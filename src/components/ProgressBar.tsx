interface ProgressBarProps {
  current: number;
  total: number;
}

export function ProgressBar({ current, total }: ProgressBarProps) {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className="mb-8 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-medium text-white">Processing...</span>
        </div>
        <span className="text-sm text-gray-400">
          {current} / {total} ({percentage}%)
        </span>
      </div>
      <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
      <p className="text-xs text-gray-500 mt-2">
        ⏱️ Estimasi waktu: ~{(total - current)} detik (1 detik per package)
      </p>
    </div>
  );
}
