// API Configuration and Utilities

const API_BASE_URL = 'https://service.sipd.kemendagri.go.id/referensi/strict';

const API_ENDPOINTS = {
    JADWAL_PERGESERAN: `${API_BASE_URL}/laporan/dpa/dpa/jadwal-pergeseran`,
    HALAMAN_PERSETUJUAN: `${API_BASE_URL}/laporan/dpa/dpa/halaman-persetujuan`,
    TIM_TAPD: `${API_BASE_URL}/tim-tapd/list`
};

/**
 * Get DPA approval data endpoint
 * @param {string|number} skpdId - SKPD ID
 * @param {string|number} jadwalId - Jadwal ID
 * @returns {string} Full API endpoint URL
 */
function getDPAApprovalEndpoint(skpdId, jadwalId) {
    return `${API_ENDPOINTS.HALAMAN_PERSETUJUAN}/${skpdId}/${jadwalId}`;
}

/**
 * Get stored auth token
 * @returns {Promise<string|null>}
 */
async function getAuthToken() {
    return new Promise((resolve) => {
        chrome.storage.local.get(['sipd_auth_token'], (result) => {
            resolve(result.sipd_auth_token || null);
        });
    });
}

/**
 * Make authenticated API request with complete headers
 * @param {string} url - API endpoint
 * @param {Object} options - Fetch options
 * @returns {Promise<Object>} JSON response
 */
async function makeAuthenticatedRequest(url, options = {}) {
    try {
        // Get token from storage
        const token = await getAuthToken();

        if (!token) {
            throw new Error('Token tidak ditemukan. Silakan buka halaman SIPD terlebih dahulu untuk login.');
        }

        // Build headers - Only Authorization (avoid CORS preflight issues)
        const headers = {
            'Authorization': `Bearer ${token}`,
            ...options.headers
        };

        const response = await fetch(url, {
            ...options,
            credentials: 'include',
            headers: headers
        });

        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Token expired atau tidak valid. Silakan refresh halaman SIPD dan coba lagi.');
            }
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('API Request failed:', error);
        throw error;
    }
}

/**
 * Fetch jadwal data
 * @returns {Promise<Array>} Jadwal list
 */
async function fetchJadwal() {
    return await makeAuthenticatedRequest(API_ENDPOINTS.JADWAL_PERGESERAN);
}

/**
 * Fetch DPA approval data
 * @param {string|number} skpdId - SKPD ID
 * @param {string|number} jadwalId - Jadwal ID
 * @returns {Promise<Object>} DPA approval data
 */
async function fetchDPAApproval(skpdId, jadwalId) {
    const url = getDPAApprovalEndpoint(skpdId, jadwalId);
    return await makeAuthenticatedRequest(url);
}

/**
 * Fetch tim-tapd data
 * @returns {Promise<Array>} Tim TAPD list
 */
async function fetchTimTapd() {
    return await makeAuthenticatedRequest(API_ENDPOINTS.TIM_TAPD);
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        API_ENDPOINTS,
        getDPAApprovalEndpoint,
        makeAuthenticatedRequest,
        fetchJadwal,
        fetchDPAApproval,
        fetchTimTapd
    };
}
