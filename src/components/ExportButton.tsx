import * as XLSX from 'xlsx';
import type { AppInfo } from '../types';

interface ExportButtonProps {
  results: AppInfo[];
}

export function ExportButton({ results }: ExportButtonProps) {
  const handleExport = () => {
    const data = results.map((result, idx) => ({
      'No': idx + 1,
      'Package Name': result.packageName,
      'App Name': result.appName || '',
      'Publisher Name': result.publisherName || '',
      'Category': result.category || '',
      'Status': result.error ? `Error: ${result.error}` : 'Success',
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Results');

    // Set column widths
    worksheet['!cols'] = [
      { wch: 5 },
      { wch: 40 },
      { wch: 30 },
      { wch: 30 },
      { wch: 20 },
      { wch: 15 },
    ];

    XLSX.writeFile(workbook, `playstore-scraper-results-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <button
      onClick={handleExport}
      className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white font-medium rounded-lg shadow-lg shadow-blue-500/25 transition-all hover:scale-105 flex items-center gap-2"
    >
      <span>📥</span>
      <span>Export Excel</span>
    </button>
  );
}
