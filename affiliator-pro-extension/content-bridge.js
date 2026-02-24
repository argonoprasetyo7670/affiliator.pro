/**
 * Content Bridge Script - Affiliator Pro
 * Injected into Affiliator Pro pages to enable communication with extension
 * Prefix: AFFILIATOR_PRO_
 */

(function () {
    console.log('[AffiliatorPro] Content bridge loaded');

    // Check if chrome.runtime is available
    function isExtensionValid() {
        try {
            return !!(chrome && chrome.runtime && chrome.runtime.sendMessage);
        } catch (e) {
            return false;
        }
    }

    // Set marker attribute immediately
    if (isExtensionValid()) {
        document.documentElement.setAttribute('data-affiliator-pro-extension', 'true');
        console.log('[AffiliatorPro] Extension marker set');
    }

    // Also set on DOMContentLoaded to be safe
    document.addEventListener('DOMContentLoaded', () => {
        if (isExtensionValid()) {
            document.documentElement.setAttribute('data-affiliator-pro-extension', 'true');
        }
    });

    // Listen for PING (extension detection)
    window.addEventListener('AFFILIATOR_PRO_PING', (event) => {
        const { requestId } = event.detail || {};

        if (!isExtensionValid()) {
            console.warn('[AffiliatorPro] Extension not valid, skipping PONG');
            return;
        }

        console.log('[AffiliatorPro] PING received, sending PONG');

        window.dispatchEvent(new CustomEvent('AFFILIATOR_PRO_PONG', {
            detail: {
                requestId: requestId,
                extensionName: 'Affiliator Pro Client',
                version: '2.1.0'
            }
        }));
    });

    // Listen for token generation requests from web page
    window.addEventListener('AFFILIATOR_PRO_REQUEST_TOKEN', async (event) => {
        console.log('[AffiliatorPro] Token request received');

        const { requestId, sitekey, action } = event.detail || {};

        if (!isExtensionValid()) {
            console.error('[AffiliatorPro] Extension disconnected');
            window.dispatchEvent(new CustomEvent('AFFILIATOR_PRO_TOKEN_RESPONSE', {
                detail: {
                    requestId: requestId,
                    success: false,
                    error: 'Extension disconnected. Please reload the page.'
                }
            }));
            return;
        }

        try {
            const response = await chrome.runtime.sendMessage({
                type: 'GENERATE_TOKEN',
                sitekey: sitekey,
                action: action
            });

            console.log('[AffiliatorPro] Token response:', response?.success);

            window.dispatchEvent(new CustomEvent('AFFILIATOR_PRO_TOKEN_RESPONSE', {
                detail: {
                    requestId: requestId,
                    success: response?.success || false,
                    token: response?.token || null,
                    error: response?.error || null
                }
            }));
        } catch (error) {
            console.error('[AffiliatorPro] Token error:', error.message);

            window.dispatchEvent(new CustomEvent('AFFILIATOR_PRO_TOKEN_RESPONSE', {
                detail: {
                    requestId: requestId,
                    success: false,
                    error: 'Extension disconnected. Please reload the page.'
                }
            }));
        }
    });

    // Listen for captured token requests
    window.addEventListener('AFFILIATOR_PRO_GET_TOKEN', async (event) => {
        const { requestId } = event.detail || {};

        if (!isExtensionValid()) {
            window.dispatchEvent(new CustomEvent('AFFILIATOR_PRO_CAPTURED_TOKEN_RESPONSE', {
                detail: { requestId, success: false, error: 'Extension disconnected' }
            }));
            return;
        }

        try {
            const response = await chrome.runtime.sendMessage({ type: 'GET_CAPTURED_TOKEN' });
            window.dispatchEvent(new CustomEvent('AFFILIATOR_PRO_CAPTURED_TOKEN_RESPONSE', {
                detail: {
                    requestId,
                    success: response?.success || false,
                    token: response?.token || null
                }
            }));
        } catch (error) {
            window.dispatchEvent(new CustomEvent('AFFILIATOR_PRO_CAPTURED_TOKEN_RESPONSE', {
                detail: { requestId, success: false, error: error.message }
            }));
        }
    });

    // Listen for image generation requests (CORS bypass)
    window.addEventListener('AFFILIATOR_PRO_GENERATE_IMAGE', async (event) => {
        const { requestId, payload, authToken } = event.detail || {};

        if (!isExtensionValid()) {
            window.dispatchEvent(new CustomEvent('AFFILIATOR_PRO_IMAGE_RESPONSE', {
                detail: { requestId, success: false, error: 'Extension disconnected' }
            }));
            return;
        }

        try {
            const response = await chrome.runtime.sendMessage({
                type: 'GENERATE_IMAGE',
                payload,
                authToken
            });

            window.dispatchEvent(new CustomEvent('AFFILIATOR_PRO_IMAGE_RESPONSE', {
                detail: {
                    requestId,
                    success: response?.success || false,
                    images: response?.images || [],
                    error: response?.error || null
                }
            }));
        } catch (error) {
            window.dispatchEvent(new CustomEvent('AFFILIATOR_PRO_IMAGE_RESPONSE', {
                detail: { requestId, success: false, error: error.message }
            }));
        }
    });

    console.log('[AffiliatorPro] All event listeners registered');
})();
