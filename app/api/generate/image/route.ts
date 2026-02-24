import { NextRequest, NextResponse } from "next/server"
import { generateTextToImage, generateImageToImage } from "@/app/actions/generate-image"
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
        let referenceImagesBase64: string[] = []

        // Handle both JSON and FormData
        if (isFormData(request)) {
            const formData = await request.formData()
            prompt = formData.get("prompt") as string
            aspectRatio = (formData.get("aspectRatio") as string) || "landscape"

            // Handle file uploads for reference images
            const files = formData.getAll("referenceImages")
            for (const file of files.slice(0, 3)) {
                if (file instanceof File && file.size > 0) {
                    const base64 = await fileToBase64(file)
                    referenceImagesBase64.push(base64)
                }
            }
        } else {
            const body = await request.json()
            prompt = body.prompt
            aspectRatio = body.aspectRatio || "landscape"
            referenceImagesBase64 = body.referenceImages || []
        }

        if (!prompt) {
            return NextResponse.json(
                { success: false, error: "Prompt is required" },
                { status: 400 }
            )
        }

        let result

        if (referenceImagesBase64.length > 0) {
            // Image-to-image mode
            result = await generateImageToImage({
                prompt,
                referenceImagesBase64: referenceImagesBase64.slice(0, 3),
                aspectRatio: (aspectRatio === "portrait" ? "portrait" : "landscape") as "landscape" | "portrait",
                userId: authResult.userId,  // Pass userId from API key auth
            })
        } else {
            // Text-to-image mode
            result = await generateTextToImage({
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
        console.error("Image generation API error:", error)
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        )
    }
}
