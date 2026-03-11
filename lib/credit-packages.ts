/**
 * Credit Package definitions and credit costs for operations
 */

export const CREDIT_PACKAGES = {
    starter: {
        id: "starter",
        name: "Starter",
        credits: 100,
        price: 20000, // Rp 15.000
        pricePerCredit: 200,
        description: "100 credits untuk pemula",
    },
    pro: {
        id: "pro",
        name: "Pro",
        credits: 500,
        price: 100000, // Rp 70.000
        pricePerCredit: 200,
        description: "500 credits untuk penggunaan reguler",
        popular: true,
    },
    enterprise: {
        id: "enterprise",
        name: "Enterprise",
        credits: 1000,
        price: 200000, // Rp 135.000
        pricePerCredit: 200,
        description: "1000 credits untuk penggunaan besar",
    },
} as const

export type CreditPackageId = keyof typeof CREDIT_PACKAGES

/**
 * Credit costs for each operation type
 */
export const CREDIT_COSTS = {
    textToImage: 0.5,
    imageToImage: 0.5,
    upscaleImage: 1,
    upscaleVideo: 0.5,
    textToVideo: 2,
    imageToVideo: 2,
} as const

export type CreditOperationType = keyof typeof CREDIT_COSTS

/**
 * Get credit cost for an operation
 */
export function getCreditCost(operation: CreditOperationType): number {
    return CREDIT_COSTS[operation]
}

/**
 * Get credit package by ID
 */
export function getCreditPackage(packageId: CreditPackageId) {
    return CREDIT_PACKAGES[packageId]
}

/**
 * Format credit amount for display
 */
export function formatCredits(credits: number): string {
    if (credits >= 1) {
        return credits.toLocaleString("id-ID")
    }
    return credits.toFixed(1)
}

/**
 * Format price in IDR
 */
export function formatPrice(price: number): string {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(price)
}
