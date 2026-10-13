import { useState, useCallback } from 'react';

interface ManualInputProps {
  onPackagesLoaded: (packages: string[]) => void;
}

export function ManualInput({ onPackagesLoaded }: ManualInputProps) {
  const [text, setText] = useState('');

  const handleSubmit = useCallback(() => {
    const lines = text.split(/[\n,;]+/).map(l => l.trim()).filter(l => l.length > 0);
    const packages: string[] = [];

    for (const line of lines) {
      if (/^[a-zA-Z][a-zA-Z0-9_]*(\.[a-zA-Z][a-zA-Z0-9_]*)+$/.test(line)) {
        if (!packages.includes(line)) {
          packages.push(line);
        }
      }
    }

    if (packages.length > 0) {
      onPackagesLoaded(packages);
    } else {
      alert('Tidak ditemukan package name yang valid.\n\nFormat: com.example.app (satu per baris)');
    }
  }, [text, onPackagesLoaded]);

  return (
    <div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={'Masukkan package name (satu per baris):\n\ncom.whatsapp\ncom.instagram.android\ncom.spotify.music\ncom.tencent.mm\ncom.facebook.katana'}
        className="input-glass h-48 p-4 font-mono text-sm resize-none"
      />
      <div className="flex items-center justify-between mt-4">
        <p className="text-sm text-[var(--ink-muted)]">
          <span className="chip tabular-nums">
            {text.split(/[\n,;]+/).filter(l => l.trim().length > 0).length} terdeteksi
          </span>
        </p>
        <button
          onClick={handleSubmit}
          disabled={text.trim().length === 0}
          className="btn btn-success"
        >
          Load Packages
        </button>
      </div>
    </div>
  );
}
