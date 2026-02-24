"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { CREDIT_COSTS, type CreditOperationType } from "@/lib/credit-packages"

export type CreditHistoryType = "purchase" | "usage" | "refund" | "bonus" | "admin"

/**
 * Get user's current credit balance
 */
export async function getUserCredits(): Promise<{
    success: boolean
    credits?: number
    error?: string
}> {
    try {
        const session = await auth()

        if (!session?.user?.id) {
            return { success: false, error: "Unauthorized" }
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { credits: true },
        })

        if (!user) {
            return { success: false, error: "User not found" }
        }

        return { success: true, credits: user.credits }
    } catch (error) {
        console.error("Error getting credits:", error)
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        }
    }
}

/**
 * Check if user has sufficient credits for an operation
 */
export async function checkSufficientCredits(
    operation: CreditOperationType
): Promise<{
    success: boolean
    hasCredits?: boolean
    required?: number
    available?: number
    error?: string
}> {
    try {
        const session = await auth()

        if (!session?.user?.id) {
            return { success: false, error: "Unauthorized" }
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { credits: true },
        })

        if (!user) {
            return { success: false, error: "User not found" }
        }

        const required = CREDIT_COSTS[operation]
        const hasCredits = user.credits >= required

        return {
            success: true,
            hasCredits,
            required,
            available: user.credits,
        }
    } catch (error) {
        console.error("Error checking credits:", error)
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        }
    }
}

/**
 * Deduct credits for an operation
 */
export async function deductCredits(
    operation: CreditOperationType,
    description: string
): Promise<{
    success: boolean
    remainingCredits?: number
    error?: string
}> {
    try {
        const session = await auth()

        if (!session?.user?.id) {
            return { success: false, error: "Unauthorized" }
        }

        const cost = CREDIT_COSTS[operation]
        const userId = session.user.id

        // Use transaction with timeout and retry logic
        const maxRetries = 3
        let lastError: Error | null = null

        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                const result = await prisma.$transaction(async (tx) => {
                    const user = await tx.user.findUnique({
                        where: { id: userId },
                        select: { credits: true },
                    })

                    if (!user) {
                        throw new Error("User not found")
                    }

                    if (user.credits < cost) {
                        throw new Error(`Insufficient credits. Required: ${cost}, Available: ${user.credits}`)
                    }

                    const newBalance = user.credits - cost

                    // Update user credits
                    await tx.user.update({
                        where: { id: userId },
                        data: { credits: newBalance },
                    })

                    // Record history
                    await tx.creditHistory.create({
                        data: {
                            userId,
                            amount: -cost,
                            type: "usage",
                            description,
                            balanceAfter: newBalance,
                        },
                    })

                    return newBalance
                }, {
                    timeout: 10000, // 10 second timeout
                    maxWait: 5000,  // 5 second max wait for transaction to start
                })

                return { success: true, remainingCredits: result }
            } catch (retryError) {
                lastError = retryError instanceof Error ? retryError : new Error(String(retryError))
                // If it's not a transaction timeout error, don't retry
                if (!lastError.message.includes("Unable to start a transaction")) {
                    throw lastError
                }
                // Wait before retry
                await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)))
            }
        }

        throw lastError || new Error("Transaction failed after retries")
    } catch (error) {
        console.error("Error deducting credits:", error)
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        }
    }
}

/**
 * Add credits to user balance (for purchases, bonuses, admin adjustments)
 */
