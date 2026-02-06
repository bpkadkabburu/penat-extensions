# 📦 Batch Extract DPA - Per-SKPD Control

Extension sekarang support **Batch Extraction dengan kontrol granular**!

## 🚀 Cara Pakai

1. **Buka Halaman List:**
   URL: `https://sipd.kemendagri.go.id/penatausahaan/pengeluaran/dpa/laporan/dpa/halaman-persetujuan-dpa`
   
   Klik tombol: **📦 Batch Extract DPA**

2. **Preview Modal Muncul:**
   - Lihat **Total SKPD** yang ditemukan
   - Lihat **daftar Jadwal** yang akan didownload per SKPD
   - **Scrollable list SKPD** dengan tombol Download masing-masing

3. **Pilih SKPD yang Diinginkan (Granular Control! ✨)**
   - Klik tombol **⬇️ Download** pada SKPD tertentu (misal: SKPD 277)
   - Extension akan otomatis download **SEMUA jadwal** untuk SKPD tersebut
   - **Exclude jadwal ID 62** (otomatis difilter)

4. **Proses Download:**
   - Modal tetap terbuka
   - Tombol berubah: `⏳ Processing...` → `✅ Done`
   - Download SKPD lain kapan saja tanpa perlu buka ulang modal

## ⚙️ Fitur

- ✅ **Download per SKPD**: Kontrol mana yang mau didownload dulu
- ✅ **Auto-filter**: Jadwal ID 62 otomatis diskip
- ✅ **Multi-schedule**: Download semua jadwal untuk 1 SKPD sekaligus
- ✅ **Rate Limiting**: 1.5 detik delay antar file
- ✅ **File Organization**: `SIPD-Output/[Jadwal]/[SKPD_ID]/persetujuan.json`

## 📊 Contoh

Jika SKPD 277 punya 4 jadwal (ID: 60, 61, 62, 63):
- Jadwal yang didownload: **3 file** (60, 61, 63)
- Jadwal 62 **diskip otomatis**
- Total waktu: ~4.5 detik (3 file × 1.5s)

Enjoy! 🚀
