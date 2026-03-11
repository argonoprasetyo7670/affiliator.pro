"use server"

import { auth } from "@/lib/auth"
import { checkSufficientCredits, deductCredits, checkSufficientCreditsByUserId, deductCreditsByUserId } from "./credit"
import { CREDIT_COSTS, type CreditOperationType } from "@/lib/credit-packages"
import { getCaptchaToken } from '@/lib/chaptcha'

interface TextToVideoRequest {
    prompt: string
    aspectRatio: "landscape" | "portrait"
    model?: string
    userId?: string  // Optional: for API key auth flow
}

interface ImageToVideoRequest {
    prompt: string
    startImageBase64: string
    aspectRatio: "landscape" | "portrait"
    model?: string
    userId?: string  // Optional: for API key auth flow
}

interface FrameToFrameRequest {
    prompt: string
    startImageBase64: string
    endImageBase64: string
    aspectRatio: "landscape" | "portrait"
    model?: string
    userId?: string  // Optional: for API key auth flow
}

interface GenerateVideoResponse {
    success: boolean
    videoUrl?: string
    videoUrls?: string[]
    jobId?: string
    error?: string
    remainingCredits?: number
}

interface VideoJobStatusResponse {
    success: boolean
    status: "created" | "running" | "completed" | "failed"
    videoUrls?: string[]
    mediaGenerationId?: string
    error?: string
    remainingCredits?: number
}

const USEAPI_TOKEN = process.env.USEAPI_API_TOKEN
const USEAPI_BASE_URL = "https://api.useapi.net/v1/google-flow"

export async function generateTextToVideo(
    request: TextToVideoRequest
): Promise<GenerateVideoResponse> {
    try {
        if (!USEAPI_TOKEN) {
            throw new Error("USEAPI_API_TOKEN is not configured")
        }

        // Check if user has sufficient credits
        // Use userId-based function for API key auth, session-based for web UI
        const creditCheck = request.userId
            ? await checkSufficientCreditsByUserId(request.userId, "textToVideo")
            : await checkSufficientCredits("textToVideo")
        if (!creditCheck.success) {
            return { success: false, error: creditCheck.error }
        }
        if (!creditCheck.hasCredits) {
            return {
                success: false,
                error: `Kredit tidak cukup. Dibutuhkan: ${creditCheck.required}, Tersedia: ${creditCheck.available}`
            }
        }

        // Use async mode since video generation takes 60-180 seconds
        const response = await fetch(`${USEAPI_BASE_URL}/videos`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${USEAPI_TOKEN}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                prompt: request.prompt,
                aspectRatio: request.aspectRatio,
                model: "veo-3.1-fast-relaxed",
                count: 1,
                async: true,
            }),
        })

        const data = await response.json()

        if (!response.ok) {
            console.error("UseAPI Video Error:", data)
            throw new Error(data.error || `API Error: ${response.status}`)
        }

        // For async mode, we get jobId immediately - DON'T deduct credits yet, wait for completion
        const jobId = data.jobId || data.jobid
        if (jobId) {
            // Return jobId without deducting credits - credits will be deducted when job completes
            return {
                success: true,
                jobId,
                // Don't return remainingCredits here since we haven't deducted yet
            }
        }

        // If not async, try to extract video URLs from operations
        const videoUrls: string[] = []
        if (data.operations && Array.isArray(data.operations)) {
            for (const op of data.operations) {
                const fifeUrl = op?.operation?.metadata?.video?.fifeUrl || op?.video?.fifeUrl
                if (fifeUrl) {
                    videoUrls.push(fifeUrl)
                }
            }
        }

        if (videoUrls.length === 0) {
            console.error("Unexpected API response:", data)
            throw new Error("No video URL in response")
        }

        // Deduct credits for sync generation
        const deductResult = request.userId
            ? await deductCreditsByUserId(request.userId, "textToVideo", "Text to Video Generation")
            : await deductCredits("textToVideo", "Text to Video Generation")

        return {
            success: true,
            videoUrl: videoUrls[0],
            videoUrls,
            remainingCredits: deductResult.remainingCredits,
        }
    } catch (error) {
        console.error("Text-to-video generation failed:", error)
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error occurred",
        }
    }
}

