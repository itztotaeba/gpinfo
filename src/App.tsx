import { useState, useCallback } from 'react';
import { FileUpload } from './components/FileUpload';
import { ManualInput } from './components/ManualInput';
import { ResultsTable } from './components/ResultsTable';
import { ProgressBar } from './components/ProgressBar';
import { ExportButton } from './components/ExportButton';
import type { AppInfo } from './types';

export default function App() {
  const [packageNames, setPackageNames] = useState<string[]>([]);
  const [results, setResults] = useState<AppInfo[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [activeTab, setActiveTab] = useState<'upload' | 'manual'>('upload');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [currentProcessing, setCurrentProcessing] = useState<string>('');

  const handlePackagesLoaded = useCallback((packages: string[]) => {
    setPackageNames(packages);
    setResults([]);
    setErrorMsg('');
  }, []);

  const scrapeSinglePackage = async (packageName: string): Promise<AppInfo> => {
    try {
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageName }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.result;
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        return {
          packageName,
          appName: '',
          publisherName: '',
          category: '',
          version: '',
          error: errorData.error || `HTTP ${response.status}`,
        };
      }
    } catch (error: any) {
      return {
        packageName,
        appName: '',
        publisherName: '',
        category: '',
        version: '',
        error: `Network error: ${error.message}`,
      };
    }
  };

  const handleScrape = useCallback(async (packagesToScrape?: string[]) => {
    const packages = packagesToScrape || packageNames;
    if (packages.length === 0) return;

    setIsProcessing(true);
    if (!packagesToScrape) {
      setResults([]);
    }
    setErrorMsg('');
    setProgress({ current: 0, total: packages.length });

    const allResults: AppInfo[] = packagesToScrape ? [...results] : [];

    // Process one package at a time
    for (let i = 0; i < packages.length; i++) {
      const packageName = packages[i];
      setCurrentProcessing(packageName);
      
      const result = await scrapeSinglePackage(packageName);
      allResults.push(result);
      
      setProgress({ current: i + 1, total: packages.length });
      setResults([...allResults]);

      // Small delay between requests to avoid rate limiting
      if (i < packages.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    setCurrentProcessing('');
    setIsProcessing(false);
  }, [packageNames, results]);

  const handleRetryFailed = useCallback(() => {
    const failedPackages = results
      .filter(r => r.error)
      .map(r => r.packageName);
    
    if (failedPackages.length > 0) {
      // Remove failed results
      const successResults = results.filter(r => !r.error);
      setResults(successResults);
      // Retry failed packages
      handleScrape(failedPackages);
    }
  }, [results, handleScrape]);

  const handleReset = useCallback(() => {
    setPackageNames([]);
    setResults([]);
    setProgress({ current: 0, total: 0 });
    setErrorMsg('');
    setCurrentProcessing('');
  }, []);

  const loadSampleData = useCallback(() => {
    const samples = [
      'com.whatsapp',
      'com.instagram.android',
      'com.spotify.music',
      'com.tencent.mm',
      'com.facebook.katana',
    ];
    setPackageNames(samples);
    setResults([]);
    setErrorMsg('');
  }, []);

  const failedCount = results.filter(r => r.error).length;
  const successCount = results.filter(r => !r.error).length;

  // Calculate estimated time
  const getEstimatedTime = (total: number, current: number) => {
    const remaining = total - current;
    const avgTimePerPackage = 8; // seconds
    const totalSeconds = remaining * avgTimePerPackage;
    
    if (totalSeconds < 60) {
      return `~${totalSeconds} detik`;
    } else if (totalSeconds < 3600) {
      const minutes = Math.floor(totalSeconds / 60);
      return `~${minutes} menit`;
    } else {
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      return `~${hours}j ${minutes}m`;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="border-b border-white/10 backdrop-blur-sm bg-white/5">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-xl flex items-center justify-center text-xl shadow-lg">
              📱
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Play Store Scraper</h1>
              <p className="text-sm text-gray-400">Batch lookup publisher & category dari package name</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Error Message */}
        {errorMsg && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
            <p className="text-red-300 text-sm">⚠️ {errorMsg}</p>
          </div>
        )}

        {/* Input Section */}
        {packageNames.length === 0 && !isProcessing && (
          <div className="mb-8">
            {/* Tabs */}
            <div className="flex flex-wrap gap-2 mb-6">
              <button
                onClick={() => setActiveTab('upload')}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                  activeTab === 'upload'
                    ? 'bg-white/20 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                📁 Import Excel (.xlsx)
              </button>
              <button
                onClick={() => setActiveTab('manual')}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                  activeTab === 'manual'
                    ? 'bg-white/20 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                ✏️ Manual Input
              </button>
              <button
                onClick={loadSampleData}
                className="px-4 py-2 rounded-lg font-medium text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-all ml-auto"
              >
                🧪 Load Sample Data
              </button>
            </div>

            {/* Tab Content */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
              {activeTab === 'upload' ? (
                <FileUpload onPackagesLoaded={handlePackagesLoaded} />
              ) : (
                <ManualInput onPackagesLoaded={handlePackagesLoaded} />
              )}
            </div>
          </div>
        )}

        {/* Package List & Actions */}
        {packageNames.length > 0 && (
          <div className="mb-8">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-semibold text-white">
                    📦 {packageNames.length} Package Names Loaded
                  </h2>
                  <div className="mt-2 max-h-32 overflow-y-auto">
                    <div className="flex flex-wrap gap-2">
                      {packageNames.slice(0, 50).map((pkg, idx) => (
                        <span key={idx} className="px-2 py-1 bg-white/10 rounded text-xs text-gray-300 font-mono">
                          {pkg}
                        </span>
                      ))}
                      {packageNames.length > 50 && (
                        <span className="px-2 py-1 bg-blue-500/20 rounded text-xs text-blue-300 font-medium">
                          +{packageNames.length - 50} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 shrink-0">
                  {!isProcessing && results.length === 0 && (
                    <button
                      onClick={() => handleScrape()}
                      className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-semibold rounded-xl shadow-lg shadow-green-500/25 transition-all hover:scale-105 active:scale-95"
                    >
                      🔍 Start Scraping
                    </button>
                  )}
                  <button
                    onClick={handleReset}
                    disabled={isProcessing}
                    className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all disabled:opacity-50"
                  >
                    🔄 Reset
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Progress */}
        {isProcessing && (
          <div className="mb-8 space-y-4">
            <ProgressBar current={progress.current} total={progress.total} />
            
            {/* Current Processing Info */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-sm text-gray-300">Processing:</span>
                  <span className="text-sm font-mono text-blue-300">{currentProcessing}</span>
                </div>
                <span className="text-sm text-gray-400">
                  ETA: {getEstimatedTime(progress.total, progress.current)}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-3">
                <div className="bg-white/5 rounded-lg p-3">
                  <div className="text-xs text-gray-400 mb-1">Total</div>
                  <div className="text-lg font-bold text-white">{progress.total}</div>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <div className="text-xs text-gray-400 mb-1">Success</div>
                  <div className="text-lg font-bold text-green-400">{successCount}</div>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <div className="text-xs text-gray-400 mb-1">Failed</div>
                  <div className="text-lg font-bold text-red-400">{failedCount}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  📊 Results ({results.length}/{packageNames.length})
                </h2>
                {failedCount > 0 && !isProcessing && (
                  <p className="text-sm text-yellow-400 mt-1">
                    ⚠️ {failedCount} app failed to scrape
                  </p>
                )}
              </div>
              <div className="flex gap-3">
                {failedCount > 0 && !isProcessing && (
                  <button
                    onClick={handleRetryFailed}
                    className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-400 hover:to-orange-500 text-white font-medium rounded-lg shadow-lg transition-all hover:scale-105 flex items-center gap-2"
                  >
                    <span>🔄</span>
                    <span>Retry Failed ({failedCount})</span>
                  </button>
                )}
                {!isProcessing && (
                  <ExportButton results={results} />
                )}
              </div>
            </div>
            <ResultsTable results={results} />
          </div>
        )}

        {/* Info Section */}
        {packageNames.length === 0 && !isProcessing && results.length === 0 && (
          <div className="mt-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-5">
                <div className="text-2xl mb-2">📤</div>
                <h3 className="font-semibold text-white mb-1">1. Upload File</h3>
                <p className="text-sm text-gray-400">Import file .xlsx atau input manual tanpa batasan jumlah package</p>
              </div>
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-5">
                <div className="text-2xl mb-2">⚙️</div>
                <h3 className="font-semibold text-white mb-1">2. Process</h3>
                <p className="text-sm text-gray-400">Sistem akan process satu per satu dengan retry mechanism</p>
              </div>
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-5">
                <div className="text-2xl mb-2">📥</div>
                <h3 className="font-semibold text-white mb-1">3. Export</h3>
                <p className="text-sm text-gray-400">Download hasil dalam format Excel (.xlsx) dengan data lengkap</p>
              </div>
            </div>

            {/* Additional Info */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <h3 className="font-semibold text-white mb-3">ℹ️ Informasi Penting</h3>
              <ul className="text-sm text-gray-400 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">•</span>
                  <span>Format package name: <code className="px-1 py-0.5 bg-white/10 rounded text-xs font-mono text-blue-300">com.example.app</code></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">•</span>
                  <span><strong className="text-white">Tidak ada batasan jumlah package</strong> - bisa input 300+ package sekaligus</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">•</span>
                  <span>Data yang diambil: <strong className="text-white">App Name, Publisher, Category, Version</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">•</span>
                  <span>Estimasi waktu: ~8 detik per package (dengan retry mechanism)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">•</span>
                  <span>Menggunakan 3 metode scraping dengan retry untuk akurasi maksimal</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">•</span>
                  <span>Jika ada app yang gagal, gunakan tombol "Retry Failed" untuk mencoba ulang</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-0.5">💡</span>
                  <span className="text-blue-300"><strong>Tentang Versi Aplikasi:</strong></span>
                </li>
                <li className="flex items-start gap-2 pl-6">
                  <span className="text-gray-500">•</span>
                  <span>Sistem akan mencoba <strong className="text-white">4 metode</strong> untuk mendapatkan versi asli:</span>
                </li>
                <li className="flex items-start gap-2 pl-10">
                  <span className="text-gray-600">1.</span>
                  <span>Google Play Store Library</span>
                </li>
                <li className="flex items-start gap-2 pl-10">
                  <span className="text-gray-600">2.</span>
                  <span>Device Simulation (simulasi Android device)</span>
                </li>
                <li className="flex items-start gap-2 pl-10">
                  <span className="text-gray-600">3.</span>
                  <span>APKMirror (database APK versi spesifik)</span>
                </li>
                <li className="flex items-start gap-2 pl-10">
                  <span className="text-gray-600">4.</span>
                  <span>Direct HTML Parsing</span>
                </li>
                <li className="flex items-start gap-2 pl-6">
                  <span className="text-gray-500">•</span>
                  <span>Jika semua metode gagal, akan tampil <code className="px-1 py-0.5 bg-white/10 rounded text-xs font-mono">Varies with device</code></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-0.5">💡</span>
                  <span className="text-blue-300"><strong>Contoh estimasi waktu:</strong></span>
                </li>
                <li className="flex items-start gap-2 pl-6">
                  <span className="text-gray-500">•</span>
                  <span>50 packages ≈ 7 menit</span>
                </li>
                <li className="flex items-start gap-2 pl-6">
                  <span className="text-gray-500">•</span>
                  <span>100 packages ≈ 13 menit</span>
                </li>
                <li className="flex items-start gap-2 pl-6">
                  <span className="text-gray-500">•</span>
                  <span>300 packages ≈ 40 menit</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-400 mt-0.5">⚠️</span>
                  <span className="text-yellow-300">Pastikan koneksi internet stabil dan jangan tutup browser saat proses berjalan</span>
                </li>
              </ul>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500">
            Play Store Scraper • Unlimited packages • Multi-method scraping with retry
          </p>
        </div>
      </footer>
    </div>
  );
}
