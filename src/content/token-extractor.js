// Token Extractor - Extract Bearer token from SIPD session

(function () {
    'use strict';

    /**
     * Get cookie value by name
     */
    function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) {
            return parts.pop().split(';').shift();
        }
        return null;
    }

    /**
     * Extract token from cookies, localStorage, or sessionStorage
     */
    function extractToken() {
        let token = null;

        // PRIORITY 1: Check cookies first (SIPD stores token in X-SIPD-PU-TK!)
        const cookieToken = getCookie('X-SIPD-PU-TK');
        if (cookieToken && cookieToken.length > 50) {
            token = cookieToken;
            console.log('[Token Extractor] ✅ Found token in cookie: X-SIPD-PU-TK');
            return token;
        }

        // PRIORITY 2: Try localStorage
        const possibleKeys = [
            'token',
            'auth_token',
            'authToken',
            'access_token',
            'accessToken',
            'bearer_token',
            'jwt_token',
            'sipd_token',
            'Authorization',
            'X-SIPD-PU-TK'
        ];

        // Check localStorage
        for (const key of possibleKeys) {
            const value = localStorage.getItem(key);
            if (value && value.length > 50) {
                token = value;
                console.log('[Token Extractor] Found token in localStorage:', key);
                return token;
            }
        }

        // PRIORITY 3: Check sessionStorage
        for (const key of possibleKeys) {
            const value = sessionStorage.getItem(key);
            if (value && value.length > 50) {
                token = value;
                console.log('[Token Extractor] Found token in sessionStorage:', key);
                return token;
            }
        }

        // If still not found
        console.log('[Token Extractor] ⚠️ Token not found in cookies or storage');
        return null;
    }

    /**
     * Save token to chrome storage
     */
    async function saveTokenToStorage(token) {
        return new Promise((resolve) => {
            chrome.storage.local.set({ sipd_auth_token: token }, () => {
                console.log('[Token Extractor] Token saved to chrome storage');
                resolve();
            });
        });
    }

    /**
     * Check and extract token periodically
     */
    async function checkAndSaveToken() {
        const token = extractToken();
        if (token) {
            await saveTokenToStorage(token);

            // Send message to background script
            chrome.runtime.sendMessage({
                action: 'tokenExtracted',
                token: token
            });
        }
    }

    // Run immediately
    checkAndSaveToken();

    // Also run after page fully loads
    window.addEventListener('load', () => {
        setTimeout(checkAndSaveToken, 1000);
    });

    // Intercept fetch requests to get Authorization header
    const originalFetch = window.fetch;
    window.fetch = function (...args) {
        const [url, options = {}] = args;

        // Check if this is a SIPD API request
        if (url.includes('service.sipd.kemendagri.go.id')) {
            const headers = options.headers || {};

            // Extract Authorization header if present
            if (headers.Authorization || headers.authorization) {
                const authHeader = headers.Authorization || headers.authorization;
                if (authHeader.startsWith('Bearer ')) {
                    const token = authHeader.replace('Bearer ', '');
                    saveTokenToStorage(token);
                    console.log('[Token Extractor] Intercepted token from fetch request');
                }
            }
        }

        return originalFetch.apply(this, args);
    };

    // Intercept XMLHttpRequest as well
    const originalOpen = XMLHttpRequest.prototype.open;
    const originalSetRequestHeader = XMLHttpRequest.prototype.setRequestHeader;

    XMLHttpRequest.prototype.setRequestHeader = function (header, value) {
        if (header === 'Authorization' && value.startsWith('Bearer ')) {
            const token = value.replace('Bearer ', '');
            saveTokenToStorage(token);
            console.log('[Token Extractor] Intercepted token from XHR request');
        }
        return originalSetRequestHeader.apply(this, arguments);
    };

    console.log('[Token Extractor] Token extractor initialized');
})();
