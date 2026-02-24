import { NextRequest, NextResponse } from "next/server"
import { upscaleVideo } from "@/app/actions/generate-video"
import { validateApiRequest, unauthorizedResponse } from "@/lib/api-auth"

// CORS headers for production
const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
}

// Handle OPTIONS preflight request
export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders })
}

/**
 * POST /api/upscale/video
 * Upscale a video to 1080p or 4K resolution
 * 
 * Request body:
 * {
 *   "mediaGenerationId": string,  // Required: from video generation response
 *   "resolution": "1080p" | "4K"  // Optional: default "1080p"
 * }
 * 
 * Response:
 * {
 *   "success": boolean,
 *   "jobId": string,              // Poll this job for completion
 *   "remainingCredits": number
 * }
 */
export async function POST(request: NextRequest) {
    try {
        // Validate Bearer token
        const authResult = await validateApiRequest(request)
        if (!authResult.authenticated) {
            return unauthorizedResponse(authResult.error || "Unauthorized")
        }

        const body = await request.json()
        const { mediaGenerationId, resolution = "1080p" } = body

        if (!mediaGenerationId) {
            return NextResponse.json(
                { success: false, error: "mediaGenerationId is required" },
                { status: 400, headers: corsHeaders }
            )
        }

        // Validate resolution
        if (resolution && !["1080p", "4K"].includes(resolution)) {
            return NextResponse.json(
                { success: false, error: "resolution must be '1080p' or '4K'" },
                { status: 400, headers: corsHeaders }
            )
        }

        const result = await upscaleVideo({
            mediaGenerationId,
            resolution: resolution as "1080p" | "4K",
            userId: authResult.userId,  // Pass userId from API key auth
        })

        if (!result.success) {
            return NextResponse.json(
                { success: false, error: result.error },
                { status: 400, headers: corsHeaders }
            )
        }

        return NextResponse.json({
            success: true,
            jobId: result.jobId,
            videoUrl: result.videoUrl,
            remainingCredits: result.remainingCredits,
        }, { headers: corsHeaders })

    } catch (error) {
        console.error("Video Upscale API error:", error)
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : "Internal server error" },
            { status: 500, headers: corsHeaders }
        )
    }
}
