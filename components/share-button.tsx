"use client"

import { Share2 } from 'lucide-react'

interface ShareButtonProps {
    title: string
}

export function ShareButton({ title }: ShareButtonProps) {
    const handleShare = () => {
        if (typeof navigator !== 'undefined' && navigator.share) {
            navigator.share({
                title: title,
                url: window.location.href,
            })
        } else {
            // Fallback: copy to clipboard
            if (typeof navigator !== 'undefined' && navigator.clipboard) {
                navigator.clipboard.writeText(window.location.href)
            }
        }
    }

    return (
        <button
            className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            onClick={handleShare}
        >
            <Share2 className="w-4 h-4" />
        </button>
    )
}