export async function checkVideoJobStatus(
    jobId: string,
    operation?: CreditOperationType,
    userId?: string
): Promise<VideoJobStatusResponse> {
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
            // Extract video URLs and mediaGenerationId from response.operations
            const videoUrls: string[] = []
            let mediaGenerationId: string | undefined
            if (data.response?.operations && Array.isArray(data.response.operations)) {
                for (const op of data.response.operations) {
                    const fifeUrl = op?.video?.fifeUrl || op?.operation?.metadata?.video?.fifeUrl
                    if (fifeUrl) {
                        videoUrls.push(fifeUrl)
                    }
                    // Extract mediaGenerationId for upscale support
                    if (!mediaGenerationId) {
                        mediaGenerationId = op?.mediaGenerationId ||
                            op?.video?.mediaGenerationId ||
                            op?.operation?.metadata?.video?.mediaGenerationId
                    }
                }
            }

            // Deduct credits only on successful completion
            let remainingCredits: number | undefined
            if (operation) {
                let description = "Video Generation"
                if (operation === "textToVideo") {
                    description = "Text to Video Generation"
                } else if (operation === "imageToVideo") {
                    description = "Image to Video Generation"
                } else if (operation === "upscaleVideo") {
                    description = "Video Upscale"
                }
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
                videoUrls,
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

export async function generateImageToVideo(
    request: ImageToVideoRequest
): Promise<GenerateVideoResponse> {
    try {
        if (!USEAPI_TOKEN) {
            throw new Error("USEAPI_API_TOKEN is not configured")
        }

        // Check if user has sufficient credits
        // Use userId-based function for API key auth, session-based for web UI
        const creditCheck = request.userId
            ? await checkSufficientCreditsByUserId(request.userId, "imageToVideo")
            : await checkSufficientCredits("imageToVideo")
        if (!creditCheck.success) {
            return { success: false, error: creditCheck.error }
        }
        if (!creditCheck.hasCredits) {
            return {
                success: false,
                error: `Kredit tidak cukup. Dibutuhkan: ${creditCheck.required}, Tersedia: ${creditCheck.available}`
            }
        }

        let binaryData: Buffer
        let contentType = "image/jpeg"

        if (request.startImageBase64.startsWith("http://") || request.startImageBase64.startsWith("https://")) {
            // It's a URL (e.g. Cloudinary) — fetch server-side
            const fetched = await fetch(request.startImageBase64)
            if (!fetched.ok) throw new Error("Failed to fetch start image from URL")
            binaryData = Buffer.from(await fetched.arrayBuffer())
            const ct = fetched.headers.get("content-type")
            if (ct) contentType = ct.split(";")[0]
        } else {
            // Validate and decode base64 to binary
            let base64Data = request.startImageBase64

            // Remove data URL prefix if present
            if (base64Data.includes(',')) {
                base64Data = base64Data.split(',')[1]
            }

            // Validate base64 data
            if (!base64Data || base64Data.length < 100) {
                throw new Error("Invalid image data. Please try uploading a different image.")
            }

            try {
                binaryData = Buffer.from(base64Data, "base64")
            } catch (e) {
                throw new Error("Failed to decode image data. Please try a different image.")
            }

            // Validate decoded buffer size
            if (binaryData.length < 1000) {
                throw new Error("Image data is too small. Please use a higher quality image.")
            }

            if (base64Data.startsWith("/9j/")) contentType = "image/jpeg"
            else if (base64Data.startsWith("iVBOR")) contentType = "image/png"
        }

        console.log(`Uploading start image: ${binaryData.length} bytes, type: ${contentType}`)

        // Upload the start image as raw binary
        const uploadResponse = await fetch(`${USEAPI_BASE_URL}/assets`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${USEAPI_TOKEN}`,
                "Content-Type": contentType,
            },
            body: new Uint8Array(binaryData),
        })

        if (!uploadResponse.ok) {
            const errorData = await uploadResponse.json().catch(() => ({}))
            console.error("Upload Error:", errorData)
            const errorMsg = typeof errorData.error === 'object'
                ? errorData.error.message || JSON.stringify(errorData.error)
                : errorData.error || `Upload Error: ${uploadResponse.status}`
            throw new Error(`Failed to upload image: ${errorMsg}`)
        }

        const uploadData = await uploadResponse.json()
        const mediaGenerationId = uploadData.mediaGenerationId?.mediaGenerationId || uploadData.mediaGenerationId

        if (!mediaGenerationId) {
            console.error("No mediaGenerationId in upload response:", uploadData)
            throw new Error("Failed to upload start image - no media ID received")
        }

        console.log("Image uploaded successfully, mediaGenerationId:", mediaGenerationId)

        // Generate video with startImage (I2V mode)
        const response = await fetch(`${USEAPI_BASE_URL}/videos`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${USEAPI_TOKEN}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                prompt: request.prompt,
                aspectRatio: request.aspectRatio,
                model: "veo-3.1-fast-relaxed",
                count: 1,
                async: true,
                startImage: mediaGenerationId,
            }),
        })

        const data = await response.json()

        if (!response.ok) {
            console.error("UseAPI Video Error:", data)
            throw new Error(data.error || `API Error: ${response.status}`)
        }

        const jobId = data.jobId || data.jobid
        if (jobId) {
            // Return jobId without deducting credits - credits will be deducted when job completes
            return {
                success: true,
                jobId,
                // Don't return remainingCredits here since we haven't deducted yet
            }
        }

        // If not async, try to extract video URLs
        const videoUrls: string[] = []
        if (data.operations && Array.isArray(data.operations)) {
            for (const op of data.operations) {
                const fifeUrl = op?.operation?.metadata?.video?.fifeUrl || op?.video?.fifeUrl
                if (fifeUrl) {
                    videoUrls.push(fifeUrl)
                }
            }
        }

        if (videoUrls.length === 0) {
            console.error("Unexpected API response:", data)
            throw new Error("No video URL in response")
        }

        // Deduct credits for sync generation
        const deductResult = request.userId
            ? await deductCreditsByUserId(request.userId, "imageToVideo", "Image to Video Generation")
            : await deductCredits("imageToVideo", "Image to Video Generation")

        return {
            success: true,
            videoUrl: videoUrls[0],
            videoUrls,
            remainingCredits: deductResult.remainingCredits,
        }
    } catch (error) {
        console.error("Image-to-video generation failed:", error)
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error occurred",
        }
    }
}

// R2V (Reference-to-Video) interfaces
interface ReferenceToVideoRequest {
    prompt: string
    referenceImagesBase64: string[]  // 1-3 reference images (base64 or URL)
    aspectRatio: "landscape" | "portrait"
    model?: string
    userId?: string
}

/**
 * Generate video from reference images (R2V mode).
 * Uploads 1-3 reference images, then generates video using them for style/composition.
 * Only works with veo-3.1-fast and veo-3.1-fast-relaxed models.
 */
export async function generateReferenceToVideo(
    request: ReferenceToVideoRequest
): Promise<GenerateVideoResponse> {
    try {
        if (!USEAPI_TOKEN) {
            throw new Error("USEAPI_API_TOKEN is not configured")
        }

        if (!request.referenceImagesBase64 || request.referenceImagesBase64.length === 0) {
            throw new Error("At least one reference image is required")
        }

        if (request.referenceImagesBase64.length > 3) {
            throw new Error("Maximum 3 reference images allowed")
        }

        // R2V only works with fast models
        const model = request.model || "veo-3.1-fast"
        if (model === "veo-3.1-quality") {
            throw new Error("R2V mode only supports veo-3.1-fast and veo-3.1-fast-relaxed models")
        }

        // Check credits
        const creditCheck = request.userId
            ? await checkSufficientCreditsByUserId(request.userId, "imageToVideo")
            : await checkSufficientCredits("imageToVideo")
        if (!creditCheck.success) {
            return { success: false, error: creditCheck.error }
        }
        if (!creditCheck.hasCredits) {
            return {
                success: false,
                error: `Kredit tidak cukup. Dibutuhkan: ${creditCheck.required}, Tersedia: ${creditCheck.available}`
            }
        }

        // Upload each reference image and collect mediaGenerationIds
        const mediaGenerationIds: string[] = []

        for (let i = 0; i < request.referenceImagesBase64.length; i++) {
            const imageInput = request.referenceImagesBase64[i]

            let binaryData: Buffer
            let contentType = "image/jpeg"

            if (imageInput.startsWith("http://") || imageInput.startsWith("https://")) {
                const fetched = await fetch(imageInput)
                if (!fetched.ok) throw new Error(`Failed to fetch reference image ${i + 1}`)
                binaryData = Buffer.from(await fetched.arrayBuffer())
                const ct = fetched.headers.get("content-type")
                if (ct) contentType = ct.split(";")[0]
            } else {
                let base64Data = imageInput
                if (base64Data.includes(',')) {
                    base64Data = base64Data.split(',')[1]
                }
                if (!base64Data || base64Data.length < 100) {
                    throw new Error(`Invalid reference image ${i + 1}`)
                }
                binaryData = Buffer.from(base64Data, "base64")
                if (base64Data.startsWith("/9j/")) contentType = "image/jpeg"
                else if (base64Data.startsWith("iVBOR")) contentType = "image/png"
            }

            console.log(`Uploading reference image ${i + 1}: ${binaryData.length} bytes, type: ${contentType}`)

            const uploadResponse = await fetch(`${USEAPI_BASE_URL}/assets`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${USEAPI_TOKEN}`,
                    "Content-Type": contentType,
                },
                body: new Uint8Array(binaryData),
            })

            if (!uploadResponse.ok) {
                const errorData = await uploadResponse.json().catch(() => ({}))
                console.error(`Upload Error (ref ${i + 1}):`, errorData)
                const errorMsg = typeof errorData.error === 'object'
                    ? errorData.error.message || JSON.stringify(errorData.error)
                    : errorData.error || `Upload Error: ${uploadResponse.status}`
                throw new Error(`Failed to upload reference image ${i + 1}: ${errorMsg}`)
            }

            const uploadData = await uploadResponse.json()
            const mediaGenId = uploadData.mediaGenerationId?.mediaGenerationId || uploadData.mediaGenerationId

            if (!mediaGenId) {
                throw new Error(`Failed to upload reference image ${i + 1} - no media ID received`)
            }

            console.log(`Reference image ${i + 1} uploaded, mediaGenerationId:`, mediaGenId)
            mediaGenerationIds.push(mediaGenId)
        }

        // Build request body with referenceImage_1, _2, _3
        const requestBody: Record<string, unknown> = {
            prompt: request.prompt,
            aspectRatio: request.aspectRatio,
            model,
            count: 1,
            async: true,
        }

        if (mediaGenerationIds[0]) requestBody.referenceImage_1 = mediaGenerationIds[0]
        if (mediaGenerationIds[1]) requestBody.referenceImage_2 = mediaGenerationIds[1]
        if (mediaGenerationIds[2]) requestBody.referenceImage_3 = mediaGenerationIds[2]

        console.log(`[R2V] Generating with ${mediaGenerationIds.length} reference images`)

        const response = await fetch(`${USEAPI_BASE_URL}/videos`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${USEAPI_TOKEN}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(requestBody),
        })

        const data = await response.json()

        if (!response.ok) {
            console.error("UseAPI R2V Error:", data)
            throw new Error(data.error || `API Error: ${response.status}`)
        }

        const jobId = data.jobId || data.jobid
        if (jobId) {
            return {
                success: true,
                jobId,
            }
        }

        // Sync response fallback
        const videoUrls: string[] = []
        if (data.media && Array.isArray(data.media)) {
            for (const item of data.media) {
                if (item.videoUrl) videoUrls.push(item.videoUrl)
            }
        }
        if (data.operations && Array.isArray(data.operations)) {
            for (const op of data.operations) {
                const fifeUrl = op?.operation?.metadata?.video?.fifeUrl || op?.video?.fifeUrl
                if (fifeUrl) videoUrls.push(fifeUrl)
            }
        }

        if (videoUrls.length === 0) {
            throw new Error("No video URL in response")
        }

        const deductResult = request.userId
            ? await deductCreditsByUserId(request.userId, "imageToVideo", "Reference to Video Generation")
            : await deductCredits("imageToVideo", "Reference to Video Generation")

        return {
            success: true,
            videoUrl: videoUrls[0],
            videoUrls,
            remainingCredits: deductResult.remainingCredits,
        }
    } catch (error) {
        console.error("Reference-to-video generation failed:", error)
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error occurred",
        }
    }
}

