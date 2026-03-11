"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { deleteFromCloudinary } from "@/lib/cloudinary"

// Types
export interface AdminUser {
    id: string
    name: string | null
    email: string
    role: string
    credits: number
    discountPercent: number
    createdAt: Date
    _count?: {
        transactions: number
    }
}

export interface AdminTransaction {
    id: string
    orderId: string
    plan: string
    amount: number
    status: string
    paymentType: string | null
    createdAt: Date
    user: {
        id: string
        name: string | null
        email: string
    }
}

export interface DashboardStats {
    totalUsers: number
    activeUsersThisMonth: number
    totalRevenue: number
    monthlyRevenue: number
    totalCreditsDistributed: number
    pendingTransactions: number
}

/**
 * Check if current user has admin access
 */
export async function checkAdminAccess(): Promise<{
    isAdmin: boolean
    userId?: string
    error?: string
}> {
    try {
        const session = await auth()

        if (!session?.user?.id) {
            return { isAdmin: false, error: "Unauthorized" }
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { role: true },
        })

        if (user?.role !== "admin") {
            return { isAdmin: false, error: "Admin access required" }
        }

        return { isAdmin: true, userId: session.user.id }
    } catch (error) {
        console.error("Error checking admin access:", error)
        return { isAdmin: false, error: "Error checking access" }
    }
}

/**
 * Get all users with pagination
 */
export async function getAllUsers(
    page: number = 1,
    limit: number = 20,
    search: string = ""
): Promise<{
    success: boolean
    users?: AdminUser[]
    total?: number
    error?: string
}> {
    try {
        const { isAdmin, error } = await checkAdminAccess()
        if (!isAdmin) {
            return { success: false, error }
        }

        const skip = (page - 1) * limit

        const where = search
            ? {
                OR: [
                    { name: { contains: search, mode: "insensitive" as const } },
                    { email: { contains: search, mode: "insensitive" as const } },
                ],
            }
            : {}

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    credits: true,
                    discountPercent: true,
                    createdAt: true,
                    _count: {
                        select: { transactions: true },
                    },
                },
            }),
            prisma.user.count({ where }),
        ])

        return { success: true, users, total }
    } catch (error) {
        console.error("Error getting users:", error)
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        }
    }
}

/**
 * Update user details
 */
export async function updateUser(
    userId: string,
    data: {
        name?: string
        role?: string
        credits?: number
        discountPercent?: number
    }
): Promise<{
    success: boolean
    user?: AdminUser
    error?: string
}> {
    try {
        const { isAdmin, error } = await checkAdminAccess()
        if (!isAdmin) {
            return { success: false, error }
        }

        const user = await prisma.user.update({
            where: { id: userId },
            data,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                credits: true,
                discountPercent: true,
                createdAt: true,
            },
        })

        revalidatePath("/admin/users")
        return { success: true, user }
    } catch (error) {
        console.error("Error updating user:", error)
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        }
    }
}

/**
 * Delete a user
 */
export async function deleteUser(userId: string): Promise<{
    success: boolean
    error?: string
}> {
    try {
        const { isAdmin, userId: adminId, error } = await checkAdminAccess()
        if (!isAdmin) {
            return { success: false, error }
        }

        // Prevent self-delete
        if (userId === adminId) {
            return { success: false, error: "Cannot delete your own account" }
        }

        await prisma.user.delete({
            where: { id: userId },
        })

        revalidatePath("/admin/users")
        return { success: true }
    } catch (error) {
        console.error("Error deleting user:", error)
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        }
    }
}

/**
 * Get all transactions with pagination
 */
