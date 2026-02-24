"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
    CheckCircle2,
    XCircle,
    RefreshCw,
    Copy,
    ExternalLink,
    Loader2,
    Shield,
    Key,
    Zap,
    AlertCircle,
    Download
} from "lucide-react"
import { toast } from "sonner"

interface ExtensionStatus {
    isInstalled: boolean
    isConnected: boolean
    version?: string
    lastChecked: Date
}

interface CapturedToken {
    token: string
    capturedAt: string
}

export default function AutomationToolsPage() {
    const [extensionStatus, setExtensionStatus] = useState<ExtensionStatus>({
        isInstalled: false,
        isConnected: false,
        lastChecked: new Date()
    })
    const [isCheckingExtension, setIsCheckingExtension] = useState(false)
    const [isGeneratingToken, setIsGeneratingToken] = useState(false)
    const [capturedToken, setCapturedToken] = useState<CapturedToken | null>(null)
    const [manualToken, setManualToken] = useState("")
    const [mounted, setMounted] = useState(false)

    // Check extension via content bridge (custom events)
    const checkExtension = useCallback(async () => {
        setIsCheckingExtension(true)

        try {
            // Method 1: Check for data attribute set by content bridge
            const hasAttribute = document.documentElement.hasAttribute('data-affiliator-pro-extension')

            if (hasAttribute) {
                setExtensionStatus({
                    isInstalled: true,
                    isConnected: true,
                    version: '2.0.0',
                    lastChecked: new Date()
                })
                return
            }

            // Method 2: Try ping via custom event
            const requestId = Date.now().toString()
            let resolved = false

            const handlePong = (event: CustomEvent) => {
                if (event.detail?.requestId === requestId) {
                    resolved = true
                    setExtensionStatus({
                        isInstalled: true,
                        isConnected: true,
                        version: event.detail.version || '2.0.0',
                        lastChecked: new Date()
                    })
                }
            }

            window.addEventListener('AFFILIATOR_PRO_PONG', handlePong as EventListener)

            // Dispatch ping event
            window.dispatchEvent(new CustomEvent('AFFILIATOR_PRO_PING', {
                detail: { requestId }
            }))

            // Wait for response
            await new Promise(resolve => setTimeout(resolve, 2000))

            window.removeEventListener('AFFILIATOR_PRO_PONG', handlePong as EventListener)

            if (!resolved) {
                setExtensionStatus({
                    isInstalled: false,
                    isConnected: false,
                    lastChecked: new Date()
                })
            }

        } catch (error) {
            console.error('Extension check failed:', error)
            setExtensionStatus({
                isInstalled: false,
                isConnected: false,
                lastChecked: new Date()
            })
        } finally {
            setIsCheckingExtension(false)
        }
    }, [])

    // Generate token via extension
    const generateToken = async () => {
        if (!extensionStatus.isConnected) {
            toast.error("Extension tidak terhubung")
            return
        }

        setIsGeneratingToken(true)

        try {
            const requestId = Date.now().toString()
            let resolved = false

            const handleResponse = (event: CustomEvent) => {
                if (event.detail?.requestId === requestId) {
                    resolved = true
                    if (event.detail.success && event.detail.token) {
                        setCapturedToken({
                            token: event.detail.token,
                            capturedAt: new Date().toISOString()
                        })
                        toast.success("Token berhasil di-generate!")
                    } else {
                        toast.error(event.detail.error || "Gagal generate token")
                    }
                }
            }

            window.addEventListener('AFFILIATOR_PRO_TOKEN_RESPONSE', handleResponse as EventListener)

            // Request token via extension
            window.dispatchEvent(new CustomEvent('AFFILIATOR_PRO_REQUEST_TOKEN', {
                detail: {
                    requestId,
                    sitekey: '6LdsFiUsAAAAAIjVDZcuLhaHiDn5nnHVXVRQGeMV',
                    action: 'VIDEO_GENERATION'
                }
            }))

            // Wait for response (max 60 seconds for token generation)
            await new Promise(resolve => setTimeout(resolve, 60000))

            window.removeEventListener('AFFILIATOR_PRO_TOKEN_RESPONSE', handleResponse as EventListener)

            if (!resolved) {
                toast.error("Timeout - tidak ada response dari extension")
            }

        } catch (error) {
            console.error('Token generation failed:', error)
            toast.error("Gagal generate token")
        } finally {
            setIsGeneratingToken(false)
        }
    }

    // Copy token to clipboard
    const copyToken = async (token: string) => {
        try {
            await navigator.clipboard.writeText(token)
            toast.success("Token berhasil dicopy!")
        } catch {
            // Fallback
            const ta = document.createElement('textarea')
            ta.value = token
            document.body.appendChild(ta)
            ta.select()
            document.execCommand('copy')
            document.body.removeChild(ta)
            toast.success("Token berhasil dicopy!")
        }
    }

    // Save manual token
    const saveManualToken = () => {
        if (!manualToken.trim()) {
            toast.error("Masukkan token terlebih dahulu")
            return
        }
        setCapturedToken({
            token: manualToken.trim(),
            capturedAt: new Date().toISOString()
        })
        localStorage.setItem('ap_user_token', manualToken.trim())
        toast.success("Token berhasil disimpan!")
        setManualToken("")
    }

    // Check extension on mount
    useEffect(() => {
        setMounted(true)
        checkExtension()

        // Listen for token captured events
        const handleTokenCaptured = (event: MessageEvent) => {
            if (event.data?.type === 'AFFILIATOR_PRO_TOKEN_CAPTURED' && event.data.token) {
                setCapturedToken({
                    token: event.data.token,
                    capturedAt: new Date().toISOString()
                })
                toast.success("Token otomatis ter-capture!")
            }
        }

        window.addEventListener('message', handleTokenCaptured)
        return () => window.removeEventListener('message', handleTokenCaptured)
    }, [checkExtension])

    // Format relative time
    const formatRelativeTime = (isoString: string) => {
        const date = new Date(isoString)
        const now = new Date()
        const diffMin = Math.floor((now.getTime() - date.getTime()) / 60000)

        if (diffMin < 1) return "Baru saja"
        if (diffMin < 60) return `${diffMin} menit lalu`
        if (diffMin < 1440) return `${Math.floor(diffMin / 60)} jam lalu`
        return date.toLocaleDateString('id-ID')
    }

    return (
        <div className="p-4 md:p-6 space-y-6">
            {/* Extension Status Card */}
            <Card className="border-2">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${extensionStatus.isConnected
                                ? 'bg-green-500/20'
                                : 'bg-red-500/20'
                                }`}>
                                <Shield className={`w-5 h-5 ${extensionStatus.isConnected
                                    ? 'text-green-500'
                                    : 'text-red-500'
                                    }`} />
                            </div>
                            <div>
                                <CardTitle className="text-lg">AP Extension</CardTitle>
                                <CardDescription>
                                    Chrome extension untuk auto-capture token
                                </CardDescription>
                            </div>
                        </div>
                        <Badge variant={extensionStatus.isConnected ? "default" : "destructive"}>
                            {extensionStatus.isConnected ? (
                                <><CheckCircle2 className="w-3 h-3 mr-1" /> Connected</>
                            ) : (
                                <><XCircle className="w-3 h-3 mr-1" /> Not Connected</>
                            )}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Status Info */}
                    <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">Status:</span>
                            <span className={extensionStatus.isConnected ? 'text-green-500' : 'text-red-500'}>
                                {extensionStatus.isConnected ? 'Terhubung' : 'Tidak Terhubung'}
                            </span>
                        </div>
                        {extensionStatus.version && (
                            <div className="flex items-center gap-2">
                                <span className="text-muted-foreground">Version:</span>
                                <span>v{extensionStatus.version}</span>
                            </div>
                        )}
                        <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">Last Check:</span>
                            <span>{mounted ? extensionStatus.lastChecked.toLocaleTimeString('id-ID') : '--:--:--'}</span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={checkExtension}
                            disabled={isCheckingExtension}
                        >
                            {isCheckingExtension ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <RefreshCw className="w-4 h-4 mr-2" />
                            )}
                            Refresh Status
                        </Button>

                        {!extensionStatus.isConnected && (
                            <Button
                                variant="default"
                                size="sm"
                                onClick={() => window.open('https://labs.google/fx/tools/flow', '_blank')}
                            >
                                <ExternalLink className="w-4 h-4 mr-2" />
                                Buka labs.google
                            </Button>
                        )}
                    </div>

                    {/* Installation Instructions */}
                    {!extensionStatus.isInstalled && (
                        <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5" />
                                <div className="space-y-2">
                                    <p className="text-sm font-medium text-amber-500">Extension Belum Terinstall</p>
                                    <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                                        <li>Download extension AP Client 2.0</li>
                                        <li>Buka chrome://extensions di browser</li>
                                        <li>Aktifkan "Developer mode"</li>
                                        <li>Klik "Load unpacked" dan pilih folder extension</li>
                                        <li>Refresh halaman ini setelah install</li>
                                    </ol>
                                    <a href="/affiliator-pro-extension.zip" download>
                                        <Button variant="outline" size="sm" className="mt-2">
                                            <Download className="w-4 h-4 mr-2" />
                                            Download Extension
                                        </Button>
                                    </a>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Token Generation Card */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                            <Key className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <CardTitle className="text-lg">Token Generator</CardTitle>
                            <CardDescription>
                                Generate atau input token reCAPTCHA untuk API
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Auto Generate */}
                    <div className="space-y-3">
                        <Label className="text-sm font-medium">Auto Generate (via Extension)</Label>
                        <Button
                            onClick={generateToken}
                            disabled={!extensionStatus.isConnected || isGeneratingToken}
                            className="w-full sm:w-auto"
                        >
                            {isGeneratingToken ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <Zap className="w-4 h-4 mr-2" />
                                    Generate Token
                                </>
                            )}
                        </Button>
                        {!extensionStatus.isConnected && (
                            <p className="text-xs text-muted-foreground">
                                Install dan hubungkan extension terlebih dahulu
                            </p>
                        )}
                    </div>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">atau</span>
                        </div>
                    </div>

                    {/* Manual Input */}
                    <div className="space-y-3">
                        <Label className="text-sm font-medium">Manual Input Token</Label>
                        <div className="flex gap-2">
                            <Input
                                placeholder="Paste token dari extension popup..."
                                value={manualToken}
                                onChange={(e) => setManualToken(e.target.value)}
                                className="flex-1 font-mono text-sm"
                            />
                            <Button onClick={saveManualToken} disabled={!manualToken.trim()}>
                                Simpan
                            </Button>
                        </div>
                    </div>

                    {/* Current Token */}
                    {capturedToken && (
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">Token Aktif</Label>
                            <div className="p-3 bg-muted/50 rounded-lg border">
                                <div className="flex items-center justify-between mb-2">
                                    <Badge variant="secondary" className="text-xs">
                                        <CheckCircle2 className="w-3 h-3 mr-1 text-green-500" />
                                        Valid Token
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">
                                        {formatRelativeTime(capturedToken.capturedAt)}
                                    </span>
                                </div>
                                <div className="flex gap-2">
                                    <code className="flex-1 text-xs bg-background p-2 rounded border overflow-x-auto whitespace-nowrap">
                                        {capturedToken.token.slice(0, 50)}...
                                    </code>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => copyToken(capturedToken.token)}
                                    >
                                        <Copy className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Requirements Card */}
            <Card className="border-2 border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-orange-500/10">
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                            <AlertCircle className="w-5 h-5 text-amber-500" />
                        </div>
                        <div>
                            <CardTitle className="text-lg">Syarat Penggunaan</CardTitle>
                            <CardDescription>
                                Harap penuhi syarat berikut sebelum menggunakan tools
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-3">
                        <div className="flex items-start gap-3 p-3 bg-background/50 rounded-lg border">
                            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                                <span className="text-blue-500 font-bold text-sm">1</span>
                            </div>
                            <div>
                                <p className="font-medium text-sm">Wajib Menggunakan Laptop/PC</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Tools ini hanya bisa dijalankan di laptop atau komputer. Tidak support untuk perangkat mobile.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 p-3 bg-background/50 rounded-lg border">
                            <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                                <span className="text-purple-500 font-bold text-sm">2</span>
                            </div>
                            <div>
                                <p className="font-medium text-sm">Akun Google Flow Ultra</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Anda wajib memiliki akun Google Flow Ultra untuk dapat menggunakan fitur automation tools ini.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 p-3 bg-background/50 rounded-lg border">
                            <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                                <span className="text-green-500 font-bold text-sm">3</span>
                            </div>
                            <div>
                                <p className="font-medium text-sm">Akses Lifetime</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Tools bersifat lifetime - sekali bayar, akses selamanya tanpa biaya tambahan.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 p-3 bg-background/50 rounded-lg border">
                            <div className="w-8 h-8 rounded-full bg-pink-500/20 flex items-center justify-center flex-shrink-0">
                                <span className="text-pink-500 font-bold text-sm">4</span>
                            </div>
                            <div>
                                <p className="font-medium text-sm">Pembayaran via Admin</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Untuk melakukan pembayaran, silakan hubungi admin melalui fitur chat atau kontak yang tersedia.
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Usage Instructions */}
            <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                <CardHeader>
                    <CardTitle className="text-lg">Cara Penggunaan</CardTitle>
                </CardHeader>
                <CardContent>
                    <ol className="space-y-3 text-sm">
                        <li className="flex items-start gap-3">
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">1</span>
                            <span>Install extension AP Client 2.0 dari folder <code className="px-1 bg-muted rounded">ap-extension</code></span>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">2</span>
                            <span>Buka <a href="https://labs.google/fx/tools/flow" target="_blank" className="text-primary underline">labs.google/fx/tools/flow</a> dan login dengan akun Google</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">3</span>
                            <span>Token akan otomatis ter-capture ketika generate video di labs.google</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">4</span>
                            <span>Gunakan tab Video Tools atau Image Tools untuk generate konten</span>
                        </li>
                    </ol>
                </CardContent>
            </Card>
        </div>
    )
}
