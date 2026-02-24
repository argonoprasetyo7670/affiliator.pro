/**
 * Background Service Worker - Affiliator Pro
 * Handles:
 * 1. Internal messages from content bridge for reCAPTCHA token generation
 * 2. External messages from frontend
 * 3. Token capture storage
 * 4. Image generation via Google AI Sandbox API
 */

const CONFIG = {
    RECAPTCHA_SITEKEY: '6LdsFiUsAAAAAIjVDZcuLhaHiDn5nnHVXVRQGeMV',
    RECAPTCHA_ACTION: 'FLOW_GENERATION',
    LABS_URL: 'https://labs.google/fx/tools/flow',
    AI_SANDBOX_BASE: 'https://aisandbox-pa.googleapis.com/v1/projects'
};

console.log('[AffiliatorPro-BG] Background service worker loaded - BUILD v3');

// Listen for external messages from web pages
chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
    console.log('[AffiliatorPro-BG] External message:', message.type);
    handleMessage(message, sendResponse);
    return true; // Keep channel open for async response
});

// Listen for internal messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('[AffiliatorPro-BG] Internal message:', message.type);
    handleMessage(message, sendResponse);
    return true; // Keep channel open for async response
});

// Unified message handler
function handleMessage(message, sendResponse) {
    switch (message.type) {
        case 'GENERATE_TOKEN':
            generateToken(
                message.sitekey || CONFIG.RECAPTCHA_SITEKEY,
                message.action || CONFIG.RECAPTCHA_ACTION
            )
                .then(result => sendResponse(result))
                .catch(error => sendResponse({ success: false, error: error.message }));
            break;

        case 'GET_CAPTURED_TOKEN':
            chrome.storage.local.get(['capturedToken', 'capturedAt'], (result) => {
                sendResponse({
                    success: !!result.capturedToken,
                    token: result.capturedToken || null,
                    capturedAt: result.capturedAt || null
                });
            });
            break;

        case 'SAVE_CAPTURED_TOKEN':
            chrome.storage.local.set({
                capturedToken: message.token,
                capturedAt: new Date().toISOString()
            }, () => {
                sendResponse({ success: true });
            });
            break;

        case 'GENERATE_IMAGE':
            generateImage(message.payload, message.authToken)
                .then(result => sendResponse(result))
                .catch(error => sendResponse({ success: false, error: error.message }));
            break;

        case 'PING':
            sendResponse({
                success: true,
                message: 'Affiliator Pro Extension active',
                version: '2.1.0'
            });
            break;

        default:
            sendResponse({ success: false, error: 'Unknown message type: ' + message.type });
    }
}

// Generate reCAPTCHA token by executing script in labs.google tab
async function generateToken(sitekey, action) {
    console.log('[AffiliatorPro-BG] Generating reCAPTCHA token...');

    try {
        // Find existing labs.google tab
        let tabs = await chrome.tabs.query({ url: 'https://labs.google/*' });
        let createdNewTab = false;
        let tabId;

        if (tabs.length === 0) {
            console.log('[AffiliatorPro-BG] No labs.google tab found, creating one...');
            const newTab = await chrome.tabs.create({
                url: CONFIG.LABS_URL,
                active: false
            });
            tabId = newTab.id;
            createdNewTab = true;

            // Wait for tab to fully load
            await new Promise((resolve) => {
                const listener = (id, info) => {
                    if (id === tabId && info.status === 'complete') {
                        chrome.tabs.onUpdated.removeListener(listener);
                        resolve();
                    }
                };
                chrome.tabs.onUpdated.addListener(listener);
                setTimeout(resolve, 30000); // Max 30s timeout
            });

            // Extra wait for scripts to initialize
            await new Promise(r => setTimeout(r, 3000));
        } else {
            tabId = tabs[0].id;
        }

        // Execute reCAPTCHA in the tab's page context
        const results = await chrome.scripting.executeScript({
            target: { tabId },
            world: 'MAIN',
            func: executeRecaptcha,
            args: [sitekey, action]
        });

        // Clean up if we created a new tab
        if (createdNewTab) {
            try { await chrome.tabs.remove(tabId); } catch (e) { }
        }

        if (results && results[0] && results[0].result) {
            return results[0].result;
        }

        return { success: false, error: 'No result from reCAPTCHA execution' };

    } catch (error) {
        console.error('[AffiliatorPro-BG] Token generation error:', error);
        return { success: false, error: error.message };
    }
}

