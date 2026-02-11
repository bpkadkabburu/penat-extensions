# Clear Download History Storage

## Cara Manual Clear Storage

Jika ingin menghapus semua download history tracking:

1. Buka **Chrome DevTools** (F12) di halaman SIPD
2. Pilih tab **Application** atau **Console**
3. Di Console, jalankan:

```javascript
// Clear hanya rincian belanja tracker
chrome.storage.local.remove('sipd_tracker_rincian_belanja');

// ATAU clear semua tracker
chrome.storage.local.remove([
  'sipd_tracker_persetujuan',
  'sipd_tracker_skpd', 
  'sipd_tracker_pendapatan',
  'sipd_tracker_belanja',
  'sipd_tracker_pembiayaan',
  'sipd_tracker_rincian_belanja'
]);

// ATAU clear semua data extension (jadwal, tracker, error logs, dll)
chrome.storage.local.clear();
```

## Catatan

- File download di folder `SIPD-Output` **tidak akan terhapus**
- Hanya tracking history (checkmark) yang di-reset
- Setelah clear, semua sub-kegiatan akan muncul tanpa checkmark
