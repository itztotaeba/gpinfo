import { useState, useCallback } from 'react';
import { FileUpload } from './components/FileUpload';
import { ManualInput } from './components/ManualInput';
import { ResultsTable } from './components/ResultsTable';
import { ProgressBar } from './components/ProgressBar';
import { ExportButton } from './components/ExportButton';
import type { AppInfo } from './types';

// Fallback CORS proxy for when the serverless function is unavailable
const CORS_PROXIES = [
  'https://api.allorigins.win/raw?url=',
  'https://corsproxy.io/?',
];

async function fetchWithProxy(url: string): Promise<string> {
  // Try direct fetch first (for same-origin)
  try {
    const directRes = await fetch(url);
    if (directRes.ok) return await directRes.text();
  } catch {}

  // Try CORS proxies
  for (const proxy of CORS_PROXIES) {
    try {
      const res = await fetch(`${proxy}${encodeURIComponent(url)}`);
      if (res.ok) return await res.text();
    } catch {}
  }
  throw new Error('All fetch methods failed');
}

function parsePlayStoreHtml(html: string, packageName: string): AppInfo {
  let appName = '';
  let publisherName = '';
  let category = '';

  // App Name
  const ogTitleMatch = html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i);
  if (ogTitleMatch) {
    appName = ogTitleMatch[1].replace(/\s*-\s*Apps on Google Play$/i, '').replace(/\s*-\s*Games on Google Play$/i, '').trim();
  }
  if (!appName) {
    const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
    if (titleMatch) {
      appName = titleMatch[1].replace(/\s*-\s*Apps on Google Play$/i, '').replace(/\s*-\s*Games on Google Play$/i, '').trim();
    }
  }

  // Publisher Name
  const devLinkMatch = html.match(/<a[^>]+href="\/store\/apps\/developer\?id=[^"]*"[^>]*>([^<]+)<\/a>/);
  if (devLinkMatch) {
    publisherName = devLinkMatch[1].trim();
  }
  if (!publisherName) {
    const devNameMatch = html.match(/"developer_name"\s*:\s*"([^"]+)"/);
    if (devNameMatch) {
      publisherName = devNameMatch[1];
    }
  }

  // Category
  const catLinkMatch = html.match(/\/store\/apps\/category\/([A-Z_]+)[^"]*"[^>]*>([^<]+)</);
  if (catLinkMatch) {
    category = catLinkMatch[2].trim();
  }
  if (!category) {
    const catMatch = html.match(/"category"\s*:\s*"([^"]+)"/);
    if (catMatch) {
      category = catMatch[1];
    }
  }
  if (!category) {
    const catUrlMatch = html.match(/\/store\/apps\/category\/([A-Z_]+)/);
    if (catUrlMatch) {
      category = catUrlMatch[1].replace(/_/g, ' ');
    }
  }

  return {
    packageName,
    appName: appName || 'Unknown',
    publisherName: publisherName || 'Not found',
    category: category || 'Not found',
  };
}

