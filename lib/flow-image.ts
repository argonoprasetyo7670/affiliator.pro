/**
 * Google Flow Image Generation Utility - Affiliator Pro
 * Utility untuk generate gambar via Google AI Sandbox (labs.google)
 * Uses Affiliator Pro Extension to bypass CORS
 * Prefix: AFFILIATOR_PRO_
 */

const PROJECT_ID = "4ac269d2-84a9-455a-9e65-6ee9628e4721";

// Aspect ratio mapping
export type AspectRatio = "16:9" | "9:16";

const ASPECT_RATIO_MAP: Record<AspectRatio, string> = {
    "16:9": "IMAGE_ASPECT_RATIO_LANDSCAPE",
    "9:16": "IMAGE_ASPECT_RATIO_PORTRAIT",
};

// Response types
export interface FlowImageResult {
    images: Array<{
        imageBytes?: string;
        imageUrl?: string;
        seed: number;
    }>;
    error?: string;
}

export interface GenerateFlowImageParams {
    prompt: string;
    aspectRatio?: AspectRatio;
    recaptchaToken: string;
    authToken: string;
    count?: number;
}

// Generate random seed
function generateSeed(): number {
    return Math.floor(Math.random() * 1000000);
}

/**
 * Build client context for Google Flow API
 */
function buildClientContext(recaptchaToken: string, sessionId: string) {
    return {
        recaptchaContext: {
            token: recaptchaToken,
            applicationType: "RECAPTCHA_APPLICATION_TYPE_WEB"
        },
        sessionId,
        projectId: PROJECT_ID,
        tool: "PINHOLE"
    };
}

/**
 * Build payload for Google Flow API
 */
export function buildFlowImagePayload(params: {
    prompt: string;
    aspectRatio: AspectRatio;
    recaptchaToken: string;
    count?: number;
}) {
    const { prompt, aspectRatio = "16:9", recaptchaToken, count = 2 } = params;

    const sessionId = `;${Date.now()}`;
    const imageAspectRatio = ASPECT_RATIO_MAP[aspectRatio] || ASPECT_RATIO_MAP["16:9"];
    const clientContext = buildClientContext(recaptchaToken, sessionId);

    const requests = Array.from({ length: count }, () => ({
        clientContext,
        seed: generateSeed(),
        imageModelName: "GEM_PIX_2",
        imageAspectRatio,
        prompt,
        imageInputs: []
    }));

    return {
        clientContext,
        requests
    };
}

/**
 * Generate images using Google Flow via Extension (bypasses CORS)
 */
export async function generateFlowImage(params: GenerateFlowImageParams): Promise<FlowImageResult> {
    const {
        prompt,
        aspectRatio = "16:9",
        recaptchaToken,
        authToken,
        count = 2
    } = params;

    if (!prompt) {
        return { images: [], error: "Prompt is required" };
    }

    if (!recaptchaToken) {
        return { images: [], error: "reCAPTCHA token is required" };
    }

    if (!authToken) {
        return { images: [], error: "Auth token is required" };
    }

    const payload = buildFlowImagePayload({ prompt, aspectRatio, recaptchaToken, count });

    return new Promise((resolve) => {
        const requestId = Date.now().toString();
        let resolved = false;

        const handleResponse = (event: CustomEvent) => {
            if (event.detail?.requestId === requestId) {
                resolved = true;
                window.removeEventListener('AFFILIATOR_PRO_IMAGE_RESPONSE', handleResponse as EventListener);

                if (event.detail.success && event.detail.images) {
                    resolve({ images: event.detail.images });
                } else {
                    resolve({
                        images: [],
                        error: event.detail.error || 'Failed to generate image'
                    });
                }
            }
        };

        window.addEventListener('AFFILIATOR_PRO_IMAGE_RESPONSE', handleResponse as EventListener);

        window.dispatchEvent(new CustomEvent('AFFILIATOR_PRO_GENERATE_IMAGE', {
            detail: {
                requestId,
                payload,
                authToken
            }
        }));

        // Timeout after 120 seconds
        setTimeout(() => {
            if (!resolved) {
                window.removeEventListener('AFFILIATOR_PRO_IMAGE_RESPONSE', handleResponse as EventListener);
                resolve({
                    images: [],
                    error: 'Timeout - Extension did not respond. Make sure extension is connected.'
                });
            }
        }, 120000);
    });
}

/**
 * Request reCAPTCHA token from extension
 */
export async function requestRecaptchaToken(): Promise<string | null> {
    return new Promise((resolve) => {
        const requestId = Date.now().toString();
        let resolved = false;

        const handleResponse = (event: CustomEvent) => {
            if (event.detail?.requestId === requestId) {
                resolved = true;
                window.removeEventListener('AFFILIATOR_PRO_TOKEN_RESPONSE', handleResponse as EventListener);

                if (event.detail.success && event.detail.token) {
                    resolve(event.detail.token);
                } else {
                    resolve(null);
                }
            }
        };

        window.addEventListener('AFFILIATOR_PRO_TOKEN_RESPONSE', handleResponse as EventListener);

        window.dispatchEvent(new CustomEvent('AFFILIATOR_PRO_REQUEST_TOKEN', {
            detail: {
                requestId,
                sitekey: '6LdsFiUsAAAAAIjVDZcuLhaHiDn5nnHVXVRQGeMV',
                action: 'FLOW_GENERATION'
            }
        }));

        // Timeout after 60 seconds
        setTimeout(() => {
            if (!resolved) {
                window.removeEventListener('AFFILIATOR_PRO_TOKEN_RESPONSE', handleResponse as EventListener);
                resolve(null);
            }
        }, 60000);
    });
}

/**
 * Check if extension is connected
 */
export async function checkFlowExtension(): Promise<boolean> {
    // Method 1: Check for data attribute
    if (typeof document !== 'undefined' && document.documentElement.hasAttribute('data-affiliator-pro-extension')) {
        return true;
    }

    // Method 2: Ping extension
    return new Promise((resolve) => {
        if (typeof window === 'undefined') {
            resolve(false);
            return;
        }

        const requestId = Date.now().toString();
        let resolved = false;

        const handlePong = (event: CustomEvent) => {
            if (event.detail?.requestId === requestId) {
                resolved = true;
                window.removeEventListener('AFFILIATOR_PRO_PONG', handlePong as EventListener);
                resolve(true);
            }
        };

        window.addEventListener('AFFILIATOR_PRO_PONG', handlePong as EventListener);

        window.dispatchEvent(new CustomEvent('AFFILIATOR_PRO_PING', {
            detail: { requestId }
        }));

        setTimeout(() => {
            if (!resolved) {
                window.removeEventListener('AFFILIATOR_PRO_PONG', handlePong as EventListener);
                resolve(false);
            }
        }, 2000);
    });
}

/**
 * Get stored auth token from localStorage
 */
export function getStoredAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('flow_auth_token');
}

/**
 * Store auth token to localStorage
 */
export function storeAuthToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('flow_auth_token', token);
}

/**
 * Get stored reCAPTCHA token from localStorage
 */
export function getStoredRecaptchaToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('flow_recaptcha_token');
}

/**
 * Store reCAPTCHA token to localStorage
 */
export function storeRecaptchaToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('flow_recaptcha_token', token);
}
