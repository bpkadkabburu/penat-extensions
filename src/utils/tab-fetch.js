// Wrapper untuk execute fetch di SIPD page context (preserves Origin/Referer)

/**
 * Fetch data from SIPD API by executing in active SIPD tab
 * @param {string} url - API endpoint
 * @param {string} token - Bearer token
 * @returns {Promise<Object>} Response data
 */
async function fetchFromSIPDTab(url, token) {
    // Get active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab) {
        throw new Error('Tidak ada tab aktif');
    }

    if (!tab.url || !tab.url.includes('sipd.kemendagri.go.id')) {
        throw new Error('Popup harus dibuka dari halaman SIPD! Buka tab SIPD terlebih dahulu.');
    }

    // Execute fetch in SIPD tab context
    const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: async (apiUrl, authToken) => {
            try {
                const response = await fetch(apiUrl, {
                    method: 'GET',
                    credentials: 'include',
                    headers: {
                        'Authorization': `Bearer ${authToken}`
                    }
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
                }

                return await response.json();
            } catch (error) {
                throw new Error(error.message);
            }
        },
        args: [url, token]
    });

    if (!results || !results[0]) {
        throw new Error('Failed to execute script in tab');
    }

    if (results[0].error) {
        throw new Error(results[0].error);
    }

    return results[0].result;
}

// Export for use in popup
if (typeof window !== 'undefined') {
    window.fetchFromSIPDTab = fetchFromSIPDTab;
}
