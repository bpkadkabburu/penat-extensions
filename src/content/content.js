// Content script for SIPD approval detail pages

(async function () {
    'use strict';

    // State tracking
    let lastUrl = location.href;

    // Initial run
    checkAndInjectButtons();

    // Observe URL changes for SPA (React)
    new MutationObserver(() => {
        const url = location.href;
        if (url !== lastUrl) {
            lastUrl = url;
            checkAndInjectButtons();
        }
        // Also check periodically in case URL didn't change but content re-rendered
        checkAndInjectButtons();
    }).observe(document, { subtree: true, childList: true });

    /**
     * Check current page and inject/remove buttons accordingly
     */
    function checkAndInjectButtons() {
        // Check page type - STRICT matching
        const path = window.location.pathname;

        // Persetujuan pages
        const persetujuanDetailMatch = path.match(/\/halaman-persetujuan-dpa\/(\d+)$/);
        const persetujuanListMatch = path === '/penatausahaan/pengeluaran/dpa/laporan/dpa/halaman-persetujuan-dpa' ||
            path === '/penatausahaan/pengeluaran/dpa/laporan/dpa/halaman-persetujuan-dpa/';

        // SKPD DPA pages
        const skpdListMatch = path === '/penatausahaan/pengeluaran/dpa/laporan/dpa/skpd' ||
            path === '/penatausahaan/pengeluaran/dpa/laporan/dpa/skpd/';

        // Pendapatan pages
        const pendapatanListMatch = path === '/penatausahaan/pengeluaran/dpa/laporan/dpa/pendapatan' ||
            path === '/penatausahaan/pengeluaran/dpa/laporan/dpa/pendapatan/';

        // Belanja pages
        const belanjaListMatch = path === '/penatausahaan/pengeluaran/dpa/laporan/dpa/belanja' ||
            path === '/penatausahaan/pengeluaran/dpa/laporan/dpa/belanja/';

        // Pembiayaan pages
        const pembiayaanListMatch = path === '/penatausahaan/pengeluaran/dpa/laporan/dpa/pembiayaan' ||
            path === '/penatausahaan/pengeluaran/dpa/laporan/dpa/pembiayaan/';

        // Rincian Belanja detail page (extract skpdId from URL)
        const rincianBelanjaDetailMatch = path.match(/\/rincian-belanja\/(\d+)$/);

        // Cleanup existing buttons if they don't match current context
        const existingSingleBtn = document.getElementById('sipd-extractor-container');
        const existingBatchBtn = document.getElementById('sipd-batch-container');
        const existingSkpdBatchBtn = document.getElementById('sipd-skpd-batch-container');
        const existingPendapatanBatchBtn = document.getElementById('sipd-pendapatan-batch-container');
        const existingBelanjaBatchBtn = document.getElementById('sipd-belanja-batch-container');
        const existingPembiayaanBatchBtn = document.getElementById('sipd-pembiayaan-batch-container');
        const existingRincianBtn = document.getElementById('sipd-rincian-container');

        if (persetujuanDetailMatch) {
            // We are on PERSETUJUAN DETAIL page
            if (existingBatchBtn) existingBatchBtn.remove();
            if (existingSkpdBatchBtn) existingSkpdBatchBtn.remove();
            if (existingPendapatanBatchBtn) existingPendapatanBatchBtn.remove();
            if (existingBelanjaBatchBtn) existingBelanjaBatchBtn.remove();
            if (existingPembiayaanBatchBtn) existingPembiayaanBatchBtn.remove();
            if (existingRincianBtn) existingRincianBtn.remove();

            if (!existingSingleBtn) {
                const skpdId = persetujuanDetailMatch[1];
                console.log('SIPD Extractor: Detected Persetujuan Detail Page, ID:', skpdId);
                addExtractionButton(skpdId);
            }
        } else if (persetujuanListMatch) {
            // We are on PERSETUJUAN LIST page
            if (existingSingleBtn) existingSingleBtn.remove();
            if (existingSkpdBatchBtn) existingSkpdBatchBtn.remove();
            if (existingPendapatanBatchBtn) existingPendapatanBatchBtn.remove();
            if (existingBelanjaBatchBtn) existingBelanjaBatchBtn.remove();
            if (existingPembiayaanBatchBtn) existingPembiayaanBatchBtn.remove();
            if (existingRincianBtn) existingRincianBtn.remove();

            if (!existingBatchBtn) {
                console.log('SIPD Extractor: Detected Persetujuan List Page');
                addBatchExtractionButton('persetujuan');
            }
        } else if (skpdListMatch) {
            // We are on SKPD DPA LIST page
            if (existingSingleBtn) existingSingleBtn.remove();
            if (existingBatchBtn) existingBatchBtn.remove();
            if (existingPendapatanBatchBtn) existingPendapatanBatchBtn.remove();
            if (existingBelanjaBatchBtn) existingBelanjaBatchBtn.remove();
            if (existingPembiayaanBatchBtn) existingPembiayaanBatchBtn.remove();
            if (existingRincianBtn) existingRincianBtn.remove();

            if (!existingSkpdBatchBtn) {
                console.log('SIPD Extractor: Detected SKPD DPA List Page');
                addBatchExtractionButton('skpd');
            }
        } else if (pendapatanListMatch) {
            // We are on PENDAPATAN LIST page
            if (existingSingleBtn) existingSingleBtn.remove();
            if (existingBatchBtn) existingBatchBtn.remove();
            if (existingSkpdBatchBtn) existingSkpdBatchBtn.remove();
            if (existingBelanjaBatchBtn) existingBelanjaBatchBtn.remove();
            if (existingPembiayaanBatchBtn) existingPembiayaanBatchBtn.remove();
            if (existingRincianBtn) existingRincianBtn.remove();

            if (!existingPendapatanBatchBtn) {
                console.log('SIPD Extractor: Detected Pendapatan List Page');
                addBatchExtractionButton('pendapatan');
            }
        } else if (belanjaListMatch) {
            // We are on BELANJA LIST page
            if (existingSingleBtn) existingSingleBtn.remove();
            if (existingBatchBtn) existingBatchBtn.remove();
            if (existingSkpdBatchBtn) existingSkpdBatchBtn.remove();
            if (existingPendapatanBatchBtn) existingPendapatanBatchBtn.remove();
            if (existingPembiayaanBatchBtn) existingPembiayaanBatchBtn.remove();
            if (existingRincianBtn) existingRincianBtn.remove();

            if (!existingBelanjaBatchBtn) {
                console.log('SIPD Extractor: Detected Belanja List Page');
                addBatchExtractionButton('belanja');
            }
        } else if (pembiayaanListMatch) {
            // We are on PEMBIAYAAN LIST page
            if (existingSingleBtn) existingSingleBtn.remove();
            if (existingBatchBtn) existingBatchBtn.remove();
            if (existingSkpdBatchBtn) existingSkpdBatchBtn.remove();
            if (existingPendapatanBatchBtn) existingPendapatanBatchBtn.remove();
            if (existingBelanjaBatchBtn) existingBelanjaBatchBtn.remove();
            if (existingRincianBtn) existingRincianBtn.remove();

            if (!existingPembiayaanBatchBtn) {
                console.log('SIPD Extractor: Detected Pembiayaan List Page');
                addBatchExtractionButton('pembiayaan');
            }
        } else if (rincianBelanjaDetailMatch) {
            // We are on RINCIAN BELANJA DETAIL page
            if (existingSingleBtn) existingSingleBtn.remove();
            if (existingBatchBtn) existingBatchBtn.remove();
            if (existingSkpdBatchBtn) existingSkpdBatchBtn.remove();
            if (existingPendapatanBatchBtn) existingPendapatanBatchBtn.remove();
            if (existingBelanjaBatchBtn) existingBelanjaBatchBtn.remove();
            if (existingPembiayaanBatchBtn) existingPembiayaanBatchBtn.remove();

            if (!existingRincianBtn) {
                const skpdId = rincianBelanjaDetailMatch[1];
                console.log('SIPD Extractor: Detected Rincian Belanja Detail Page, ID:', skpdId);
                addRincianBelanjaDetailButton(skpdId);
            }
        } else {
            // Not a target page
            if (existingSingleBtn) existingSingleBtn.remove();
            if (existingBatchBtn) existingBatchBtn.remove();
            if (existingSkpdBatchBtn) existingSkpdBatchBtn.remove();
            if (existingPendapatanBatchBtn) existingPendapatanBatchBtn.remove();
            if (existingBelanjaBatchBtn) existingBelanjaBatchBtn.remove();
            if (existingPembiayaanBatchBtn) existingPembiayaanBatchBtn.remove();
            if (existingRincianBtn) existingRincianBtn.remove();
        }
    }

    /**
     * Add extraction button to the page
     * @param {string} skpdId - SKPD ID from URL
     */
    function addExtractionButton(skpdId) {
        // Create button container
        const buttonContainer = document.createElement('div');
        buttonContainer.id = 'sipd-extractor-container';
        buttonContainer.className = 'sipd-extractor-container';

        // Create button
        const button = document.createElement('button');
        button.id = 'sipd-extract-btn';
        button.className = 'sipd-extract-btn';
        button.innerHTML = `
      <span class="sipd-icon">📊</span>
      <span class="sipd-text">Extract DPA Data</span>
    `;

        buttonContainer.appendChild(button);

        // Insert button at the top of the page
        const contentArea = document.querySelector('.content-wrapper') ||
            document.querySelector('.main-content') ||
            document.body;

        if (contentArea.firstChild) {
            contentArea.insertBefore(buttonContainer, contentArea.firstChild);
        } else {
            contentArea.appendChild(buttonContainer);
        }

        // Add click event listener
        button.addEventListener('click', () => handleExtractClick(skpdId));
    }

    /**
     * Add rincian belanja extraction button to detail page
     * @param {string} skpdId - SKPD ID from URL
     */
    function addRincianBelanjaDetailButton(skpdId) {
        // Create button container
        const buttonContainer = document.createElement('div');
        buttonContainer.id = 'sipd-rincian-container';
        buttonContainer.className = 'sipd-extractor-container';

        // Create button
        const button = document.createElement('button');
        button.id = 'sipd-rincian-btn';
        button.className = 'sipd-extract-btn';
        button.innerHTML = `
      <span class="sipd-icon">📊</span>
      <span class="sipd-text">Extract Rincian Belanja</span>
    `;

        buttonContainer.appendChild(button);

        // Insert button at the top of the page
        const contentArea = document.querySelector('.content-wrapper') ||
            document.querySelector('.main-content') ||
            document.body;

        if (contentArea.firstChild) {
            contentArea.insertBefore(buttonContainer, contentArea.firstChild);
        } else {
            contentArea.appendChild(buttonContainer);
        }

        // Add click event listener
        button.addEventListener('click', () => handleRincianBelanjaClick(skpdId));
    }

    /**
     * Handle rincian belanja extract button click
     * @param {string} skpdId - SKPD ID
     */
    async function handleRincianBelanjaClick(skpdId) {
        try {
            showLoadingIndicator();
            const loadingText = document.querySelector('.sipd-loading-text');
            if (loadingText) loadingText.textContent = 'Memuat data rincian belanja...';

            // Load jadwal from DB
            const jadwalList = await loadJadwalFromDB();
            if (!jadwalList || jadwalList.length === 0) {
                throw new Error('Tidak ada jadwal tersimpan. Silakan fetch jadwal terlebih dahulu.');
            }

            // Get token
            const token = await getAuthToken();
            if (!token) throw new Error('Token tidak ditemukan');

            // Fetch sub-kegiatan list
            if (loadingText) loadingText.textContent = 'Fetching sub-kegiatan list...';
            const subKegiatanList = await fetchRincianBelanjaSKPD(token, skpdId);

            if (!subKegiatanList || subKegiatanList.length === 0) {
                throw new Error('Tidak ada sub-kegiatan ditemukan untuk SKPD ini');
            }

            hideLoadingIndicator();

            // Get SKPD Name from the first item (since we injected it in fetchRincianBelanjaSKPD)
            const skpdName = (subKegiatanList.length > 0 && subKegiatanList[0].nama_skpd)
                ? subKegiatanList[0].nama_skpd
                : `SKPD ${skpdId}`;

            // Show hierarchical modal
            await showRincianBelanjaModal(skpdId, subKegiatanList, jadwalList, skpdName);

        } catch (error) {
            console.error('Error:', error);
            hideLoadingIndicator();
            alert(`Error: ${error.message}`);
        }
    }

    /**
     * Handle extract button click
     * @param {string} skpdId - SKPD ID
     */
    async function handleExtractClick(skpdId) {
        try {
            // Load jadwal from IndexedDB
            const jadwalList = await loadJadwalFromDB();

            if (!jadwalList || jadwalList.length === 0) {
                alert('Tidak ada jadwal tersimpan. Silakan buka extension popup dan klik "Fetch Jadwal" terlebih dahulu.');
                return;
            }

            // Show jadwal selector modal
            showJadwalSelector(jadwalList, skpdId);

        } catch (error) {
            console.error('Error:', error);
            alert(`Error: ${error.message}`);
        }
    }

    /**
     * Load jadwal from chrome storage
     * @returns {Promise<Array>}
     */
    function loadJadwalFromDB() {
        return new Promise((resolve, reject) => {
            chrome.storage.local.get(['sipd_jadwal'], (result) => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                } else {
                    resolve(result.sipd_jadwal || []);
                }
            });
        });
    }

    /**
     * Show jadwal selector modal
     * @param {Array} jadwalList - List of jadwal
     * @param {string} skpdId - SKPD ID
     */
    function showJadwalSelector(jadwalList, skpdId) {
        // Create modal overlay
        const modal = document.createElement('div');
        modal.id = 'sipd-modal-overlay';
        modal.className = 'sipd-modal-overlay';

        // Create modal content
        const modalContent = document.createElement('div');
        modalContent.className = 'sipd-modal-content';

        // Modal header
        const header = document.createElement('div');
        header.className = 'sipd-modal-header';
        header.innerHTML = `
      <h2>Pilih Jadwal APBD</h2>
      <button class="sipd-modal-close" id="sipd-modal-close">&times;</button>
    `;

        // Modal body
        const body = document.createElement('div');
        body.className = 'sipd-modal-body';

        // Create jadwal list
        const jadwalListEl = document.createElement('div');
        jadwalListEl.className = 'sipd-jadwal-list';

        jadwalList.forEach(jadwal => {
            const jadwalItem = document.createElement('div');
            jadwalItem.className = 'sipd-jadwal-item';

            // Try to find name property
            const name = jadwal.jadwal_sipd_penatausahaan ||
                jadwal.nama_jadwal ||
                jadwal.nama ||
                jadwal.nama_tahapan ||
                jadwal.nama_sub_tahapan ||
                jadwal.uraian ||
                jadwal.keterangan ||
                'Jadwal';

            // Try to find ID property
            const id = jadwal.id_jadwal || jadwal.id;

            jadwalItem.innerHTML = `
        <div class="sipd-jadwal-name">${name}</div>
        <div class="sipd-jadwal-id">ID: ${id}</div>
      `;
            jadwalItem.addEventListener('click', () => {
                console.log('Selected jadwal:', jadwal); // Debug log
                extractDPAData(skpdId, id, name);
                closeModal();
            });
            jadwalListEl.appendChild(jadwalItem);
        });

        body.appendChild(jadwalListEl);

        // Assemble modal
        modalContent.appendChild(header);
        modalContent.appendChild(body);
        modal.appendChild(modalContent);

        // Add to page
        document.body.appendChild(modal);

        // Close button event
        document.getElementById('sipd-modal-close').addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });

        function closeModal() {
            modal.remove();
        }
    }

    /**
     * Get stored auth token
     */
    async function getAuthToken() {
        return new Promise((resolve) => {
            chrome.storage.local.get(['sipd_auth_token'], (result) => {
                resolve(result.sipd_auth_token || null);
            });
        });
    }

    /**
     * Extract DPA data from API
     * @param {string} skpdId - SKPD ID
     * @param {string} jadwalId - Jadwal ID
     * @param {string} jadwalName - Jadwal name
     * @param {string} skpdLabel - Optional SKPD label for folder name (e.g. "1. Dinas Pendidikan")
     * @param {string} pageType - 'persetujuan' or 'skpd'
     */
    async function extractDPAData(skpdId, jadwalId, jadwalName, skpdLabel = null, pageType = 'persetujuan') {
        try {
            // Show loading indicator
            showLoadingIndicator();

            // Get token
            const token = await getAuthToken();

            if (!token) {
                throw new Error('Token tidak ditemukan. Silakan refresh halaman SIPD.');
            }

            // API endpoint based on page type
            const apiEndpoints = {
                'persetujuan': `https://service.sipd.kemendagri.go.id/referensi/strict/laporan/dpa/dpa/halaman-persetujuan/${skpdId}/${jadwalId}`,
                'skpd': `https://service.sipd.kemendagri.go.id/referensi/strict/laporan/dpa/dpa/skpd/${skpdId}/${jadwalId}`,
                'pendapatan': `https://service.sipd.kemendagri.go.id/referensi/strict/laporan/dpa/dpa/pendapatan/${skpdId}/${jadwalId}`,
                'belanja': `https://service.sipd.kemendagri.go.id/referensi/strict/laporan/dpa/dpa/belanja/${skpdId}/${jadwalId}`,
                'pembiayaan': `https://service.sipd.kemendagri.go.id/referensi/strict/laporan/dpa/dpa/pembiayaan/${skpdId}/${jadwalId}`
            };
            const apiUrl = apiEndpoints[pageType] || apiEndpoints['persetujuan'];

            console.log('Fetching DPA data from:', apiUrl);

            const response = await fetchXHR(apiUrl, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('Token expired. Silakan refresh halaman SIPD dan coba lagi.');
                }
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            // Filename based on page type
            const filenames = {
                'persetujuan': '1. depan - persetujuan.json',
                'skpd': '2. skpd.json',
                'pendapatan': '3. pendapatan.json',
                'belanja': '4. belanja.json',
                'pembiayaan': '5. pembiayaan.json'
            };
            const outputFilename = filenames[pageType] || filenames['persetujuan'];

            // Format filename: SIPD-Output/[Nama Jadwal]/[SKPD Label or ID]/[output file]
            // Clean filename characters to avoid invalid paths
            const safeJadwalName = (jadwalName ? String(jadwalName) : 'Jadwal');
            const safeSkpdFolder = skpdLabel ? String(skpdLabel) : String(skpdId || '0');

            const cleanJadwalName = safeJadwalName.replace(/[/\\?%*:|"<>]/g, '-').trim();
            const cleanSkpdFolder = safeSkpdFolder.replace(/[/\\?%*:|"<>]/g, '-').trim();

            // Construct path: SIPD-Output/NamaJadwal/SkpdLabel/[filename]
            const filename = `SIPD-Output/${cleanJadwalName}/${cleanSkpdFolder}/${outputFilename}`;

            // Download via background script
            await downloadJSON(data, filename);

            // Hide loading indicator
            hideLoadingIndicator();

            // Show success message
            showSuccessMessage(`Data tersimpan: ${filename}`);

        } catch (error) {
            console.error('Error extracting DPA data:', error);
            hideLoadingIndicator();
            alert(`Error: ${error.message}`);
        }
    }

    /**
     * Download data as JSON file via Background Script (to support subfolders)
     * @param {Object} data - Data to download
     * @param {string} filename - Relative path/filename
     */
    async function downloadJSON(data, filename) {
        // Convert data to Base64 Data URL
        const jsonString = JSON.stringify(data, null, 2);
        const base64Data = btoa(unescape(encodeURIComponent(jsonString))); // Handle UTF-8 characters correctly
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

    /**
     * Show loading indicator
     */
    function showLoadingIndicator() {
        // Prevent multiple loaders
        if (document.getElementById('sipd-loader')) return;

        const loader = document.createElement('div');
        loader.id = 'sipd-loader';
        loader.className = 'sipd-loader-overlay';
        loader.innerHTML = `
      <div class="sipd-loader-content">
        <div class="sipd-spinner"></div>
        <p class="sipd-loading-text">Mengambil data DPA...</p>
      </div>
    `;
        document.body.appendChild(loader);
    }

    /**
     * Hide loading indicator
     */
    function hideLoadingIndicator() {
        const loader = document.getElementById('sipd-loader');
        if (loader) loader.remove();
    }

    /**
     * Show success message
     * @param {string} message - Success message
     */
    function showSuccessMessage(message) {
        const toast = document.createElement('div');
        toast.className = 'sipd-toast sipd-toast-success';
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('sipd-toast-show');
        }, 100);

        setTimeout(() => {
            toast.classList.remove('sipd-toast-show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    /**
     * Show error message
     * @param {string} message - Error message
     */
    function showErrorMessage(message) {
        // Ensure error style exists
        if (!document.getElementById('sipd-toast-error-style')) {
            const style = document.createElement('style');
            style.id = 'sipd-toast-error-style';
            style.textContent = `
                .sipd-toast-error {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    background-color: #f44336;
                    color: white;
                    padding: 12px 24px;
                    border-radius: 4px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    z-index: 10001;
                    font-size: 14px;
                    opacity: 0;
                    transform: translateY(20px);
                    transition: all 0.3s ease;
                }
                .sipd-toast-show {
                    opacity: 1;
                    transform: translateY(0);
                }
            `;
            document.head.appendChild(style);
        }

        const toast = document.createElement('div');
        toast.className = 'sipd-toast-error';
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('sipd-toast-show');
        }, 100);

        setTimeout(() => {
            toast.classList.remove('sipd-toast-show');
            setTimeout(() => toast.remove(), 300);
        }, 5000); // 5 seconds display for errors
    }

    /**
     * Add batch extraction button to list page
     * @param {string} pageType - 'persetujuan', 'skpd', or 'pendapatan'
     */
    function addBatchExtractionButton(pageType = 'persetujuan') {
        // Container ID based on page type
        const containerIds = {
            'persetujuan': 'sipd-batch-container',
            'skpd': 'sipd-skpd-batch-container',
            'pendapatan': 'sipd-pendapatan-batch-container',
            'belanja': 'sipd-belanja-batch-container',
            'pembiayaan': 'sipd-pembiayaan-batch-container'
        };

        // Create button container
        const buttonContainer = document.createElement('div');
        buttonContainer.id = containerIds[pageType] || containerIds['persetujuan'];
        buttonContainer.className = 'sipd-extractor-container';

        // Button text based on page type
        const buttonTexts = {
            'persetujuan': 'Batch Extract DPA Persetujuan',
            'skpd': 'Batch Extract DPA SKPD',
            'pendapatan': 'Batch Extract DPA Pendapatan',
            'belanja': 'Batch Extract DPA Belanja',
            'pembiayaan': 'Batch Extract DPA Pembiayaan'
        };

        // Button ID based on page type
        const buttonIds = {
            'persetujuan': 'sipd-batch-btn',
            'skpd': 'sipd-skpd-batch-btn',
            'pendapatan': 'sipd-pendapatan-batch-btn',
            'belanja': 'sipd-belanja-batch-btn',
            'pembiayaan': 'sipd-pembiayaan-batch-btn'
        };

        // Create button
        const button = document.createElement('button');
        button.id = buttonIds[pageType] || buttonIds['persetujuan'];
        button.className = 'sipd-extract-btn';
        button.innerHTML = `
      <span class="sipd-icon">📦</span>
      <span class="sipd-text">${buttonTexts[pageType] || buttonTexts['persetujuan']}</span>
    `;

        button.addEventListener('click', () => handleBatchExtraction(pageType));
        buttonContainer.appendChild(button);

        // Insert at top
        const contentArea = document.querySelector('.content-wrapper') ||
            document.querySelector('.main-content') ||
            document.body;

        if (contentArea.firstChild) {
            contentArea.insertBefore(buttonContainer, contentArea.firstChild);
        } else {
            contentArea.appendChild(buttonContainer);
        }
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
     * Handle batch extraction flow
     * @param {string} pageType - 'persetujuan', 'skpd', or 'pendapatan'
     */
    async function handleBatchExtraction(pageType = 'persetujuan') {
        try {
            showLoadingIndicator();
            const loadingText = document.querySelector('.sipd-loading-text');
            if (loadingText) loadingText.textContent = 'Memulai batch extraction...';

            // 1. Get Token
            const token = await getAuthToken();
            if (!token) throw new Error('Token tidak ditemukan');

            // 2. Parse Token for ID Daerah & Tahun
            const jwt = parseJwt(token);
            if (!jwt || !jwt.id_daerah || !jwt.tahun) {
                throw new Error('Gagal membaca info daerah/tahun dari token');
            }
            console.log('JWT Info:', jwt);

            // 3. Fetch SKPD List (different API for pendapatan and pembiayaan)
            let skpdList;
            if (pageType === 'pendapatan') {
                if (loadingText) loadingText.textContent = 'Fetching semua halaman pendapatan...';
                skpdList = await fetchPendapatanSKPDList(token);
            } else if (pageType === 'pembiayaan') {
                if (loadingText) loadingText.textContent = 'Fetching semua halaman pembiayaan...';
                skpdList = await fetchPembiayaanSKPDList(token);
            } else {
                // For 'persetujuan', 'skpd', and 'belanja' - use standard SKPD list API
                skpdList = await fetchSKPDList(token, jwt.id_daerah, jwt.tahun);
            }

            if (!skpdList || skpdList.length === 0) {
                throw new Error('Tidak ada data SKPD ditemukan');
            }

            // 4. Save List to Storage
            await new Promise(resolve => {
                chrome.storage.local.set({ sipd_persetujuan: skpdList }, resolve);
            });
            console.log(`Saved ${skpdList.length} SKPDs to sipd_persetujuan`);

            // 5. Select Jadwal (Not needed anymore, we use ALL jadwals)
            const jadwalList = await loadJadwalFromDB();
            if (jadwalList.length === 0) {
                throw new Error('Belum ada data jadwal. Silakan fetch jadwal dulu via extension popup.');
            }

            // Hide loading indicator before showing modal
            hideLoadingIndicator();

            // Show Preview Modal with pageType
            showBatchPreviewModal(skpdList, jadwalList, pageType);

        } catch (error) {
            console.error(error);
            hideLoadingIndicator();
            alert(`Batch Error: ${error.message}`);
        }
    }

    /**
     * Fetch SKPD List from API
     */
    async function fetchSKPDList(token, idDaerah, tahun) {
        const apiUrl = `https://service.sipd.kemendagri.go.id/referensi/strict/skpd/list/${idDaerah}/${tahun}`;
        console.log('Fetching SKPD List:', apiUrl);

        const response = await fetchXHR(apiUrl, {
            method: 'GET',
            credentials: 'include',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error(`Gagal fetch SKPD: ${response.status}`);

        const data = await response.json();
        return data;
    }

    /**
     * Fetch ALL pages of Pendapatan SKPD list
     * Filter only items where nilai or nilai_rak > 0
     * Scrapes total page count from DOM pagination first
     * @param {string} token - Auth token
     */
    async function fetchPendapatanSKPDList(token) {
        const allItems = [];

        // Scrape total pages from DOM pagination text
        // Format: "Menampilkan halaman ke- X dari Y halaman"
        let totalPages = 1;
        const paginationText = document.querySelector('.container-pagination-table-list .css-nac-9_c9am_DJ-Ds p');
        if (paginationText) {
            const match = paginationText.textContent.match(/dari\s+(\d+)\s+halaman/);
            if (match) {
                totalPages = parseInt(match[1]);
                console.log(`Total pages scraped from DOM: ${totalPages}`);
            }
        }

        console.log(`Starting to fetch all ${totalPages} Pendapatan pages...`);

        for (let currentPage = 1; currentPage <= totalPages; currentPage++) {
            const apiUrl = `https://service.sipd.kemendagri.go.id/referensi/strict/dpa/penerimaan/pendapatan?page=${currentPage}`;
            console.log(`Fetching page ${currentPage}/${totalPages}:`, apiUrl);

            const response = await fetchXHR(apiUrl, {
                method: 'GET',
                credentials: 'include',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error(`Gagal fetch Pendapatan page ${currentPage}: ${response.status}`);

            const result = await response.json();

            // Handle different response structures
            const items = result.data || result || [];
            allItems.push(...items);

            // Add small delay to avoid rate limiting
            if (currentPage < totalPages) {
                await new Promise(r => setTimeout(r, 300));
            }
        }

        console.log(`Total items fetched: ${allItems.length}`);

        // Filter only items with nilai or nilai_rak > 0
        const filtered = allItems.filter(item => {
            const nilai = parseFloat(item.nilai) || 0;
            const nilaiRak = parseFloat(item.nilai_rak) || 0;
            return nilai > 0 || nilaiRak > 0;
        });

        console.log(`Items with nilai > 0: ${filtered.length}`);

        // Map to standard format (similar to SKPD list structure)
        return filtered.map(item => ({
            id_skpd: item.id_skpd || item.id,
            nama_skpd: item.nama_skpd || item.nama || 'Unknown SKPD',
            kode_skpd: item.kode_skpd || item.kode || '',
            nilai: item.nilai,
            nilai_rak: item.nilai_rak
        }));
    }

    /**
     * Fetch ALL pages of Pembiayaan SKPD list
     * Filter only items where nilai or nilai_rak > 0
     * Scrapes total page count from DOM pagination first
     * @param {string} token - Auth token
     */
    async function fetchPembiayaanSKPDList(token) {
        const allItems = [];

        // Scrape total pages from DOM pagination text
        // Format: "Menampilkan halaman ke- X dari Y halaman"
        let totalPages = 1;
        const paginationText = document.querySelector('.container-pagination-table-list .css-nac-9_c9am_DJ-Ds p');
        if (paginationText) {
            const match = paginationText.textContent.match(/dari\s+(\d+)\s+halaman/);
            if (match) {
                totalPages = parseInt(match[1]);
                console.log(`Total pages scraped from DOM: ${totalPages}`);
            }
        }

        console.log(`Starting to fetch all ${totalPages} Pembiayaan pages...`);

        for (let currentPage = 1; currentPage <= totalPages; currentPage++) {
            const apiUrl = `https://service.sipd.kemendagri.go.id/referensi/strict/dpa/penerimaan/pembiayaan?page=${currentPage}`;
            console.log(`Fetching page ${currentPage}/${totalPages}:`, apiUrl);

            const response = await fetchXHR(apiUrl, {
                method: 'GET',
                credentials: 'include',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error(`Gagal fetch Pembiayaan page ${currentPage}: ${response.status}`);

            const result = await response.json();

            // Handle different response structures
            const items = result.data || result || [];
            allItems.push(...items);

            // Add small delay to avoid rate limiting
            if (currentPage < totalPages) {
                await new Promise(r => setTimeout(r, 300));
            }
        }

        console.log(`Total items fetched: ${allItems.length}`);

        // Filter only items with nilai or nilai_rak > 0
        const filtered = allItems.filter(item => {
            const nilai = parseFloat(item.nilai) || 0;
            const nilaiRak = parseFloat(item.nilai_rak) || 0;
            return nilai > 0 || nilaiRak > 0;
        });

        console.log(`Items with nilai > 0: ${filtered.length}`);

        // Map to standard format (similar to SKPD list structure)
        return filtered.map(item => ({
            id_skpd: item.id_skpd || item.id,
            nama_skpd: item.nama_skpd || item.nama || 'Unknown SKPD',
            kode_skpd: item.kode_skpd || item.kode || '',
            nilai: item.nilai,
            nilai_rak: item.nilai_rak
        }));
    }

    /**
     * Fetch Sub-Kegiatan list for Rincian Belanja
     * @param {string} token - Auth token
     * @param {string} skpdId - SKPD ID
     */
    async function fetchRincianBelanjaSKPD(token, skpdId) {
        const apiUrl = `https://service.sipd.kemendagri.go.id/referensi/strict/dpa/penarikan/belanja/skpd/${skpdId}`;
        console.log('Fetching Rincian Belanja SKPD:', apiUrl);

        const response = await fetchXHR(apiUrl, {
            method: 'GET',
            credentials: 'include',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error(`Gagal fetch Rincian Belanja SKPD: ${response.status}`);

        const result = await response.json();

        // Response structure: { id_skpd, nama_skpd, kode_skpd, items: [...] }
        const items = result.items || [];
        let namaSkpd = result.nama_skpd;

        // Fallback: If nama_skpd is empty (common in some endpoints), try to find it in items
        // Usually items where id_skpd == id_sub_skpd represent the main SKPD name
        if (!namaSkpd && items.length > 0) {
            const mainItem = items.find(i => i.id_skpd == i.id_sub_skpd) || items[0];
            namaSkpd = mainItem.nama_sub_skpd || mainItem.nama_skpd;
            console.log('Using fallback nama_skpd:', namaSkpd);
        }

        // Inject nama_skpd into each item for later use in filename generation
        if (namaSkpd) {
            items.forEach(item => {
                // Only overwrite if item doesn't have it or it's empty
                if (!item.nama_skpd) {
                    item.nama_skpd = namaSkpd;
                }
            });
        }

        console.log(`Total sub-kegiatan fetched: ${items.length} for SKPD: ${namaSkpd}`);

        return items;
    }

    /**
     * Show Hierarchical Rincian Belanja Modal
     * Groups by sub_skpd, sorts sub_giat
     * @param {string} skpdId - SKPD ID
     * @param {Array} subKegiatanList - List of sub-kegiatan with all params
     * @param {Array} jadwalList - List of jadwals
     */
    async function showRincianBelanjaModal(skpdId, subKegiatanList, jadwalList, skpdName) {
        const modal = document.createElement('div');
        modal.className = 'sipd-modal';

        // Display Name for Header (cleanup duplicates if name contains "SKPD")
        const displayName = skpdName || `SKPD ${skpdId}`;

        // Filter out jadwal id 62
        const filteredJadwalList = jadwalList.filter(j => {
            const id = j.id_jadwal || j.id;
            return id != 62;
        });

        // Group by sub_skpd
        const groupedBySubSkpd = {};
        subKegiatanList.forEach(item => {
            const key = `${item.kode_sub_skpd} - ${item.nama_sub_skpd}`;
            if (!groupedBySubSkpd[key]) {
                groupedBySubSkpd[key] = {
                    kode_sub_skpd: item.kode_sub_skpd,
                    nama_sub_skpd: item.nama_sub_skpd,
                    items: []
                };
            }
            groupedBySubSkpd[key].items.push(item);
        });

        // Sort sub_giat within each group by kode_sub_giat
        Object.values(groupedBySubSkpd).forEach(group => {
            group.items.sort((a, b) => {
                return (a.kode_sub_giat || '').localeCompare(b.kode_sub_giat || '');
            });
        });

        // Fetch Errors
        const errors = await getErrorLogs(skpdId);
        let errorHtml = '';
        if (errors.length > 0) {
            errorHtml = `
            <div class="sipd-error-notice" style="background: #ffebee; border: 1px solid #ef9a9a; padding: 10px; margin-bottom: 15px; border-radius: 6px;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <strong>⚠️ Terdeteksi ${errors.length} download gagal sebelumnya:</strong>
                    <button id="sipd-clear-errors" style="font-size: 11px; padding: 2px 8px; cursor: pointer;">Clear Log</button>
                </div>
                <ul style="margin: 5px 0 0 20px; font-size: 11px; color: #d32f2f; max-height: 100px; overflow-y: auto;">
                    ${errors.map(e => `<li>[${e.jadwalName}] ${e.subGiatCode} - ${e.error}</li>`).join('')}
                </ul>
            </div>
            `;
        }

        // Load tracker data for all subgiats
        const trackerDataMap = {};
        for (const subGiat of subKegiatanList) {
            const trackerId = `${skpdId}_${subGiat.kode_sub_giat}`;
            const tracker = await getDownloadTracker('rincian_belanja', trackerId);
            if (tracker) {
                trackerDataMap[trackerId] = tracker;
            }
        }

        // Helper function to sanitize ID for CSS selector
        const sanitizeId = (id) => String(id).replace(/\./g, '-');

        // Build hierarchical list HTML with status indicators
        let hierarchicalListHtml = '';
        Object.keys(groupedBySubSkpd).sort().forEach(groupKey => {
            const group = groupedBySubSkpd[groupKey];
            hierarchicalListHtml += `
                <div class="sipd-subskpd-group">
                    <div class="sipd-subskpd-header">
                        <strong>${group.kode_sub_skpd}</strong> - ${group.nama_sub_skpd}
                    </div>
                    <div class="sipd-subgiat-list">
            `;

            group.items.forEach(subGiat => {
                const trackerId = `${skpdId}_${subGiat.kode_sub_giat}`;
                const sanitizedId = sanitizeId(trackerId);
                const tracker = trackerDataMap[trackerId];

                let statusClass = 'pending';
                let statusBadge = '';

                if (tracker && tracker.stats) {
                    const { total, success, error } = tracker.stats;
                    if (success === total && total > 0) {
                        statusClass = 'complete';
                        statusBadge = `<span class="sipd-status-badge success">✅ ${success}/${total}</span>`;
                    } else if (error > 0) {
                        statusClass = 'error';
                        statusBadge = `<span class="sipd-status-badge error">❌ ${error}/${total} Error</span>`;
                    } else if (success > 0) {
                        statusClass = 'partial';
                        statusBadge = `<span class="sipd-status-badge partial">⚠️ ${success}/${total}</span>`;
                    }
                }

                hierarchicalListHtml += `
                    <div class="sipd-subgiat-item sipd-status-${statusClass}" data-tracker-id="${trackerId}">
                        <div class="sipd-subgiat-info">
                            ${statusBadge}
                            <span class="sipd-subgiat-code">${subGiat.kode_sub_giat}</span>
                            <span class="sipd-subgiat-name">${subGiat.nama_sub_giat}</span>
                        </div>
                        <button class="sipd-subgiat-expand-btn" data-subgiat='${JSON.stringify(subGiat).replace(/'/g, "&#39;")}'>
                            ⚙️ Options
                        </button>
                    </div>
                    <div class="sipd-subgiat-options" id="options-${sanitizedId}" style="display: none;">
                        <div class="sipd-jadwal-selector">
                            <div class="sipd-jadwal-checkboxes">
                                ${filteredJadwalList.map(j => {
                    const jId = j.id_jadwal_sipd;
                    const jName = j.jadwal_sipd_penatausahaan || j.nama_jadwal || j.nama || 'Jadwal';
                    let jStatus = '';
                    if (tracker && tracker.jadwals && tracker.jadwals[jId]) {
                        const st = tracker.jadwals[jId].status;
                        jStatus = st === 'success' ? '✓' : st === 'error' ? '✗' : '⏳';
                    }
                    return `
                                        <label class="sipd-jadwal-label">
                                            <input type="checkbox" class="sipd-jadwal-checkbox" value="${jId}" checked>
                                            ${jStatus} ${jName}
                                        </label>
                                    `;
                }).join('')}
                            </div>
                            <div class="sipd-jadwal-actions">
                                <button class="sipd-select-all-btn">Select All</button>
                                <button class="sipd-deselect-all-btn">Deselect All</button>
                            </div>
                        </div>
                        <div class="sipd-download-actions">
                            <button class="sipd-download-selected-btn" data-subgiat='${JSON.stringify(subGiat).replace(/'/g, "&#39;")}'>
                                ⬇️ Download Selected
                            </button>
                        </div>
                    </div>
                `;
            });

            hierarchicalListHtml += `
                    </div>
                </div>
            `;
        });

        modal.innerHTML = `
            <div class="sipd-modal-content" style="max-width: 800px;">
                <div class="sipd-modal-header">
                    <h2>📦 ${displayName}</h2>
                    <button class="sipd-modal-close">×</button>
                </div>
                <div class="sipd-modal-body">
                    ${errorHtml}
                    <div class="sipd-info-box">
                        <p><strong>Total Sub-SKPD:</strong> ${Object.keys(groupedBySubSkpd).length}</p>
                        <p><strong>Total Sub-Kegiatan:</strong> ${subKegiatanList.length}</p>
                        <p><strong>Jadwal per Sub-Kegiatan:</strong> ${filteredJadwalList.length} file</p>
                        <p style="font-size: 12px; color: #666;">💡 Klik tombol Download pada sub-kegiatan yang diinginkan</p>
                    </div>
                    
                    <div id="sipd-hierarchical-list" style="max-height: 500px; overflow-y: auto; border: 1px solid #ddd; padding: 10px; background: #f9f9f9;">
                        ${hierarchicalListHtml}
                    </div>
                </div>
            </div>
        `;

        // Styling
        const style = document.createElement('style');
        style.textContent = `
            .sipd-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10000;
            }
            .sipd-modal-content {
                background: white;
                border-radius: 8px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
                max-height: 90vh;
                overflow: hidden;
                display: flex;
                flex-direction: column;
            }
            .sipd-modal-header {
                padding: 15px 20px;
                border-bottom: 1px solid #ddd;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .sipd-modal-header h2 {
                margin: 0;
                font-size: 18px;
            }
            .sipd-modal-close {
                background: none;
                border: none;
                font-size: 24px;
                cursor: pointer;
                color: #666;
            }
            .sipd-modal-close:hover {
                color: #000;
            }
            .sipd-modal-body {
                padding: 20px;
                overflow-y: auto;
            }
            .sipd-info-box {
                background: #fff3e0;
                padding: 10px;
                border-radius: 6px;
                margin-bottom: 15px;
                border: 1px solid #ffe0b2;
            }
            .sipd-subskpd-group {
                margin-bottom: 15px;
                border: 1px solid #ddd;
                border-radius: 6px;
                background: white;
            }
            .sipd-subskpd-header {
                padding: 10px;
                background: #e3f2fd;
                border-bottom: 1px solid #90caf9;
                font-size: 14px;
                border-radius: 6px 6px 0 0;
            }
            .sipd-subgiat-list {
                padding: 5px;
            }
            .sipd-subgiat-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 8px 10px;
                border-bottom: 1px solid #eee;
            }
            .sipd-subgiat-item:last-child {
                border-bottom: none;
            }
            /* Status Color Coding */
            .sipd-status-complete {
                border-left: 4px solid #4caf50;
                background: #f1f8f4;
            }
            .sipd-status-partial {
                border-left: 4px solid #ff9800;
                background: #fff8f0;
            }
            .sipd-status-error {
                border-left: 4px solid #f44336;
                background: #fef5f5;
            }
            .sipd-status-pending {
                border-left: 4px solid #9e9e9e;
            }
            /* Status Badge */
            .sipd-status-badge {
                display: inline-block;
                font-size: 10px;
                padding: 2px 6px;
                border-radius: 3px;
                margin-right: 8px;
                font-weight: bold;
            }
            .sipd-status-badge.success {
                background: #c8e6c9;
                color: #2e7d32;
            }
            .sipd-status-badge.partial {
                background: #ffe0b2;
                color: #e65100;
            }
            .sipd-status-badge.error {
                background: #ffcdd2;
                color: #c62828;
            }
            .sipd-subgiat-info {
                flex: 1;
                font-size: 13px;
                display: flex;
                align-items: center;
                gap: 4px;
            }
            .sipd-subgiat-code {
                display: inline-block;
                background: #fff3e0;
                color: #e65100;
                padding: 2px 6px;
                border-radius: 3px;
                font-family: monospace;
                font-size: 11px;
            }
            .sipd-subgiat-name {
                color: #333;
            }
            /* Expand Button */
            .sipd-subgiat-expand-btn {
                background: #2196f3;
                color: white;
                border: none;
                padding: 6px 12px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
                white-space: nowrap;
            }
            .sipd-subgiat-expand-btn:hover {
                background: #1976d2;
            }
            /* Options Panel */
            .sipd-subgiat-options {
                padding: 10px;
                background: #f9f9f9;
                border: 1px solid #ddd;
                border-radius: 4px;
                margin: 5px 0;
            }
            .sipd-jadwal-selector {
                margin-bottom: 10px;
            }
            .sipd-jadwal-checkboxes {
                display: flex;
                flex-direction: column;
                gap: 5px;
                margin-bottom: 10px;
                max-height: 200px;
                overflow-y: auto;
            }
            .sipd-jadwal-label {
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 12px;
                padding: 4px;
                cursor: pointer;
            }
            .sipd-jadwal-label:hover {
                background: #e3f2fd;
            }
            .sipd-jadwal-checkbox {
                cursor: pointer;
            }
            .sipd-jadwal-actions {
                display: flex;
                gap: 8px;
                margin-bottom: 10px;
            }
            .sipd-select-all-btn, .sipd-deselect-all-btn {
                background: #757575;
                color: white;
                border: none;
                padding: 4px 8px;
                border-radius: 3px;
                cursor: pointer;
                font-size: 11px;
            }
            .sipd-select-all-btn:hover, .sipd-deselect-all-btn:hover {
                background: #616161;
            }
            .sipd-download-actions {
                display: flex;
                gap: 8px;
            }
            .sipd-download-selected-btn {
                background: #4caf50;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 13px;
                flex: 1;
            }
            .sipd-download-selected-btn:hover {
                background: #45a049;
            }
            .sipd-download-selected-btn:disabled {
                background: #ccc;
                cursor: not-allowed;
            }
        `;
        document.head.appendChild(style);

        // Event Handlers
        modal.querySelector('.sipd-modal-close').onclick = () => {
            modal.remove();
            style.remove();
        };

        // Clear Logs Handler
        const clearBtn = modal.querySelector('#sipd-clear-errors');
        if (clearBtn) {
            clearBtn.onclick = async () => {
                if (confirm('Bersihkan semua log error untuk SKPD ini?')) {
                    await clearErrorLogs(skpdId);
                    const notice = modal.querySelector('.sipd-error-notice');
                    if (notice) notice.remove();
                }
            };
        }

        // Expand/Collapse Options Handlers
        modal.querySelectorAll('.sipd-subgiat-expand-btn').forEach(btn => {
            btn.onclick = () => {
                const subGiatJson = btn.getAttribute('data-subgiat');
                const subGiat = JSON.parse(subGiatJson);
                const trackerId = `${skpdId}_${subGiat.kode_sub_giat}`;
                const sanitizedId = sanitizeId(trackerId);
                const optionsDiv = modal.querySelector(`#options-${sanitizedId}`);

                if (optionsDiv) {
                    const isHidden = optionsDiv.style.display === 'none';
                    optionsDiv.style.display = isHidden ? 'block' : 'none';
                    btn.textContent = isHidden ? '⬆️ Hide' : '⚙️ Options';
                }
            };
        });

        // Select All / Deselect All Handlers
        modal.querySelectorAll('.sipd-select-all-btn').forEach(btn => {
            btn.onclick = () => {
                const optionsDiv = btn.closest('.sipd-subgiat-options');
                optionsDiv.querySelectorAll('.sipd-jadwal-checkbox').forEach(cb => cb.checked = true);
            };
        });

        modal.querySelectorAll('.sipd-deselect-all-btn').forEach(btn => {
            btn.onclick = () => {
                const optionsDiv = btn.closest('.sipd-subgiat-options');
                optionsDiv.querySelectorAll('.sipd-jadwal-checkbox').forEach(cb => cb.checked = false);
            };
        });

        // Download Selected Handlers
        modal.querySelectorAll('.sipd-download-selected-btn').forEach(btn => {
            btn.onclick = async () => {
                const subGiatJson = btn.getAttribute('data-subgiat');
                const subGiat = JSON.parse(subGiatJson);
                const trackerId = `${skpdId}_${subGiat.kode_sub_giat}`;
                const sanitizedId = sanitizeId(trackerId);
                const optionsDiv = modal.querySelector(`#options-${sanitizedId}`);

                // Get selected jadwals
                const selectedJadwalIds = [];
                optionsDiv.querySelectorAll('.sipd-jadwal-checkbox:checked').forEach(cb => {
                    selectedJadwalIds.push(cb.value);
                });

                if (selectedJadwalIds.length === 0) {
                    alert('Pilih minimal 1 jadwal!');
                    return;
                }

                // Filter jadwal list
                const selectedJadwals = filteredJadwalList.filter(j =>
                    selectedJadwalIds.includes(String(j.id_jadwal_sipd))
                );

                btn.disabled = true;
                btn.textContent = '⏳ Processing...';

                await downloadSubGiatAllJadwals(subGiat, selectedJadwals, skpdId);

                // Reload modal to update status
                modal.remove();
                style.remove();
                await showRincianBelanjaModal(skpdId, subKegiatanList, jadwalList, skpdName);
            };
        });

        document.body.appendChild(modal);
    }

    /**
     * Show Batch Preview Modal with Individual SKPD Download Buttons
     * @param {Array} skpdList - List of SKPDs
     * @param {Array} jadwalList - List of jadwals
     * @param {string} pageType - 'persetujuan' or 'skpd'
     */
    async function showBatchPreviewModal(skpdList, jadwalList, pageType = 'persetujuan') {
        const modal = document.createElement('div');
        modal.className = 'sipd-modal';

        // Title based on page type
        const modalTitles = {
            'persetujuan': '📦 Batch Extract DPA Persetujuan',
            'skpd': '📦 Batch Extract DPA SKPD',
            'pendapatan': '📦 Batch Extract DPA Pendapatan',
            'belanja': '📦 Batch Extract DPA Belanja',
            'pembiayaan': '📦 Batch Extract DPA Pembiayaan'
        };
        const modalTitle = modalTitles[pageType] || modalTitles['persetujuan'];

        // Filter out id_jadwal 62
        const filteredJadwalList = jadwalList.filter(j => {
            const id = j.id_jadwal || j.id;
            return id != 62;
        });

        // Load tracker data for all SKPDs
        const trackerDataMap = {};
        for (const skpd of skpdList) {
            const tracker = await getDownloadTracker(pageType, skpd.id_skpd);
            if (tracker) {
                trackerDataMap[skpd.id_skpd] = tracker;
            }
        }

        // Helper function to sanitize ID for CSS selector
        const sanitizeId = (id) => String(id).replace(/\./g, '-');

        // Build SKPD list with status indicators and options
        let skpdListHtml = '';
        skpdList.forEach(skpd => {
            const skpdId = skpd.id_skpd;
            const sanitizedId = sanitizeId(skpdId);
            const tracker = trackerDataMap[skpdId];

            let statusClass = 'pending';
            let statusBadge = '';

            if (tracker && tracker.stats) {
                const { total, success, error } = tracker.stats;
                if (success === total && total > 0) {
                    statusClass = 'complete';
                    statusBadge = `<span class="sipd-status-badge success">✅ ${success}/${total}</span>`;
                } else if (error > 0) {
                    statusClass = 'error';
                    statusBadge = `<span class="sipd-status-badge error">❌ ${error}/${total} Error</span>`;
                } else if (success > 0) {
                    statusClass = 'partial';
                    statusBadge = `<span class="sipd-status-badge partial">⚠️ ${success}/${total}</span>`;
                }
            }

            skpdListHtml += `
                <div class="sipd-skpd-item sipd-status-${statusClass}" data-tracker-id="${skpdId}">
                    <div class="sipd-skpd-info-row">
                        ${statusBadge}
                        <div class="sipd-skpd-text">
                            <small>${skpd.kode_skpd}</small>
                            <b>${skpd.nama_skpd}</b>
                        </div>
                        <button class="sipd-skpd-expand-btn" data-skpd='${JSON.stringify(skpd).replace(/'/g, "&#39;")}'>
                            ⚙️ Options
                        </button>
                    </div>
                    <div class="sipd-skpd-options" id="batch-options-${sanitizedId}" style="display: none;">
                        <div class="sipd-jadwal-selector">
                            <div class="sipd-jadwal-checkboxes">
                                ${filteredJadwalList.map(j => {
                const jId = j.id_jadwal || j.id;
                const jName = j.jadwal_sipd_penatausahaan || j.nama_jadwal || j.nama || 'Jadwal';
                let jStatus = '';
                if (tracker && tracker.jadwals && tracker.jadwals[jId]) {
                    const st = tracker.jadwals[jId].status;
                    jStatus = st === 'success' ? '✓' : st === 'error' ? '✗' : '⏳';
                }
                return `
                                        <label class="sipd-jadwal-label">
                                            <input type="checkbox" class="sipd-jadwal-checkbox" value="${jId}" checked>
                                            ${jStatus} ${jName}
                                        </label>
                                    `;
            }).join('')}
                            </div>
                            <div class="sipd-jadwal-actions">
                                <button class="sipd-select-all-btn">Select All</button>
                                <button class="sipd-deselect-all-btn">Deselect All</button>
                            </div>
                        </div>
                        <div class="sipd-download-actions">
                            <button class="sipd-download-selected-btn" data-skpd='${JSON.stringify(skpd).replace(/'/g, "&#39;")}'>
                                ⬇️ Download Selected
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });

        modal.innerHTML = `
            <div class="sipd-modal-content" style="max-width: 700px;">
                <div class="sipd-modal-header">
                    <h2>${modalTitle}</h2>
                    <button class="sipd-modal-close">&times;</button>
                </div>
                <div class="sipd-modal-body">
                    <div class="sipd-info-box">
                        <p><strong>Total SKPD:</strong> ${skpdList.length}</p>
                        <p><strong>Jadwal per SKPD:</strong> ${filteredJadwalList.length} file</p>
                        <p style="font-size: 12px; color: #666;">💡 Klik tombol Options untuk pilih jadwal</p>
                    </div>
                    
                    <h3>Daftar SKPD:</h3>
                    <div id="sipd-skpd-list" style="max-height: 400px; overflow-y: auto; border: 1px solid #ddd; padding: 10px; background: #f9f9f9;">
                        ${skpdListHtml}
                    </div>
                </div>
            </div>
        `;

        // Styling for new elements
        const style = document.createElement('style');
        style.textContent = `
            .sipd-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10000;
            }
            .sipd-modal-content {
                background: white;
                border-radius: 8px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
                max-height: 90vh;
                overflow: hidden;
                display: flex;
                flex-direction: column;
            }
            .sipd-modal-header {
                padding: 15px 20px;
                border-bottom: 1px solid #ddd;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .sipd-modal-header h2 {
                margin: 0;
                font-size: 18px;
            }
            .sipd-modal-close {
                background: none;
                border: none;
                font-size: 24px;
                cursor: pointer;
                color: #666;
            }
            .sipd-modal-close:hover {
                color: #000;
            }
            .sipd-modal-body {
                padding: 20px;
                overflow-y: auto;
            }
            /* Batch SKPD Items */
            .sipd-skpd-item {
                border-bottom: 1px solid #eee;
                margin-bottom: 5px;
                padding: 8px 10px;
                border-radius: 4px;
            }
            /* Status Color Coding for SKPD Items */
            .sipd-skpd-item.sipd-status-complete {
                border-left: 4px solid #4caf50;
                background: #f1f8f4;
            }
            .sipd-skpd-item.sipd-status-partial {
                border-left: 4px solid #ff9800;
                background: #fff8f0;
            }
            .sipd-skpd-item.sipd-status-error {
                border-left: 4px solid #f44336;
                background: #fef5f5;
            }
            .sipd-skpd-item.sipd-status-pending {
                border-left: 4px solid #9e9e9e;
            }
            .sipd-skpd-info-row {
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 8px;
            }
            .sipd-skpd-text {
                flex: 1;
                font-size: 13px;
            }
            .sipd-skpd-text small {
                display: block;
                color: #666;
                margin-bottom: 2px;
            }
            .sipd-skpd-expand-btn {
                background: #2196f3;
                color: white;
                border: none;
                padding: 6px 12px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
                white-space: nowrap;
            }
            .sipd-skpd-expand-btn:hover {
                background: #1976d2;
            }
            .sipd-skpd-options {
                padding: 10px;
                background: #f9f9f9;
                border: 1px solid #ddd;
                border-radius: 4px;
                margin-top: 5px;
            }
            /* Jadwal Selector Styling */
            .sipd-jadwal-selector {
                margin-bottom: 10px;
            }
            .sipd-jadwal-checkboxes {
                display: flex;
                flex-direction: column;
                gap: 5px;
                margin-bottom: 10px;
                max-height: 200px;
                overflow-y: auto;
                padding: 5px;
                background: white;
                border: 1px solid #e0e0e0;
                border-radius: 4px;
            }
            .sipd-jadwal-label {
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 12px;
                padding: 6px 8px;
                cursor: pointer;
                border-radius: 3px;
                transition: background 0.2s;
            }
            .sipd-jadwal-label:hover {
                background: #e3f2fd;
            }
            .sipd-jadwal-checkbox {
                cursor: pointer;
                width: 16px;
                height: 16px;
            }
            .sipd-jadwal-actions {
                display: flex;
                gap: 8px;
                margin-bottom: 10px;
            }
            .sipd-select-all-btn, .sipd-deselect-all-btn {
                background: #757575;
                color: white;
                border: none;
                padding: 5px 10px;
                border-radius: 3px;
                cursor: pointer;
                font-size: 11px;
                transition: background 0.2s;
            }
            .sipd-select-all-btn:hover, .sipd-deselect-all-btn:hover {
                background: #616161;
            }
            .sipd-download-actions {
                display: flex;
                gap: 8px;
            }
            .sipd-download-selected-btn {
                background: #4caf50;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 13px;
                flex: 1;
                transition: background 0.2s;
            }
            .sipd-download-selected-btn:hover {
                background: #45a049;
            }
            .sipd-download-selected-btn:disabled {
                background: #ccc;
                cursor: not-allowed;
            }
            .sipd-badge { 
                display: inline-block; 
                background: #e3f2fd; 
                color: #1565c0; 
                padding: 2px 8px; 
                border-radius: 4px; 
                font-size: 12px; 
                margin-right: 5px; 
                margin-bottom: 5px; 
                border: 1px solid #90caf9; 
            }
            .sipd-info-box { 
                background: #fff3e0; 
                padding: 10px; 
                border-radius: 6px; 
                margin-bottom: 15px; 
                border: 1px solid #ffe0b2; 
            }
        `;
        document.head.appendChild(style);

        // Event Handlers
        modal.querySelector('.sipd-modal-close').onclick = () => {
            modal.remove();
            style.remove();
        };

        // Expand/Collapse Options Handlers
        modal.querySelectorAll('.sipd-skpd-expand-btn').forEach(btn => {
            btn.onclick = () => {
                const skpdJson = btn.getAttribute('data-skpd');
                const skpd = JSON.parse(skpdJson);
                const sanitizedId = sanitizeId(skpd.id_skpd);
                const optionsDiv = modal.querySelector(`#batch-options-${sanitizedId}`);

                if (optionsDiv) {
                    const isHidden = optionsDiv.style.display === 'none';
                    optionsDiv.style.display = isHidden ? 'block' : 'none';
                    btn.textContent = isHidden ? '⬆️ Hide' : '⚙️ Options';
                }
            };
        });

        // Select All / Deselect All Handlers
        modal.querySelectorAll('.sipd-select-all-btn').forEach(btn => {
            btn.onclick = () => {
                const optionsDiv = btn.closest('.sipd-skpd-options');
                optionsDiv.querySelectorAll('.sipd-jadwal-checkbox').forEach(cb => cb.checked = true);
            };
        });

        modal.querySelectorAll('.sipd-deselect-all-btn').forEach(btn => {
            btn.onclick = () => {
                const optionsDiv = btn.closest('.sipd-skpd-options');
                optionsDiv.querySelectorAll('.sipd-jadwal-checkbox').forEach(cb => cb.checked = false);
            };
        });

        // Download Selected Handlers
        modal.querySelectorAll('.sipd-download-selected-btn').forEach(btn => {
            btn.onclick = async () => {
                const skpdJson = btn.getAttribute('data-skpd');
                const skpd = JSON.parse(skpdJson);
                const sanitizedId = sanitizeId(skpd.id_skpd);
                const optionsDiv = modal.querySelector(`#batch-options-${sanitizedId}`);

                // Get selected jadwals
                const selectedJadwalIds = [];
                optionsDiv.querySelectorAll('.sipd-jadwal-checkbox:checked').forEach(cb => {
                    selectedJadwalIds.push(cb.value);
                });

                if (selectedJadwalIds.length === 0) {
                    alert('Pilih minimal 1 jadwal!');
                    return;
                }

                // Filter jadwal list
                const selectedJadwals = filteredJadwalList.filter(j => {
                    const jId = j.id_jadwal || j.id;
                    return selectedJadwalIds.includes(String(jId));
                });

                btn.disabled = true;
                btn.textContent = '⏳ Processing...';

                await downloadSKPDAllJadwals(skpd, selectedJadwals, pageType);

                // Reload modal to update status
                modal.remove();
                style.remove();
                await showBatchPreviewModal(skpdList, jadwalList, pageType);
            };
        });

        document.body.appendChild(modal);
    }

    /**
     * Download All Jadwals for a Single SKPD
     * @param {Object} skpd - SKPD object
     * @param {Array} jadwalList - List of jadwals
     * @param {string} pageType - 'persetujuan', 'skpd', or 'pendapatan'
     */
    async function downloadSKPDAllJadwals(skpd, jadwalList, pageType = 'persetujuan') {
        const skpdId = skpd.id_skpd;
        const skpdNama = skpd.nama_skpd;

        let totalFiles = 0;
        let errors = 0;

        showLoadingIndicator();

        // Loop through ALL Jadwals for this SKPD
        for (const jadwal of jadwalList) {
            const jadwalId = jadwal.id_jadwal || jadwal.id;
            const jadwalName = jadwal.jadwal_sipd_penatausahaan || jadwal.nama_jadwal || jadwal.nama || 'Jadwal';

            // Update status text
            const statusDiv = document.querySelector('.sipd-loading-text');
            if (statusDiv) {
                statusDiv.innerHTML = `
                    Downloading SKPD: <b>${skpdNama}</b><br>
                    Progress: <b>${totalFiles + 1}/${jadwalList.length}</b><br>
                    <small>Jadwal: ${jadwalName}</small>
                `;
            }

            // Save pending status
            await saveDownloadStatus(pageType, skpdId, jadwalId, 'pending', {
                itemName: skpdNama,
                jadwalName: jadwalName
            });

            try {
                // Use SKPD name directly (no index)
                await extractDPAData(skpdId, jadwalId, jadwalName, skpdNama, pageType);
                totalFiles++;

                // Save success status
                await saveDownloadStatus(pageType, skpdId, jadwalId, 'success', {
                    itemName: skpdNama,
                    jadwalName: jadwalName
                });

                showSuccessMessage(`✅ Berhasil: [${jadwalName}] ${skpdNama}`);
            } catch (err) {
                console.error(`Failed ${skpdNama} - ${jadwalName}:`, err);
                errors++;

                // Save error status
                await saveDownloadStatus(pageType, skpdId, jadwalId, 'error', {
                    itemName: skpdNama,
                    jadwalName: jadwalName,
                    errorMsg: err.message
                });

                showErrorMessage(`❌ Gagal: [${jadwalName}] ${skpdNama}`);
            }

            // Rate Limit Delay - Wait 1.5 seconds between each file download
            await new Promise(r => setTimeout(r, 1500));
        }

        hideLoadingIndicator();

        if (errors === 0) {
            showSuccessMessage(`🎉 Selesai! SKPD ${skpdNama} berhasil didownload.`);
        } else {
            showErrorMessage(`⚠️ Selesai dengan ${errors} error. Cek log.`);
        }
    }

    /**
     * Download All Jadwals for a Single Sub-Kegiatan (Rincian Belanja)
     * @param {Object} subGiat - Sub-kegiatan object with all required params
     * @param {Array} jadwalList - List of jadwals
     * @param {string} skpdId - SKPD ID
     */
    async function downloadSubGiatAllJadwals(subGiat, jadwalList, skpdId) {
        const subGiatName = subGiat.nama_sub_giat || 'Unknown';
        const subGiatCode = subGiat.kode_sub_giat || '';

        // Composite ID for tracking: skpdId_subGiatCode
        const trackerId = `${skpdId}_${subGiatCode}`;

        let totalFiles = 0;
        let errors = 0;

        showLoadingIndicator();

        // Loop through ALL Jadwals for this sub-kegiatan
        for (const jadwal of jadwalList) {
            const jadwalIdSipd = jadwal.id_jadwal_sipd; // IMPORTANT: Use id_jadwal_sipd, not id_jadwal
            const jadwalName = jadwal.jadwal_sipd_penatausahaan || jadwal.nama_jadwal || jadwal.nama || 'Jadwal';

            // Update status text
            const statusDiv = document.querySelector('.sipd-loading-text');
            if (statusDiv) {
                statusDiv.innerHTML = `
                    Downloading Sub-Kegiatan: <b>${subGiatCode}</b><br>
                    Progress: <b>${totalFiles + 1}/${jadwalList.length}</b><br>
                    <small>Jadwal: ${jadwalName}</small>
                `;
            }

            // Save pending status
            await saveDownloadStatus('rincian_belanja', trackerId, jadwalIdSipd, 'pending', {
                itemName: `${subGiatCode} - ${subGiatName}`,
                jadwalName: jadwalName
            });

            try {
                await extractRincianBelanjaData(subGiat, jadwal, skpdId);
                totalFiles++;

                // Save success status
                await saveDownloadStatus('rincian_belanja', trackerId, jadwalIdSipd, 'success', {
                    itemName: `${subGiatCode} - ${subGiatName}`,
                    jadwalName: jadwalName
                });

                showSuccessMessage(`✅ Berhasil: [${jadwalName}] ${subGiatCode}`);
            } catch (err) {
                console.error(`Failed ${subGiatCode} - ${jadwalName}:`, err);
                errors++;

                // Save error status
                await saveDownloadStatus('rincian_belanja', trackerId, jadwalIdSipd, 'error', {
                    itemName: `${subGiatCode} - ${subGiatName}`,
                    jadwalName: jadwalName,
                    errorMsg: err.message
                });

                // Show Error Toast
                showErrorMessage(`❌ Gagal: [${jadwalName}] ${subGiatCode}`);

                // Save error log
                saveErrorLog({
                    type: 'rincian-belanja',
                    skpdId: skpdId,
                    subGiatCode: subGiatCode,
                    subGiatName: subGiatName,
                    jadwalName: jadwalName,
                    error: err.message,
                    timestamp: Date.now()
                });
            }

            // Rate Limit Delay - Wait 1.5 seconds between each file download
            await new Promise(r => setTimeout(r, 1500));
        }

        hideLoadingIndicator();

        if (errors === 0) {
            showSuccessMessage(`🎉 Selesai! Sub-Kegiatan ${subGiatCode} berhasil didownload.`);
        } else {
            showErrorMessage(`⚠️ Selesai dengan ${errors} error. Cek log.`);
        }
    }

    /**
     * Extract Rincian Belanja data from API
     * IMPORTANT: Uses id_jadwal_sipd instead of id_jadwal
     * @param {Object} subGiat - Sub-kegiatan object with all params
     * @param {Object} jadwal - Jadwal object
     * @param {string} skpdId - SKPD ID
     */
    async function extractRincianBelanjaData(subGiat, jadwal, skpdId) {
        try {
            // Get token
            const token = await getAuthToken();
            if (!token) {
                throw new Error('Token tidak ditemukan');
            }

            // Build API URL with all query parameters
            // IMPORTANT: Use id_jadwal_sipd from jadwal object
            const jadwalIdSipd = jadwal.id_jadwal_sipd;
            const apiUrl = `https://service.sipd.kemendagri.go.id/referensi/strict/laporan/dpa/dpa/rincian-belanja/${skpdId}?` +
                `id_unit=${subGiat.id_unit}&` +
                `id_skpd=${subGiat.id_skpd}&` +
                `id_sub_skpd=${subGiat.id_sub_skpd}&` +
                `id_urusan=${subGiat.id_urusan}&` +
                `id_bidang_urusan=${subGiat.id_bidang_urusan}&` +
                `id_program=${subGiat.id_program}&` +
                `id_giat=${subGiat.id_giat}&` +
                `id_sub_giat=${subGiat.id_sub_giat}&` +
                `id_jadwal_sipd=${jadwalIdSipd}`;

            console.log('Fetching Rincian Belanja data from:', apiUrl);

            const response = await fetchXHR(apiUrl, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('Token expired');
                }
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            // Build filename path to match existing folder structure:
            // SIPD-Output/{JadwalName}/{NamaSKPD}/{NamaSubSKPD}/{nama_subgiat}.json
            const jadwalName = jadwal.jadwal_sipd_penatausahaan || jadwal.nama_jadwal || jadwal.nama || 'Jadwal';
            const skpdNama = subGiat.nama_skpd || `SKPD_${skpdId}`;
            const subSkpdNama = subGiat.nama_sub_skpd || 'Sub-SKPD';

            // Sanitize and create safe names
            const safeJadwalName = String(jadwalName).replace(/[/\\?%*:|"<>]/g, '-').trim();
            const safeSkpdNama = String(skpdNama).replace(/[/\\?%*:|"<>]/g, '-').trim();
            const safeSubSkpdNama = String(subSkpdNama).replace(/[/\\?%*:|"<>]/g, '-').trim();

            // Use kode_sub_giat as filename (better for sorting and cleaner)
            const subGiatFileName = subGiat.kode_sub_giat || 'sub-kegiatan';

            // Sanitize filename (kode shouldn't have invalid chars, but to be safe)
            const safeSubGiatFileName = String(subGiatFileName).replace(/[/\\?%*:|"<>]/g, '-').trim();

            const filename = `SIPD-Output/${safeJadwalName}/${safeSkpdNama}/${safeSubSkpdNama}/${safeSubGiatFileName}.json`;

            // Download via background script
            await downloadJSON(data, filename);

        } catch (error) {
            console.error('Error extracting Rincian Belanja data:', error);
            throw error;
        }
    }

    /**
     * Save failed download log
     * @param {Object} log - Error log object
     */
    async function saveErrorLog(log) {
        return new Promise((resolve) => {
            chrome.storage.local.get(['sipd_error_logs'], (result) => {
                const logs = result.sipd_error_logs || [];
                // Prevent duplicate logs (same skpd, subgiat, jadwal within last 1 hour)
                const isDuplicate = logs.some(l =>
                    l.skpdId === log.skpdId &&
                    l.subGiatCode === log.subGiatCode &&
                    l.jadwalName === log.jadwalName &&
                    (Date.now() - l.timestamp < 3600000)
                );

                if (!isDuplicate) {
                    logs.push(log);
                    chrome.storage.local.set({ sipd_error_logs: logs }, resolve);
                } else {
                    resolve();
                }
            });
        });
    }

    /**
     * Get error logs for specific SKPD
     * @param {string} skpdId - SKPD ID
     */
    async function getErrorLogs(skpdId) {
        return new Promise((resolve) => {
            chrome.storage.local.get(['sipd_error_logs'], (result) => {
                const logs = result.sipd_error_logs || [];
                if (skpdId) {
                    resolve(logs.filter(l => l.skpdId === skpdId));
                } else {
                    resolve(logs);
                }
            });
        });
    }

    /**
     * Clear error logs for specific SKPD
     * @param {string} skpdId 
     */
    async function clearErrorLogs(skpdId) {
        return new Promise((resolve) => {
            chrome.storage.local.get(['sipd_error_logs'], (result) => {
                let logs = result.sipd_error_logs || [];
                if (skpdId) {
                    logs = logs.filter(l => l.skpdId !== skpdId);
                } else {
                    logs = [];
                }
                chrome.storage.local.set({ sipd_error_logs: logs }, resolve);
            });
        });
    }

    /**
     * Save download status for a specific jadwal
     * @param {string} menuType - 'persetujuan', 'skpd', 'rincian-belanja', etc.
     * @param {string} itemId - SKPD ID or composite key (e.g. "277_1.01.02.xxx")
     * @param {string} jadwalId - Jadwal ID
     * @param {string} status - 'pending', 'success', 'error'
     * @param {Object} metadata - Additional metadata (itemName, errorMsg, etc.)
     */
    async function saveDownloadStatus(menuType, itemId, jadwalId, status, metadata = {}) {
        const storageKey = `sipd_tracker_${menuType}`;

        return new Promise((resolve) => {
            chrome.storage.local.get([storageKey], (result) => {
                const tracker = result[storageKey] || {};

                // Initialize item if doesn't exist
                if (!tracker[itemId]) {
                    tracker[itemId] = {
                        name: metadata.itemName || itemId,
                        jadwals: {},
                        stats: { total: 0, success: 0, error: 0, pending: 0 }
                    };
                }

                // Update or create jadwal status
                tracker[itemId].jadwals[jadwalId] = {
                    status: status,
                    timestamp: Date.now(),
                    error: metadata.errorMsg || null,
                    jadwalName: metadata.jadwalName || `Jadwal ${jadwalId}`
                };

                // Recalculate stats
                tracker[itemId].stats = calculateStats(tracker[itemId].jadwals);

                chrome.storage.local.set({ [storageKey]: tracker }, resolve);
            });
        });
    }

    /**
     * Get download tracker data for specific item
     * @param {string} menuType - Menu type
     * @param {string} itemId - Item ID
     * @returns {Promise<Object|null>} Tracker data or null
     */
    async function getDownloadTracker(menuType, itemId) {
        const storageKey = `sipd_tracker_${menuType}`;

        return new Promise((resolve) => {
            chrome.storage.local.get([storageKey], (result) => {
                const tracker = result[storageKey] || {};
                resolve(tracker[itemId] || null);
            });
        });
    }

    /**
     * Calculate stats from jadwal statuses
     * @param {Object} jadwals - Jadwal status map
     * @returns {Object} Stats object
     */
    function calculateStats(jadwals) {
        const stats = { total: 0, success: 0, error: 0, pending: 0 };

        Object.values(jadwals).forEach(j => {
            stats.total++;
            stats[j.status]++;
        });

        return stats;
    }

    /**
     * Clear download tracker for specific item
     * @param {string} menuType - Menu type
     * @param {string} itemId - Item ID
     */
    async function clearDownloadTracker(menuType, itemId) {
        const storageKey = `sipd_tracker_${menuType}`;

        return new Promise((resolve) => {
            chrome.storage.local.get([storageKey], (result) => {
                const tracker = result[storageKey] || {};
                delete tracker[itemId];
                chrome.storage.local.set({ [storageKey]: tracker }, resolve);
            });
        });
    }


    /**
     * Fetch using XMLHttpRequest to mimic XHR behavior
     * @param {string} url - URL to fetch
     * @param {Object} options - Fetch options (method, headers, etc)
     */
    function fetchXHR(url, options = {}) {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            const method = options.method || 'GET';

            xhr.open(method, url);

            // Set headers
            if (options.headers) {
                Object.keys(options.headers).forEach(key => {
                    xhr.setRequestHeader(key, options.headers[key]);
                });
            }

            // Handle credential inclusion if needed
            if (options.credentials === 'include') {
                xhr.withCredentials = true;
            }

            xhr.onload = () => {
                // Mimic fetch response object
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

})();