export async function getAllTransactions(
    page: number = 1,
    limit: number = 20,
    status: string = ""
): Promise<{
    success: boolean
    transactions?: AdminTransaction[]
    total?: number
    error?: string
}> {
    try {
        const { isAdmin, error } = await checkAdminAccess()
        if (!isAdmin) {
            return { success: false, error }
        }

        const skip = (page - 1) * limit
        const where = status ? { status } : {}

        const [transactions, total] = await Promise.all([
            prisma.transaction.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
                select: {
                    id: true,
                    orderId: true,
                    plan: true,
                    amount: true,
                    status: true,
                    paymentType: true,
                    createdAt: true,
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                },
            }),
            prisma.transaction.count({ where }),
        ])

        return { success: true, transactions, total }
    } catch (error) {
        console.error("Error getting transactions:", error)
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        }
    }
}

/**
 * Update transaction status
 */
export async function updateTransactionStatus(
    transactionId: string,
    status: string
): Promise<{
    success: boolean
    error?: string
}> {
    try {
        const { isAdmin, error } = await checkAdminAccess()
        if (!isAdmin) {
            return { success: false, error }
        }

        await prisma.transaction.update({
            where: { id: transactionId },
            data: { status },
        })

        revalidatePath("/admin/transactions")
        return { success: true }
    } catch (error) {
        console.error("Error updating transaction:", error)
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        }
    }
}

/**
 * Adjust user credits (add or deduct)
 */
export async function adjustUserCredits(
    userId: string,
    amount: number,
    description: string
): Promise<{
    success: boolean
    newBalance?: number
    error?: string
}> {
    try {
        const { isAdmin, error } = await checkAdminAccess()
        if (!isAdmin) {
            return { success: false, error }
        }

        const result = await prisma.$transaction(async (tx) => {
            const user = await tx.user.findUnique({
                where: { id: userId },
                select: { credits: true },
            })

            if (!user) {
                throw new Error("User not found")
            }

            const newBalance = user.credits + amount

            if (newBalance < 0) {
                throw new Error("Resulting balance cannot be negative")
            }

            await tx.user.update({
                where: { id: userId },
                data: { credits: newBalance },
            })

            await tx.creditHistory.create({
                data: {
                    userId,
                    amount,
                    type: "admin",
                    description: `[Admin] ${description}`,
                    balanceAfter: newBalance,
                },
            })

            return newBalance
        })

        revalidatePath("/admin/credits")
        revalidatePath("/admin/users")
        return { success: true, newBalance: result }
    } catch (error) {
        console.error("Error adjusting credits:", error)
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        }
    }
}

/**
 * Get credit history for all users or specific user
 */
export async function getCreditHistoryAdmin(
    page: number = 1,
    limit: number = 20,
    userId?: string
): Promise<{
    success: boolean
    history?: Array<{
        id: string
        amount: number
        type: string
        description: string
        balanceAfter: number
        createdAt: Date
        user: {
            id: string
            name: string | null
            email: string
        }
    }>
    total?: number
    error?: string
}> {
    try {
        const { isAdmin, error } = await checkAdminAccess()
        if (!isAdmin) {
            return { success: false, error }
        }

        const skip = (page - 1) * limit
        const where = userId ? { userId } : {}

        const [history, total] = await Promise.all([
            prisma.creditHistory.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
                select: {
                    id: true,
                    amount: true,
                    type: true,
                    description: true,
                    balanceAfter: true,
                    createdAt: true,
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                },
            }),
            prisma.creditHistory.count({ where }),
        ])

        return { success: true, history, total }
    } catch (error) {
        console.error("Error getting credit history:", error)
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        }
    }
}

/**
 * Get dashboard statistics
 */
