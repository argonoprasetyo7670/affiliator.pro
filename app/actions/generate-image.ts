"use server"

import { checkSufficientCredits, deductCredits, checkSufficientCreditsByUserId, deductCreditsByUserId } from "./credit"
import { type CreditOperationType } from "@/lib/credit-packages"
import { getImageCaptchaToken } from '@/lib/chaptcha'

interface TextToImageRequest {
    prompt: string
    aspectRatio: "landscape" | "portrait"
    userId?: string  // Optional: for API key auth flow
}

interface ImageToImageRequest {
    prompt: string
    referenceImagesBase64: string[]  // Up to 3 reference images
    aspectRatio: "landscape" | "portrait"
    userId?: string  // Optional: for API key auth flow
}

interface GenerateImageResponse {
    success: boolean
    imageUrl?: string
    imageUrls?: string[]
    mediaGenerationId?: string  // For upscale feature
    jobId?: string
    error?: string
    remainingCredits?: number
}

interface JobStatusResponse {
    success: boolean
    status: "created" | "running" | "completed" | "failed"
    imageUrls?: string[]
    mediaGenerationId?: string  // For upscale feature
    error?: string
    remainingCredits?: number
}

const USEAPI_TOKEN = process.env.USEAPI_API_TOKEN
const USEAPI_BASE_URL = "https://api.useapi.net/v1/google-flow"

export async function generateTextToImage(
    request: TextToImageRequest
): Promise<GenerateImageResponse> {
    try {
        if (!USEAPI_TOKEN) {
            throw new Error("USEAPI_API_TOKEN is not configured")
        }

        // Check if user has sufficient credits
        // Use userId-based function for API key auth, session-based for web UI
        const creditCheck = request.userId
            ? await checkSufficientCreditsByUserId(request.userId, "textToImage")
            : await checkSufficientCredits("textToImage")
        if (!creditCheck.success) {
            return { success: false, error: creditCheck.error }
        }
        if (!creditCheck.hasCredits) {
            return {
                success: false,
                error: `Kredit tidak cukup. Dibutuhkan: ${creditCheck.required}, Tersedia: ${creditCheck.available}`
            }
        }

        // 🔐 Inject captcha token from custom server
        const captchaToken = await getImageCaptchaToken();

        const response = await fetch(`${USEAPI_BASE_URL}/images`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${USEAPI_TOKEN}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                prompt: request.prompt,
                aspectRatio: request.aspectRatio,
                model: "nano-banana-pro",
                count: 1,
                ...(captchaToken ? { captchaToken } : {}),
            }),
        })

        const data = await response.json()

        if (!response.ok) {
            console.error("UseAPI Error:", data)
            const errorMessage = typeof data.error === 'object'
                ? data.error.message || JSON.stringify(data.error)
                : data.error || `API Error: ${response.status}`
            throw new Error(errorMessage)
        }

        // Extract image URLs and mediaGenerationId from media array
        const imageUrls: string[] = []
        let mediaGenerationId: string | undefined
        if (data.media && Array.isArray(data.media)) {
            for (const mediaItem of data.media) {
                const fifeUrl = mediaItem?.image?.generatedImage?.fifeUrl
                if (fifeUrl) {
                    imageUrls.push(fifeUrl)
                }
                // Extract mediaGenerationId for upscale
                if (!mediaGenerationId && mediaItem?.image?.generatedImage?.mediaGenerationId) {
                    mediaGenerationId = mediaItem.image.generatedImage.mediaGenerationId
                }
            }
        }

        if (imageUrls.length === 0) {
            // If no immediate result, return jobId for polling (credit will be deducted later)
            if (data.jobId || data.jobid) {
                // Deduct credits for async job
                const deductResult = request.userId
                    ? await deductCreditsByUserId(request.userId, "textToImage", "Text to Image Generation (async)")
                    : await deductCredits("textToImage", "Text to Image Generation (async)")
                return {
                    success: true,
                    jobId: data.jobId || data.jobid,
                    remainingCredits: deductResult.remainingCredits,
                }
            }
            console.error("Unexpected API response:", data)
            throw new Error("No image URL in response")
        }

        // Deduct credits for successful generation
        const deductResult = request.userId
            ? await deductCreditsByUserId(request.userId, "textToImage", "Text to Image Generation")
            : await deductCredits("textToImage", "Text to Image Generation")

        return {
            success: true,
            imageUrl: imageUrls[0],
            imageUrls,
            mediaGenerationId,
            remainingCredits: deductResult.remainingCredits,
        }
    } catch (error) {
        console.error("Text-to-image generation failed:", error)
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error occurred",
        }
    }
}

