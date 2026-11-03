// STBP Pendapatan Content Script
// Sementara: tombol untuk ambil SEMUA halaman STBP (jenis=ALL, status=sudah_otorisasi)
// lalu export ke Excel, polanya sama seperti SPM Pembuatan / SP2D Pencairan.

(function () {
    'use strict';

    const BASE_URL = 'https://service.sipd.kemendagri.go.id';
    const STBP_ENDPOINT = '/penerimaan/strict/stbp';
    const STBP_JENIS = 'ALL';
    const STBP_STATUS = 'sudah_otorisasi';
    const PAGE_LIMIT = 10;

    let lastUrl = location.href;

    checkAndInjectButton();

    new MutationObserver(() => {
        const url = location.href;
        if (url !== lastUrl) {
            lastUrl = url;
            checkAndInjectButton();
        }
        checkAndInjectButton();
    }).observe(document, { subtree: true, childList: true });

    function isStbpPendapatanPage() {
        return window.location.pathname.replace(/\/$/, '') ===
            '/penatausahaan/penerimaan/stbp/pendapatan';
    }

    function checkAndInjectButton() {
        const existing = document.getElementById('sipd-stbp-container');
        if (isStbpPendapatanPage()) {
            if (!existing) addButton();
        } else if (existing) {
            existing.remove();
        }
    }

    function addButton() {
        const container = document.createElement('div');
        container.id = 'sipd-stbp-container';
        container.className = 'sipd-dashboard-container';

        const button = document.createElement('button');
        button.id = 'sipd-stbp-btn';
        button.className = 'sipd-dashboard-btn';
        button.innerHTML = `
            <span class="sipd-icon">📥</span>
            <span>Export STBP ke Excel</span>
        `;

        container.appendChild(button);
        document.body.appendChild(container);

        button.addEventListener('click', handleClick);
    }

    // ========== AUTH & HELPERS ==========

    function getAuthToken() {
        return new Promise((resolve) => {
            chrome.storage.local.get(['sipd_auth_token'], (result) => {
                resolve(result.sipd_auth_token || null);
            });
        });
    }

    function parseJwt(token) {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            return JSON.parse(jsonPayload);
        } catch (e) {
            console.error('Error parsing JWT:', e);
            return null;
        }
    }

    // Fetch langsung dari content script via XHR (bukan service worker) agar Origin
    // sesuai dengan yang server izinkan dan tidak kena 403.
    function fetchXHR(url, options = {}) {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open(options.method || 'GET', url);

            if (options.headers) {
                Object.keys(options.headers).forEach(key => {
                    xhr.setRequestHeader(key, options.headers[key]);
                });
            }
            if (options.credentials === 'include') {
                xhr.withCredentials = true;
            }

            xhr.onload = () => {
                resolve({
                    ok: xhr.status >= 200 && xhr.status < 300,
                    status: xhr.status,
                    statusText: xhr.statusText,
                    // null kalau header tidak di-expose via CORS (Access-Control-Expose-Headers)
                    header: (name) => xhr.getResponseHeader(name),
                    json: () => Promise.resolve(JSON.parse(xhr.responseText))
                });
            };
            xhr.onerror = () => reject(new TypeError('Network request failed'));
            xhr.send(options.body);
        });
    }

    // Rate limit server ~20 request / 30 detik, jaga jarak antar request.
    const REQUEST_DELAY_MS = 1600;

    async function fetchStbpPage(token, skpd, page, retries = 3) {
        const params = new URLSearchParams({
            jenis: STBP_JENIS,
            status: STBP_STATUS,
            skpd: String(skpd),
            page: String(page),
            limit: String(PAGE_LIMIT)
        });
        const url = `${BASE_URL}${STBP_ENDPOINT}?${params.toString()}`;

        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                const response = await fetchXHR(url, {
                    method: 'GET',
                    credentials: 'include',
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (!response.ok) {
                    if (response.status === 401) {
                        throw new Error('Token expired. Silakan refresh halaman SIPD.');
                    }
                    if (response.status === 429) {
                        await new Promise(r => setTimeout(r, 10000));
                        continue;
                    }
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const json = await response.json();
                const rows = Array.isArray(json) ? json : (Array.isArray(json?.data) ? json.data : []);
                const pageCount = parseInt(response.header('x-pagination-page-count'), 10);
                return { rows, pageCount: Number.isFinite(pageCount) ? pageCount : null };
            } catch (error) {
                if (attempt < retries) {
                    await new Promise(r => setTimeout(r, 2000));
                } else {
                    throw error;
                }
            }
        }
        throw new Error('Gagal mengambil data setelah beberapa percobaan (rate limit?).');
    }

    /**
     * Ambil SEMUA halaman STBP. Server bisa membatasi page size (mis. limit=10 tapi
     * cuma balik 5), jadi jangan berhenti hanya karena halaman tidak penuh.
     * Pakai header x-pagination-page-count kalau terbaca; kalau tidak, berhenti
     * begitu satu halaman balik kosong.
     */
    async function fetchAllStbp(token, skpd, onProgress) {
        const all = [];
        let page = 1;

        while (true) {
            const { rows, pageCount } = await fetchStbpPage(token, skpd, page);
            all.push(...rows);
            if (onProgress) onProgress(all.length, page, pageCount);

            if (rows.length === 0) break;
            if (pageCount !== null && page >= pageCount) break;

            page++;
            await new Promise(r => setTimeout(r, REQUEST_DELAY_MS));
        }

        return all;
    }

    // ========== EXCEL EXPORT (via SheetJS, lihat src/lib/xlsx.mini.min.js) ==========

    function downloadExcel(rows, filename, sheetName) {
        // Union semua key di seluruh baris jadi header.
        const headers = [];
        const seen = new Set();
        rows.forEach(row => {
            Object.keys(row || {}).forEach(key => {
                if (!seen.has(key)) {
                    seen.add(key);
                    headers.push(key);
                }
            });
        });

        // Nilai berupa object/array (mis. rincian) di-stringify supaya tidak jadi "[object Object]".
        const flatRows = rows.map(row => {
            const out = {};
            headers.forEach(key => {
                const value = row ? row[key] : undefined;
                out[key] = (value !== null && typeof value === 'object') ? JSON.stringify(value) : value;
            });
            return out;
        });

        const worksheet = XLSX.utils.json_to_sheet(flatRows, { header: headers });
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.substring(0, 31));

        const base64Data = XLSX.write(workbook, { bookType: 'xlsx', type: 'base64' });
        const dataUrl = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${base64Data}`;

        return new Promise((resolve, reject) => {
            chrome.runtime.sendMessage({
                action: 'downloadFile',
                dataUrl,
                filename
            }, (response) => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                } else if (response && response.success) {
                    resolve();
                } else {
                    reject(new Error(response?.error || 'Download gagal'));
                }
            });
        });
    }

    // ========== UI ==========

    function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `sipd-realisasi-toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.classList.add('show'), 100);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, type === 'error' ? 5000 : 3000);
    }

    function showLoadingIndicator(message = 'Memuat data...') {
        if (document.getElementById('sipd-stbp-loader')) return;
        const loader = document.createElement('div');
        loader.id = 'sipd-stbp-loader';
        loader.className = 'sipd-realisasi-loader';
        loader.innerHTML = `
            <div class="sipd-realisasi-loader-content">
                <div class="sipd-realisasi-spinner"></div>
                <p class="sipd-realisasi-loading-text">${message}</p>
            </div>
        `;
        document.body.appendChild(loader);
    }

    function updateLoadingProgress(message) {
        const textEl = document.querySelector('#sipd-stbp-loader .sipd-realisasi-loading-text');
        if (textEl) textEl.textContent = message;
    }

    function hideLoadingIndicator() {
        const loader = document.getElementById('sipd-stbp-loader');
        if (loader) loader.remove();
    }

    async function handleClick() {
        const btn = document.getElementById('sipd-stbp-btn');
        try {
            const token = await getAuthToken();
            if (!token) {
                showToast('Token SIPD tidak ditemukan. Refresh halaman SIPD dulu.', 'error');
                return;
            }

            const jwt = parseJwt(token);
            const tahun = (jwt && jwt.tahun) ? jwt.tahun : new Date().getFullYear();

            // ID SKPD diambil dari token; kalau tidak ada, tanyakan ke user.
            let skpd = jwt && jwt.id_skpd ? jwt.id_skpd : null;
            if (!skpd) {
                const input = window.prompt('Masukkan ID SKPD untuk STBP:', '');
                if (!input || !input.trim()) return;
                skpd = input.trim();
            }

            if (btn) btn.disabled = true;
            showLoadingIndicator('Mengambil data STBP (halaman 1)...');

            const rows = await fetchAllStbp(token, skpd, (total, page, pageCount) => {
                const halaman = pageCount ? `${page}/${pageCount}` : page;
                updateLoadingProgress(`Mengambil data STBP... (halaman ${halaman}, ${total} baris terkumpul)`);
            });

            hideLoadingIndicator();

            if (rows.length === 0) {
                showToast('Tidak ada data STBP untuk diexport.', 'error');
                return;
            }

            const stamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `SIPD-Output/${tahun}/STBP-Pendapatan-${skpd}-${stamp}.xlsx`;
            await downloadExcel(rows, filename, 'STBP Pendapatan');

            showToast(`✅ ${rows.length} baris STBP berhasil diexport ke Excel.`, 'success');
        } catch (error) {
            console.error('Error export STBP:', error);
            hideLoadingIndicator();
            showToast(`❌ ${error.message}`, 'error');
        } finally {
            if (btn) btn.disabled = false;
        }
    }
})();
