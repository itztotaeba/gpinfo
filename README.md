# Play Store Scraper - Batch Package Name Lookup

Aplikasi web untuk mencari **Publisher Name** dan **Category** dari aplikasi Android di Google Play Store berdasarkan package name.

## Fitur

- 📁 **Import Excel** - Upload file .xlsx yang berisi daftar package name
- ✏️ **Manual Input** - Input package name secara manual
- 🔍 **Batch Scraping** - Proses banyak package name sekaligus
- 📊 **Hasil Tabel** - Tampilkan hasil dalam tabel yang rapi
- 📥 **Export Excel** - Download hasil dalam format .xlsx
- 🔄 **Fallback Mode** - CORS proxy sebagai backup jika API utama gagal

## Cara Penggunaan

### 1. Import File Excel
- Siapkan file .xlsx dengan kolom berisi package name (contoh: `com.whatsapp`, `com.instagram.android`)
- Upload file melalui tab "Import Excel"
- Sistem akan otomatis mendeteksi kolom package name

### 2. Manual Input
- Masukkan package name satu per baris
- Pisahkan dengan enter, koma, atau titik koma

### 3. Start Scraping
- Klik tombol "Start Scraping"
- Tunggu proses selesai (estimasi ~1.5 detik per package)
- Lihat hasil di tabel

### 4. Export
- Klik "Export Excel" untuk download hasil

## Deployment ke Vercel

### Cara 1: Via Vercel Dashboard
1. Push repository ini ke GitHub
2. Buka [vercel.com](https://vercel.com)
3. Import project dari GitHub
4. Framework Preset: **Vite**
5. Klik Deploy

### Cara 2: Via Vercel CLI
```bash
npm i -g vercel
vercel
```

### Cara 3: Via Git
```bash
vercel --prod
```

## Struktur Project

```
├── api/
│   └── scrape.ts          # Vercel Serverless Function
├── src/
│   ├── App.tsx            # Main component
│   ├── components/
│   │   ├── FileUpload.tsx    # Excel upload
│   │   ├── ManualInput.tsx   # Manual input
│   │   ├── ResultsTable.tsx  # Results display
│   │   ├── ProgressBar.tsx   # Progress indicator
│   │   └── ExportButton.tsx  # Export to Excel
│   ├── types.ts           # TypeScript types
│   ├── main.tsx           # Entry point
│   └── index.css          # Tailwind CSS
├── vercel.json            # Vercel configuration
└── package.json
```

## Teknologi

- **Frontend**: React + TypeScript + Tailwind CSS + Vite
- **Backend**: Vercel Serverless Functions
- **Scraping**: Cheerio (HTML parsing)
- **Excel**: SheetJS (xlsx)

## Catatan

- Maksimal 50 package per batch request
- Ada delay 1.5 detik antar request untuk menghindari rate limiting
- Jika hasil "Not found", coba aktifkan Mode Fallback
- Data diambil langsung dari halaman Google Play Store
