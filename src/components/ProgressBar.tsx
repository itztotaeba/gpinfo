import { SpinnerIcon } from './icons';

interface ProgressBarProps {
  current: number;
  total: number;
}

export function ProgressBar({ current, total }: ProgressBarProps) {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className="glass p-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <SpinnerIcon className="w-4 h-4 text-sky-300" />
          <span className="text-sm font-semibold text-white">Processing...</span>
        </div>
        <span className="text-sm text-[var(--ink-muted)] tabular-nums">
          {current} / {total} ({percentage}%)
        </span>
      </div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${percentage}%` }} />
      </div>
      <p className="text-xs text-[var(--ink-faint)] mt-2.5">
        Sisa ~{total - current} package — proses berjalan otomatis satu per satu
      </p>
    </div>
  );
}
