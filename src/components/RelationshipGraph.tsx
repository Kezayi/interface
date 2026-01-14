import { useEffect, useRef, useState } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { Author, getCategoryColor, getCategoryLabel } from '../lib/relationshipMesh';
import { Memorial } from '../lib/supabase';

type GraphNode = {
  id: string;
  name: string;
  type: 'deceased' | 'author';
  category?: string;
  color: string;
  size: number;
};

type GraphLink = {
  source: string;
  target: string;
  color: string;
  label: string;
};

type RelationshipGraphProps = {
  deceased: Memorial;
  authors: Author[];
  highlightedAuthorEmail?: string;
};

export function RelationshipGraph({ deceased, authors, highlightedAuthorEmail }: RelationshipGraphProps) {
  const graphRef = useRef<any>();
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        const height = Math.min(600, width * 0.75);
        setDimensions({ width, height });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const nodes: GraphNode[] = [
    {
      id: deceased.id,
      name: deceased.deceased_full_name,
      type: 'deceased',
      color: '#ef4444',
      size: 12,
    },
    ...authors.map((author) => ({
      id: author.email,
      name: author.name,
      type: 'author' as const,
      category: author.relationshipCategory,
      color: getCategoryColor(author.relationshipCategory),
      size: highlightedAuthorEmail === author.email ? 10 : 6,
    })),
  ];

  const links: GraphLink[] = authors.map((author) => ({
    source: deceased.id,
    target: author.email,
    color: getCategoryColor(author.relationshipCategory),
    label: getCategoryLabel(author.relationshipCategory),
  }));

  const graphData = { nodes, links };

  return (
    <div ref={containerRef} className="w-full bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <h3 className="text-lg font-semibold text-gray-900">Réseau de Relations</h3>
        <div className="flex flex-wrap gap-4 mt-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-xs text-gray-600">Défunt(e)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getCategoryColor('family') }}></div>
            <span className="text-xs text-gray-600">Famille</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getCategoryColor('professional') }}></div>
            <span className="text-xs text-gray-600">Professionnel</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getCategoryColor('friend') }}></div>
            <span className="text-xs text-gray-600">Ami</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getCategoryColor('other') }}></div>
            <span className="text-xs text-gray-600">Autre</span>
          </div>
        </div>
      </div>
      <ForceGraph2D
        ref={graphRef}
        graphData={graphData}
        width={dimensions.width}
        height={dimensions.height}
        nodeLabel={(node: any) => node.name}
        nodeColor={(node: any) => node.color}
        nodeVal={(node: any) => node.size}
        linkColor={(link: any) => link.color}
        linkWidth={2}
        linkDirectionalParticles={2}
        linkDirectionalParticleWidth={2}
        nodeCanvasObject={(node: any, ctx, globalScale) => {
          const label = node.name;
          const fontSize = node.type === 'deceased' ? 14 / globalScale : 12 / globalScale;
          ctx.font = `${fontSize}px Sans-Serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = node.color;

          ctx.beginPath();
          ctx.arc(node.x, node.y, node.size, 0, 2 * Math.PI, false);
          ctx.fill();

          if (node.type === 'deceased') {
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();
          }

          ctx.fillStyle = '#1f2937';
          ctx.fillText(label, node.x, node.y + node.size + fontSize);
        }}
        cooldownTicks={100}
        onEngineStop={() => {
          if (graphRef.current) {
            graphRef.current.zoomToFit(400, 50);
          }
        }}
      />
    </div>
  );
}