export async function getDashboardStats(): Promise<{
    success: boolean
    stats?: DashboardStats
    error?: string
}> {
    try {
        const { isAdmin, error } = await checkAdminAccess()
        if (!isAdmin) {
            return { success: false, error }
        }

        const now = new Date()
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

        const [
            totalUsers,
            activeUsersThisMonth,
            revenueData,
            monthlyRevenueData,
            creditsData,
            pendingTransactions,
        ] = await Promise.all([
            // Total users
            prisma.user.count(),

            // Active users this month (users who have credit history this month)
            prisma.creditHistory.groupBy({
                by: ["userId"],
                where: {
                    createdAt: { gte: startOfMonth },
                },
            }).then((result) => result.length),

            // Total revenue from successful transactions
            prisma.transaction.aggregate({
                where: { status: "success" },
                _sum: { amount: true },
            }),

            // Monthly revenue
            prisma.transaction.aggregate({
                where: {
                    status: "success",
                    createdAt: { gte: startOfMonth },
                },
                _sum: { amount: true },
            }),

            // Total credits distributed (positive credits added)
            prisma.creditHistory.aggregate({
                where: {
                    amount: { gt: 0 },
                },
                _sum: { amount: true },
            }),

            // Pending transactions
            prisma.transaction.count({
                where: { status: "pending" },
            }),
        ])

        return {
            success: true,
            stats: {
                totalUsers,
                activeUsersThisMonth,
                totalRevenue: revenueData._sum.amount || 0,
                monthlyRevenue: monthlyRevenueData._sum.amount || 0,
                totalCreditsDistributed: creditsData._sum.amount || 0,
                pendingTransactions,
            },
        }
    } catch (error) {
        console.error("Error getting dashboard stats:", error)
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        }
    }
}

/**
 * Get recent transactions for dashboard
 */
export async function getRecentTransactions(limit: number = 5): Promise<{
    success: boolean
    transactions?: AdminTransaction[]
    error?: string
}> {
    try {
        const { isAdmin, error } = await checkAdminAccess()
        if (!isAdmin) {
            return { success: false, error }
        }

        const transactions = await prisma.transaction.findMany({
            take: limit,
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                orderId: true,
                plan: true,
                amount: true,
                status: true,
                paymentType: true,
                createdAt: true,
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        })

        return { success: true, transactions }
    } catch (error) {
        console.error("Error getting recent transactions:", error)
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        }
    }
}

/**
 * Delete all project assets older than 3 days (admin only)
 */
export async function deleteExpiredAssets() {
    const adminCheck = await checkAdminAccess()
    if (!adminCheck.isAdmin) {
        return { success: false, error: "Unauthorized" }
    }

    try {
        const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)

        // Fetch expired assets first to delete from Cloudinary
        const expiredAssets = await prisma.projectAsset.findMany({
            where: {
                createdAt: { lt: threeDaysAgo },
            },
            select: { id: true, url: true, type: true },
        })

        // Delete from Cloudinary in parallel
        const cloudinaryDeletes = expiredAssets
            .filter(a => a.url.includes("res.cloudinary.com"))
            .map(async (a) => {
                try {
                    const parts = a.url.split("/upload/")
                    if (parts[1]) {
                        const pathAfterUpload = parts[1].replace(/^v\d+\//, "")
                        const publicId = pathAfterUpload.replace(/\.[^.]+$/, "")
                        const resourceType = a.type === "video" ? "video" as const : "image" as const
                        await deleteFromCloudinary(publicId, resourceType)
                    }
                } catch (e) {
                    console.error(`Cloudinary delete failed for asset ${a.id}:`, e)
                }
            })

        await Promise.allSettled(cloudinaryDeletes)

        // Delete from DB
        const result = await prisma.projectAsset.deleteMany({
            where: {
                createdAt: { lt: threeDaysAgo },
            },
        })

        return {
            success: true,
            deletedCount: result.count,
        }
    } catch (error) {
        console.error("Error deleting expired assets:", error)
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        }
    }
}

/**
 * Get count of expired assets (older than 3 days)
 */
export async function getExpiredAssetsCount() {
    const adminCheck = await checkAdminAccess()
    if (!adminCheck.isAdmin) {
        return { success: false, error: "Unauthorized" }
    }

    try {
        const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)

        const count = await prisma.projectAsset.count({
            where: {
                createdAt: {
                    lt: threeDaysAgo,
                },
            },
        })

        return { success: true, count }
    } catch (error) {
        console.error("Error counting expired assets:", error)
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        }
    }
}
