import { useState, useCallback } from 'react';
import { FileUpload } from './components/FileUpload';
import { ManualInput } from './components/ManualInput';
import { ResultsTable } from './components/ResultsTable';
import { ProgressBar } from './components/ProgressBar';
import { ExportButton } from './components/ExportButton';
import {
  AndroidRobotLogo,
  AlertIcon,
  BugIcon,
  ChartIcon,
  DownloadIcon,
  FlaskIcon,
  GearIcon,
  HuaweiIcon,
  InfoIcon,
  PackageIcon,
  PencilIcon,
  PlayIcon,
  RefreshIcon,
  SearchIcon,
  ShuffleIcon,
  UploadIcon,
} from './components/icons';
import type { AppInfo } from './types';

export type ScrapeSource = 'both' | 'google-play' | 'huawei-appgallery';

const SOURCE_OPTIONS: ReadonlyArray<{
  value: ScrapeSource;
  label: string;
  icon: React.ReactNode;
}> = [
  { value: 'both', label: 'Play Store + AppGallery', icon: <ShuffleIcon className="w-3.5 h-3.5" /> },
  { value: 'google-play', label: 'Google Play Store', icon: <PlayIcon className="w-3 h-3" /> },
  { value: 'huawei-appgallery', label: 'Huawei AppGallery', icon: <HuaweiIcon className="w-3.5 h-3.5" /> },
];