export async function addCredits(
    amount: number,
    type: CreditHistoryType,
    description: string,
    userId?: string // Optional: for admin to add to specific user
): Promise<{
    success: boolean
    newBalance?: number
    error?: string
}> {
    try {
        const session = await auth()

        if (!session?.user?.id) {
            return { success: false, error: "Unauthorized" }
        }

        // Use provided userId or current user
        const targetUserId = userId || session.user.id

        // For admin operations, verify admin role
        if (userId && userId !== session.user.id) {
            const adminUser = await prisma.user.findUnique({
                where: { id: session.user.id },
                select: { role: true },
            })

            if (adminUser?.role !== "admin") {
                return { success: false, error: "Admin access required" }
            }
        }

        const result = await prisma.$transaction(async (tx) => {
            const user = await tx.user.findUnique({
                where: { id: targetUserId },
                select: { credits: true },
            })

            if (!user) {
                throw new Error("User not found")
            }

            const newBalance = user.credits + amount

            // Update user credits
            await tx.user.update({
                where: { id: targetUserId },
                data: { credits: newBalance },
            })

            // Record history
            await tx.creditHistory.create({
                data: {
                    userId: targetUserId,
                    amount,
                    type,
                    description,
                    balanceAfter: newBalance,
                },
            })

            return newBalance
        })

        return { success: true, newBalance: result }
    } catch (error) {
        console.error("Error adding credits:", error)
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        }
    }
}

/**
 * Get credit transaction history
 */
export async function getCreditHistory(limit: number = 20): Promise<{
    success: boolean
    history?: Array<{
        id: string
        amount: number
        type: string
        description: string
        balanceAfter: number
        createdAt: Date
    }>
    error?: string
}> {
    try {
        const session = await auth()

        if (!session?.user?.id) {
            return { success: false, error: "Unauthorized" }
        }

        const history = await prisma.creditHistory.findMany({
            where: { userId: session.user.id },
            orderBy: { createdAt: "desc" },
            take: limit,
            select: {
                id: true,
                amount: true,
                type: true,
                description: true,
                balanceAfter: true,
                createdAt: true,
            },
        })

        return { success: true, history }
    } catch (error) {
        console.error("Error getting credit history:", error)
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        }
    }
}

/**
 * Check if user has sufficient credits by userId (for API routes)
 */
export async function checkSufficientCreditsByUserId(
    userId: string,
    operation: CreditOperationType
): Promise<{
    success: boolean
    hasCredits?: boolean
    required?: number
    available?: number
    error?: string
}> {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { credits: true },
        })

        if (!user) {
            return { success: false, error: "User not found" }
        }

        const required = CREDIT_COSTS[operation]
        const hasCredits = user.credits >= required

        return {
            success: true,
            hasCredits,
            required,
            available: user.credits,
        }
    } catch (error) {
        console.error("Error checking credits:", error)
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        }
    }
}

/**
 * Deduct credits by userId (for API routes)
 */
export async function deductCreditsByUserId(
    userId: string,
    operation: CreditOperationType,
    description: string
): Promise<{
    success: boolean
    remainingCredits?: number
    error?: string
}> {
    try {
        const cost = CREDIT_COSTS[operation]

        // Use transaction with timeout and retry logic
        const maxRetries = 3
        let lastError: Error | null = null

        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                const result = await prisma.$transaction(async (tx) => {
                    const user = await tx.user.findUnique({
                        where: { id: userId },
                        select: { credits: true },
                    })

                    if (!user) {
                        throw new Error("User not found")
                    }

                    if (user.credits < cost) {
                        throw new Error(`Insufficient credits. Required: ${cost}, Available: ${user.credits}`)
                    }

                    const newBalance = user.credits - cost

                    await tx.user.update({
                        where: { id: userId },
                        data: { credits: newBalance },
                    })

                    await tx.creditHistory.create({
                        data: {
                            userId,
                            amount: -cost,
                            type: "usage",
                            description,
                            balanceAfter: newBalance,
                        },
                    })

                    return newBalance
                }, {
                    timeout: 10000, // 10 second timeout
                    maxWait: 5000,  // 5 second max wait for transaction to start
                })

                return { success: true, remainingCredits: result }
            } catch (retryError) {
                lastError = retryError instanceof Error ? retryError : new Error(String(retryError))
                // If it's not a transaction timeout error, don't retry
                if (!lastError.message.includes("Unable to start a transaction")) {
                    throw lastError
                }
                // Wait before retry
                await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)))
            }
        }

        throw lastError || new Error("Transaction failed after retries")
    } catch (error) {
        console.error("Error deducting credits:", error)
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        }
    }
}
