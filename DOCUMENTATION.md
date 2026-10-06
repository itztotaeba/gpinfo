# Play Store Scraper - Dokumentasi Lengkap

## 🎯 Fitur Utama

Aplikasi web untuk scraping data aplikasi Android dari Google Play Store berdasarkan package name.

### Data yang Diambil:
1. **Package Name** - ID aplikasi (contoh: com.whatsapp)
2. **App Name** - Nama aplikasi
3. **Publisher Name** - Nama developer/publisher
4. **Category** - Kategori aplikasi
5. **Version** - Versi aplikasi ⭐

---

## 🔍 Sistem Scraping Versi (6 Metode)

Sistem menggunakan **6 metode berurutan** untuk mendapatkan versi aplikasi yang akurat:

### 1. Library (google-play-scraper)
- Menggunakan library `google-play-scraper` yang teruji
- Cepat dan reliable untuk data dasar
- Method pertama yang dicoba

### 2. Device Simulation (5 Android Devices)
Simulasi 5 device Android berbeda dengan User-Agent spesifik:
- **Samsung Galaxy S23** (Android 14, SM-S911B)
- **Google Pixel 8** (Android 14)
- **Samsung Galaxy A54** (Android 13, SM-A546B)
- **Xiaomi 13** (Android 14, 2211133G)
- **OnePlus 11** (Android 14, CPH2449)

Setiap device menggunakan:
- User-Agent Android Mobile yang spesifik
- Sec-CH-UA headers (platform, mobile, brand)
- Accept headers yang sesuai

### 3. Desktop Fetch
- Fetch dengan User-Agent desktop
- Extract versi dari:
  - **JSON-LD** (`<script type="application/ld+json">`)
  - **Meta tags** (`itemprop="softwareVersion"`)
  - **HTML blocks** (`.hAyfc` dengan label "Current Version")

### 4. APKMirror ⭐
- Scraping dari APKMirror.com
- Database APK dengan versi spesifik
- Fallback ketika Play Store menampilkan "Varies with device"
- URL format: `https://www.apkmirror.com/apk/{developer}/{app-name}/`

### 5. APKPure ⭐
- Scraping dari APKPure.com
- Alternative source untuk versi APK
- Fallback tambahan jika APKMirror gagal
- URL format: `https://apkpure.com/{package-name}/{package-name}`

### 6. Multi-Country
- Coba 10 country berbeda:
  - Indonesia (id), USA (us), UK (gb), Singapore (sg)
  - Australia (au), Japan (jp), Korea (kr)
  - Germany (de), Brazil (br), India (in)
- Beberapa app memiliki versi berbeda per region

---

## ⚙️ Konfigurasi

### vercel.json
```json
{
  "functions": {
    "api/scrape.mjs": {
      "maxDuration": 120
    }
  }
}
```

**Catatan:** 
- **Vercel Pro Plan** diperlukan untuk `maxDuration: 120 detik`
- **Vercel Hobby/Free Plan** hanya mendukung max 10 detik
- Jika pakai free plan, kurangi jumlah device di `DEVICE_PROFILES`

### Rate Limiting
- Delay 200ms antar device simulation
- Delay 200-600ms antar metode
- Mencegah blocking oleh Google Play Store

---

## 📊 Hasil yang Diharapkan

| Skenario | Hasil |
|----------|-------|
| App dengan versi tetap | ✅ Versi spesifik (contoh: `2.24.3.76`) |
| App "Varies with device" | ✅ Versi dari APKMirror/APKPure/Device Simulation |
| App berbeda versi per device | ✅ Versi paling spesifik dari 5 device |
| App sangat baru/beta | ⚠️ Mungkin masih "Varies with device" |
| App dihapus/diblokir | ❌ Error |

---

## 🚀 Deployment

### 1. Push ke GitHub
```bash
git add .
git commit -m "feat: add 6-method version scraping with APKMirror & APKPure"
git push origin main
```

### 2. Vercel Auto-Deploy
- Vercel akan otomatis detect perubahan
- Build frontend dengan Vite
- Deploy API function ke serverless

### 3. Cek Deployment
- Buka Vercel Dashboard
- Pastikan deployment status: **Ready**
- Test dengan sample data

---

## 🧪 Testing

### Sample Package Names
```
com.whatsapp
com.instagram.android
com.spotify.music
com.tencent.mm
com.facebook.katana
```

### Expected Results
- **WhatsApp**: Versi spesifik (contoh: `2.24.3.76`)
- **Instagram**: Versi spesifik atau "Varies with device"
- **Spotify**: Versi spesifik
- **WeChat**: Versi spesifik
- **Facebook**: Versi spesifik

