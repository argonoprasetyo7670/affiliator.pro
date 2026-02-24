"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    ImageIcon,
    Sparkles,
    FileImage,
    Trash2,
    Download,
    AlertCircle,
    CheckCircle2
} from "lucide-react"
import { toast } from "sonner"
import {
    checkFlowExtension,
    requestRecaptchaToken,
    generateFlowImage,
    getStoredAuthToken,
    storeAuthToken,
    type AspectRatio
} from "@/lib/flow-image"

interface ImageJob {
    id: string
    prompt: string
    status: "pending" | "processing" | "completed" | "failed"
    aspectRatio: string
    createdAt: Date
    imageUrl?: string
    error?: string
}

export default function AutomationImagePage() {
    const [prompt, setPrompt] = useState("")
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>("16:9")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [imageJobs, setImageJobs] = useState<ImageJob[]>([])
    const [isExtensionConnected, setIsExtensionConnected] = useState(false)
    const [authToken, setAuthToken] = useState("")

    // Check extension on mount
    useEffect(() => {
        checkFlowExtension().then(setIsExtensionConnected)
        const stored = getStoredAuthToken()
        if (stored) setAuthToken(stored)
    }, [])

    const handleSubmit = async () => {
        if (!prompt.trim()) {
            toast.error("Masukkan prompt terlebih dahulu")
            return
        }

        if (!authToken.trim()) {
            toast.error("Masukkan Auth Token terlebih dahulu")
            return
        }

        if (!isExtensionConnected) {
            toast.error("Extension tidak terhubung. Refresh halaman dan pastikan extension aktif.")
            return
        }

        setIsSubmitting(true)

        // Create new job
        const jobId = Date.now().toString()
        const newJob: ImageJob = {
            id: jobId,
            prompt: prompt.trim(),
            status: "processing",
            aspectRatio,
            createdAt: new Date()
        }

        setImageJobs(prev => [newJob, ...prev])
        const currentPrompt = prompt.trim()
        setPrompt("")

        try {
            // Get reCAPTCHA token from extension
            toast.info("Mendapatkan reCAPTCHA token...")
            const recaptchaToken = await requestRecaptchaToken()

            if (!recaptchaToken) {
                throw new Error("Gagal mendapatkan reCAPTCHA token. Pastikan labs.google sudah login.")
            }

            toast.info("Generating image via extension...")

            // Generate image using extension (bypasses CORS)
            const result = await generateFlowImage({
                prompt: currentPrompt,
                aspectRatio,
                recaptchaToken,
                authToken: authToken.trim(),
                count: 2
            })

            if (result.error) {
                throw new Error(result.error)
            }

            // Update job with first image
            if (result.images && result.images.length > 0) {
                setImageJobs(prev => prev.map(job =>
                    job.id === jobId
                        ? { ...job, status: "completed", imageUrl: result.images[0].imageUrl }
                        : job
                ))

                // Add additional images as new jobs
                for (let i = 1; i < result.images.length; i++) {
                    const additionalJob: ImageJob = {
                        id: `${jobId}-${i}`,
                        prompt: currentPrompt,
                        status: "completed",
                        aspectRatio,
                        createdAt: new Date(),
                        imageUrl: result.images[i].imageUrl
                    }
                    setImageJobs(prev => [additionalJob, ...prev])
                }

                toast.success(`${result.images.length} gambar berhasil di-generate!`)
            } else {
                throw new Error("No images returned")
            }

        } catch (error) {
            console.error("Generation error:", error)
            setImageJobs(prev => prev.map(job =>
                job.id === jobId
                    ? { ...job, status: "failed", error: String(error) }
                    : job
            ))
            toast.error(String(error))
        } finally {
            setIsSubmitting(false)
        }
    }

    const removeJob = (id: string) => {
        setImageJobs(prev => prev.filter(job => job.id !== id))
        toast.success("Job dihapus")
    }

    const downloadImage = (imageUrl: string, filename: string) => {
        const a = document.createElement("a")
        a.href = imageUrl
        a.download = filename
        a.click()
        toast.success("Gambar diunduh!")
    }

    const getStatusBadge = (status: ImageJob["status"]) => {
        switch (status) {
            case "pending":
                return <Badge variant="secondary">Pending</Badge>
            case "processing":
                return <Badge variant="default" className="bg-blue-500">Processing</Badge>
            case "completed":
                return <Badge variant="default" className="bg-green-500">Completed</Badge>
            case "failed":
                return <Badge variant="destructive">Failed</Badge>
        }
    }

    return (
        <div className="p-4 md:p-6 space-y-6">
            {/* Extension Status */}
            <Card className={isExtensionConnected ? "border-green-500/50" : "border-amber-500/50"}>
                <CardContent className="py-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {isExtensionConnected ? (
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                            ) : (
                                <AlertCircle className="w-4 h-4 text-amber-500" />
                            )}
                            <span className="text-sm">
                                Extension: {isExtensionConnected ? "Terhubung" : "Tidak Terhubung"}
                            </span>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => checkFlowExtension().then(setIsExtensionConnected)}
                        >
                            Refresh
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Auth Token Input */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base">Auth Token</CardTitle>
                    <CardDescription className="text-xs">
                        Bearer token dari labs.google (Network tab → batchGenerateImages → Authorization header)
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-2">
                        <Input
                            type="password"
                            placeholder="ya29.a0..."
                            value={authToken}
                            onChange={(e) => setAuthToken(e.target.value)}
                            className="font-mono text-xs"
                        />
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                storeAuthToken(authToken)
                                toast.success("Token tersimpan!")
                            }}
                        >
                            Simpan
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* New Image Job Form */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
                            <ImageIcon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <CardTitle className="text-lg">Generate Image</CardTitle>
                            <CardDescription>
                                Buat gambar dengan Google Flow AI via Extension
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Prompt</Label>
                        <Textarea
                            placeholder="Deskripsikan gambar yang ingin dibuat..."
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            rows={3}
                        />
                    </div>

                    <div className="flex gap-4 flex-wrap">
                        <div className="space-y-2 flex-1 min-w-[150px]">
                            <Label>Aspect Ratio</Label>
                            <Select value={aspectRatio} onValueChange={(v) => setAspectRatio(v as AspectRatio)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="16:9">🖼️ Landscape (16:9)</SelectItem>
                                    <SelectItem value="9:16">📱 Portrait (9:16)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <Button
                        onClick={handleSubmit}
                        disabled={!prompt.trim() || !authToken.trim() || !isExtensionConnected || isSubmitting}
                        className="w-full sm:w-auto"
                    >
                        {isSubmitting ? (
                            <>
                                <div className="w-4 h-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Generating...
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-4 h-4 mr-2" />
                                Generate Image
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>

            {/* Image Jobs Queue */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                                <FileImage className="w-5 h-5" />
                            </div>
                            <div>
                                <CardTitle className="text-lg">Generated Images</CardTitle>
                                <CardDescription>
                                    {imageJobs.length} gambar
                                </CardDescription>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {imageJobs.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <FileImage className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>Belum ada gambar</p>
                            <p className="text-sm">Buat gambar baru dengan form di atas</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {imageJobs.map((job) => (
                                <div
                                    key={job.id}
                                    className="border rounded-lg overflow-hidden bg-muted/30"
                                >
                                    <div className="aspect-square bg-muted flex items-center justify-center relative">
                                        {job.status === "completed" && job.imageUrl ? (
                                            <img
                                                src={job.imageUrl}
                                                alt={job.prompt}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : job.status === "processing" ? (
                                            <div className="w-10 h-10 border-4 border-muted-foreground/20 border-t-pink-500 rounded-full animate-spin" />
                                        ) : job.status === "failed" ? (
                                            <div className="text-center p-4">
                                                <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-2" />
                                                <p className="text-xs text-destructive line-clamp-2">{job.error}</p>
                                            </div>
                                        ) : (
                                            <ImageIcon className="w-12 h-12 text-muted-foreground/50" />
                                        )}
                                    </div>
                                    <div className="p-3 space-y-2">
                                        <p className="text-sm line-clamp-2">{job.prompt}</p>
                                        <div className="flex items-center justify-between">
                                            {getStatusBadge(job.status)}
                                            <div className="flex gap-1">
                                                {job.status === "completed" && job.imageUrl && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                        onClick={() => downloadImage(job.imageUrl!, `flow-${job.id}.png`)}
                                                    >
                                                        <Download className="w-4 h-4" />
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                    onClick={() => removeJob(job.id)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                        <Badge variant="outline" className="text-xs">
                                            {job.aspectRatio}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
