"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Coins,
    Check,
    Sparkles,
    Zap,
    Crown,
    History,
    ArrowUpRight,
    ArrowDownRight,
    Loader2,
    ImageIcon,
    Video
} from "lucide-react"
import { CreditDisplay } from "@/components/credit-display"
import { CREDIT_PACKAGES, CREDIT_COSTS, formatPrice, formatCredits } from "@/lib/credit-packages"
import { getCreditHistory } from "@/app/actions/credit"
import { useEffect } from "react"
import { toast } from "sonner"

const packageIcons = {
    starter: Zap,
    pro: Sparkles,
    enterprise: Crown,
}

const packageColors = {
    starter: "from-blue-500 to-cyan-500",
    pro: "from-purple-500 to-pink-500",
    enterprise: "from-amber-500 to-orange-500",
}

interface CreditHistoryItem {
    id: string
    amount: number
    type: string
    description: string
    balanceAfter: number
    createdAt: Date
}

export default function CreditsPage() {
    const [selectedPackage, setSelectedPackage] = useState<string | null>(null)
    const [isPurchasing, setIsPurchasing] = useState(false)
    const [history, setHistory] = useState<CreditHistoryItem[]>([])
    const [historyLoading, setHistoryLoading] = useState(true)

    useEffect(() => {
        loadHistory()
    }, [])

    const loadHistory = async () => {
        setHistoryLoading(true)
        try {
            const result = await getCreditHistory(20)
            if (result.success && result.history) {
                setHistory(result.history.map(h => ({
                    ...h,
                    createdAt: new Date(h.createdAt)
                })))
            }
        } catch (error) {
            console.error("Failed to load history:", error)
        } finally {
            setHistoryLoading(false)
        }
    }

    const handlePurchase = async (packageId: string) => {
        setIsPurchasing(true)
        setSelectedPackage(packageId)

        try {
            // TODO: Integrate with Midtrans or other payment gateway
            toast.info("Fitur pembayaran akan segera tersedia. Hubungi admin untuk pembelian kredit.")
        } catch (error) {
            toast.error("Gagal memproses pembelian")
        } finally {
            setIsPurchasing(false)
            setSelectedPackage(null)
        }
    }

    const getTypeColor = (type: string) => {
        switch (type) {
            case "purchase": return "text-green-500"
            case "usage": return "text-red-500"
            case "refund": return "text-blue-500"
            case "bonus": return "text-purple-500"
            case "admin": return "text-amber-500"
            default: return "text-muted-foreground"
        }
    }

    const getTypeLabel = (type: string) => {
        switch (type) {
            case "purchase": return "Pembelian"
            case "usage": return "Penggunaan"
            case "refund": return "Refund"
            case "bonus": return "Bonus"
            case "admin": return "Admin"
            default: return type
        }
    }

    return (
        <div className="container mx-auto py-6 px-4 space-y-8">
            {/* Header */}
            <div className="flex flex-col gap-4">
                <h1 className="text-3xl font-bold">Kredit</h1>
                <p className="text-muted-foreground">
                    Kelola kredit Anda untuk menggunakan layanan AI
                </p>
            </div>

            {/* Current Balance */}
            <CreditDisplay showBuyButton={false} />

            {/* Tabs */}
            <Tabs defaultValue="packages" className="w-full">
                <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
                    <TabsTrigger value="packages">Paket Kredit</TabsTrigger>
                    <TabsTrigger value="pricing">Harga Layanan</TabsTrigger>
                    <TabsTrigger value="history">Riwayat</TabsTrigger>
                </TabsList>

                {/* Credit Packages */}
                <TabsContent value="packages" className="mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {Object.entries(CREDIT_PACKAGES).map(([key, pkg]) => {
                            const Icon = packageIcons[key as keyof typeof packageIcons]
                            const colorClass = packageColors[key as keyof typeof packageColors]
                            const isPopular = 'popular' in pkg && pkg.popular

                            return (
                                <Card
                                    key={key}
                                    className={`relative overflow-hidden transition-all hover:shadow-lg ${isPopular ? 'ring-2 ring-purple-500' : ''
                                        }`}
                                >
                                    {isPopular && (
                                        <div className="absolute top-0 right-0">
                                            <Badge className="rounded-none rounded-bl-lg bg-purple-500">
                                                Populer
                                            </Badge>
                                        </div>
                                    )}

                                    <CardHeader>
                                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorClass} flex items-center justify-center mb-4`}>
                                            <Icon className="w-6 h-6 text-white" />
                                        </div>
                                        <CardTitle className="text-xl">{pkg.name}</CardTitle>
                                        <CardDescription>{pkg.description}</CardDescription>
                                    </CardHeader>

                                    <CardContent className="space-y-4">
                                        <div>
                                            <span className="text-3xl font-bold">{formatPrice(pkg.price)}</span>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <Check className="w-4 h-4 text-green-500" />
                                                <span>{formatCredits(pkg.credits)} kredit</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Check className="w-4 h-4 text-green-500" />
                                                <span>{formatPrice(pkg.pricePerCredit)}/kredit</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Check className="w-4 h-4 text-green-500" />
                                                <span>Tidak ada masa berlaku</span>
                                            </div>
                                        </div>
                                    </CardContent>

                                    <CardFooter>
                                        <Button
                                            className={`w-full bg-gradient-to-r ${colorClass} hover:opacity-90`}
                                            onClick={() => handlePurchase(key)}
                                            disabled={isPurchasing}
                                        >
                                            {isPurchasing && selectedPackage === key ? (
                                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                            ) : (
                                                <Coins className="w-4 h-4 mr-2" />
                                            )}
                                            Beli Sekarang
                                        </Button>
                                    </CardFooter>
                                </Card>
                            )
                        })}
                    </div>
                </TabsContent>

                {/* Pricing */}
                <TabsContent value="pricing" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Harga Layanan per Operasi</CardTitle>
                            <CardDescription>
                                Biaya kredit untuk setiap jenis operasi AI
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                                            <ImageIcon className="w-5 h-5 text-purple-500" />
                                        </div>
                                        <div>
                                            <p className="font-medium">Text to Image</p>
                                            <p className="text-sm text-muted-foreground">Generate gambar dari teks</p>
                                        </div>
                                    </div>
                                    <Badge variant="secondary" className="text-lg">
                                        {CREDIT_COSTS.textToImage} kredit
                                    </Badge>
                                </div>

                                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-pink-500/20 flex items-center justify-center">
                                            <ImageIcon className="w-5 h-5 text-pink-500" />
                                        </div>
                                        <div>
                                            <p className="font-medium">Image to Image</p>
                                            <p className="text-sm text-muted-foreground">Edit gambar dengan AI</p>
                                        </div>
                                    </div>
                                    <Badge variant="secondary" className="text-lg">
                                        {CREDIT_COSTS.imageToImage} kredit
                                    </Badge>
                                </div>

                                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                                            <Video className="w-5 h-5 text-blue-500" />
                                        </div>
                                        <div>
                                            <p className="font-medium">Text to Video</p>
                                            <p className="text-sm text-muted-foreground">Generate video dari teks</p>
                                        </div>
                                    </div>
                                    <Badge variant="secondary" className="text-lg">
                                        {CREDIT_COSTS.textToVideo} kredit
                                    </Badge>
                                </div>

                                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                                            <Video className="w-5 h-5 text-cyan-500" />
                                        </div>
                                        <div>
                                            <p className="font-medium">Image to Video</p>
                                            <p className="text-sm text-muted-foreground">Animasi dari gambar</p>
                                        </div>
                                    </div>
                                    <Badge variant="secondary" className="text-lg">
                                        {CREDIT_COSTS.imageToVideo} kredit
                                    </Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* History */}
                <TabsContent value="history" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <History className="w-5 h-5" />
                                Riwayat Transaksi
                            </CardTitle>
                            <CardDescription>
                                20 transaksi kredit terakhir
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {historyLoading ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                                </div>
                            ) : history.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    Belum ada riwayat transaksi
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {history.map((item) => (
                                        <div
                                            key={item.id}
                                            className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${item.amount > 0 ? 'bg-green-500/20' : 'bg-red-500/20'
                                                    }`}>
                                                    {item.amount > 0 ? (
                                                        <ArrowUpRight className="w-4 h-4 text-green-500" />
                                                    ) : (
                                                        <ArrowDownRight className="w-4 h-4 text-red-500" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-sm">{item.description}</p>
                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                        <Badge variant="outline" className={getTypeColor(item.type)}>
                                                            {getTypeLabel(item.type)}
                                                        </Badge>
                                                        <span>•</span>
                                                        <span>{item.createdAt.toLocaleDateString('id-ID')}</span>
                                                        <span>{item.createdAt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className={`font-semibold ${item.amount > 0 ? 'text-green-500' : 'text-red-500'}`}>
                                                    {item.amount > 0 ? '+' : ''}{formatCredits(item.amount)}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    Saldo: {formatCredits(item.balanceAfter)}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
