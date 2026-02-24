import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CREDIT_PACKAGES, CREDIT_COSTS, formatPrice } from "@/lib/credit-packages"
import { Package, Zap, Image, Video, FileImage, FileVideo } from "lucide-react"

export default function AdminPackagesPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Package Configuration</h1>
                <p className="text-muted-foreground">
                    Lihat konfigurasi paket dan biaya kredit
                </p>
            </div>

            {/* Credit Packages */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        Credit Packages
                    </CardTitle>
                    <CardDescription>
                        Paket kredit yang tersedia untuk user
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-3">
                        {Object.values(CREDIT_PACKAGES).map((pkg) => (
                            <div
                                key={pkg.id}
                                className="relative rounded-lg border p-4 space-y-3"
                            >
                                {'popular' in pkg && pkg.popular && (
                                    <Badge className="absolute -top-2 right-4 bg-gradient-to-r from-orange-500 to-red-500">
                                        Popular
                                    </Badge>
                                )}
                                <div>
                                    <h3 className="font-semibold text-lg">{pkg.name}</h3>
                                    <p className="text-sm text-muted-foreground">
                                        {pkg.description}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-2xl font-bold">{formatPrice(pkg.price)}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {pkg.credits} credits
                                    </p>
                                </div>
                                <div className="pt-2 border-t">
                                    <p className="text-sm">
                                        <span className="text-muted-foreground">Price per credit: </span>
                                        <span className="font-medium">{formatPrice(pkg.pricePerCredit)}</span>
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Credit Costs */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Zap className="h-5 w-5" />
                        Credit Costs
                    </CardTitle>
                    <CardDescription>
                        Biaya kredit untuk setiap operasi
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <div className="flex items-center gap-3 rounded-lg border p-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500">
                                <Image className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <p className="font-medium">Text to Image</p>
                                <p className="text-sm text-muted-foreground">
                                    {CREDIT_COSTS.textToImage} credit
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 rounded-lg border p-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
                                <FileImage className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <p className="font-medium">Image to Image</p>
                                <p className="text-sm text-muted-foreground">
                                    {CREDIT_COSTS.imageToImage} credit
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 rounded-lg border p-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-red-500">
                                <Video className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <p className="font-medium">Text to Video</p>
                                <p className="text-sm text-muted-foreground">
                                    {CREDIT_COSTS.textToVideo} credit
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 rounded-lg border p-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-green-500 to-emerald-500">
                                <FileVideo className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <p className="font-medium">Image to Video</p>
                                <p className="text-sm text-muted-foreground">
                                    {CREDIT_COSTS.imageToVideo} credit
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Instructions */}
            <Card>
                <CardHeader>
                    <CardTitle>Mengubah Konfigurasi</CardTitle>
                    <CardDescription>
                        Cara mengubah paket dan biaya kredit
                    </CardDescription>
                </CardHeader>
                <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                    <p>
                        Untuk mengubah konfigurasi paket atau biaya kredit, edit file berikut:
                    </p>
                    <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
                        <code>lib/credit-packages.ts</code>
                    </pre>
                    <p>Struktur file:</p>
                    <ul>
                        <li>
                            <code>CREDIT_PACKAGES</code> - Daftar paket kredit (nama, harga, jumlah kredit)
                        </li>
                        <li>
                            <code>CREDIT_COSTS</code> - Biaya kredit per operasi (text-to-image, video, dll)
                        </li>
                    </ul>
                    <blockquote className="border-l-4 border-yellow-500 pl-4 text-yellow-600 dark:text-yellow-400">
                        <strong>Catatan:</strong> Setelah mengubah file, restart aplikasi agar perubahan berlaku.
                    </blockquote>
                </CardContent>
            </Card>
        </div>
    )
}
