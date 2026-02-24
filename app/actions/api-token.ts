"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { randomBytes } from "crypto"

/**
 * Generate a secure random API token
 */
function generateToken(): string {
    return `afp_${randomBytes(32).toString("hex")}`
}

/**
 * Get the current user's API token, or create one if it doesn't exist
 */
export async function getUserApiToken(): Promise<{
    success: boolean
    token?: string
    error?: string
}> {
    try {
        const session = await auth()

        if (!session?.user?.id) {
            return { success: false, error: "Unauthorized" }
        }

        // Check for existing active token
        const existingKey = await prisma.apiKey.findFirst({
            where: {
                userId: session.user.id,
                isActive: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        })

        if (existingKey) {
            return { success: true, token: existingKey.key }
        }

        // Create new token if none exists
        const newToken = generateToken()
        await prisma.apiKey.create({
            data: {
                userId: session.user.id,
                key: newToken,
                name: "Default API Key",
                isActive: true,
            },
        })

        return { success: true, token: newToken }
    } catch (error) {
        console.error("Error getting API token:", error)
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        }
    }
}

/**
 * Regenerate the user's API token (invalidates old token)
 */
export async function regenerateApiToken(): Promise<{
    success: boolean
    token?: string
    error?: string
}> {
    try {
        const session = await auth()

        if (!session?.user?.id) {
            return { success: false, error: "Unauthorized" }
        }

        // Deactivate all existing tokens
        await prisma.apiKey.updateMany({
            where: {
                userId: session.user.id,
                isActive: true,
            },
            data: {
                isActive: false,
            },
        })

        // Create new token
        const newToken = generateToken()
        await prisma.apiKey.create({
            data: {
                userId: session.user.id,
                key: newToken,
                name: "Default API Key",
                isActive: true,
            },
        })

        return { success: true, token: newToken }
    } catch (error) {
        console.error("Error regenerating API token:", error)
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        }
    }
}

/**
 * Validate an API token and return the user ID if valid
 */
export async function validateApiToken(token: string): Promise<{
    valid: boolean
    userId?: string
    error?: string
}> {
    try {
        if (!token) {
            return { valid: false, error: "Token is required" }
        }

        const apiKey = await prisma.apiKey.findFirst({
            where: {
                key: token,
                isActive: true,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                    },
                },
            },
        })

        if (!apiKey) {
            return { valid: false, error: "Invalid or expired token" }
        }

        return { valid: true, userId: apiKey.userId }
    } catch (error) {
        console.error("Error validating API token:", error)
        return {
            valid: false,
            error: error instanceof Error ? error.message : "Unknown error",
        }
    }
}
