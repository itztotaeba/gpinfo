import * as XLSX from 'xlsx';
import type { AppInfo } from '../types';
import { DownloadIcon } from './icons';

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
      'Version (Play Store)': result.googlePlay ? (result.googlePlay.version || '') : (result.source === 'huawei-appgallery' ? '' : result.version || ''),
      'Source (Play Store)': result.googlePlay?.source || (result.source === 'huawei-appgallery' ? '' : result.source) || '',
      'Play Store URL': result.googlePlay?.playStoreUrl
        || (result.googlePlay?.version ? `https://play.google.com/store/apps/details?id=${encodeURIComponent(result.packageName)}` : ''),
      'Version (AppGallery)': result.huaweiAppGallery ? (result.huaweiAppGallery.version || result.huaweiAppGallery.error || '') : (result.source === 'huawei-appgallery' ? result.version || '' : ''),
      'App ID (AppGallery)': result.huaweiAppGallery?.appGalleryAppId || '',
      'AppGallery URL': result.huaweiAppGallery?.appGalleryUrl || '',
      'Downloads (AppGallery)': result.huaweiAppGallery?.downloadCount ?? '',
      'Status': result.error ? `Error: ${result.error}` : 'Success',
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Results');

    worksheet['!cols'] = [
      { wch: 5 },   // No
      { wch: 40 },  // Package Name
      { wch: 30 },  // App Name
      { wch: 30 },  // Publisher
      { wch: 20 },  // Category
      { wch: 20 },  // Version Play
      { wch: 18 },  // Source Play
      { wch: 55 },  // Play URL
      { wch: 20 },  // Version AG
      { wch: 45 },  // AG URL
      { wch: 20 },  // Downloads
      { wch: 15 },  // Status
    ];

    XLSX.writeFile(workbook, `app-scraper-results-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <button onClick={handleExport} className="btn btn-primary">
      <DownloadIcon className="w-4 h-4" />
      Export Excel
    </button>
  );
}
