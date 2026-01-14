import { useEffect, useState } from 'react';
import { Activity, Search } from 'lucide-react';
import { supabaseShim as supabase } from '../../lib/supabaseShim';
import { AuditLog as AuditLogType } from '../../lib/backoffice-types';

export function AuditLog() {
  const [logs, setLogs] = useState<AuditLogType[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionTypeFilter, setActionTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Error loading audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const actionTypes = Array.from(new Set(logs.map(log => log.action_type)));

  const filteredLogs = logs.filter(log => {
    const matchesType = actionTypeFilter === 'all' || log.action_type === actionTypeFilter;
    const matchesSearch =
      log.justification.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.entity_type.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-medium text-gray-900 mb-2">Journal d'audit</h2>
        <p className="text-sm text-gray-600">
          Traçabilité complète (500 dernières entrées) • Immuable
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            />
            <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
          </div>

          <select
            value={actionTypeFilter}
            onChange={(e) => setActionTypeFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          >
            <option value="all">Tous les types d'action</option>
            {actionTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredLogs.length === 0 ? (
              <p className="text-center text-gray-600 py-8">Aucune entrée trouvée</p>
            ) : (
              filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-4 border border-gray-200 rounded-lg"
                >
                  <div className="flex items-start gap-3">
                    <Activity className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900">{log.action_type}</span>
                        <span className="text-xs text-gray-500">sur {log.entity_type}</span>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{log.justification}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-600">
                        <span>{new Date(log.created_at).toLocaleString('fr-FR')}</span>
                        {log.admin_id && (
                          <>
                            <span>•</span>
                            <span className="font-mono">{log.admin_id.substring(0, 8)}...</span>
                          </>
                        )}
                        {log.entity_id && (
                          <>
                            <span>•</span>
                            <span className="font-mono">{log.entity_id.substring(0, 8)}...</span>
                          </>
                        )}
                      </div>
                      {Object.keys(log.action_details || {}).length > 0 && (
                        <details className="mt-2">
                          <summary className="text-xs text-blue-600 cursor-pointer hover:text-blue-800">
                            Voir les détails
                          </summary>
                          <pre className="mt-2 text-xs bg-gray-50 p-2 rounded overflow-x-auto">
                            {JSON.stringify(log.action_details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">Caractéristiques du journal</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Lecture seule : Aucune modification possible</li>
          <li>• Immuable : Aucune suppression possible</li>
          <li>• Traçable : Toutes les actions admin sont enregistrées</li>
          <li>• Permanent : Conservation indéfinie</li>
        </ul>
      </div>
    </div>
  );
}
