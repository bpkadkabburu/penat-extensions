// Popup script for SIPD Data Extractor

document.addEventListener('DOMContentLoaded', async () => {
    const fetchJadwalBtn = document.getElementById('fetchJadwalBtn');
    const clearDataBtn = document.getElementById('clearDataBtn');
    const statusMessage = document.getElementById('statusMessage');
    const jadwalContainer = document.getElementById('jadwalContainer');

    // Load and display existing jadwal on popup open
    await loadJadwalList();

    // Fetch Jadwal button click handler
    fetchJadwalBtn.addEventListener('click', async () => {
        try {
            setLoading(fetchJadwalBtn, true);
            showStatus('Mengambil data jadwal...', 'loading');

            // Get token
            const result = await new Promise((resolve) => {
                chrome.storage.local.get(['sipd_auth_token'], resolve);
            });

            const token = result.sipd_auth_token;

            if (!token) {
                showStatus('Token tidak ditemukan. Buka halaman SIPD terlebih dahulu.', 'error');
                return;
            }

            // Fetch jadwal from API using tab context (preserves Origin/Referer)
            const apiUrl = 'https://service.sipd.kemendagri.go.id/referensi/strict/laporan/dpa/dpa/jadwal-pergeseran';
            const response = await fetchFromSIPDTab(apiUrl, token);

            // Check if response has data
            let jadwalData = [];
            if (Array.isArray(response)) {
                jadwalData = response;
            } else if (response.data && Array.isArray(response.data)) {
                jadwalData = response.data;
            } else if (response.results && Array.isArray(response.results)) {
                jadwalData = response.results;
            } else {
                throw new Error('Format data tidak valid');
            }

            if (jadwalData.length === 0) {
                showStatus('Tidak ada data jadwal yang ditemukan', 'error');
                return;
            }

            // Save to IndexedDB
            await saveJadwal(jadwalData);

            // Download jadwal JSON to SIPD-Output folder
            showStatus('Downloading jadwal.json...', 'loading');
            await downloadJSON(jadwalData, 'SIPD-Output/jadwal.json');

            // Fetch and download tim-tapd JSON
            showStatus('Fetching tim-tapd data...', 'loading');
            const timTapdUrl = 'https://service.sipd.kemendagri.go.id/referensi/strict/tim-tapd/list';
            const timTapdData = await fetchFromSIPDTab(timTapdUrl, token);

            showStatus('Downloading tim-tapd.json...', 'loading');
            await downloadJSON(timTapdData, 'SIPD-Output/tim-tapd.json');

            showStatus(`Berhasil: ${jadwalData.length} jadwal + JSON files downloaded`, 'success');
            await loadJadwalList();

        } catch (error) {
            console.error('Error fetching jadwal:', error);
            showStatus(`Error: ${error.message}`, 'error');
        } finally {
            setLoading(fetchJadwalBtn, false);
        }
    });

    // Clear Data button click handler
    clearDataBtn.addEventListener('click', async () => {
        if (!confirm('Apakah Anda yakin ingin menghapus semua data jadwal?')) {
            return;
        }

        try {
            setLoading(clearDataBtn, true);
            showStatus('Menghapus data...', 'loading');

            await clearJadwal();

            showStatus('Data berhasil dihapus', 'success');
            await loadJadwalList();

        } catch (error) {
            console.error('Error clearing data:', error);
            showStatus(`Error: ${error.message}`, 'error');
        } finally {
            setLoading(clearDataBtn, false);
        }
    });

    /**
     * Download data as JSON file via Background Script
     * @param {Object} data - Data to download
     * @param {string} filename - Relative path/filename
     */
    async function downloadJSON(data, filename) {
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

    /**
     * Load and display jadwal list
     */
    async function loadJadwalList() {
        try {
            const jadwalList = await getJadwal();

            if (jadwalList.length === 0) {
                jadwalContainer.innerHTML = '<p class="empty-state">Belum ada jadwal. Klik "Fetch Jadwal" untuk memulai.</p>';
                return;
            }

            // Display jadwal items
            jadwalContainer.innerHTML = jadwalList.map(jadwal => `
        <div class="jadwal-item">
          <div class="jadwal-name">${jadwal.nama_jadwal || jadwal.nama || 'Jadwal'}</div>
          <div class="jadwal-id">ID: ${jadwal.id_jadwal || jadwal.id}</div>
        </div>
      `).join('');

        } catch (error) {
            console.error('Error loading jadwal:', error);
            jadwalContainer.innerHTML = '<p class="empty-state">Error loading data</p>';
        }
    }

    /**
     * Show status message
     * @param {string} message - Message to display
     * @param {string} type - Message type (success, error, loading)
     */
    function showStatus(message, type) {
        statusMessage.textContent = message;
        statusMessage.className = `status-message show ${type}`;

        if (type === 'success' || type === 'error') {
            setTimeout(() => {
                statusMessage.classList.remove('show');
            }, 5000);
        }
    }

    /**
     * Set button loading state
     * @param {HTMLElement} button - Button element
     * @param {boolean} loading - Loading state
     */
    function setLoading(button, loading) {
        button.disabled = loading;
        if (loading) {
            button.classList.add('loading');
        } else {
            button.classList.remove('loading');
        }
    }
});
