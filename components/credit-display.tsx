"use client"

import { useState, useEffect } from "react"
import { Coins, RefreshCw, AlertCircle } from "lucide-react"
import { getUserCredits } from "@/app/actions/credit"
import { formatCredits } from "@/lib/credit-packages"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface CreditDisplayProps {
    compact?: boolean
    className?: string
    showBuyButton?: boolean
}

export function CreditDisplay({
    compact = false,
    className,
    showBuyButton = true
}: CreditDisplayProps) {
    const [credits, setCredits] = useState<number | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchCredits = async () => {
        setLoading(true)
        setError(null)
        try {
            const result = await getUserCredits()
            if (result.success && result.credits !== undefined) {
                setCredits(result.credits)
            } else {
                setError(result.error || "Failed to fetch credits")
            }
        } catch (err) {
            setError("Failed to fetch credits")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchCredits()

        // Refresh credits every 30 seconds
        const interval = setInterval(fetchCredits, 30000)
        return () => clearInterval(interval)
    }, [])

    // Compact mode for sidebar
    if (compact) {
        return (
            <Link
                href="/dashboard/credits"
                className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-accent transition-colors",
                    className
                )}
            >
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-amber-500/20 to-yellow-500/20">
                    <Coins className="w-4 h-4 text-amber-500" />
                </div>
                <div className="flex flex-col group-data-[collapsible=icon]:hidden">
                    <span className="text-xs text-muted-foreground">Kredit</span>
                    {loading ? (
                        <span className="text-sm font-medium animate-pulse">...</span>
                    ) : error ? (
                        <span className="text-sm text-destructive">Error</span>
                    ) : (
                        <span className="text-sm font-semibold">
                            {formatCredits(credits || 0)}
                        </span>
                    )}
                </div>
            </Link>
        )
    }

    // Full display mode
    return (
        <div className={cn(
            "flex items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border border-amber-500/20",
            className
        )}>
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-amber-500/20 to-yellow-500/20">
                <Coins className="w-6 h-6 text-amber-500" />
            </div>

            <div className="flex-1">
                <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Kredit Tersedia</span>
                    <button
                        onClick={fetchCredits}
                        disabled={loading}
                        className="p-1 hover:bg-accent rounded transition-colors"
                    >
                        <RefreshCw className={cn(
                            "w-3 h-3 text-muted-foreground",
                            loading && "animate-spin"
                        )} />
                    </button>
                </div>

                {error ? (
                    <div className="flex items-center gap-1 text-destructive">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-sm">{error}</span>
                    </div>
                ) : (
                    <span className="text-2xl font-bold">
                        {loading ? "..." : formatCredits(credits || 0)}
                    </span>
                )}
            </div>

            {showBuyButton && (
                <Link href="/dashboard/credits">
                    <Button size="sm" variant="default" className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white">
                        Beli Kredit
                    </Button>
                </Link>
            )}
        </div>
    )
}

// Hook for getting credits in other components
export function useCredits() {
    const [credits, setCredits] = useState<number | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const refresh = async () => {
        setLoading(true)
        try {
            const result = await getUserCredits()
            if (result.success && result.credits !== undefined) {
                setCredits(result.credits)
                setError(null)
            } else {
                setError(result.error || "Failed to fetch credits")
            }
        } catch (err) {
            setError("Failed to fetch credits")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        refresh()
    }, [])

    return { credits, loading, error, refresh }
}