export default function App() {
  const [packageNames, setPackageNames] = useState<string[]>([]);
  const [results, setResults] = useState<AppInfo[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [activeTab, setActiveTab] = useState<'upload' | 'manual'>('upload');
  const [useFallback, setUseFallback] = useState(false);

  const handlePackagesLoaded = useCallback((packages: string[]) => {
    setPackageNames(packages);
    setResults([]);
  }, []);

  const scrapeViaAPI = async (batch: string[]): Promise<AppInfo[]> => {
    const response = await fetch('/api/scrape', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ packageNames: batch }),
    });

    if (!response.ok) throw new Error(`API error: ${response.status}`);
    const data = await response.json();
    return data.results;
  };

  const scrapeViaFallback = async (packageName: string): Promise<AppInfo> => {
    const url = `https://play.google.com/store/apps/details?id=${encodeURIComponent(packageName)}&hl=en`;
    try {
      const html = await fetchWithProxy(url);
      return parsePlayStoreHtml(html, packageName);
    } catch (error: any) {
      return {
        packageName,
        appName: '',
        publisherName: '',
        category: '',
        error: error.message || 'Fallback failed',
      };
    }
  };

  const handleScrape = useCallback(async () => {
    if (packageNames.length === 0) return;

    setIsProcessing(true);
    setResults([]);
    setProgress({ current: 0, total: packageNames.length });

    const allResults: AppInfo[] = [];
    let apiFailed = false;

    if (!useFallback) {
      // Try API method first (batch processing)
      const batchSize = 5;
      for (let i = 0; i < packageNames.length; i += batchSize) {
        const batch = packageNames.slice(i, i + batchSize);
        
        try {
          const batchResults = await scrapeViaAPI(batch);
          allResults.push(...batchResults);
        } catch (error) {
          apiFailed = true;
          // Mark remaining as failed and switch to fallback
          for (const pkg of batch) {
            allResults.push({
              packageName: pkg,
              appName: '',
              publisherName: '',
              category: '',
              error: 'API failed, switching to fallback...',
            });
          }
          break;
        }

        setProgress({ current: Math.min(i + batchSize, packageNames.length), total: packageNames.length });
        setResults([...allResults]);
      }
    }

    // If API failed or fallback mode is on, use client-side fallback
    if (apiFailed || useFallback) {
      const startIndex = useFallback ? 0 : allResults.length;
      const remaining = packageNames.slice(startIndex);
      
      if (useFallback) {
        allResults.length = 0;
        setResults([]);
      }

      for (let i = 0; i < remaining.length; i++) {
        const result = await scrapeViaFallback(remaining[i]);
        allResults.push(result);
        setProgress({ current: startIndex + i + 1, total: packageNames.length });
        setResults([...allResults]);
        
        // Delay between requests
        if (i < remaining.length - 1) {
          await new Promise(r => setTimeout(r, 2000));
        }
      }
    }

    setIsProcessing(false);
  }, [packageNames, useFallback]);

  const handleReset = useCallback(() => {
    setPackageNames([]);
    setResults([]);
    setProgress({ current: 0, total: 0 });
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
  }, []);

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

            {/* Fallback Toggle */}
            <div className="mt-4 flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-4">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={useFallback}
                  onChange={(e) => setUseFallback(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
              </label>
              <div>
                <p className="text-sm text-white font-medium">Mode Fallback (CORS Proxy)</p>
                <p className="text-xs text-gray-400">Aktifkan jika method utama gagal. Lebih lambat tapi lebih reliable.</p>
              </div>
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
                      {packageNames.map((pkg, idx) => (
                        <span key={idx} className="px-2 py-1 bg-white/10 rounded text-xs text-gray-300 font-mono">
                          {pkg}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 shrink-0">
                  {!isProcessing && results.length === 0 && (
                    <button
                      onClick={handleScrape}
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
          <ProgressBar current={progress.current} total={progress.total} />
        )}

        {/* Results */}
        {results.length > 0 && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-white">
                📊 Results ({results.length}/{packageNames.length})
              </h2>
              {!isProcessing && (
                <ExportButton results={results} />
              )}
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
                <p className="text-sm text-gray-400">Import file .xlsx yang berisi daftar package name aplikasi Android</p>
              </div>
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-5">
                <div className="text-2xl mb-2">⚙️</div>
                <h3 className="font-semibold text-white mb-1">2. Process</h3>
                <p className="text-sm text-gray-400">Sistem akan otomatis scraping data dari Google Play Store</p>
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
                  <span>Maksimal 50 package per batch request</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">•</span>
                  <span>Estimasi waktu: ~1.5 detik per package name</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">•</span>
                  <span>Jika hasil "Not found", coba aktifkan Mode Fallback</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">•</span>
                  <span>File Excel harus memiliki kolom yang berisi package name (otomatis terdeteksi)</span>
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
            Play Store Scraper • Data diambil langsung dari Google Play Store • Deploy di Vercel
          </p>
        </div>
      </footer>
    </div>
  );
}
