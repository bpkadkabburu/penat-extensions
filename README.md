# SIPD Data Extractor

Chrome extension untuk mengekstrak data DPA dari website SIPD Kemendagri.

## Fitur

- 📥 **Fetch Jadwal APBD** - Ambil dan simpan data jadwal APBD ke IndexedDB
- 📊 **Extract DPA Data** - Ekstrak data halaman persetujuan DPA berdasarkan SKPD dan Jadwal
- 💾 **Auto Download** - Otomatis download data dalam format JSON
- 🎨 **Modern UI** - Interface yang clean dan user-friendly

## Instalasi

### 1. Clone atau Download Extension

Clone repository ini atau download sebagai ZIP dan extract.

### 2. Install di Chrome

1. Buka Chrome dan navigasi ke `chrome://extensions/`
2. Aktifkan **Developer mode** di pojok kanan atas
3. Klik **Load unpacked**
4. Pilih folder `penat-extension`
5. Extension akan muncul di toolbar Chrome

## Cara Penggunaan

### A. Setup Awal (Sekali saja)

1. **Login ke SIPD** terlebih dahulu di browser Chrome
2. Klik icon extension di toolbar
3. Klik tombol **"Fetch Jadwal"**
4. Data jadwal akan tersimpan di IndexedDB browser Anda

### B. Ekstrak Data DPA

1. **Navigasi ke halaman approval detail**:
   ```
   https://sipd.kemendagri.go.id/penatausahaan/pengeluaran/dpa/laporan/dpa/halaman-persetujuan-dpa/[ID_SKPD]
   ```
   
2. **Klik tombol "Extract DPA Data"** yang muncul di pojok kanan atas halaman

3. **Pilih jadwal** dari modal yang muncul

4. Data akan diambil dari API dan otomatis terdownload sebagai file JSON dengan format:
   ```
   DPA_SKPD_[ID_SKPD]_Jadwal_[ID_JADWAL]_[NAMA_JADWAL].json
   ```

### C. Update Jadwal

Jika ada jadwal baru atau perlu refresh data jadwal:

1. Klik icon extension
2. Klik **"Clear Data"**
3. Klik **"Fetch Jadwal"** lagi

## Struktur Extension

```
penat-extension/
├── manifest.json              # Extension configuration
├── popup/
│   ├── popup.html            # Popup UI
│   ├── popup.css             # Popup styling
│   └── popup.js              # Popup logic
├── src/
│   ├── background/
│   │   └── service-worker.js # Background service worker
│   ├── content/
│   │   ├── content.js        # Content script (injected on pages)
│   │   └── content.css       # Content script styling
│   ├── db/
│   │   └── indexeddb.js      # IndexedDB wrapper
│   └── utils/
│       └── api.js            # API utilities
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

## API Endpoints

Extension ini berinteraksi dengan API berikut:

1. **Jadwal Pergeseran**:
   ```
   GET https://service.sipd.kemendagri.go.id/referensi/strict/laporan/dpa/dpa/jadwal-pergeseran
   ```

2. **Halaman Persetujuan DPA**:
   ```
   GET https://service.sipd.kemendagri.go.id/referensi/strict/laporan/dpa/dpa/halaman-persetujuan/{skpd_id}/{jadwal_id}
   ```

## Troubleshooting

### Extension tidak bisa fetch data

- Pastikan Anda sudah login ke SIPD di browser Chrome
- Check Network tab di DevTools untuk melihat request yang gagal
- Pastikan cookies session masih valid

### Tombol "Extract DPA Data" tidak muncul

- Pastikan Anda berada di halaman yang benar (halaman approval detail dengan URL pattern `/halaman-persetujuan-dpa/\d+`)
- Refresh halaman dan coba lagi
- Check Console di DevTools untuk error messages

### Data jadwal kosong

- Klik "Fetch Jadwal" terlebih dahulu dari popup extension
- Pastikan API mengembalikan data yang valid
- Check IndexedDB di DevTools (Application → Storage → IndexedDB → SIPDExtractorDB)

## Teknologi

- Chrome Extension Manifest V3
- IndexedDB untuk storage lokal
- Vanilla JavaScript (no framework)
- Modern CSS dengan gradients dan animations

## Catatan Keamanan

- Extension ini menggunakan cookies dan session dari browser untuk autentikasi
- Data jadwal disimpan secara lokal di IndexedDB browser
- Tidak ada data yang dikirim ke server third-party
- Extension hanya memiliki akses ke domain `*.sipd.kemendagri.go.id`

## License

MIT License

## Support

Jika ada masalah atau pertanyaan, silakan buat issue di repository ini.
