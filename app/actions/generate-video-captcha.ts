"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { checkSufficientCredits, deductCredits } from "./credit"
import { getCaptchaToken } from '@/lib/chaptcha'

/**
 * Submit video generation job and return jobId immediately
 * Frontend then polls /api/video/status for updates
 * This is the ASYNC version - for frontend polling
 */

export interface SubmitImageToVideoInput {
    prompt: string
    referenceImageIds: string[] // Array of mediaGenerationIds (1=I2V, 2-3=R2V)
    endImageId?: string // Optional end frame for I2V-FL mode
    model?: "veo-3.1-quality" | "veo-3.1-fast" | "veo-3.1-fast-relaxed"
    aspectRatio?: "landscape" | "portrait"
    count?: number
    seed?: number
}

export interface SubmitVideoResponse {
    success: boolean
    message?: string
    jobId?: string
    remainingCredits?: number
    shouldShowUpgrade?: boolean
    shouldShowTopup?: boolean
    prompt?: string
}

export async function submitImageToVideo(
    input: SubmitImageToVideoInput
): Promise<SubmitVideoResponse> {
    try {
        const session = await auth()

        if (!session?.user?.email || !session?.user?.id) {
            return {
                success: false,
                message: "Unauthorized - please login first",
            }
        }

        // === CREDIT CHECK ===
        const creditCheck = await checkSufficientCredits("imageToVideo")
        if (!creditCheck.success) {
            return {
                success: false,
                message: creditCheck.error || "Gagal memeriksa kredit",
            }
        }
        if (!creditCheck.hasCredits) {
            return {
                success: false,
                message: `Kredit tidak cukup. Dibutuhkan: ${creditCheck.required}, Tersedia: ${creditCheck.available}`,
                shouldShowTopup: true,
                remainingCredits: creditCheck.available,
            }
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        })

        if (!user) {
            return {
                success: false,
                message: "User not found",
            }
        }

        const {
            prompt,
            referenceImageIds,
            model: inputModel = "veo-3.1-fast-relaxed",
            aspectRatio = "landscape",
            count = 1,
            seed,
        } = input

        // Validate referenceImageIds
        if (!referenceImageIds || referenceImageIds.length === 0) {
            return {
                success: false,
                message: "At least one reference image is required",
            }
        }

        // Determine mode
        const isR2V = referenceImageIds.length >= 2;
        const isI2VFL = referenceImageIds.length === 1 && !!input.endImageId;

        let model = inputModel;
        if (isR2V && model === "veo-3.1-quality") {
            model = "veo-3.1-fast-relaxed";
        }

        // Prepare request body - ASYNC MODE
        const requestBody: Record<string, unknown> = {
            prompt,
            model,
            aspectRatio,
            count,
            async: true, // 🆕 Async mode - returns jobId immediately
        }

        // 🔐 Inject captcha token from custom server
        const captchaToken = await getCaptchaToken();
        if (captchaToken) requestBody.captchaToken = captchaToken;

        if (isR2V) {
            requestBody.referenceImage_1 = referenceImageIds[0];
            if (referenceImageIds[1]) requestBody.referenceImage_2 = referenceImageIds[1];
            if (referenceImageIds[2]) requestBody.referenceImage_3 = referenceImageIds[2];
        } else if (isI2VFL) {
            requestBody.startImage = referenceImageIds[0];
            requestBody.endImage = input.endImageId;
        } else {
            requestBody.startImage = referenceImageIds[0];
        }

        if (seed !== undefined) {
            requestBody.seed = seed
        }

        const apiToken = process.env.USEAPI_API_TOKEN
        if (!apiToken) {
            return {
                success: false,
                message: "API token not configured",
            }
        }

        const modeLabel = isR2V ? 'R2V' : isI2VFL ? 'I2V-FL' : 'I2V';
        console.log(`[Submit I2V] 🎬 ${session.user.email} | ${model} | ${modeLabel} | ASYNC`);

        // Submit job - returns immediately with jobId
        let submitResponse: Response;
        try {
            submitResponse = await fetch(
                "https://api.useapi.net/v1/google-flow/videos",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${apiToken}`,
                    },
                    body: JSON.stringify(requestBody),
                }
            )
        } catch (fetchError) {
            console.error('[Submit I2V] ❌ Fetch error:', fetchError);
            return {
                success: false,
                message: 'Gagal menghubungi server. Periksa koneksi internet Anda.',
            };
        }

        const submitData = await submitResponse.json()

        if (!submitResponse.ok && submitResponse.status !== 201) {
            const nestedMessage = submitData.response?.error?.message;
            const nestedStatus = submitData.response?.error?.status;
            const topError = typeof submitData.error === 'string' ? submitData.error : submitData.error?.message;
            const rawError = nestedMessage
                ? `${nestedMessage}${nestedStatus ? ` (${nestedStatus})` : ''}`
                : (topError || `API Error ${submitResponse.status}`);
            console.error('[Submit I2V] ❌ Error:', submitResponse.status, rawError)
            console.error('[Submit I2V] ❌ Full response:', JSON.stringify(submitData, null, 2))

            // User-friendly message
            const userMessage = nestedStatus === 'INVALID_ARGUMENT'
                ? 'Generate gagal: argument tidak valid. Coba ganti image atau ubah prompt.'
                : (nestedStatus === 'PERMISSION_DENIED' || submitResponse.status === 403)
                    ? 'Generate gagal karena kendala server. Silahkan coba lagi.'
                    : (submitResponse.status === 429)
                        ? 'Server sedang sibuk. Silahkan tunggu sebentar lalu coba lagi.'
                        : `Generate gagal (${submitResponse.status}). Silahkan coba lagi.`;

            return {
                success: false,
                message: userMessage,
            }
        }

        // Get jobId from response
        const jobId = submitData.jobid || submitData.jobId;
        if (!jobId) {
            return {
                success: false,
                message: "Server tidak mengembalikan job ID",
            }
        }

        console.log(`[Submit I2V] ✅ Job created: ${jobId}`);

        // === CREDIT DEDUCTION ===
        const deduction = await deductCredits(
            "imageToVideo",
            `Video generation (I2V-${modeLabel}) - Job: ${jobId}`
        );
        if (!deduction.success) {
            console.error('[Submit I2V] ❌ Credit deduction failed:', deduction.error);
        }

        return {
            success: true,
            message: 'Job submitted. Poll /api/video/status for updates.',
            jobId,
            remainingCredits: deduction.remainingCredits ?? 0,
            prompt,
        }
    } catch (error) {
        console.error('[Submit I2V] ❌ Error:', error)
        return {
            success: false,
            message: error instanceof Error ? error.message : "Failed to submit video",
        }
    }
}

/**
 * Submit text-to-video generation job
 * Frontend then polls /api/video/status for updates
 */
export interface SubmitTextToVideoInput {
    prompt: string
    model?: 'veo-3.1-quality' | 'veo-3.1-fast' | 'veo-3.1-fast-relaxed'
    aspectRatio?: 'landscape' | 'portrait'
    count?: number
    seed?: number
}

export async function submitTextToVideo(
    input: SubmitTextToVideoInput
): Promise<SubmitVideoResponse> {
    try {
        const session = await auth()

        if (!session?.user?.id || !session?.user?.email) {
            return {
                success: false,
                message: 'Anda harus login terlebih dahulu',
            }
        }

        // === CREDIT CHECK ===
        const creditCheck = await checkSufficientCredits("textToVideo")
        if (!creditCheck.success) {
            return {
                success: false,
                message: creditCheck.error || "Gagal memeriksa kredit",
            }
        }
        if (!creditCheck.hasCredits) {
            return {
                success: false,
                message: `Kredit tidak cukup. Dibutuhkan: ${creditCheck.required}, Tersedia: ${creditCheck.available}`,
                shouldShowTopup: true,
                remainingCredits: creditCheck.available,
            }
        }

        const apiToken = process.env.USEAPI_API_TOKEN;
        if (!apiToken) {
            return {
                success: false,
                message: 'API token tidak ditemukan',
            };
        }

        if (!input.prompt || input.prompt.trim().length === 0) {
            return {
                success: false,
                message: 'Prompt tidak boleh kosong',
            };
        }

        // 🔐 Inject captcha token from custom server
        const captchaToken = await getCaptchaToken();
        console.log({ captchaToken });

        const requestBody = {
            prompt: input.prompt,
            model: input.model || 'veo-3.1-fast-relaxed',
            aspectRatio: input.aspectRatio || 'landscape',
            count: input.count || 1,
            async: true, // 🆕 Async mode
            ...(input.seed && { seed: input.seed }),
            ...(captchaToken ? { captchaToken } : {}), // 🔐 inject captcha token
        };

        console.log(`[Submit T2V] 🎬 ${session.user.email} | ${requestBody.model} | ASYNC`);

        let submitResponse: Response;
        try {
            submitResponse = await fetch('https://api.useapi.net/v1/google-flow/videos', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });
        } catch (fetchError) {
            console.error('[Submit T2V] ❌ Fetch error:', fetchError);
            return {
                success: false,
                message: 'Gagal menghubungi server',
            };
        }

        const submitData = await submitResponse.json();

        if (!submitResponse.ok && submitResponse.status !== 201) {
            const nestedMessage = submitData.response?.error?.message;
            const nestedStatus = submitData.response?.error?.status;
            const topError = typeof submitData.error === 'string' ? submitData.error : submitData.error?.message;
            const rawError = nestedMessage
                ? `${nestedMessage}${nestedStatus ? ` (${nestedStatus})` : ''}`
                : (topError || `API Error ${submitResponse.status}`);
            console.error('[Submit T2V] ❌ Error:', submitResponse.status, rawError);
            console.error('[Submit T2V] ❌ Full response:', JSON.stringify(submitData, null, 2));

            // User-friendly message
            const userMessage = nestedStatus === 'INVALID_ARGUMENT'
                ? 'Generate gagal: argument tidak valid. Coba ganti image atau ubah prompt.'
                : (nestedStatus === 'PERMISSION_DENIED' || submitResponse.status === 403)
                    ? 'Generate gagal karena kendala server. Silahkan coba lagi.'
                    : (submitResponse.status === 429)
                        ? 'Server sedang sibuk. Silahkan tunggu sebentar lalu coba lagi.'
                        : `Generate gagal (${submitResponse.status}). Silahkan coba lagi.`;

            return {
                success: false,
                message: userMessage,
            };
        }

        const jobId = submitData.jobid || submitData.jobId;
        if (!jobId) {
            return {
                success: false,
                message: 'Server tidak mengembalikan job ID',
            };
        }

        console.log(`[Submit T2V] ✅ Job created: ${jobId}`);

        // === CREDIT DEDUCTION ===
        const deduction = await deductCredits(
            "textToVideo",
            `Video generation (T2V) - Job: ${jobId}`
        );
        if (!deduction.success) {
            console.error('[Submit T2V] ❌ Credit deduction failed:', deduction.error);
        }

        return {
            success: true,
            message: 'Job submitted. Poll /api/video/status for updates.',
            jobId,
            remainingCredits: deduction.remainingCredits ?? 0,
            prompt: input.prompt,
        };
    } catch (error) {
        console.error('[Submit T2V] ❌ Error:', error);
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Terjadi kesalahan',
        };
    }
}