// Video upscale interfaces
interface UpscaleVideoRequest {
    mediaGenerationId: string
    resolution?: "1080p" | "4K"
    userId?: string  // Optional: for API key auth flow
}

interface UpscaleVideoResponse {
    success: boolean
    jobId?: string
    videoUrl?: string
    error?: string
    remainingCredits?: number
}

/**
 * Upscale a video using the UseAPI upscale endpoint
 * Uses async mode and returns jobId for polling
 */
export async function upscaleVideo(
    request: UpscaleVideoRequest
): Promise<UpscaleVideoResponse> {
    try {
        if (!USEAPI_TOKEN) {
            throw new Error("USEAPI_API_TOKEN is not configured")
        }

        if (!request.mediaGenerationId) {
            throw new Error("mediaGenerationId is required for upscaling")
        }

        // Check if user has sufficient credits
        const creditCheck = request.userId
            ? await checkSufficientCreditsByUserId(request.userId, "upscaleVideo")
            : await checkSufficientCredits("upscaleVideo")

        if (!creditCheck.success) {
            return { success: false, error: creditCheck.error }
        }
        if (!creditCheck.hasCredits) {
            return {
                success: false,
                error: `Kredit tidak cukup. Dibutuhkan: ${creditCheck.required}, Tersedia: ${creditCheck.available}`
            }
        }

        // Call the video upscale API in async mode
        const response = await fetch(`${USEAPI_BASE_URL}/videos/upscale`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${USEAPI_TOKEN}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                mediaGenerationId: request.mediaGenerationId,
                resolution: request.resolution || "1080p",
                async: true,  // Always use async mode for video upscale
            }),
        })

        const data = await response.json()

        if (!response.ok) {
            console.error("UseAPI Video Upscale Error:", data)
            const errorMessage = typeof data.error === 'object'
                ? data.error.message || JSON.stringify(data.error)
                : data.error || `API Error: ${response.status}`
            throw new Error(errorMessage)
        }

        // Extract jobId for async polling
        const jobId = data.jobid || data.jobId

        if (jobId) {
            // DON'T deduct credits immediately for async jobs
            // Credits will be deducted when job completes via checkVideoJobStatus
            return {
                success: true,
                jobId,
                // Don't return remainingCredits here since we haven't deducted yet
            }
        }

        // If sync response (not using async mode), extract video URL
        const videoUrl = data.operations?.[0]?.operation?.metadata?.video?.fifeUrl

        if (!videoUrl) {
            throw new Error("No video URL in response")
        }

        // Deduct credits for successful sync upscale
        const deductResult = request.userId
            ? await deductCreditsByUserId(request.userId, "upscaleVideo", "Video Upscale")
            : await deductCredits("upscaleVideo", "Video Upscale")

        return {
            success: true,
            videoUrl,
            remainingCredits: deductResult.remainingCredits,
        }
    } catch (error) {
        console.error("Video upscale failed:", error)
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error occurred",
        }
    }
}

