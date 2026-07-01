// Dokumen Realisasi Content Script
// Menarik "Laporan Realisasi Per Dokumen" dari SIPD Penatausahaan per bulan,
// lalu mengirim JSON apa adanya ke bpkad-superapps (POST per bulan).

(function () {
    'use strict';

    const BASE_URL = 'https://service.sipd.kemendagri.go.id';
    // Endpoint SIPD: cetak?tipe=dokumen&skpd=0&bulan=N  (N = 1..12)
    const CETAK_ENDPOINT = '/pengeluaran/strict/laporan/realisasi/cetak';
    const DEST_PATH = '/api/sumber-data/dokumen-realisasi';

    const BULAN_NAMES = [
        '', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];

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

    function isRealisasiPage() {
        return window.location.pathname.replace(/\/$/, '') ===
            '/penatausahaan/penatausahaan/pengeluaran/laporan/realisasi';
    }

    function checkAndInjectButton() {
        const existing = document.getElementById('sipd-dokrealisasi-container');
        if (isRealisasiPage()) {
            if (!existing) addButton();
        } else if (existing) {
            existing.remove();
        }
    }

    function addButton() {
        const container = document.createElement('div');
        container.id = 'sipd-dokrealisasi-container';
        container.className = 'sipd-dashboard-container';

        const button = document.createElement('button');
        button.id = 'sipd-dokrealisasi-btn';
        button.className = 'sipd-dashboard-btn';
        button.innerHTML = `
            <span class="sipd-icon">📤</span>
            <span>Kirim Realisasi Per Dokumen</span>
        `;

        container.appendChild(button);

        const contentArea = document.querySelector('.content-wrapper') ||
            document.querySelector('.main-content') ||
            document.body;

        if (contentArea.firstChild) {
            contentArea.insertBefore(container, contentArea.firstChild);
        } else {
            contentArea.appendChild(container);
        }

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

    function getDestConfig() {
        return new Promise((resolve) => {
            chrome.storage.sync.get(['localApiUrl', 'localToken'], (result) => {
                resolve({
                    apiUrl: result.localApiUrl || null,
                    token: result.localToken || null
                });
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

    // Fetch via XHR (pola sama dengan content.js / dashboard-realisasi.js)
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
                    text: () => Promise.resolve(xhr.responseText),
                    json: () => Promise.resolve(JSON.parse(xhr.responseText))
                });
            };
            xhr.onerror = () => reject(new TypeError('Network request failed'));
            xhr.send(options.body);
        });
    }

    /**
     * GET data realisasi per dokumen untuk 1 bulan.
     * @param {string} token
     * @param {number} bulan 1..12
     * @returns {Promise<Array>} baris JSON apa adanya dari SIPD
     */
    async function fetchDokumenRealisasi(token, bulan, retries = 3) {
        const url = `${BASE_URL}${CETAK_ENDPOINT}?tipe=dokumen&skpd=0&bulan=${bulan}`;

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

                const data = await response.json();
                // Normalisasi: SIPD kadang membungkus dalam { data: [...] }.
                // Selalu kembalikan array agar payload ke server konsisten.
                if (Array.isArray(data)) return data;
                if (Array.isArray(data?.data)) return data.data;
                if (data == null) return [];
                // Bentuk tak terduga (mis. objek error/status) — bukan daftar baris.
                throw new Error('Format data SIPD tidak dikenali (bukan array)');
            } catch (error) {
                if (attempt < retries) {
                    await new Promise(r => setTimeout(r, 2000));
                } else {
                    throw error;
                }
            }
        }
        // Semua percobaan habis (mis. 429 terus-menerus pada attempt terakhir).
        throw new Error('Gagal mengambil data setelah beberapa percobaan (rate limit?).');
    }

    /**
     * POST data 1 bulan ke bpkad-superapps via service worker (hindari CORS).
     * @returns {Promise<{total:number}>}
     */
    function postToServer(destApiUrl, destToken, tahun, bulan, data) {
        return new Promise((resolve, reject) => {
            chrome.runtime.sendMessage({
                action: 'postDokumenRealisasi',
                payload: { apiUrl: destApiUrl, token: destToken, tahun, bulan, data }
            }, (res) => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                } else if (!res) {
                    reject(new Error('Tidak ada response dari service worker'));
                } else if (!res.success) {
                    reject(new Error(res.error || 'Gagal tanpa pesan error'));
                } else {
                    resolve(res.data);
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

    async function handleClick() {
        const token = await getAuthToken();
        if (!token) {
            showToast('Token SIPD tidak ditemukan. Refresh halaman SIPD dulu.', 'error');
            return;
        }

        const dest = await getDestConfig();
        if (!dest.apiUrl || !dest.token) {
            showToast('URL & Token server belum diatur. Buka Pengaturan extension dulu.', 'error');
            chrome.runtime.sendMessage({ action: 'openOptions' });
            return;
        }

        const jwt = parseJwt(token);
        const tahun = (jwt && jwt.tahun) ? Number(jwt.tahun) : new Date().getFullYear();

        showMonthModal(token, dest, tahun);
    }

    function showMonthModal(token, dest, tahun) {
        const modal = document.createElement('div');
        modal.className = 'sipd-realisasi-modal';

        const checkboxes = BULAN_NAMES.slice(1).map((nama, i) => {
            const bulan = i + 1;
            return `
                <label class="sipd-bulan-label">
                    <input type="checkbox" class="sipd-bulan-checkbox" value="${bulan}" checked>
                    ${bulan}. ${nama}
                </label>
            `;
        }).join('');

        modal.innerHTML = `
            <div class="sipd-realisasi-modal-content" style="max-width: 480px;">
                <div class="sipd-realisasi-modal-header">
                    <h2>📤 Kirim Realisasi Per Dokumen — ${tahun}</h2>
                    <button class="sipd-realisasi-modal-close">×</button>
                </div>
                <div class="sipd-realisasi-modal-body">
                    <div class="sipd-realisasi-info">
                        <p>Pilih bulan yang ingin dikirim. Tiap bulan dikirim terpisah (1 POST per bulan).</p>
                        <p class="sipd-info-hint">Tujuan: <code>${dest.apiUrl}${DEST_PATH}</code></p>
                    </div>
                    <div class="sipd-realisasi-actions">
                        <button class="sipd-bulan-select-all">✅ Semua</button>
                        <button class="sipd-bulan-deselect-all">⬜ Kosongkan</button>
                        <button class="sipd-bulan-send" id="sipd-bulan-send-btn">🚀 Kirim</button>
                    </div>
                    <div class="sipd-bulan-grid">${checkboxes}</div>
                    <div id="sipd-bulan-log" class="sipd-bulan-log"></div>
                </div>
            </div>
        `;

        modal.querySelector('.sipd-realisasi-modal-close').onclick = () => modal.remove();
        modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

        modal.querySelector('.sipd-bulan-select-all').onclick = () =>
            modal.querySelectorAll('.sipd-bulan-checkbox').forEach(cb => cb.checked = true);
        modal.querySelector('.sipd-bulan-deselect-all').onclick = () =>
            modal.querySelectorAll('.sipd-bulan-checkbox').forEach(cb => cb.checked = false);

        modal.querySelector('#sipd-bulan-send-btn').onclick = async () => {
            const selected = Array.from(modal.querySelectorAll('.sipd-bulan-checkbox:checked'))
                .map(cb => parseInt(cb.value));

            if (selected.length === 0) {
                showToast('Pilih minimal 1 bulan!', 'error');
                return;
            }

            const sendBtn = modal.querySelector('#sipd-bulan-send-btn');
            const logEl = modal.querySelector('#sipd-bulan-log');
            sendBtn.disabled = true;

            await sendMonths(selected, token, dest, tahun, logEl);

            sendBtn.disabled = false;
        };

        document.body.appendChild(modal);
    }

    async function sendMonths(months, token, dest, tahun, logEl) {
        const destApiUrl = dest.apiUrl + DEST_PATH;
        let ok = 0, fail = 0;

        function log(msg, type) {
            const line = document.createElement('div');
            line.className = `sipd-log-line ${type || ''}`;
            line.textContent = msg;
            logEl.appendChild(line);
            logEl.scrollTop = logEl.scrollHeight;
        }

        for (let i = 0; i < months.length; i++) {
            const bulan = months[i];
            const nama = BULAN_NAMES[bulan];
            log(`⏳ ${nama}: mengambil data...`, 'loading');

            try {
                const data = await fetchDokumenRealisasi(token, bulan);
                log(`   ${nama}: ${data.length} baris. Mengirim...`, 'loading');

                const result = await postToServer(destApiUrl, dest.token, tahun, bulan, data);
                log(`✅ ${nama}: terkirim (${result?.total ?? data.length} baris).`, 'ok');
                ok++;
            } catch (error) {
                log(`❌ ${nama}: ${error.message}`, 'err');
                fail++;
            }

            // jeda antar bulan untuk hindari rate limit
            if (i < months.length - 1) {
                await new Promise(r => setTimeout(r, 800));
            }
        }

        if (fail === 0) {
            showToast(`🎉 Selesai! ${ok} bulan berhasil dikirim.`, 'success');
        } else {
            showToast(`⚠️ Selesai: ${ok} sukses, ${fail} gagal.`, 'error');
        }
    }
})();
