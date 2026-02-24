import { NextRequest, NextResponse } from "next/server"
import { generateTextToVideo, generateImageToVideo } from "@/app/actions/generate-video"
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

// Helper to convert File to base64
async function fileToBase64(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    return buffer.toString("base64")
}

// Check if request is form data
function isFormData(request: NextRequest): boolean {
    const contentType = request.headers.get("content-type") || ""
    return contentType.includes("multipart/form-data")
}

export async function POST(request: NextRequest) {
    try {
        // Validate Bearer token
        const authResult = await validateApiRequest(request)
        if (!authResult.authenticated) {
            return unauthorizedResponse(authResult.error || "Unauthorized")
        }

        let prompt: string
        let aspectRatio: string = "landscape"
        let startImageBase64: string | null = null

        // Handle both JSON and FormData
        if (isFormData(request)) {
            const formData = await request.formData()
            prompt = formData.get("prompt") as string
            aspectRatio = (formData.get("aspectRatio") as string) || "landscape"

            // Handle file upload for start image
            const startImageFile = formData.get("startImage")
            if (startImageFile instanceof File && startImageFile.size > 0) {
                startImageBase64 = await fileToBase64(startImageFile)
            }
        } else {
            const body = await request.json()
            prompt = body.prompt
            aspectRatio = body.aspectRatio || "landscape"
            startImageBase64 = body.startImage || null
        }

        if (!prompt) {
            return NextResponse.json(
                { success: false, error: "Prompt is required" },
                { status: 400 }
            )
        }

        let result

        if (startImageBase64) {
            // Image-to-video mode
            result = await generateImageToVideo({
                prompt,
                startImageBase64,
                aspectRatio: (aspectRatio === "portrait" ? "portrait" : "landscape") as "landscape" | "portrait",
                userId: authResult.userId,  // Pass userId from API key auth
            })
        } else {
            // Text-to-video mode
            result = await generateTextToVideo({
                prompt,
                aspectRatio: (aspectRatio === "portrait" ? "portrait" : "landscape") as "landscape" | "portrait",
                userId: authResult.userId,  // Pass userId from API key auth
            })
        }

        if (!result.success) {
            return NextResponse.json(
                { success: false, error: result.error },
                { status: 400 }
            )
        }

        return NextResponse.json(result)
    } catch (error) {
        console.error("Video generation API error:", error)
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        )
    }
}
