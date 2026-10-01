import type { AppInfo } from '../types';

interface ResultsTableProps {
  results: AppInfo[];
}

export function ResultsTable({ results }: ResultsTableProps) {
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
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {results.map((result, idx) => (
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