export async function checkImageJobStatus(
    jobId: string,
    operation?: CreditOperationType,
    userId?: string
): Promise<JobStatusResponse> {
    try {
        if (!USEAPI_TOKEN) {
            throw new Error("USEAPI_API_TOKEN is not configured")
        }

        const response = await fetch(`${USEAPI_BASE_URL}/jobs/${jobId}`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${USEAPI_TOKEN}`,
            },
        })

        const data = await response.json()

        if (!response.ok) {
            console.error("Job status check error:", data)
            throw new Error(data.error || `API Error: ${response.status}`)
        }

        // Check job status
        if (data.status === "failed") {
            return {
                success: false,
                status: "failed",
                error: data.error || "Job failed",
            }
        }

        if (data.status === "completed") {
            // Extract image URLs and mediaGenerationId from response.media
            const imageUrls: string[] = []
            let mediaGenerationId: string | undefined
            if (data.response?.media && Array.isArray(data.response.media)) {
                for (const mediaItem of data.response.media) {
                    const fifeUrl = mediaItem?.image?.generatedImage?.fifeUrl
                    if (fifeUrl) {
                        imageUrls.push(fifeUrl)
                    }
                    // Extract mediaGenerationId for upscale
                    if (!mediaGenerationId && mediaItem?.image?.generatedImage?.mediaGenerationId) {
                        mediaGenerationId = mediaItem.image.generatedImage.mediaGenerationId
                    }
                }
            }

            // Deduct credits only on successful completion
            let remainingCredits: number | undefined
            if (operation) {
                const description = `${operation === "textToImage" ? "Text to Image" : "Image to Image"} Generation`
                const deductResult = userId
                    ? await deductCreditsByUserId(userId, operation, description)
                    : await deductCredits(operation, description)
                if (deductResult.success) {
                    remainingCredits = deductResult.remainingCredits
                }
            }

            return {
                success: true,
                status: "completed",
                imageUrls,
                mediaGenerationId,
                remainingCredits,
            }
        }

        // Still processing
        return {
            success: true,
            status: data.status || "running",
        }
    } catch (error) {
        console.error("Job status check failed:", error)
        return {
            success: false,
            status: "failed",
            error: error instanceof Error ? error.message : "Unknown error occurred",
        }
    }
}

export async function generateImageToImage(
    request: ImageToImageRequest
): Promise<GenerateImageResponse> {
    try {
        if (!USEAPI_TOKEN) {
            throw new Error("USEAPI_API_TOKEN is not configured")
        }

        // Check if user has sufficient credits
        // Use userId-based function for API key auth, session-based for web UI
        const creditCheck = request.userId
            ? await checkSufficientCreditsByUserId(request.userId, "imageToImage")
            : await checkSufficientCredits("imageToImage")
        if (!creditCheck.success) {
            return { success: false, error: creditCheck.error }
        }
        if (!creditCheck.hasCredits) {
            return {
                success: false,
                error: `Kredit tidak cukup. Dibutuhkan: ${creditCheck.required}, Tersedia: ${creditCheck.available}`
            }
        }

        // Upload all reference images (max 3)
        // Important: All reference images must be uploaded to the same account
        // First upload: no email (let API choose), then use returned email for subsequent uploads
        const mediaIds: string[] = []
        const imagesToUpload = request.referenceImagesBase64.slice(0, 3) // Max 3 references
        let accountEmail: string | null = null  // Will be captured from first upload

        for (let i = 0; i < imagesToUpload.length; i++) {
            const base64Data = imagesToUpload[i]
            // Decode base64 to binary
            const binaryData = Buffer.from(base64Data, "base64")

            // Determine content type from base64 header or default to jpeg
            let contentType = "image/jpeg"
            if (base64Data.startsWith("/9j/")) {
                contentType = "image/jpeg"
            } else if (base64Data.startsWith("iVBOR")) {
                contentType = "image/png"
            }

            // Upload the reference image as raw binary
            // First upload: no email path (API auto-selects account)
            // Subsequent uploads: use email from first upload response
            const assetUrl: string = accountEmail
                ? `${USEAPI_BASE_URL}/assets/${encodeURIComponent(accountEmail)}`
                : `${USEAPI_BASE_URL}/assets`

            const uploadResponse: Response = await fetch(assetUrl, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${USEAPI_TOKEN}`,
                    "Content-Type": contentType,
                },
                body: binaryData,
            })

            if (!uploadResponse.ok) {
                const errorData = await uploadResponse.json().catch(() => ({}))
                console.error("Upload Error:", errorData)
                throw new Error(errorData.error || `Upload Error: ${uploadResponse.status}`)
            }

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const uploadData: any = await uploadResponse.json()
            const mediaGenerationId = typeof uploadData.mediaGenerationId === 'object'
                ? uploadData.mediaGenerationId?.mediaGenerationId
                : uploadData.mediaGenerationId

            if (!mediaGenerationId) {
                console.error("No mediaGenerationId in upload response:", uploadData)
                throw new Error("Failed to upload reference image")
            }

            // Capture email from first upload response for subsequent uploads
            if (i === 0 && uploadData.email) {
                accountEmail = uploadData.email
                console.log("Using account email for subsequent uploads:", accountEmail)
            }

            mediaIds.push(mediaGenerationId)
        }

        // 🔐 Inject captcha token from custom server
        const captchaToken = await getImageCaptchaToken();

        // Build request body with reference images
        const requestBody: Record<string, unknown> = {
            prompt: request.prompt,
            aspectRatio: request.aspectRatio,
            model: "nano-banana-pro",
            count: 1,
            ...(captchaToken ? { captchaToken } : {}),
        }

        // Add references (reference_1, reference_2, reference_3)
        mediaIds.forEach((id, index) => {
            requestBody[`reference_${index + 1}`] = id
        })

        // Now generate with references
        const response = await fetch(`${USEAPI_BASE_URL}/images`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${USEAPI_TOKEN}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(requestBody),
        })

        const data = await response.json()

        if (!response.ok) {
            console.error("UseAPI Error:", data)
            throw new Error(data.error || `API Error: ${response.status}`)
        }

        // Extract image URLs and mediaGenerationId from media array
        const imageUrls: string[] = []
        let mediaGenerationId: string | undefined
        if (data.media && Array.isArray(data.media)) {
            for (const mediaItem of data.media) {
                const fifeUrl = mediaItem?.image?.generatedImage?.fifeUrl
                if (fifeUrl) {
                    imageUrls.push(fifeUrl)
                }
                // Extract mediaGenerationId for upscale
                if (!mediaGenerationId && mediaItem?.image?.generatedImage?.mediaGenerationId) {
                    mediaGenerationId = mediaItem.image.generatedImage.mediaGenerationId
                }
            }
        }

        if (imageUrls.length === 0) {
            if (data.jobId || data.jobid) {
                // Deduct credits for async job
                const deductResult = request.userId
                    ? await deductCreditsByUserId(request.userId, "imageToImage", "Image to Image Generation (async)")
                    : await deductCredits("imageToImage", "Image to Image Generation (async)")
                return {
                    success: true,
                    jobId: data.jobId || data.jobid,
                    remainingCredits: deductResult.remainingCredits,
                }
            }
            console.error("Unexpected API response:", data)
            throw new Error("No image URL in response")
        }

        // Deduct credits for successful generation
        const deductResult = request.userId
            ? await deductCreditsByUserId(request.userId, "imageToImage", "Image to Image Generation")
            : await deductCredits("imageToImage", "Image to Image Generation")

        return {
            success: true,
            imageUrl: imageUrls[0],
            imageUrls,
            mediaGenerationId,
            remainingCredits: deductResult.remainingCredits,
        }
    } catch (error) {
        console.error("Image-to-image generation failed:", error)
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error occurred",
        }
    }
}