// Function injected into page context to execute reCAPTCHA
function executeRecaptcha(sitekey, action) {
    return new Promise((resolve) => {
        const timeout = setTimeout(() => {
            resolve({ success: false, error: 'reCAPTCHA timeout (30s)' });
        }, 30000);

        const execute = () => {
            // First try to get cached token from our hook in token-capture.js
            const cachedToken = localStorage.getItem('affiliator_pro_recaptcha_token');
            const cachedAt = localStorage.getItem('affiliator_pro_recaptcha_at');
            
            if (cachedToken && cachedAt) {
                const age = Date.now() - new Date(cachedAt).getTime();
                // Use cached token if less than 90 seconds old
                if (age < 90000) {
                    console.log('[AffiliatorPro] Using cached reCAPTCHA token (age: ' + Math.round(age/1000) + 's)');
                    clearTimeout(timeout);
                    resolve({ success: true, token: cachedToken });
                    return;
                }
            }

            // Otherwise generate fresh token
            if (typeof grecaptcha !== 'undefined' && grecaptcha.enterprise) {
                grecaptcha.enterprise.ready(() => {
                    grecaptcha.enterprise.execute(sitekey, { action })
                        .then(token => {
                            clearTimeout(timeout);
                            resolve({ success: true, token });
                        })
                        .catch(err => {
                            clearTimeout(timeout);
                            resolve({ success: false, error: err.message });
                        });
                });
            } else {
                clearTimeout(timeout);
                resolve({ success: false, error: 'grecaptcha not available. Open labs.google/fx/tools/flow first.' });
            }
        };

        setTimeout(execute, 300);
    });
}

// Generate image via Google AI Sandbox API (CORS bypass)
async function generateImage(payload, authToken) {
    console.log('[AffiliatorPro-BG] Generating image via AI Sandbox...');

    try {
        // Extract projectId from payload clientContext
        const projectId = payload.clientContext?.projectId;
        if (!projectId) {
            return { success: false, error: 'No projectId found in payload' };
        }

        const apiUrl = `${CONFIG.AI_SANDBOX_BASE}/${projectId}/flowMedia:batchGenerateImages`;
        console.log('[AffiliatorPro-BG] API URL:', apiUrl);
        console.log('[AffiliatorPro-BG] Full payload:', JSON.stringify(payload, null, 2));

        const bodyStr = JSON.stringify(payload);
        console.log('[AffiliatorPro-BG] Request body length:', bodyStr.length);

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain;charset=UTF-8',
                'Authorization': `Bearer ${authToken}`,
                'Origin': 'https://labs.google',
                'Referer': 'https://labs.google/',
                'x-browser-channel': 'stable',
                'x-browser-copyright': 'Copyright 2026 Google LLC. All Rights reserved.',
                'x-browser-year': '2026'
            },
            body: bodyStr
        });

        if (!response.ok) {
            const errorText = await response.text();
            return { success: false, error: `API error ${response.status}: ${errorText}` };
        }

        const data = await response.json();

        // Parse response to extract images from batchGenerateImages format
        const images = [];
        if (data.responses) {
            for (const res of data.responses) {
                if (res.image?.imageBytes) {
                    images.push({
                        imageBytes: res.image.imageBytes,
                        imageUrl: `data:image/png;base64,${res.image.imageBytes}`,
                        seed: res.seed || 0
                    });
                }
            }
        }

        return { success: true, images };

    } catch (error) {
        console.error('[AffiliatorPro-BG] Image generation error:', error);
        return { success: false, error: error.message };
    }
}
