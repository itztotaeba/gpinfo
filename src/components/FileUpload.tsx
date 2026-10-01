import { useCallback, useRef, useState } from 'react';
import * as XLSX from 'xlsx';

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
        
        // Get first sheet
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as any[][];
        
        // Extract package names - try to find the column with package names
        const packages: string[] = [];
        
        // Skip header row, look for package names
        for (let i = 0; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (!row || row.length === 0) continue;
          
          for (const cell of row) {
            if (typeof cell === 'string' && cell.includes('.')) {
              // Check if it looks like a package name (contains dots, no spaces)
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
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
          dragActive
            ? 'border-green-400 bg-green-400/10'
            : 'border-white/20 hover:border-white/40 hover:bg-white/5'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="text-4xl mb-3">📁</div>
        <p className="text-white font-medium mb-1">
          {fileName || 'Drag & drop file Excel di sini'}
        </p>
        <p className="text-sm text-gray-400">
          {fileName ? 'File berhasil dimuat!' : 'atau klik untuk memilih file (.xlsx, .xls, .csv)'}
        </p>
        <p className="text-xs text-gray-500 mt-2">
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

      {/* Sample format info */}
      <div className="mt-4 p-4 bg-white/5 rounded-lg border border-white/10">
        <p className="text-sm text-gray-400 mb-2">💡 <strong className="text-gray-300">Format file yang didukung:</strong></p>
        <div className="text-xs text-gray-500 space-y-1">
          <p>• Kolom berisi package name (otomatis terdeteksi)</p>
          <p>• Contoh: com.whatsapp, com.instagram.android, com.spotify.music</p>
          <p>• Mendukung file .xlsx, .xls, dan .csv</p>
        </div>
      </div>
    </div>
  );
}