// Upscale image interface
interface UpscaleImageRequest {
    mediaGenerationId: string
    resolution?: "2k" | "4k"
    userId?: string  // Optional: for API key auth flow
}

interface UpscaleImageResponse {
    success: boolean
    imageUrl?: string  // Data URL (base64)
    error?: string
    remainingCredits?: number
}

/**
 * Upscale an image using the UseAPI upscale endpoint
 */
export async function upscaleImage(
    request: UpscaleImageRequest
): Promise<UpscaleImageResponse> {
    try {
        if (!USEAPI_TOKEN) {
            throw new Error("USEAPI_API_TOKEN is not configured")
        }

        if (!request.mediaGenerationId) {
            throw new Error("mediaGenerationId is required for upscaling")
        }

        // Check if user has sufficient credits
        const creditCheck = request.userId
            ? await checkSufficientCreditsByUserId(request.userId, "upscaleImage")
            : await checkSufficientCredits("upscaleImage")

        if (!creditCheck.hasCredits) {
            return {
                success: false,
                error: creditCheck.error || "Insufficient credits for upscaling",
            }
        }

        const response = await fetch(`${USEAPI_BASE_URL}/images/upscale`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${USEAPI_TOKEN}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                mediaGenerationId: request.mediaGenerationId,
                resolution: request.resolution || "2k",
            }),
        })

        const data = await response.json()

        if (!response.ok) {
            console.error("UseAPI Upscale Error:", data)
            const errorMessage = typeof data.error === 'object'
                ? data.error.message || JSON.stringify(data.error)
                : data.error || `API Error: ${response.status}`
            throw new Error(errorMessage)
        }

        if (!data.encodedImage) {
            throw new Error("No upscaled image in response")
        }

        // Deduct credits for successful upscale
        const deductResult = request.userId
            ? await deductCreditsByUserId(request.userId, "upscaleImage", "Image Upscale")
            : await deductCredits("upscaleImage", "Image Upscale")

        // Return as data URL for direct use in img src
        const imageUrl = `data:image/jpeg;base64,${data.encodedImage}`

        return {
            success: true,
            imageUrl,
            remainingCredits: deductResult.remainingCredits,
        }
    } catch (error) {
        console.error("Image upscale failed:", error)
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error occurred",
        }
    }
}