export default function App() {
  const [packageNames, setPackageNames] = useState<string[]>([]);
  const [results, setResults] = useState<AppInfo[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [activeTab, setActiveTab] = useState<'upload' | 'manual'>('upload');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [currentProcessing, setCurrentProcessing] = useState<string>('');
  const [source, setSource] = useState<ScrapeSource>('both');

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
        body: JSON.stringify({ packageName, source }),
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
          debug_steps: { api: `Failed: HTTP ${response.status}` },
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
        debug_steps: { network: `Failed: ${error.message}` },
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
  }, [packageNames, results, source]);

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
    <div className="min-h-screen">
      <div className="bg-veil" />

      {/* Header */}
      <header className="sticky top-4 z-20 px-4 sm:px-6 lg:px-8 pt-4">
        <div className="max-w-7xl mx-auto">
          <div className="glass glass-sheen px-5 py-3.5 flex items-center gap-3.5 rounded-[24px]">
            <div className="logo-mark shrink-0">
              <AndroidRobotLogo className="w-7 h-7" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-bold tracking-tight text-[var(--ink)] truncate">
                Android App Information
              </h1>
              <p className="text-xs text-[var(--ink-muted)] truncate">
                Batch lookup publisher, category &amp; versi dari package name — Google Play Store &amp; Huawei AppGallery
              </p>
            </div>
            <span className="chip ml-auto hidden sm:inline-flex shrink-0">
              <InfoIcon className="w-3.5 h-3.5" />
              Liquid Glass
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Error Message */}
        {errorMsg && (
          <div className="mb-6 glass-soft p-4 border-l-4 border-l-red-400 flex items-start gap-3">
            <AlertIcon className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-600">{errorMsg}</p>
          </div>
        )}

        {/* Input Section */}
        {packageNames.length === 0 && !isProcessing && (
          <div className="mb-8">
            {/* Source Selector */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <span className="text-sm font-semibold text-[var(--ink-muted)]">Sumber data:</span>
              <div className="segmented">
                {SOURCE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setSource(opt.value)}
                    className={`segment ${source === opt.value ? 'active' : ''}`}
                  >
                    {opt.icon}
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <div className="segmented">
                <button
                  onClick={() => setActiveTab('upload')}
                  className={`segment ${activeTab === 'upload' ? 'active' : ''}`}
                >
                  <UploadIcon className="w-3.5 h-3.5" />
                  Import Excel (.xlsx)
                </button>
                <button
                  onClick={() => setActiveTab('manual')}
                  className={`segment ${activeTab === 'manual' ? 'active' : ''}`}
                >
                  <PencilIcon className="w-3.5 h-3.5" />
                  Manual Input
                </button>
              </div>
              <button onClick={loadSampleData} className="btn btn-ghost !text-xs ml-auto">
                <FlaskIcon className="w-3.5 h-3.5" />
                Load Sample Data
              </button>
            </div>

            {/* Tab Content */}
            <div className="glass p-6">
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
            <div className="glass p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h2 className="text-base font-bold text-[var(--ink)] flex items-center gap-2">
                    <PackageIcon className="w-5 h-5 text-emerald-600" />
                    {packageNames.length} Package Names Loaded
                  </h2>
                  <div className="mt-3 max-h-32 overflow-y-auto pr-1">
                    <div className="flex flex-wrap gap-1.5">
                      {packageNames.slice(0, 50).map((pkg, idx) => (
                        <span key={idx} className="chip !font-mono !text-[11px]">
                          {pkg}
                        </span>
                      ))}
                      {packageNames.length > 50 && (
                        <span className="chip chip-ok !text-[11px]">
                          +{packageNames.length - 50} lainnya
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 shrink-0">
                  {!isProcessing && results.length === 0 && (
                    <button onClick={() => handleScrape()} className="btn btn-success">
                      <SearchIcon className="w-4 h-4" />
                      Start Scraping
                    </button>
                  )}
                  <button onClick={handleReset} disabled={isProcessing} className="btn">
                    <RefreshIcon className="w-4 h-4" />
                    Reset
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
            <div className="glass p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shrink-0" />
                  <span className="text-sm text-[var(--ink-muted)] shrink-0">Processing:</span>
                  <span className="text-sm font-mono text-emerald-700 truncate">{currentProcessing}</span>
                </div>
                <span className="text-sm text-[var(--ink-muted)] tabular-nums shrink-0 ml-3">
                  ETA: {getEstimatedTime(progress.total, progress.current)}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="glass-soft p-3.5 text-center">
                  <div className="text-[11px] uppercase tracking-wider text-[var(--ink-faint)] font-semibold">Total</div>
                  <div className="text-xl font-bold tabular-nums text-[var(--ink)]">{progress.total}</div>
                </div>
                <div className="glass-soft p-3.5 text-center">
                  <div className="text-[11px] uppercase tracking-wider text-[var(--ink-faint)] font-semibold">Success</div>
                  <div className="text-xl font-bold tabular-nums text-emerald-600">{successCount}</div>
                </div>
                <div className="glass-soft p-3.5 text-center">
                  <div className="text-[11px] uppercase tracking-wider text-[var(--ink-faint)] font-semibold">Failed</div>
                  <div className="text-xl font-bold tabular-nums text-red-500">{failedCount}</div>
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
                <h2 className="text-base font-bold text-[var(--ink)] flex items-center gap-2">
                  <ChartIcon className="w-5 h-5 text-slate-500" />
                  Results ({results.length}/{packageNames.length})
                </h2>
                {failedCount > 0 && !isProcessing && (
                  <p className="text-sm text-amber-600 mt-1 flex items-center gap-1.5">
                    <AlertIcon className="w-4 h-4" />
                    {failedCount} app gagal di-scrape
                  </p>
                )}
              </div>
              <div className="flex gap-3">
                {failedCount > 0 && !isProcessing && (
                  <button onClick={handleRetryFailed} className="btn btn-warning">
                    <RefreshIcon className="w-4 h-4" />
                    Retry Failed ({failedCount})
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
              {[
                {
                  icon: <UploadIcon className="w-5 h-5" />,
                  title: '1. Upload File',
                  desc: 'Import file .xlsx atau input manual tanpa batasan jumlah package.',
                },
                {
                  icon: <GearIcon className="w-5 h-5" />,
                  title: '2. Process',
                  desc: 'Sistem memproses satu per satu dengan retry mechanism otomatis.',
                },
                {
                  icon: <DownloadIcon className="w-5 h-5" />,
                  title: '3. Export',
                  desc: 'Download hasil dalam format Excel (.xlsx) dengan data lengkap.',
                },
              ].map((step) => (
                <div key={step.title} className="glass glass-sheen p-5">
                  <div className="logo-mark !w-10 !h-10 !rounded-[14px] mb-3">{step.icon}</div>
                  <h3 className="font-bold text-[var(--ink)] mb-1">{step.title}</h3>
                  <p className="text-sm text-[var(--ink-muted)]">{step.desc}</p>
                </div>
              ))}
            </div>

            {/* Additional Info */}
            <div className="glass p-6">
              <h3 className="font-bold text-[var(--ink)] mb-4 flex items-center gap-2">
                <InfoIcon className="w-5 h-5 text-emerald-600" />
                Informasi Penting
              </h3>
              <ul className="text-sm text-[var(--ink-muted)] space-y-2.5">
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-600 mt-1 shrink-0">•</span>
                  <span>Format package name: <code className="px-1.5 py-0.5 rounded-lg bg-white/60 border border-slate-200 text-xs font-mono text-slate-700">com.example.app</code></span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-600 mt-1 shrink-0">•</span>
                  <span><strong className="text-[var(--ink)]">Tidak ada batasan jumlah package</strong> — bisa input 300+ package sekaligus</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-600 mt-1 shrink-0">•</span>
                  <span>Data yang diambil: <strong className="text-[var(--ink)]">App Name, Publisher, Category, Version</strong> dari Play Store &amp; AppGallery</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-600 mt-1 shrink-0">•</span>
                  <span>Estimasi waktu: ~8 detik per package (dengan retry mechanism)</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-600 mt-1 shrink-0">•</span>
                  <span>Jika ada app yang gagal, gunakan tombol <strong className="text-[var(--ink)]">Retry Failed</strong> untuk mencoba ulang</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <BugIcon className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
                  <span><strong className="text-[var(--ink)]">Tentang Versi Aplikasi:</strong> sistem mencoba 6 metode berurutan — google-play-scraper library, device simulation (5 perangkat Android), desktop fetch (JSON-LD &amp; HTML), APKMirror, APKPure, dan multi-country (10 negara). Jika semua gagal, tampil <code className="px-1.5 py-0.5 rounded-lg bg-white/60 border border-slate-200 text-xs font-mono text-slate-700">Varies with device</code>.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <HuaweiIcon className="w-4 h-4 text-orange-600 mt-0.5 shrink-0" />
                  <span><strong className="text-[var(--ink)]">Huawei AppGallery:</strong> scraping via API edge regional appgallery.huawei.com — mengembalikan versi, App ID (contoh: C103097007), URL halaman aplikasi, dan jumlah download bila tersedia.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-amber-500 mt-0.5 shrink-0"><AlertIcon className="w-4 h-4" /></span>
                  <span className="text-amber-700">Pastikan koneksi internet stabil dan jangan tutup browser saat proses berjalan.</span>
                </li>
              </ul>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-4 pb-8 sm:px-6 lg:px-8">
        <div className="glass-soft py-4 px-6">
          <p className="text-center text-xs text-[var(--ink-faint)]">
            Android App Information • Unlimited packages • Multi-method scraping with retry • Play Store &amp; Huawei AppGallery
          </p>
        </div>
      </footer>
    </div>
  );
}
