// Background Service Worker for SIPD Data Extractor

// Listen for extension installation
chrome.runtime.onInstalled.addListener(() => {
    console.log('SIPD Data Extractor installed');
});

// Listen for messages from popup or content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'fetchJadwal') {
        handleFetchJadwal(sendResponse);
        return true; // Keep channel open for async response
    }

    if (request.action === 'fetchDPA') {
        handleFetchDPA(request.skpdId, request.jadwalId, sendResponse);
        return true; // Keep channel open for async response
    }

    if (request.action === 'downloadFile') {
        handleDownload(request.dataUrl, request.filename, sendResponse);
        return true;
    }

    if (request.action === 'postDokumenRealisasi') {
        handlePostDokumenRealisasi(request.payload, sendResponse);
        return true;
    }

    if (request.action === 'openOptions') {
        chrome.runtime.openOptionsPage();
        return false;
    }
});

/**
 * POST data realisasi per dokumen ke server bpkad-superapps.
 * Dilakukan dari service worker agar tidak terkena CORS (tidak ada Origin header
 * seperti request dari halaman).
 * @param {{ apiUrl: string, token: string, tahun: number, bulan: number, data: Array }} payload
 * @param {Function} sendResponse
 */
async function handlePostDokumenRealisasi(payload, sendResponse) {
    try {
        const { apiUrl, token, tahun, bulan, data } = payload;

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ tahun, bulan, data })
        });

        if (!response.ok) {
            const text = await response.text().catch(() => '');
            throw new Error(`HTTP ${response.status}${text ? ': ' + text.substring(0, 200) : ''}`);
        }

        const respJson = await response.json().catch(() => ({}));
        sendResponse({ success: true, data: { total: data.length, response: respJson } });
    } catch (error) {
        console.error('Error posting dokumen realisasi:', error);
        sendResponse({ success: false, error: error.message });
    }
}

/**
 * Handle file download request
 */
async function handleDownload(dataUrl, filename, sendResponse) {
    try {
        await chrome.downloads.download({
            url: dataUrl,
            filename: filename, // Path relative to user's Downloads folder (e.g., "SIPD-Output/file.json")
            saveAs: false,       // false = auto save without prompt
            conflictAction: 'overwrite'
        });
        sendResponse({ success: true });
    } catch (error) {
        console.error('Download error:', error);
        sendResponse({ success: false, error: error.message });
    }
}

/**
 * Handle fetch jadwal request
 * @param {Function} sendResponse - Callback to send response
 */
async function handleFetchJadwal(sendResponse) {
    try {
        const apiUrl = 'https://service.sipd.kemendagri.go.id/referensi/strict/laporan/dpa/dpa/jadwal-pergeseran';

        const response = await fetch(apiUrl, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        sendResponse({ success: true, data });

    } catch (error) {
        console.error('Error fetching jadwal:', error);
        sendResponse({ success: false, error: error.message });
    }
}

/**
 * Handle fetch DPA data request
 * @param {string} skpdId - SKPD ID
 * @param {string} jadwalId - Jadwal ID
 * @param {Function} sendResponse - Callback to send response
 */
async function handleFetchDPA(skpdId, jadwalId, sendResponse) {
    try {
        const apiUrl = `https://service.sipd.kemendagri.go.id/referensi/strict/laporan/dpa/dpa/halaman-persetujuan/${skpdId}/${jadwalId}`;

        const response = await fetch(apiUrl, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        sendResponse({ success: true, data });

    } catch (error) {
        console.error('Error fetching DPA data:', error);
        sendResponse({ success: false, error: error.message });
    }
}
