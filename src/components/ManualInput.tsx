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
      // Check if it looks like a package name
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
        placeholder={`Masukkan package name (satu per baris):\n\ncom.whatsapp\ncom.instagram.android\ncom.spotify.music\ncom.tencent.mm\ncom.facebook.katana`}
        className="w-full h-48 bg-white/5 border border-white/20 rounded-xl p-4 text-white placeholder-gray-500 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:border-green-400/50"
      />
      <div className="flex items-center justify-between mt-4">
        <p className="text-sm text-gray-400">
          {text.split(/[\n,;]+/).filter(l => l.trim().length > 0).length} package names terdeteksi
        </p>
        <button
          onClick={handleSubmit}
          disabled={text.trim().length === 0}
          className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-medium rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          Load Packages
        </button>
      </div>
    </div>
  );
}
