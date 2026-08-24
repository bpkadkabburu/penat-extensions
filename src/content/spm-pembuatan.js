// SPM Pembuatan Content Script
// Halaman pembuatan SPM hanya menampilkan 5 baris utk status=dihapus (bug UI),
// padahal API bisa punya lebih banyak. Tombol ini ambil SEMUA halaman lalu export ke Excel.

(function () {
    'use strict';

    const BASE_URL = 'https://service.sipd.kemendagri.go.id';
    const SPM_ENDPOINT = '/pengeluaran/strict/spm/index';
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

    function isSpmPembuatanPage() {
        return window.location.pathname.replace(/\/$/, '') ===
            '/penatausahaan/pengeluaran/spm/pembuatan';
    }

    function checkAndInjectButton() {
        const existing = document.getElementById('sipd-spm-dihapus-container');
        if (isSpmPembuatanPage()) {
            if (!existing) addButton();
        } else if (existing) {
            existing.remove();
        }
    }

    function addButton() {
        const container = document.createElement('div');
        container.id = 'sipd-spm-dihapus-container';
        container.className = 'sipd-dashboard-container';

        const button = document.createElement('button');
        button.id = 'sipd-spm-dihapus-btn';
        button.className = 'sipd-dashboard-btn';
        button.innerHTML = `
            <span class="sipd-icon">📥</span>
            <span>Export SPM Dihapus ke Excel</span>
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

    // Fetch langsung dari content script via XHR (sama seperti menu DPA/dashboard-realisasi),
    // karena request dari halaman sipd.kemendagri.go.id ikut Origin yang server izinkan.
    // (Sempat dicoba lewat background service worker biar bisa baca header x-pagination-*,
    // tapi origin-nya jadi chrome-extension://... dan server balas 403 — jadi dibalik lagi.)
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
                    json: () => Promise.resolve(JSON.parse(xhr.responseText))
                });
            };
            xhr.onerror = () => reject(new TypeError('Network request failed'));
            xhr.send(options.body);
        });
    }

    // Rate limit servernya ~20 request / 30 detik (dari header x-ratelimit-* yang
    // sayangnya tidak bisa dibaca via XHR karena CORS). Jaga jarak antar request agar
    // tidak nabrak limit itu, dan tetap ada fallback retry kalau kena 429.
    const REQUEST_DELAY_MS = 1600;

    async function fetchSpmPage(token, page, retries = 3) {
        const url = `${BASE_URL}${SPM_ENDPOINT}?jenis=&status=dihapus&page=${page}&limit=${PAGE_LIMIT}&nilai_akhir=1000000000000`;

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
                return Array.isArray(json) ? json : (Array.isArray(json?.data) ? json.data : []);
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
     * Ambil SEMUA halaman SPM status=dihapus. Karena info total halaman ada di
     * response header (yang tidak bisa dibaca via XHR lintas origin), berhenti
     * begitu satu halaman balik kosong.
     */
    async function fetchAllSpmDihapus(token, onProgress) {
        const all = [];
        let page = 1;

        while (true) {
            const rows = await fetchSpmPage(token, page);
            all.push(...rows);
            if (onProgress) onProgress(all.length, page);

            if (rows.length === 0) break;

            page++;
            await new Promise(r => setTimeout(r, REQUEST_DELAY_MS));
        }

        return all;
    }

    // ========== EXCEL EXPORT (via SheetJS, lihat src/lib/xlsx.mini.min.js) ==========

    function downloadExcel(rows, filename, sheetName) {
        // Union semua key di seluruh baris jadi header, biar kolom konsisten
        // walau record satu sama lain gak selalu punya field yang sama.
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

        const worksheet = XLSX.utils.json_to_sheet(rows, { header: headers });
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
        if (document.getElementById('sipd-spm-dihapus-loader')) return;
        const loader = document.createElement('div');
        loader.id = 'sipd-spm-dihapus-loader';
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
        const textEl = document.querySelector('#sipd-spm-dihapus-loader .sipd-realisasi-loading-text');
        if (textEl) textEl.textContent = message;
    }

    function hideLoadingIndicator() {
        const loader = document.getElementById('sipd-spm-dihapus-loader');
        if (loader) loader.remove();
    }

    async function handleClick() {
        const btn = document.getElementById('sipd-spm-dihapus-btn');
        try {
            const token = await getAuthToken();
            if (!token) {
                showToast('Token SIPD tidak ditemukan. Refresh halaman SIPD dulu.', 'error');
                return;
            }

            if (btn) btn.disabled = true;
            showLoadingIndicator('Mengambil data SPM dihapus (halaman 1)...');

            const jwt = parseJwt(token);
            const tahun = (jwt && jwt.tahun) ? jwt.tahun : new Date().getFullYear();

            const rows = await fetchAllSpmDihapus(token, (total, page) => {
                updateLoadingProgress(`Mengambil data SPM dihapus... (halaman ${page}, ${total} baris terkumpul)`);
            });

            hideLoadingIndicator();

            if (rows.length === 0) {
                showToast('Tidak ada data SPM dihapus untuk diexport.', 'error');
                return;
            }

            const stamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `SIPD-Output/${tahun}/SPM-Dihapus-${stamp}.xlsx`;
            await downloadExcel(rows, filename, 'SPM Dihapus');

            showToast(`✅ ${rows.length} baris SPM dihapus berhasil diexport ke Excel.`, 'success');
        } catch (error) {
            console.error('Error export SPM dihapus:', error);
            hideLoadingIndicator();
            showToast(`❌ ${error.message}`, 'error');
        } finally {
            if (btn) btn.disabled = false;
        }
    }
})();
