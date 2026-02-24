import { NextRequest, NextResponse } from "next/server"
import { prisma } from "./prisma"

export interface AuthResult {
    authenticated: boolean
    userId?: string
    error?: string
}

/**
 * Extract Bearer token from Authorization header
 */
function extractBearerToken(request: NextRequest): string | null {
    const authHeader = request.headers.get("Authorization")
    if (!authHeader) return null

    const parts = authHeader.split(" ")
    if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer") {
        return null
    }

    return parts[1]
}

/**
 * Validate API request with Bearer token
 * Returns auth result with userId if valid
 */
export async function validateApiRequest(request: NextRequest): Promise<AuthResult> {
    const token = extractBearerToken(request)

    if (!token) {
        return {
            authenticated: false,
            error: "Missing Authorization header. Use 'Authorization: Bearer <your_token>'",
        }
    }

    try {
        const apiKey = await prisma.apiKey.findFirst({
            where: {
                key: token,
                isActive: true,
            },
        })

        if (!apiKey) {
            return {
                authenticated: false,
                error: "Invalid or expired API token",
            }
        }

        return {
            authenticated: true,
            userId: apiKey.userId,
        }
    } catch (error) {
        console.error("API auth error:", error)
        return {
            authenticated: false,
            error: "Authentication failed",
        }
    }
}

/**
 * Create unauthorized response
 */
export function unauthorizedResponse(message: string): NextResponse {
    return NextResponse.json(
        {
            success: false,
            error: message,
        },
        { status: 401 }
    )
}
