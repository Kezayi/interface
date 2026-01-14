import { useEffect, useRef, useState } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { Users, Info } from 'lucide-react';
import {
  Author,
  DeducedRelationship,
  buildKinshipMesh,
  findPotentialRelativesBySurname,
  getRelationLabel,
} from '../lib/kinshipInference';

type GraphNode = {
  id: string;
  name: string;
  type: 'deceased' | 'author';
  relationType?: string;
  color: string;
  size: number;
  surname?: string;
};

type GraphLink = {
  source: string;
  target: string;
  color: string;
  label: string;
  lineStyle?: 'solid' | 'dashed';
  isDeduced?: boolean;
};

interface MeshOfLivingProps {
  deceased: {
    id: string;
    firstName: string;
    lastName: string;
  };
  authors: Author[];
}

export function MeshOfLiving({ deceased, authors }: MeshOfLivingProps) {
  const graphRef = useRef<any>();
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const containerRef = useRef<HTMLDivElement>(null);
  const [deducedRelationships, setDeducedRelationships] = useState<DeducedRelationship[]>([]);
  const [potentialRelatives, setPotentialRelatives] = useState<Map<string, Author[]>>(new Map());
  const [selectedRelationship, setSelectedRelationship] = useState<DeducedRelationship | null>(null);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        const height = Math.min(700, width * 0.85);
        setDimensions({ width, height });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    const relationships = buildKinshipMesh(authors, deceased);
    setDeducedRelationships(relationships);

    const relatives = findPotentialRelativesBySurname(authors);
    setPotentialRelatives(relatives);
  }, [authors, deceased]);

  const nodes: GraphNode[] = [
    {
      id: deceased.id,
      name: `${deceased.firstName} ${deceased.lastName}`,
      type: 'deceased',
      color: '#1f2937',
      size: 14,
    },
    ...authors.map((author) => ({
      id: author.id,
      name: `${author.firstName} ${author.lastName}`,
      type: 'author' as const,
      relationType: author.relationType,
      color: '#3b82f6',
      size: 8,
      surname: author.lastName,
    })),
  ];

  const links: GraphLink[] = [
    ...authors.map((author) => ({
      source: deceased.id,
      target: author.id,
      color: '#94a3b8',
      label: getRelationLabel(author.relationType),
      lineStyle: 'solid' as const,
      isDeduced: false,
    })),
    ...deducedRelationships.map((rel) => ({
      source: rel.authorA.id,
      target: rel.authorB.id,
      color: '#fbbf24',
      label: rel.labelFr,
      lineStyle: 'dashed' as const,
      isDeduced: true,
    })),
  ];

  const graphData = { nodes, links };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'bg-green-500';
    if (confidence >= 0.75) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  return (
    <div className="space-y-6">
      <div ref={containerRef} className="w-full bg-gray-50 rounded-lg border border-gray-200 overflow-hidden shadow-lg">
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white px-6 py-4">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6" />
            <div>
              <h3 className="text-xl font-bold">Maillage des Vivants</h3>
              <p className="text-sm text-gray-300">Réseau de relations déduites autour de {deceased.firstName}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex flex-wrap gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-900"></div>
              <span className="text-gray-700">Défunt(e)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-gray-700">Auteur</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-0.5 bg-gray-400"></div>
              <span className="text-gray-700">Lien direct</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-0.5 border-t-2 border-dashed border-yellow-500"></div>
              <span className="text-gray-700">Lien déduit</span>
            </div>
          </div>
        </div>

        <ForceGraph2D
          ref={graphRef}
          graphData={graphData}
          width={dimensions.width}
          height={dimensions.height}
          nodeLabel={(node: any) => `${node.name}${node.relationType ? ` (${getRelationLabel(node.relationType)})` : ''}`}
          nodeColor={(node: any) => node.color}
          nodeVal={(node: any) => node.size}
          linkColor={(link: any) => link.color}
          linkWidth={(link: any) => (link.isDeduced ? 3 : 2)}
          linkLineDash={(link: any) => (link.isDeduced ? [5, 5] : null)}
          linkDirectionalParticles={(link: any) => (link.isDeduced ? 4 : 0)}
          linkDirectionalParticleWidth={3}
          linkDirectionalParticleColor={(link: any) => link.color}
          onLinkClick={(link: any) => {
            if (link.isDeduced) {
              const rel = deducedRelationships.find(
                (r) =>
                  (r.authorA.id === link.source.id && r.authorB.id === link.target.id) ||
                  (r.authorA.id === link.target.id && r.authorB.id === link.source.id)
              );
              if (rel) setSelectedRelationship(rel);
            }
          }}
          nodeCanvasObject={(node: any, ctx, globalScale) => {
            const label = node.name;
            const fontSize = node.type === 'deceased' ? 13 / globalScale : 11 / globalScale;
            ctx.font = `${node.type === 'deceased' ? 'bold' : ''} ${fontSize}px Sans-Serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            ctx.fillStyle = node.color;
            ctx.beginPath();
            ctx.arc(node.x, node.y, node.size, 0, 2 * Math.PI, false);
            ctx.fill();

            if (node.type === 'deceased') {
              ctx.strokeStyle = '#fff';
              ctx.lineWidth = 3;
              ctx.stroke();
            }

            ctx.fillStyle = node.type === 'deceased' ? '#fff' : '#1f2937';
            ctx.fillText(label, node.x, node.y + node.size + fontSize + 3);
          }}
          cooldownTicks={100}
          onEngineStop={() => {
            if (graphRef.current) {
              graphRef.current.zoomToFit(400, 60);
            }
          }}
        />
      </div>

      {deducedRelationships.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-yellow-50 to-amber-50 px-6 py-4 border-b border-yellow-200">
            <div className="flex items-center gap-2">
              <Info className="w-5 h-5 text-yellow-700" />
              <h4 className="font-semibold text-gray-900">Relations Déduites par Inférence</h4>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {deducedRelationships.length} lien{deducedRelationships.length > 1 ? 's' : ''} de parenté identifié{deducedRelationships.length > 1 ? 's' : ''} entre les auteurs
            </p>
          </div>

          <div className="p-6">
            <div className="space-y-4">
              {deducedRelationships.map((rel, idx) => (
                <div
                  key={idx}
                  className="border border-gray-200 rounded-lg p-4 hover:border-yellow-400 hover:shadow-md transition-all cursor-pointer bg-gradient-to-r from-white to-yellow-50"
                  onClick={() => setSelectedRelationship(rel)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-gray-900">{rel.labelFr}</span>
                        <div className={`h-2 w-16 rounded-full ${getConfidenceColor(rel.confidence)}`}></div>
                        <span className="text-xs text-gray-500">
                          {Math.round(rel.confidence * 100)}% confiance
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 italic">{rel.explanation}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {potentialRelatives.size > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 px-6 py-4 border-b border-blue-200">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-700" />
              <h4 className="font-semibold text-gray-900">Parentés Potentielles par Nom de Famille</h4>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Personnes partageant le même nom de famille
            </p>
          </div>

          <div className="p-6">
            <div className="space-y-4">
              {Array.from(potentialRelatives.entries()).map(([surname, group], idx) => (
                <div key={idx} className="border border-gray-200 rounded-lg p-4 bg-blue-50">
                  <h5 className="font-semibold text-gray-900 mb-3 text-lg">
                    Famille {surname.toUpperCase()} ({group.length} personnes)
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {group.map((author, authorIdx) => (
                      <div key={authorIdx} className="flex items-center gap-2 text-sm bg-white rounded px-3 py-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        <span className="font-medium">{author.firstName} {author.lastName}</span>
                        <span className="text-xs text-gray-500">({getRelationLabel(author.relationType)})</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {selectedRelationship && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedRelationship(null)}
        >
          <div
            className="bg-white rounded-lg shadow-2xl max-w-2xl w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Détails de la Relation Déduite</h3>
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-lg font-semibold text-gray-900 mb-2">{selectedRelationship.labelFr}</p>
                <p className="text-sm text-gray-600 italic">{selectedRelationship.explanation}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Personne A</h4>
                  <p className="font-medium text-gray-900">
                    {selectedRelationship.authorA.firstName} {selectedRelationship.authorA.lastName}
                  </p>
                  <p className="text-sm text-gray-600">
                    {getRelationLabel(selectedRelationship.authorA.relationType)} de {deceased.firstName}
                  </p>
                </div>

                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Personne B</h4>
                  <p className="font-medium text-gray-900">
                    {selectedRelationship.authorB.firstName} {selectedRelationship.authorB.lastName}
                  </p>
                  <p className="text-sm text-gray-600">
                    {getRelationLabel(selectedRelationship.authorB.relationType)} de {deceased.firstName}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-4">
                <span className="text-sm font-medium text-gray-700">Niveau de confiance:</span>
                <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${getConfidenceColor(selectedRelationship.confidence)}`}
                    style={{ width: `${selectedRelationship.confidence * 100}%` }}
                  ></div>
                </div>
                <span className="text-sm font-semibold text-gray-900">
                  {Math.round(selectedRelationship.confidence * 100)}%
                </span>
              </div>

              <button
                onClick={() => setSelectedRelationship(null)}
                className="w-full px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
