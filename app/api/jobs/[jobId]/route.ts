import { NextRequest, NextResponse } from "next/server"
import { checkImageJobStatus } from "@/app/actions/generate-image"
import { checkVideoJobStatus } from "@/app/actions/generate-video"
import { validateApiRequest, unauthorizedResponse } from "@/lib/api-auth"
import { type CreditOperationType } from "@/lib/credit-packages"

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

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ jobId: string }> }
) {
    try {
        // Validate Bearer token
        const authResult = await validateApiRequest(request)
        if (!authResult.authenticated) {
            return unauthorizedResponse(authResult.error || "Unauthorized")
        }

        const { jobId } = await params

        // Get operation type from query params for credit deduction
        const { searchParams } = new URL(request.url)
        const operation = searchParams.get("operation") as CreditOperationType | null

        if (!jobId) {
            return NextResponse.json(
                { success: false, error: "Job ID is required" },
                { status: 400 }
            )
        }

        // Determine job type from jobId format
        // Video jobs contain 'v-' after the timestamp
        const isVideoJob = jobId.includes("v-")

        let result

        if (isVideoJob) {
            result = await checkVideoJobStatus(jobId, operation || undefined, authResult.userId)
        } else {
            result = await checkImageJobStatus(jobId, operation || undefined, authResult.userId)
        }

        return NextResponse.json(result)
    } catch (error) {
        console.error("Job status API error:", error)
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        )
    }
}
