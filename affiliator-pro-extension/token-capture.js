/**
 * Token Capture - Affiliator Pro
 * Intercepts fetch requests to capture Bearer tokens AND reCAPTCHA tokens from Google AI Sandbox
 * Also hooks grecaptcha.enterprise.execute to capture fresh reCAPTCHA tokens
 * Runs on labs.google pages in MAIN world
 */

(function () {
    // ===== 1. Hook grecaptcha.enterprise.execute to capture reCAPTCHA tokens =====
    let latestRecaptchaToken = null;

    function hookRecaptcha() {
        if (typeof grecaptcha !== 'undefined' && grecaptcha.enterprise && !grecaptcha.enterprise._hooked) {
            const originalExecute = grecaptcha.enterprise.execute;
            grecaptcha.enterprise.execute = function (...args) {
                // Log the sitekey and action being used
                console.log('[AffiliatorPro] grecaptcha.enterprise.execute called with args:', JSON.stringify(args));
                const action = args[1]?.action || 'unknown';
                console.log('[AffiliatorPro] reCAPTCHA action:', action);
                localStorage.setItem('affiliator_pro_recaptcha_action', action);

                const result = originalExecute.apply(this, args);
                if (result && typeof result.then === 'function') {
                    result.then(token => {
                        latestRecaptchaToken = token;
                        localStorage.setItem('affiliator_pro_recaptcha_token', token);
                        localStorage.setItem('affiliator_pro_recaptcha_at', new Date().toISOString());
                        console.log('[AffiliatorPro] reCAPTCHA token hooked (action: ' + action + ')');
                        window.postMessage({
                            type: 'AFFILIATOR_PRO_RECAPTCHA_CAPTURED',
                            token: token,
                            action: action
                        }, '*');
                    }).catch(() => {});
                }
                return result;
            };
            grecaptcha.enterprise._hooked = true;
            console.log('[AffiliatorPro] grecaptcha.enterprise.execute hooked');
        }
    }

    // Try hooking immediately and periodically
    hookRecaptcha();
    const hookInterval = setInterval(() => {
        hookRecaptcha();
        if (typeof grecaptcha !== 'undefined' && grecaptcha.enterprise && grecaptcha.enterprise._hooked) {
            clearInterval(hookInterval);
        }
    }, 1000);
    // Stop trying after 30 seconds
    setTimeout(() => clearInterval(hookInterval), 30000);

    // ===== 2. Hook fetch to capture auth token + reCAPTCHA from request body =====
    const originalFetch = window.fetch;

    window.fetch = async function (...args) {
        const [url, options] = args;

        // Check if request is to AI Sandbox API
        if (url && url.includes('aisandbox-pa.googleapis.com')) {
            const headers = options?.headers;

            if (headers) {
                let authHeader = null;

                if (headers instanceof Headers) {
                    authHeader = headers.get('Authorization');
                } else if (typeof headers === 'object') {
                    authHeader = headers['Authorization'] || headers['authorization'];
                }

                if (authHeader && authHeader.startsWith('Bearer ')) {
                    const token = authHeader.replace('Bearer ', '');

                    try {
                        localStorage.setItem('affiliator_pro_captured_token', token);
                        localStorage.setItem('affiliator_pro_captured_at', new Date().toISOString());

                        window.postMessage({
                            type: 'AFFILIATOR_PRO_TOKEN_CAPTURED',
                            token: token
                        }, '*');
                    } catch (e) {
                        // Silent fail
                    }
                }
            }

            // Also capture reCAPTCHA token from request body
            if (options?.body) {
                try {
                    let bodyStr = options.body;
                    if (typeof bodyStr !== 'string') {
                        bodyStr = new TextDecoder().decode(bodyStr);
                    }
                    const bodyJson = JSON.parse(bodyStr);
                    const recaptchaToken = bodyJson?.clientContext?.recaptchaContext?.token;
                    if (recaptchaToken) {
                        localStorage.setItem('affiliator_pro_recaptcha_token', recaptchaToken);
                        localStorage.setItem('affiliator_pro_recaptcha_at', new Date().toISOString());
                        console.log('[AffiliatorPro] reCAPTCHA token captured from request body');
                    }
                } catch (e) {
                    // Silent fail on body parse
                }
            }
        }

        return originalFetch.apply(this, args);
    };

    // ===== 3. Listen for token requests from content bridge =====
    window.addEventListener('message', (event) => {
        if (event.data?.type === 'AFFILIATOR_PRO_GET_FRESH_RECAPTCHA') {
            const token = latestRecaptchaToken || localStorage.getItem('affiliator_pro_recaptcha_token');
            window.postMessage({
                type: 'AFFILIATOR_PRO_FRESH_RECAPTCHA_RESPONSE',
                requestId: event.data.requestId,
                token: token
            }, '*');
        }
    });

    console.log('[AffiliatorPro] Token capture loaded - v3');
})();
