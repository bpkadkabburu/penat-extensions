// Dashboard Realisasi Content Script
// Extracts realisasi data from SIPD Dashboard page
// Following the same recursive pattern as realisasi.js

(async function () {
    'use strict';

    const BASE_URL = 'https://service.sipd.kemendagri.go.id';
    const REALISASI_ENDPOINT = '/pengeluaran/strict/dashboard/statistik-belanja';

    // State tracking
    let lastUrl = location.href;

    // Initial run
    checkAndInjectButton();

    // Observe URL changes for SPA (React)
    new MutationObserver(() => {
        const url = location.href;
        if (url !== lastUrl) {
            lastUrl = url;
            checkAndInjectButton();
        }
        checkAndInjectButton();
    }).observe(document, { subtree: true, childList: true });

    /**
     * Check current page and inject/remove button accordingly
     */
    function checkAndInjectButton() {
        const path = window.location.pathname;
        const isDashboard = path === '/penatausahaan/dashboard' ||
            path === '/penatausahaan/dashboard/';

        const existingBtn = document.getElementById('sipd-dashboard-realisasi-container');

        if (isDashboard) {
            if (!existingBtn) {
                console.log('SIPD Realisasi: Detected Dashboard Page');
                addRealisasiButton();
            }
        } else {
            if (existingBtn) existingBtn.remove();
        }
    }

    /**
     * Add realisasi download button to the page
     */
    function addRealisasiButton() {
        const buttonContainer = document.createElement('div');
        buttonContainer.id = 'sipd-dashboard-realisasi-container';
        buttonContainer.className = 'sipd-dashboard-container';

        const button = document.createElement('button');
        button.id = 'sipd-dashboard-realisasi-btn';
        button.className = 'sipd-dashboard-btn';
        button.innerHTML = `
            <span class="sipd-icon">📊</span>
            <span>Download Realisasi</span>
        `;

        buttonContainer.appendChild(button);

        const contentArea = document.querySelector('.content-wrapper') ||
            document.querySelector('.main-content') ||
            document.body;

        if (contentArea.firstChild) {
            contentArea.insertBefore(buttonContainer, contentArea.firstChild);
        } else {
            contentArea.appendChild(buttonContainer);
        }

        button.addEventListener('click', handleRealisasiClick);
    }

    // ========== AUTH & HELPERS ==========

    /**
     * Get stored auth token
     */
    function getAuthToken() {
        return new Promise((resolve) => {
            chrome.storage.local.get(['sipd_auth_token'], (result) => {
                resolve(result.sipd_auth_token || null);
            });
        });
    }

    /**
     * Parse JWT Token
     */
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

    /**
     * Get current date in YYYY-MM-DD format
     */
    function getCurrentDate() {
        return new Date().toISOString().split('T')[0];
    }

    /**
     * Fetch using XMLHttpRequest (same pattern as content.js)
     */
    function fetchXHR(url, options = {}) {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            const method = options.method || 'GET';

            xhr.open(method, url);

            if (options.headers) {
                Object.keys(options.headers).forEach(key => {
                    xhr.setRequestHeader(key, options.headers[key]);
                });
            }

            if (options.credentials === 'include') {
                xhr.withCredentials = true;
            }

            xhr.onload = () => {
                const response = {
                    ok: xhr.status >= 200 && xhr.status < 300,
                    status: xhr.status,
                    statusText: xhr.statusText,
                    url: xhr.responseURL,
                    text: () => Promise.resolve(xhr.responseText),
                    json: () => Promise.resolve(JSON.parse(xhr.responseText))
                };
                resolve(response);
            };

            xhr.onerror = () => {
                reject(new TypeError('Network request failed'));
            };

            xhr.send(options.body);
        });
    }

    /**
     * Make API request with retries
     */
    async function makeRequest(token, endpoint, retries = 3) {
        const currentDate = getCurrentDate();
        const url = `${BASE_URL}${endpoint}?tanggal_akhir=${currentDate}`;

        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                const response = await fetchXHR(url, {
                    method: 'GET',
                    credentials: 'include',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    if (response.status === 401) {
                        throw new Error('Token expired. Silakan refresh halaman SIPD.');
                    }
                    if (response.status === 429) {
                        // Rate limited - wait longer
                        console.log('Rate limited, waiting 10 seconds...');
                        await new Promise(r => setTimeout(r, 10000));
                        continue;
                    }
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                return await response.json();
            } catch (error) {
                if (attempt < retries) {
                    console.log(`Request failed, retrying (${retries - attempt} left)...`);
                    await new Promise(r => setTimeout(r, 2000));
                } else {
                    throw error;
                }
            }
        }
    }

    /**
     * Download data as JSON file via Background Script
     */
    function downloadJSON(data, filename) {
        const jsonString = JSON.stringify(data, null, 2);
        const base64Data = btoa(unescape(encodeURIComponent(jsonString)));
        const dataUrl = `data:application/json;base64,${base64Data}`;

        return new Promise((resolve, reject) => {
            chrome.runtime.sendMessage({
                action: 'downloadFile',
                dataUrl: dataUrl,
                filename: filename
            }, (response) => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                } else if (response && response.success) {
                    resolve();
                } else {
                    reject(new Error(response?.error || 'Download failed'));
                }
            });
        });
    }

    // ========== UI HELPERS ==========

    /**
     * Show loading indicator with progress
     */
    function showLoadingIndicator(message = 'Memuat data...') {
        if (document.getElementById('sipd-realisasi-loader')) return;

        const loader = document.createElement('div');
        loader.id = 'sipd-realisasi-loader';
        loader.className = 'sipd-realisasi-loader';
        loader.innerHTML = `
            <div class="sipd-realisasi-loader-content">
                <div class="sipd-realisasi-spinner"></div>
                <p class="sipd-realisasi-loading-text">${message}</p>
                <div class="sipd-progress-bar-container">
                    <div class="sipd-progress-bar" id="sipd-realisasi-progress-bar"></div>
                </div>
                <div class="sipd-progress-text" id="sipd-realisasi-progress-text"></div>
            </div>
        `;
        document.body.appendChild(loader);
    }

    /**
     * Update loading text and progress
     */
    function updateLoadingProgress(message, progress = null, detail = '') {
        const textEl = document.querySelector('.sipd-realisasi-loading-text');
        const barEl = document.getElementById('sipd-realisasi-progress-bar');
        const detailEl = document.getElementById('sipd-realisasi-progress-text');

        if (textEl) textEl.innerHTML = message;
        if (barEl && progress !== null) barEl.style.width = `${progress}%`;
        if (detailEl) detailEl.innerHTML = detail;
    }

    /**
     * Hide loading indicator
     */
    function hideLoadingIndicator() {
        const loader = document.getElementById('sipd-realisasi-loader');
        if (loader) loader.remove();
    }

    /**
     * Show toast notification
     */
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

    // ========== TRACKER / STATUS ==========

    /**
     * Save download status
     */
    async function saveDownloadStatus(subSkpdKey, status, metadata = {}) {
        const storageKey = 'sipd_tracker_realisasi';

        return new Promise((resolve) => {
            chrome.storage.local.get([storageKey], (result) => {
                const tracker = result[storageKey] || {};

                tracker[subSkpdKey] = {
                    name: metadata.name || subSkpdKey,
                    status: status,
                    timestamp: Date.now(),
                    error: metadata.errorMsg || null
                };

                chrome.storage.local.set({ [storageKey]: tracker }, resolve);
            });
        });
    }

    /**
     * Get download tracker
     */
    async function getDownloadTracker() {
        const storageKey = 'sipd_tracker_realisasi';

        return new Promise((resolve) => {
            chrome.storage.local.get([storageKey], (result) => {
                resolve(result[storageKey] || {});
            });
        });
    }

    // ========== MAIN FLOW ==========

    /**
     * Handle realisasi button click
     */
    async function handleRealisasiClick() {
        try {
            showLoadingIndicator('Mengambil data SKPD...');

            // Get token
            const token = await getAuthToken();
            if (!token) throw new Error('Token tidak ditemukan. Silakan refresh halaman SIPD.');

            // Parse JWT for tahun
            const jwt = parseJwt(token);
            if (!jwt || !jwt.tahun) {
                throw new Error('Gagal membaca info tahun dari token.');
            }
            const tahun = jwt.tahun;

            // Fetch SKPD list
            updateLoadingProgress('Fetching daftar SKPD...');
            const skpdList = await makeRequest(token, REALISASI_ENDPOINT);

            if (!skpdList || skpdList.length === 0) {
                throw new Error('Tidak ada data SKPD ditemukan.');
            }

            console.log(`Found ${skpdList.length} SKPDs`);

            // Fetch Sub-SKPD for each SKPD
            const groupedData = [];
            for (let i = 0; i < skpdList.length; i++) {
                const skpd = skpdList[i];
                updateLoadingProgress(
                    `Fetching Sub-SKPD... (${i + 1}/${skpdList.length})`,
                    ((i + 1) / skpdList.length) * 100,
                    `SKPD: ${skpd.nama_skpd}`
                );

                try {
                    const subSkpdList = await makeRequest(token, `${REALISASI_ENDPOINT}/${skpd.id_skpd}`);

                    groupedData.push({
                        skpd: skpd,
                        subSkpdList: subSkpdList || []
                    });

                    // Rate limit delay
                    await new Promise(r => setTimeout(r, 500));
                } catch (err) {
                    console.error(`Error fetching sub-SKPD for ${skpd.nama_skpd}:`, err);
                    groupedData.push({
                        skpd: skpd,
                        subSkpdList: [],
                        error: err.message
                    });
                }
            }

            hideLoadingIndicator();

            // Show modal with grouped Sub-SKPD
            showRealisasiModal(groupedData, tahun, token);

        } catch (error) {
            console.error('Error:', error);
            hideLoadingIndicator();
            showToast(`Error: ${error.message}`, 'error');
        }
    }

    /**
     * Show Realisasi Modal with Sub-SKPD grouped by SKPD
     */
    async function showRealisasiModal(groupedData, tahun, token) {
        const modal = document.createElement('div');
        modal.className = 'sipd-realisasi-modal';

        // Load tracker
        const tracker = await getDownloadTracker();

        // Count totals
        let totalSubSkpd = 0;
        groupedData.forEach(g => { totalSubSkpd += g.subSkpdList.length; });

        // Build grouped HTML
        let groupedHtml = '';
        groupedData.forEach(group => {
            const skpd = group.skpd;

            if (group.subSkpdList.length === 0 && group.error) {
                groupedHtml += `
                    <div class="sipd-skpd-group">
                        <div class="sipd-skpd-group-header">
                            <span>${skpd.kode_skpd} - ${skpd.nama_skpd}</span>
                            <span style="color: #f44336; font-size: 12px;">⚠️ Error: ${group.error}</span>
                        </div>
                    </div>
                `;
                return;
            }

            if (group.subSkpdList.length === 0) return;

            let subSkpdHtml = '';
            group.subSkpdList.forEach(subSkpd => {
                const trackerKey = `${subSkpd.id_skpd}_${subSkpd.id_sub_skpd}`;
                const trackerData = tracker[trackerKey];

                let statusClass = 'status-pending';
                let statusBadge = '';

                if (trackerData) {
                    if (trackerData.status === 'success') {
                        statusClass = 'status-complete';
                        statusBadge = '<span class="sipd-realisasi-badge success">✅ Done</span>';
                    } else if (trackerData.status === 'error') {
                        statusClass = 'status-error';
                        statusBadge = '<span class="sipd-realisasi-badge error">❌ Error</span>';
                    } else if (trackerData.status === 'processing') {
                        statusClass = 'status-processing';
                        statusBadge = '<span class="sipd-realisasi-badge processing">⏳ Processing</span>';
                    }
                }

                subSkpdHtml += `
                    <div class="sipd-sub-skpd-item ${statusClass}" data-tracker-key="${trackerKey}">
                        <div class="sipd-sub-skpd-info">
                            <label>
                                <input type="checkbox" class="sipd-sub-skpd-checkbox" 
                                    value="${trackerKey}"
                                    data-id-skpd="${subSkpd.id_skpd}"
                                    data-id-sub-skpd="${subSkpd.id_sub_skpd}"
                                    data-kode-sub-skpd="${subSkpd.kode_sub_skpd || ''}"
                                    data-nama-sub-skpd="${(subSkpd.nama_sub_skpd || '').replace(/"/g, '&quot;')}"
                                    data-tahun="${subSkpd.tahun || tahun}"
                                    checked>
                                ${statusBadge}
                                <span class="sipd-sub-skpd-code">${subSkpd.kode_sub_skpd || ''}</span>
                                <span class="sipd-sub-skpd-name">${subSkpd.nama_sub_skpd || ''}</span>
                            </label>
                        </div>
                    </div>
                `;
            });

            groupedHtml += `
                <div class="sipd-skpd-group">
                    <div class="sipd-skpd-group-header" data-group-id="${skpd.id_skpd}">
                        <span>${skpd.kode_skpd} - ${skpd.nama_skpd} (${group.subSkpdList.length})</span>
                        <span class="sipd-toggle-icon">▼</span>
                    </div>
                    <div class="sipd-sub-skpd-list" id="group-${skpd.id_skpd}">
                        ${subSkpdHtml}
                    </div>
                </div>
            `;
        });

        modal.innerHTML = `
            <div class="sipd-realisasi-modal-content">
                <div class="sipd-realisasi-modal-header">
                    <h2>📊 Download Realisasi - Tahun ${tahun}</h2>
                    <button class="sipd-realisasi-modal-close">×</button>
                </div>
                <div class="sipd-realisasi-modal-body">
                    <div class="sipd-realisasi-info">
                        <p><strong>Total SKPD:</strong> ${groupedData.length}</p>
                        <p><strong>Total Sub-SKPD:</strong> ${totalSubSkpd}</p>
                        <p class="sipd-info-hint">💡 Pilih Sub-SKPD yang ingin didownload, lalu klik "Download Selected"</p>
                        <p class="sipd-info-hint">📁 Output: <code>SIPD-Output/${tahun}/Realisasi/{nama_sub_unit}.json</code></p>
                    </div>

                    <div class="sipd-realisasi-actions">
                        <button class="sipd-realisasi-select-all">✅ Select All</button>
                        <button class="sipd-realisasi-deselect-all">⬜ Deselect All</button>
                        <button class="sipd-realisasi-download-selected" id="sipd-realisasi-download-btn">
                            ⬇️ Download Selected
                        </button>
                    </div>

                    <div class="sipd-sub-skpd-container">
                        ${groupedHtml}
                    </div>
                </div>
            </div>
        `;

        // Event: Close modal
        modal.querySelector('.sipd-realisasi-modal-close').onclick = () => modal.remove();
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });

        // Event: Toggle SKPD group collapse
        modal.querySelectorAll('.sipd-skpd-group-header').forEach(header => {
            header.addEventListener('click', () => {
                const groupId = header.getAttribute('data-group-id');
                if (!groupId) return;
                const list = modal.querySelector(`#group-${groupId}`);
                if (list) {
                    const isHidden = list.style.display === 'none';
                    list.style.display = isHidden ? '' : 'none';
                    header.classList.toggle('collapsed', !isHidden);
                }
            });
        });

        // Event: Select All
        modal.querySelector('.sipd-realisasi-select-all').onclick = () => {
            modal.querySelectorAll('.sipd-sub-skpd-checkbox').forEach(cb => cb.checked = true);
        };

        // Event: Deselect All
        modal.querySelector('.sipd-realisasi-deselect-all').onclick = () => {
            modal.querySelectorAll('.sipd-sub-skpd-checkbox').forEach(cb => cb.checked = false);
        };

        // Event: Download Selected
        modal.querySelector('#sipd-realisasi-download-btn').onclick = async () => {
            const selectedCheckboxes = modal.querySelectorAll('.sipd-sub-skpd-checkbox:checked');

            if (selectedCheckboxes.length === 0) {
                alert('Pilih minimal 1 Sub-SKPD!');
                return;
            }

            // Collect selected sub-SKPD data
            const selectedSubSkpds = [];
            selectedCheckboxes.forEach(cb => {
                selectedSubSkpds.push({
                    trackerKey: cb.value,
                    id_skpd: parseInt(cb.dataset.idSkpd),
                    id_sub_skpd: parseInt(cb.dataset.idSubSkpd),
                    kode_sub_skpd: cb.dataset.kodeSubSkpd,
                    nama_sub_skpd: cb.dataset.namaSubSkpd,
                    tahun: cb.dataset.tahun || tahun
                });
            });

            // Close modal and start download
            modal.remove();
            await downloadSelectedSubSkpds(selectedSubSkpds, tahun, token);
        };

        document.body.appendChild(modal);
    }

    // ========== DOWNLOAD LOGIC ==========

    /**
     * Download realisasi data for selected Sub-SKPDs
     */
    async function downloadSelectedSubSkpds(subSkpds, tahun, token) {
        showLoadingIndicator('Memulai download realisasi...');

        let totalSuccess = 0;
        let totalErrors = 0;

        for (let i = 0; i < subSkpds.length; i++) {
            const subSkpd = subSkpds[i];
            const displayName = `${subSkpd.kode_sub_skpd} - ${subSkpd.nama_sub_skpd}`;

            updateLoadingProgress(
                `Downloading Sub-SKPD ${i + 1}/${subSkpds.length}`,
                ((i + 1) / subSkpds.length) * 100,
                `<b>${displayName}</b>`
            );

            // Save processing status
            await saveDownloadStatus(subSkpd.trackerKey, 'processing', {
                name: displayName
            });

            try {
                const flattenedData = await fetchAndFlattenSubSkpd(
                    token,
                    subSkpd.id_skpd,
                    subSkpd.id_sub_skpd,
                    subSkpd
                );

                if (flattenedData.length === 0) {
                    console.log(`No data for ${displayName}, skipping download`);
                    await saveDownloadStatus(subSkpd.trackerKey, 'success', {
                        name: displayName
                    });
                    totalSuccess++;
                    showToast(`⚠️ ${displayName}: Tidak ada data`, 'success');
                    continue;
                }

                // Build filename
                const safeName = displayName.replace(/[/\\?%*:|"<>]/g, '-').trim();
                const filename = `SIPD-Output/${tahun}/Realisasi/${safeName}.json`;

                await downloadJSON(flattenedData, filename);

                await saveDownloadStatus(subSkpd.trackerKey, 'success', {
                    name: displayName
                });

                totalSuccess++;
                showToast(`✅ ${displayName}`, 'success');

            } catch (error) {
                console.error(`Error processing ${displayName}:`, error);
                totalErrors++;

                await saveDownloadStatus(subSkpd.trackerKey, 'error', {
                    name: displayName,
                    errorMsg: error.message
                });

                showToast(`❌ ${displayName}: ${error.message}`, 'error');
            }

            // Rate limit delay between sub-SKPDs
            if (i < subSkpds.length - 1) {
                await new Promise(r => setTimeout(r, 1000));
            }
        }

        hideLoadingIndicator();

        if (totalErrors === 0) {
            showToast(`🎉 Selesai! ${totalSuccess} Sub-SKPD berhasil didownload.`, 'success');
        } else {
            showToast(`⚠️ Selesai: ${totalSuccess} sukses, ${totalErrors} gagal.`, 'error');
        }
    }

    /**
     * Fetch and flatten data for a single Sub-SKPD
     * Recursive: Bidang Urusan → Program → Giat → Sub-Giat → Final Data
     */
    async function fetchAndFlattenSubSkpd(token, idSkpd, idSubSkpd, subSkpdInfo) {
        const flattenedResults = [];
        let counter = 0;

        // Step 1: Fetch Bidang Urusan
        const bidangUrusanList = await makeRequest(token,
            `${REALISASI_ENDPOINT}/${idSkpd}/${idSubSkpd}`
        );

        if (!bidangUrusanList || bidangUrusanList.length === 0) {
            console.log(`No bidang urusan for sub-SKPD ${idSubSkpd}`);
            return flattenedResults;
        }

        // Step 2: For each Bidang Urusan → Fetch Program
        for (const bidangUrusan of bidangUrusanList) {
            await new Promise(r => setTimeout(r, 500)); // Rate limit

            try {
                const programList = await makeRequest(token,
                    `${REALISASI_ENDPOINT}/${idSkpd}/${idSubSkpd}/${bidangUrusan.id_bidang_urusan}`
                );

                if (!programList || programList.length === 0) continue;

                // Step 3: For each Program → Fetch Giat
                for (const program of programList) {
                    await new Promise(r => setTimeout(r, 500));

                    try {
                        const giatList = await makeRequest(token,
                            `${REALISASI_ENDPOINT}/${idSkpd}/${idSubSkpd}/${bidangUrusan.id_bidang_urusan}/${program.id_program}`
                        );

                        if (!giatList || giatList.length === 0) continue;

                        // Step 4: For each Giat → Fetch Sub-Giat
                        for (const giat of giatList) {
                            await new Promise(r => setTimeout(r, 500));

                            try {
                                const subGiatList = await makeRequest(token,
                                    `${REALISASI_ENDPOINT}/${idSkpd}/${idSubSkpd}/${bidangUrusan.id_bidang_urusan}/${program.id_program}/${giat.id_giat}`
                                );

                                if (!subGiatList || subGiatList.length === 0) continue;

                                // Step 5: For each Sub-Giat → Fetch Final Data
                                for (const subGiat of subGiatList) {
                                    await new Promise(r => setTimeout(r, 500));

                                    try {
                                        const finalData = await makeRequest(token,
                                            `${REALISASI_ENDPOINT}/${idSkpd}/${idSubSkpd}/${bidangUrusan.id_bidang_urusan}/${program.id_program}/${giat.id_giat}/${subGiat.id_sub_giat}`
                                        );

                                        if (!finalData || finalData.length === 0) continue;

                                        // Step 6: Flatten each item
                                        for (const item of finalData) {
                                            counter++;
                                            const flattenedRecord = {
                                                'NO': counter,
                                                'TAHUN': subSkpdInfo.tahun || '',
                                                'KODE SKPD': bidangUrusan.kode_skpd || '',
                                                'NAMA SKPD': bidangUrusan.nama_skpd || '',
                                                'KODE SUB UNIT': subSkpdInfo.kode_sub_skpd || '',
                                                'NAMA SUB UNIT': subSkpdInfo.nama_sub_skpd || '',
                                                'KODE BIDANG URUSAN': bidangUrusan.kode_bidang_urusan || '',
                                                'NAMA BIDANG URUSAN': bidangUrusan.nama_bidang_urusan || '',
                                                'KODE PROGRAM': program.kode_program || '',
                                                'NAMA PROGRAM': program.nama_program || '',
                                                'KODE KEGIATAN': giat.kode_giat || '',
                                                'NAMA KEGIATAN': giat.nama_giat || '',
                                                'KODE SUB KEGIATAN': subGiat.kode_sub_giat || '',
                                                'NAMA SUB KEGIATAN': subGiat.nama_sub_giat || '',
                                                'KODE REKENING': item.kode_akun || '',
                                                'NAMA REKENING': item.nama_akun || '',
                                                'PAGU': item.anggaran || 0,
                                                'REALISASI': item.realisasi_rill || 0,
                                                'AKUN': (item.kode_akun || '').substring(0, 1),
                                                'KELOMPOK': (item.kode_akun || '').substring(0, 3),
                                                'JENIS': (item.kode_akun || '').substring(0, 6),
                                                'OBJEK': (item.kode_akun || '').substring(0, 9),
                                                'RINCIAN OBJEK': (item.kode_akun || '').substring(0, 12),
                                                'SUB RINCIAN OBJEK': item.kode_akun || ''
                                            };

                                            flattenedResults.push(flattenedRecord);
                                        }
                                    } catch (error) {
                                        console.error(`Error fetching final data for sub-giat ${subGiat.id_sub_giat}:`, error.message);
                                    }
                                }
                            } catch (error) {
                                console.error(`Error fetching sub-giat for giat ${giat.id_giat}:`, error.message);
                            }
                        }
                    } catch (error) {
                        console.error(`Error fetching giat for program ${program.id_program}:`, error.message);
                    }
                }
            } catch (error) {
                console.error(`Error fetching program for bidang urusan ${bidangUrusan.id_bidang_urusan}:`, error.message);
            }
        }

        console.log(`Flattened ${flattenedResults.length} records for sub-SKPD ${idSubSkpd}`);
        return flattenedResults;
    }

})();
