# Play Store Scraper - Batch Package Name Lookup

Aplikasi web untuk mencari **Publisher Name** dan **Category** dari aplikasi Android di Google Play Store berdasarkan package name.

## ✨ Fitur

- 📁 **Import Excel** - Upload file .xlsx yang berisi daftar package name
- ✏️ **Manual Input** - Input package name secara manual
- 🔍 **Batch Scraping** - Proses banyak package name sekaligus (max 50 per batch)
- 📊 **Hasil Tabel** - Tampilkan hasil dalam tabel yang rapi
- 📥 **Export Excel** - Download hasil dalam format .xlsx
- ⚡ **Powered by google-play-scraper** - Data akurat dari Google Play Store API

## 🚀 Cara Penggunaan

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

## 📦 Deployment ke Vercel

### Cara 1: Via Vercel Dashboard (Recommended)
1. Push repository ini ke GitHub
2. Buka [vercel.com](https://vercel.com)
3. Klik "Add New Project"
4. Import project dari GitHub repository
5. Framework Preset: **Vite** (auto-detected)
6. Klik "Deploy"
7. Tunggu deployment selesai (~2-3 menit)

### Cara 2: Via Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Login ke Vercel
vercel login

# Deploy
vercel

# Deploy ke production
vercel --prod
```

### Cara 3: Via Git (Auto-deploy)
```bash
# Setelah project terhubung ke Vercel
git add .
git commit -m "update: improve scraper accuracy"
git push origin main
```
Vercel akan otomatis deploy setiap ada push ke branch `main`.

## ⚙️ Konfigurasi Vercel

Project ini sudah dikonfigurasi dengan `vercel.json`:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "functions": {
    "api/scrape.mjs": {
      "maxDuration": 60
    }
  }
}
```

### Troubleshooting Deployment

Jika deployment gagal, cek:

1. **Build Logs** di Vercel Dashboard
2. Pastikan **Framework Preset** = **Vite**
3. Pastikan **Output Directory** = **dist**
4. Pastikan Node.js version >= 18 (untuk mendukung ESM)

Jika ada error terkait `google-play-scraper`:
```bash
# Pastikan dependencies terinstall
npm install

# Commit package-lock.json
git add package-lock.json
git commit -m "chore: update dependencies"
git push origin main
```

## 🏗️ Struktur Project

```
├── api/
│   ├── scrape.mjs         # Vercel Serverless Function (ESM)
│   └── package.json       # API config (type: module)
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
├── package.json           # Dependencies
└── README.md
```

## 🛠️ Teknologi

- **Frontend**: React 18 + TypeScript + Tailwind CSS + Vite
- **Backend**: Vercel Serverless Functions (ESM)
- **Scraping**: google-play-scraper (Node.js library)
- **Excel**: SheetJS (xlsx)

## 📝 Catatan Penting

- Maksimal **50 package** per batch request
- Ada delay **1.5 detik** antar request untuk menghindari rate limiting
- Data diambil menggunakan **google-play-scraper** library yang teruji
- Estimasi waktu: ~1.5 detik per package name
- Jika ada error "App not found", berarti package name tidak valid atau app sudah dihapus

## 🔧 Development Lokal

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📄 License

MIT

## 🤝 Contributing

Pull requests welcome! Untuk major changes, please open issue terlebih dahulu.
