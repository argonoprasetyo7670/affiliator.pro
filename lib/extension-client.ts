/**
 * Extension Client Utility - Affiliator Pro
 * Handles communication with the Affiliator Pro Chrome Extension
 * Prefix: AFFILIATOR_PRO_
 */

interface ExtensionResponse {
    success: boolean;
    token?: string;
    error?: string;
    extensionName?: string;
    version?: string;
}

/**
 * Detect if the Affiliator Pro extension is installed and active
 */
export async function checkExtensionPresence(): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    // Check the marker attribute injected by content-bridge.js
    if (document.documentElement.getAttribute('data-affiliator-pro-extension') === 'true') {
        return true;
    }

    // Fallback: Ping the extension
    return new Promise((resolve) => {
        const requestId = Math.random().toString(36).substring(7);

        const listener = (event: any) => {
            if (event.detail?.requestId === requestId) {
                window.removeEventListener('AFFILIATOR_PRO_PONG', listener);
                resolve(true);
            }
        };

        window.addEventListener('AFFILIATOR_PRO_PONG', listener);

        window.dispatchEvent(new CustomEvent('AFFILIATOR_PRO_PING', {
            detail: { requestId }
        }));

        // Timeout after 2 seconds
        setTimeout(() => {
            window.removeEventListener('AFFILIATOR_PRO_PONG', listener);
            resolve(false);
        }, 2000);
    });
}

/**
 * Request a reCAPTCHA token from the extension
 */
export async function requestExtensionToken(sitekey?: string, action?: string): Promise<ExtensionResponse> {
    if (typeof window === 'undefined') {
        return { success: false, error: 'Window undefined' };
    }

    const requestId = Math.random().toString(36).substring(7);

    return new Promise((resolve) => {
        const listener = (event: any) => {
            const { requestId: responseId, success, token, error } = event.detail || {};

            if (responseId === requestId) {
                window.removeEventListener('AFFILIATOR_PRO_TOKEN_RESPONSE', listener);
                resolve({ success, token, error });
            }
        };

        window.addEventListener('AFFILIATOR_PRO_TOKEN_RESPONSE', listener);

        window.dispatchEvent(new CustomEvent('AFFILIATOR_PRO_REQUEST_TOKEN', {
            detail: { requestId, sitekey, action }
        }));

        // Timeout after 45 seconds
        setTimeout(() => {
            window.removeEventListener('AFFILIATOR_PRO_TOKEN_RESPONSE', listener);
            resolve({ success: false, error: 'Request timeout' });
        }, 45000);
    });
}

/**
 * Get the Bearer token captured from Google Labs
 */
export async function getCapturedToken(): Promise<ExtensionResponse> {
    if (typeof window === 'undefined') {
        return { success: false, error: 'Window undefined' };
    }

    const requestId = Math.random().toString(36).substring(7);

    return new Promise((resolve) => {
        const listener = (event: any) => {
            const { requestId: responseId, success, token, error } = event.detail || {};

            if (responseId === requestId) {
                window.removeEventListener('AFFILIATOR_PRO_CAPTURED_TOKEN_RESPONSE', listener);
                resolve({ success, token, error });
            }
        };

        window.addEventListener('AFFILIATOR_PRO_CAPTURED_TOKEN_RESPONSE', listener);

        window.dispatchEvent(new CustomEvent('AFFILIATOR_PRO_GET_TOKEN', {
            detail: { requestId }
        }));

        // Timeout after 5 seconds
        setTimeout(() => {
            window.removeEventListener('AFFILIATOR_PRO_CAPTURED_TOKEN_RESPONSE', listener);
            resolve({ success: false, error: 'Request timeout' });
        }, 5000);
    });
}
