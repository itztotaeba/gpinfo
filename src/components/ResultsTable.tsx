import { useState } from 'react';
import type { AppInfo } from '../types';

interface ResultsTableProps {
  results: AppInfo[];
}

export function ResultsTable({ results }: ResultsTableProps) {
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-white/5 border-b border-white/10">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                #
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Package Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                App Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Publisher Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Category
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Version
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Debug
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {results.map((result, idx) => (
              <>
                <tr key={idx} className="hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {idx + 1}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-mono text-blue-300">
                      {result.packageName}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-white">
                      {result.appName || '-'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-green-300 font-medium">
                      {result.publisherName || '-'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-500/20 text-purple-300">
                      {result.category || '-'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-mono text-yellow-300">
                      {result.version || '-'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {result.error ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/20 text-red-300">
                        ⚠️ {result.error}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-300">
                        ✅ OK
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {result.debug_steps && (
                      <button
                        onClick={() => setExpandedRow(expandedRow === idx ? null : idx)}
                        className="text-xs text-blue-400 hover:text-blue-300 underline"
                      >
                        {expandedRow === idx ? 'Hide' : 'Show'}
                      </button>
                    )}
                  </td>
                </tr>
                {expandedRow === idx && result.debug_steps && (
                  <tr className="bg-black/20">
                    <td colSpan={8} className="px-4 py-3">
                      <div className="text-xs font-mono text-gray-400 space-y-1">
                        <div className="font-semibold text-gray-300 mb-2">Debug Steps:</div>
                        {Object.entries(result.debug_steps).map(([step, status]) => {
                          const statusStr = String(status);
                          return (
                            <div key={step} className="flex gap-2">
                              <span className="text-blue-400 min-w-[100px]">{step}:</span>
                              <span className={
                                statusStr.startsWith('Success')
                                  ? 'text-green-400'
                                  : statusStr.startsWith('Failed')
                                  ? 'text-red-400'
                                  : 'text-yellow-400'
                              }>
                                {statusStr}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
