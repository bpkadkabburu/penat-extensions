# CHANGELOG

All notable changes and fixes to the SIPD Data Extractor extension.

---

## v1.0.0 - Initial Release

### Features
- ✅ Fetch jadwal APBD from SIPD API
- ✅ Store jadwal data locally using chrome.storage.local
- ✅ Inject "Extract DPA Data" button on approval detail pages
- ✅ Extract DPA data using SKPD ID and jadwal selection
- ✅ Auto-download extracted data as JSON file
- ✅ Bearer token auto-extraction from cookies

---

## Development Notes & Fixes

### 1. Bearer Token Support

**Issue**: API requests failed with 401 Unauthorized - missing Authorization header.

**Solution**: 
- Created `token-extractor.js` to auto-extract JWT token from cookies (`X-SIPD-PU-TK`)
- Token stored in `chrome.storage.local` with key `sipd_auth_token`
- All API requests include `Authorization: Bearer <token>` header

**Files Modified**:
- `manifest.json` - Added token-extractor content script
- `src/content/token-extractor.js` (NEW) - Cookie-based token extraction
- `src/utils/api.js` - Added token retrieval and Authorization header
- `src/content/content.js` - Added token support for DPA extraction

---

### 2. Cookie Token Extraction

**Issue**: Token not found in localStorage/sessionStorage.

**Solution**: 
- Updated token extractor to prioritize cookie `X-SIPD-PU-TK`
- Token is stored as JWT in cookies by SIPD
- Fallback to localStorage/sessionStorage if cookie not available

**Priority Order**:
1. Cookie `X-SIPD-PU-TK` ✅
2. localStorage (fallback)
3. sessionStorage (fallback)
4. Network request interception (fallback)

---

### 3. Forbidden Headers & CORS

**Issue**: Origin and Referer headers not appearing in requests. Attempted manual setting caused CORS preflight errors.

**Root Cause**:
- `Origin`, `Referer`, `User-Agent`, `Sec-*`, `Accept-Encoding`, `Accept-Language` are **forbidden headers**
- Cannot be set manually by JavaScript
- Browser auto-sets these based on request context
- Custom headers like `Cache-Control` and `Pragma` trigger CORS preflight which SIPD server rejects

**Solution**:
- Removed all forbidden headers from manual setting
- Removed CORS-triggering headers (`Cache-Control`, `Pragma`, `Accept`)
- Keep only `Authorization: Bearer <token>` header
- Browser automatically sets Origin, Referer, and other necessary headers

**Final Headers Sent**:
```http
Authorization: Bearer <token>     ← Manual
Origin: https://sipd.kemendagri.go.id  ← Browser auto
Referer: https://sipd.kemendagri.go.id/... ← Browser auto
Cookie: X-SIPD-PU-TK=...           ← Browser auto
Accept: */*                        ← Browser auto
```

**Files Modified**:
- `src/utils/api.js` - Simplified headers
- `src/utils/tab-fetch.js` - Simplified headers
- `src/content/content.js` - Simplified headers
- `src/content/injected-fetch.js` - Simplified headers

---

### 4. Cross-Origin Request Context

**Issue**: Requests from extension popup/background had `sec-fetch-site: none`, causing missing Origin/Referer headers.

**Solution**: Execute fetch in SIPD page context using `chrome.scripting.executeScript()`

**Implementation**:
- Popup fetches data by executing script in active SIPD tab
- Content script runs directly in page context
- Both methods ensure Origin/Referer are auto-set correctly

**Files Added**:
- `src/utils/tab-fetch.js` - Wrapper for tab-based fetch execution
- `src/content/injected-fetch.js` - MAIN world script for postMessage bridge

**Files Modified**:
- `manifest.json` - Added injected-fetch with `"world": "MAIN"`
- `popup/popup.html` - Import tab-fetch.js
- `popup/popup.js` - Use `fetchFromSIPDTab()` instead of direct fetch

---

### 5. IndexedDB vs Chrome Storage

**Issue**: Popup saves data to IndexedDB in `chrome-extension://` origin, but content script tries to read from `https://sipd.kemendagri.go.id` origin - two different databases!

**Solution**: Migrate to `chrome.storage.local` which is shared across all extension contexts.

**Advantages of chrome.storage.local**:
- ✅ Cross-context: Accessible from popup, content script, background
- ✅ Persists across browser sessions
- ✅ Simple Promise-based API
- ✅ Up to 10 MB storage limit

**Files Added**:
- `src/db/chrome-storage.js` - Chrome Storage API wrapper

**Files Modified**:
- `popup/popup.html` - Import chrome-storage.js instead of indexeddb.js
- `src/content/content.js` - Use chrome.storage.local.get instead of IndexedDB

**Files Deprecated**:
- ~~`src/db/indexeddb.js`~~ - No longer used

---

### 6. CORS Preflight Errors

**Issue**: 
```
Request header field cache-control is not allowed by 
Access-Control-Allow-Headers in preflight response
```

**Root Cause**: 
- Custom headers trigger CORS preflight (OPTIONS request)
- SIPD server does not allow `Cache-Control`, `Pragma`, `Accept` headers

**Solution**: Remove all custom headers except `Authorization`

**Before** (Error):
```javascript
headers: {
  'Accept': 'application/json',
  'Authorization': `Bearer ${token}`,
  'Cache-Control': 'no-cache',    // ❌ Triggers preflight
  'Pragma': 'no-cache'             // ❌ Triggers preflight
}
```

**After** (Fixed):
```javascript
headers: {
  'Authorization': `Bearer ${token}`  // ✅ No preflight
}
```

---

## Technical Stack

### Extension Architecture
- **Manifest Version**: 3
- **Content Scripts**: Isolated + MAIN world injection
- **Storage**: chrome.storage.local
- **Permissions**: storage, activeTab, scripting
- **Host Permissions**: sipd.kemendagri.go.id, service.sipd.kemendagri.go.id

### File Structure
```
penat-extension/
├── manifest.json
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── popup/
│   ├── popup.html
│   ├── popup.css
│   └── popup.js
└── src/
    ├── background/
    │   └── service-worker.js
    ├── content/
    │   ├── content.js
    │   ├── content.css
    │   ├── token-extractor.js
    │   └── injected-fetch.js
    ├── db/
    │   └── chrome-storage.js
    └── utils/
        ├── api.js
        └── tab-fetch.js
```

### Data Storage
```json
chrome.storage.local = {
  "sipd_auth_token": "eyJhbGci...",
  "sipd_jadwal": [
    {
      "id_jadwal": "123",
      "nama_jadwal": "TA 2024 Murni",
      ...
    }
  ]
}
```

---

## Debugging

### Check Token
```javascript
chrome.storage.local.get(['sipd_auth_token'], console.log);
```

### Check Jadwal Data
```javascript
chrome.storage.local.get(['sipd_jadwal'], console.log);
```

### Clear All Data
```javascript
chrome.storage.local.clear(() => console.log('Cleared'));
```

### Verify in DevTools
```
F12 → Application → Storage → Extension Storage
```

---

## Known Limitations

1. **Popup must be opened from SIPD tab** for fetch to work (required for proper Origin/Referer)
2. **User must be logged in** to SIPD for token extraction
3. **Token expires** after ~24 hours (user needs to re-login)

---

## Future Improvements

- [ ] Auto-detect token expiration and show refresh prompt
- [ ] Export multiple DPA data in batch
- [ ] Add data filtering and search in jadwal modal
- [ ] Background sync for jadwal data
- [ ] Export to Excel format

---

**Version**: 1.0.0  
**Last Updated**: 2026-02-04
