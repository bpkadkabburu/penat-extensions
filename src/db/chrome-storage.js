// Chrome Storage wrapper for jadwal data
// Using chrome.storage.local instead of IndexedDB for cross-context access

/**
 * Save jadwal data to chrome storage
 * @param {Array} jadwalData - Array of jadwal objects
 * @returns {Promise<void>}
 */
async function saveJadwal(jadwalData) {
    return new Promise((resolve, reject) => {
        chrome.storage.local.set({ sipd_jadwal: jadwalData }, () => {
            if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
            } else {
                console.log('Jadwal data saved to chrome.storage.local');
                resolve();
            }
        });
    });
}

/**
 * Get all jadwal data from chrome storage
 * @returns {Promise<Array>}
 */
async function getJadwal() {
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
 * Get jadwal by ID
 * @param {string|number} jadwalId - Jadwal ID
 * @returns {Promise<Object|null>}
 */
async function getJadwalById(jadwalId) {
    const jadwalList = await getJadwal();
    return jadwalList.find(j => j.id_jadwal == jadwalId || j.id == jadwalId) || null;
}

/**
 * Clear all jadwal data
 * @returns {Promise<void>}
 */
async function clearJadwal() {
    return new Promise((resolve, reject) => {
        chrome.storage.local.remove(['sipd_jadwal'], () => {
            if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
            } else {
                console.log('Jadwal data cleared');
                resolve();
            }
        });
    });
}

// Export for use in other scripts
if (typeof window !== 'undefined') {
    window.saveJadwal = saveJadwal;
    window.getJadwal = getJadwal;
    window.getJadwalById = getJadwalById;
    window.clearJadwal = clearJadwal;
}
