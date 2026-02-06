# SIPD Data Extractor - File Structure

```
penat-extension/
├── .gitignore
├── CHANGELOG.md                    # Consolidated changelog and fixes
├── README.md                        # User documentation
├── manifest.json                    # Extension manifest (v3)
│
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
│
├── popup/
│   ├── popup.html                   # Extension popup UI
│   ├── popup.css                    # Popup styling
│   └── popup.js                     # Popup logic (fetch jadwal)
│
└── src/
    ├── background/
    │   └── service-worker.js        # Background service worker
    │
    ├── content/
    │   ├── content.js               # Content script (inject button, extract DPA)
    │   ├── content.css              # Injected button/modal styling
    │   └── token-extractor.js       # Auto-extract Bearer token from cookies
    │
    ├── db/
    │   └── chrome-storage.js        # Chrome storage wrapper for jadwal data
    │
    └── utils/
        ├── api.js                   # API endpoints and helpers
        └── tab-fetch.js             # Tab-based fetch wrapper
```

## Total Files: 18

### Core Extension Files (4)
- `manifest.json`
- `.gitignore`
- `README.md`
- `CHANGELOG.md`

### Icons (3)
- `icons/icon16.png`
- `icons/icon48.png`
- `icons/icon128.png`

### Popup (3)
- `popup/popup.html`
- `popup/popup.css`
- `popup/popup.js`

### Source Files (8)
- `src/background/service-worker.js`
- `src/content/content.js`
- `src/content/content.css`
- `src/content/token-extractor.js`
- `src/db/chrome-storage.js`
- `src/utils/api.js`
- `src/utils/tab-fetch.js`

All files are **necessary and actively used**. No bloat! ✨
