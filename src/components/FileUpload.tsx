import { useCallback, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { FileIcon, InfoIcon, UploadIcon } from './icons';

interface FileUploadProps {
  onPackagesLoaded: (packages: string[]) => void;
}

export function FileUpload({ onPackagesLoaded }: FileUploadProps) {
  const [fileName, setFileName] = useState<string>('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback((file: File) => {
    setFileName(file.name);
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as any[][];

        const packages: string[] = [];

        for (let i = 0; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (!row || row.length === 0) continue;

          for (const cell of row) {
            if (typeof cell === 'string' && cell.includes('.')) {
              const trimmed = cell.trim();
              if (/^[a-zA-Z][a-zA-Z0-9_]*(\.[a-zA-Z][a-zA-Z0-9_]*)+$/.test(trimmed)) {
                if (!packages.includes(trimmed)) {
                  packages.push(trimmed);
                }
              }
            }
          }
        }

        if (packages.length > 0) {
          onPackagesLoaded(packages);
        } else {
          alert('Tidak ditemukan package name yang valid di file ini.\n\nFormat package name yang diharapkan: com.example.app');
          setFileName('');
        }
      } catch (error) {
        console.error('Error parsing file:', error);
        alert('Gagal membaca file. Pastikan file berformat .xlsx yang valid.');
        setFileName('');
      }
    };

    reader.readAsArrayBuffer(file);
  }, [onPackagesLoaded]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  }, [processFile]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv'))) {
      processFile(file);
    } else {
      alert('Hanya menerima file .xlsx, .xls, atau .csv');
    }
  }, [processFile]);

  return (
    <div>
      <div
        className={`glass-sheen relative cursor-pointer rounded-[24px] border-2 border-dashed p-10 text-center transition-all duration-200 ${
          dragActive
            ? 'border-emerald-300/70 bg-emerald-400/10 shadow-[0_0_40px_-10px_rgba(52,211,153,0.6)]'
            : 'border-white/20 hover:border-white/40 hover:bg-white/5'
        }`}
        style={{ backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)' }}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <div
          className={`logo-mark mx-auto mb-4 !w-14 !h-14 !rounded-[22px] transition-transform duration-200 ${dragActive ? 'scale-110' : ''}`}
        >
          {fileName ? <FileIcon className="w-7 h-7" /> : <UploadIcon className="w-7 h-7" />}
        </div>
        <p className="text-white font-semibold mb-1">
          {fileName || 'Drag & drop file Excel di sini'}
        </p>
        <p className="text-sm text-[var(--ink-muted)]">
          {fileName ? 'File berhasil dimuat!' : 'atau klik untuk memilih file (.xlsx, .xls, .csv)'}
        </p>
        <p className="text-xs text-[var(--ink-faint)] mt-3">
          File harus berisi kolom dengan package name (contoh: com.whatsapp, com.instagram.android)
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="mt-4 glass-soft p-4 flex gap-3 items-start">
        <InfoIcon className="w-4 h-4 text-sky-300 shrink-0 mt-0.5" />
        <div className="text-xs text-[var(--ink-muted)] space-y-1">
          <p className="font-semibold text-white">Format file yang didukung:</p>
          <p>• Kolom berisi package name (otomatis terdeteksi)</p>
          <p>• Contoh: com.whatsapp, com.instagram.android, com.spotify.music</p>
          <p>• Mendukung file .xlsx, .xls, dan .csv</p>
        </div>
      </div>
    </div>
  );
}
