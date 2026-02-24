import { NextRequest, NextResponse } from "next/server"
import { upscaleImage } from "@/app/actions/generate-image"
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
 * POST /api/upscale/image
 * Upscale an image to 2K or 4K resolution
 * 
 * Request body:
 * {
 *   "mediaGenerationId": string,  // Required: from image generation response
 *   "resolution": "2k" | "4k"     // Optional: default "2k"
 * }
 * 
 * Response:
 * {
 *   "success": boolean,
 *   "imageUrl": string,           // Base64 data URL of upscaled image
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
        const { mediaGenerationId, resolution = "2k" } = body

        if (!mediaGenerationId) {
            return NextResponse.json(
                { success: false, error: "mediaGenerationId is required" },
                { status: 400, headers: corsHeaders }
            )
        }

        // Validate resolution
        if (resolution && !["2k", "4k"].includes(resolution)) {
            return NextResponse.json(
                { success: false, error: "resolution must be '2k' or '4k'" },
                { status: 400, headers: corsHeaders }
            )
        }

        const result = await upscaleImage({
            mediaGenerationId,
            resolution: resolution as "2k" | "4k",
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
            imageUrl: result.imageUrl,
            remainingCredits: result.remainingCredits,
        }, { headers: corsHeaders })

    } catch (error) {
        console.error("Upscale API error:", error)
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : "Internal server error" },
            { status: 500, headers: corsHeaders }
        )
    }
}