/**
 * Generate video with start and end frames (I2V-FL mode / Frame-to-Frame)
 * This mode creates a video that starts with the first frame and ends with the last frame
 */
export async function generateFrameToFrameVideo(
    request: FrameToFrameRequest
): Promise<GenerateVideoResponse> {
    try {
        if (!USEAPI_TOKEN) {
            throw new Error("USEAPI_API_TOKEN is not configured")
        }

        // Check if user has sufficient credits
        const creditCheck = request.userId
            ? await checkSufficientCreditsByUserId(request.userId, "imageToVideo")
            : await checkSufficientCredits("imageToVideo")
        if (!creditCheck.success) {
            return { success: false, error: creditCheck.error }
        }
        if (!creditCheck.hasCredits) {
            return {
                success: false,
                error: `Kredit tidak cukup. Dibutuhkan: ${creditCheck.required}, Tersedia: ${creditCheck.available}`
            }
        }

        // Helper function to process and upload image
        const uploadImage = async (imageInput: string, imageName: string): Promise<string> => {
            let binaryData: Buffer
            let contentType = "image/jpeg"

            if (imageInput.startsWith("http://") || imageInput.startsWith("https://")) {
                // It's a URL (e.g. Cloudinary) — fetch server-side
                const fetched = await fetch(imageInput)
                if (!fetched.ok) throw new Error(`Failed to fetch ${imageName} from URL`)
                binaryData = Buffer.from(await fetched.arrayBuffer())
                const ct = fetched.headers.get("content-type")
                if (ct) contentType = ct.split(";")[0]
            } else {
                // Remove data URL prefix if present
                let base64Data = imageInput
                if (base64Data.includes(',')) {
                    base64Data = base64Data.split(',')[1]
                }

                // Validate base64 data
                if (!base64Data || base64Data.length < 100) {
                    throw new Error(`Invalid ${imageName} data. Please try uploading a different image.`)
                }

                try {
                    binaryData = Buffer.from(base64Data, "base64")
                } catch (e) {
                    throw new Error(`Failed to decode ${imageName} data. Please try a different image.`)
                }

                // Validate decoded buffer size
                if (binaryData.length < 1000) {
                    throw new Error(`${imageName} data is too small. Please use a higher quality image.`)
                }

                if (base64Data.startsWith("/9j/")) contentType = "image/jpeg"
                else if (base64Data.startsWith("iVBOR")) contentType = "image/png"
            }

            console.log(`Uploading ${imageName}: ${binaryData.length} bytes, type: ${contentType}`)

            // Upload the image as raw binary
            const uploadResponse = await fetch(`${USEAPI_BASE_URL}/assets`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${USEAPI_TOKEN}`,
                    "Content-Type": contentType,
                },
                body: new Uint8Array(binaryData),
            })

            if (!uploadResponse.ok) {
                const errorData = await uploadResponse.json().catch(() => ({}))
                console.error(`${imageName} Upload Error:`, errorData)
                const errorMsg = typeof errorData.error === 'object'
                    ? errorData.error.message || JSON.stringify(errorData.error)
                    : errorData.error || `Upload Error: ${uploadResponse.status}`
                throw new Error(`Failed to upload ${imageName}: ${errorMsg}`)
            }

            const uploadData = await uploadResponse.json()
            const mediaGenerationId = uploadData.mediaGenerationId?.mediaGenerationId || uploadData.mediaGenerationId

            if (!mediaGenerationId) {
                console.error(`No mediaGenerationId in ${imageName} upload response:`, uploadData)
                throw new Error(`Failed to upload ${imageName} - no media ID received`)
            }

            console.log(`${imageName} uploaded successfully, mediaGenerationId:`, mediaGenerationId)
            return mediaGenerationId
        }

        // Upload start image
        const startMediaGenerationId = await uploadImage(request.startImageBase64, "start image")

        // Upload end image
        const endMediaGenerationId = await uploadImage(request.endImageBase64, "end image")

        // 🔐 Inject captcha token from custom server
        const captchaToken = await getCaptchaToken();

        // Generate video with both startImage and endImage (I2V-FL mode)
        const response = await fetch(`${USEAPI_BASE_URL}/videos`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${USEAPI_TOKEN}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                prompt: request.prompt,
                aspectRatio: request.aspectRatio,
                model: request.model || "veo-3.1-fast",
                count: 1,
                async: true,
                startImage: startMediaGenerationId,
                endImage: endMediaGenerationId,
                ...(captchaToken ? { captchaToken } : {}),
            }),
        })

        const data = await response.json()

        if (!response.ok) {
            console.error("UseAPI Frame-to-Frame Video Error:", data)
            throw new Error(data.error || `API Error: ${response.status}`)
        }

        const jobId = data.jobId || data.jobid
        if (jobId) {
            // Return jobId without deducting credits - credits will be deducted when job completes
            return {
                success: true,
                jobId,
            }
        }

        // If not async, try to extract video URLs
        const videoUrls: string[] = []
        if (data.operations && Array.isArray(data.operations)) {
            for (const op of data.operations) {
                const fifeUrl = op?.operation?.metadata?.video?.fifeUrl || op?.video?.fifeUrl
                if (fifeUrl) {
                    videoUrls.push(fifeUrl)
                }
            }
        }

        if (videoUrls.length === 0) {
            console.error("Unexpected API response:", data)
            throw new Error("No video URL in response")
        }

        // Deduct credits for sync generation
        const deductResult = request.userId
            ? await deductCreditsByUserId(request.userId, "imageToVideo", "Frame-to-Frame Video Generation")
            : await deductCredits("imageToVideo", "Frame-to-Frame Video Generation")

        return {
            success: true,
            videoUrl: videoUrls[0],
            videoUrls,
            remainingCredits: deductResult.remainingCredits,
        }
    } catch (error) {
        console.error("Frame-to-Frame video generation failed:", error)
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error occurred",
        }
    }
}