---

## ⚠️ Limitasi & Catatan Penting

### 1. "Varies with device" Adalah Normal
Beberapa aplikasi memang memiliki versi yang berbeda untuk device yang berbeda. Ini **bukan bug**, tapi fitur dari Google Play Store.

**Contoh:**
- App game mungkin punya versi berbeda untuk HP vs Tablet
- App dengan fitur AR mungkin butuh versi berbeda per device
- App dengan hardware-specific features

### 2. Tidak Ada Jaminan 100%
Meskipun menggunakan 6 metode, ada kemungkinan:
- App sangat baru belum ada di APKMirror/APKPure
- App beta/testing hanya tersedia untuk device tertentu
- Developer memang set "Varies with device" untuk semua device

### 3. Login Google TIDK Diperlukan
- Login ke Google Play Store **tidak akan membantu**
- "Varies with device" memang berarti versi berbeda per device
- Login berisiko (2FA, CAPTCHA, banned)
- Melanggar Terms of Service Google

### 4. Rate Limiting
- Google Play Store mungkin block IP jika terlalu banyak request
- Sistem sudah implement delay untuk mencegah ini
- Jika banyak app gagal, tunggu beberapa menit lalu coba lagi

### 5. Vercel Plan Requirements
- **Pro Plan** ($20/bulan): maxDuration 120 detik ✅
- **Hobby/Free Plan**: maxDuration 10 detik ⚠️
- Jika pakai free plan, kurangi metode atau device profiles

---

## 🛠️ Troubleshooting

### Masalah: Semua versi "Varies with device"
**Solusi:**
1. Cek Vercel logs untuk melihat metode mana yang gagal
2. Pastikan maxDuration cukup (120 detik untuk 6 metode)
3. Coba test dengan package name yang known memiliki versi spesifik (com.whatsapp)

### Masalah: API timeout
**Solusi:**
1. Naikkan maxDuration di vercel.json
2. Kurangi jumlah device profiles
3. Kurangi jumlah metode yang dicoba

### Masalah: APKMirror/APKPure gagal
**Solusi:**
1. Cek apakah website tersebut blocking server IP
2. Coba ganti User-Agent
3. Sistem akan otomatis fallback ke metode lain

### Masalah: Banyak app error "App not found"
**Solusi:**
1. Cek package name apakah valid
2. App mungkin sudah dihapus dari Play Store
3. Coba retry dengan tombol "Retry Failed"

---

## 📈 Performance

### Estimasi Waktu
- **1 package**: ~5-15 detik (tergantung berapa metode yang dicoba)
- **50 packages**: ~7-10 menit
- **100 packages**: ~15-20 menit
- **300 packages**: ~45-60 menit

### Optimasi yang Dilakukan
- Early exit jika sudah dapat versi bagus
- Delay minimal antar metode
- Parallel processing tidak digunakan (untuk menghindari rate limit)
- Cache tidak digunakan (data selalu fresh dari Play Store)

---

## 🔐 Security & Ethics

### Terms of Service
- Scraping Google Play Store **mungkin melanggar** ToS Google
- Gunakan untuk **keperluan pribadi/riset** saja
- Jangan gunakan untuk komersial tanpa izin
- Respect rate limits dan jangan abuse

### Data Privacy
- Tidak menyimpan data user
- Tidak ada authentication required
- Semua data di-fetch real-time dari Play Store
- Tidak ada data yang di-cache di server

---

## 📝 Changelog

### v3.0 (Latest)
- ✅ Tambah APKMirror scraping
- ✅ Tambah APKPure scraping
- ✅ Total 6 metode scraping
- ✅ Max duration 120 detik
- ✅ Better logging untuk debugging

### v2.0
- ✅ Device simulation dengan 5 Android devices
- ✅ Multiple extraction methods (JSON-LD, meta, HTML)
- ✅ Multi-country support

### v1.0
- ✅ Basic scraping dengan google-play-scraper
- ✅ Excel import/export
- ✅ Batch processing

---

## 🤝 Support

Untuk pertanyaan atau issue:
1. Cek Vercel logs untuk error details
2. Test dengan sample data terlebih dahulu
3. Pastikan Vercel plan sesuai (Pro untuk 120 detik)
4. Cek apakah package name valid di Play Store

---

## 📄 License

MIT License - Gunakan dengan bijak dan responsible.

---

**Last Updated**: 2026-01-XX
**Version**: 3.0
**Status**: Production Ready ✅
