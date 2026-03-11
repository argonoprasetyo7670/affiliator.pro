"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Send,
    Image as ImageIcon,
    Images,
    X,
    Loader2,
    Download,
    Play,
    Shield,
} from "lucide-react"
import { submitTextToVideo, submitImageToVideo } from "@/app/actions/generate-video-captcha"
import { generateImageToVideo, generateReferenceToVideo, checkVideoJobStatus } from "@/app/actions/generate-video"
import { toast } from "sonner"

type AspectRatio = "landscape" | "portrait"
type ImageMode = "startFrame" | "reference"

interface GeneratedVideo {
    id: string
    prompt: string
    videoUrl: string
    aspectRatio: AspectRatio
    startImage: string | null
    referenceImages?: string[]
    createdAt: Date
    mediaGenerationId?: string
}

const aspectRatioOptions: { value: AspectRatio; label: string; icon: string }[] = [
    { value: "landscape", label: "Landscape (16:9)", icon: "🖼️" },
    { value: "portrait", label: "Portrait (9:16)", icon: "📱" },
]



export default function VideoCaptchaPage() {
    const [prompt, setPrompt] = useState("")
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>("landscape")
    const [imageMode, setImageMode] = useState<ImageMode>("startFrame")
    const [startImage, setStartImage] = useState<string | null>(null)
    const [referenceImages, setReferenceImages] = useState<string[]>([])
    const [isGenerating, setIsGenerating] = useState(false)
    const [generatedVideos, setGeneratedVideos] = useState<GeneratedVideo[]>([])
    const [previewVideo, setPreviewVideo] = useState<string | null>(null)
    const [previewAspectRatio, setPreviewAspectRatio] = useState<AspectRatio>("landscape")
    const fileInputRef = useRef<HTMLInputElement>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files || files.length === 0) return

        if (imageMode === "startFrame") {
            const file = files[0]
            if (!file.type.startsWith('image/')) {
                toast.error("Pilih file gambar")
                return
            }
            if (file.size > 10 * 1024 * 1024) {
                toast.error("Ukuran gambar maksimal 10MB")
                return
            }
            const reader = new FileReader()
            reader.onload = (event) => {
                if (event.target?.result) {
                    setStartImage(event.target.result as string)
                    toast.success("Gambar start frame ditambahkan")
                }
            }
            reader.onerror = () => toast.error("Gagal membaca file gambar")
            reader.readAsDataURL(file)
        } else {
            // Reference mode: up to 3 images
            const remainingSlots = 3 - referenceImages.length
            if (remainingSlots <= 0) {
                toast.error("Maksimal 3 reference images")
                return
            }
            const filesToProcess = Array.from(files).slice(0, remainingSlots)
            for (const file of filesToProcess) {
                if (!file.type.startsWith('image/')) continue
                if (file.size > 10 * 1024 * 1024) continue
                const reader = new FileReader()
                reader.onload = (event) => {
                    if (event.target?.result) {
                        setReferenceImages(prev => [...prev, event.target!.result as string])
                    }
                }
                reader.readAsDataURL(file)
            }
            toast.success(`Reference image ditambahkan`)
        }

        if (fileInputRef.current) fileInputRef.current.value = ""
    }

    const removeStartImage = () => {
        setStartImage(null)
    }

    const removeReferenceImage = (index: number) => {
        setReferenceImages(prev => prev.filter((_, i) => i !== index))
    }

    const switchImageMode = (newMode: ImageMode) => {
        setImageMode(newMode)
        setStartImage(null)
        setReferenceImages([])
    }

    const getProxiedVideoUrl = (url: string) => {
        return `/api/image-proxy?url=${encodeURIComponent(url)}`
    }


    // Poll for job completion
    const pollJobStatus = async (
        jobId: string,
        operation: "textToVideo" | "imageToVideo",
        maxAttempts = 120
    ): Promise<{ videoUrl: string; mediaGenerationId?: string } | null> => {
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            await new Promise(resolve => setTimeout(resolve, 5000))

            const statusResult = await checkVideoJobStatus(jobId, operation)

            if (statusResult.status === "completed" && statusResult.videoUrls?.length) {
                return {
                    videoUrl: statusResult.videoUrls[0],
                    mediaGenerationId: statusResult.mediaGenerationId,
                }
            }

            if (statusResult.status === "failed") {
                throw new Error(statusResult.error || "Job failed")
            }

            if (attempt > 0 && attempt % 6 === 0) {
                toast.info(`Masih memproses... (${Math.round((attempt * 5) / 60)} menit)`)
            }
        }
        throw new Error("Job timed out")
    }

    const handleGenerate = async () => {
        if (!prompt.trim()) return

        setIsGenerating(true)
        const currentPrompt = prompt.trim()
        const currentStartImage = startImage
        const currentReferenceImages = [...referenceImages]

        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
        }, 50)

        try {
            let result
            let operationType: "textToVideo" | "imageToVideo" = "textToVideo"

            if (currentReferenceImages.length > 0) {
                // R2V mode: reference images for style/composition
                toast.info(`Mengupload ${currentReferenceImages.length} reference image & generating...`)
                result = await generateReferenceToVideo({
                    prompt: currentPrompt,
                    referenceImagesBase64: currentReferenceImages,
                    aspectRatio,
                    model: "veo-3.1-fast-relaxed",
                })
                operationType = "imageToVideo"
            } else if (currentStartImage) {
                // I2V mode: start frame
                toast.info("Mengupload gambar & generating...")
                const base64Image = currentStartImage.split(",")[1] || currentStartImage
                result = await generateImageToVideo({
                    prompt: currentPrompt,
                    startImageBase64: base64Image,
                    aspectRatio,
                })
                operationType = "imageToVideo"
            } else {
                // T2V: text-to-video with captcha
                result = await submitTextToVideo({
                    prompt: currentPrompt,
                    model: "veo-3.1-fast-relaxed",
                    aspectRatio,
                })
                operationType = "textToVideo"
            }

            if (!result.success) {
                throw new Error((result as { error?: string; message?: string }).error || (result as { message?: string }).message || "Generate gagal")
            }

            // Poll for completion
            if (result.jobId) {
                const modeLabel = currentReferenceImages.length > 0 ? "R2V" : currentStartImage ? "I2V" : "T2V"
                toast.info(modeLabel === "T2V"
                    ? "🔐 Captcha token injected! Generating video... (1-3 menit)"
                    : `🎬 ${modeLabel} Generating video... (1-3 menit)`)
                const pollResult = await pollJobStatus(result.jobId, operationType)

                if (pollResult?.videoUrl) {
                    const newVideo: GeneratedVideo = {
                        id: Date.now().toString(),
                        prompt: currentPrompt,
                        videoUrl: pollResult.videoUrl,
                        aspectRatio,
                        startImage: currentStartImage,
                        referenceImages: currentReferenceImages.length > 0 ? currentReferenceImages : undefined,
                        createdAt: new Date(),
                        mediaGenerationId: pollResult.mediaGenerationId,
                    }

                    setGeneratedVideos(prev => [...prev, newVideo])
                    setPrompt("")
                    setStartImage(null)
                    setReferenceImages([])
                    toast.success("Video berhasil dibuat! 🎬")

                    setTimeout(() => {
                        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
                    }, 100)
                } else {
                    throw new Error("Tidak ada video URL")
                }
            } else {
                throw new Error("Tidak ada job ID dari server")
            }
        } catch (error) {
            console.error("Generation failed:", error)
            toast.error(error instanceof Error ? error.message : "Generate gagal")
        } finally {
            setIsGenerating(false)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            handleGenerate()
        }
    }

    const downloadVideo = async (videoUrl: string, filename: string) => {
        try {
            const proxiedUrl = getProxiedVideoUrl(videoUrl)
            const response = await fetch(proxiedUrl)
            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = filename
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            window.URL.revokeObjectURL(url)
            toast.success("Video didownload!")
        } catch (error) {
            console.error("Download failed:", error)
            toast.error("Gagal mendownload video")
        }
    }

    const getAspectRatioClass = (ratio: AspectRatio) => {
        switch (ratio) {
            case "landscape": return "aspect-video"
            case "portrait": return "aspect-[3/4] max-h-[400px]"
            default: return "aspect-video"
        }
    }

    return (
        <div className="flex flex-col h-[calc(100vh-5rem)] max-h-[calc(100vh-5rem)]">
            {/* Results Area - Scrollable */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {generatedVideos.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center mb-4">
                            <Shield className="w-10 h-10 text-emerald-500" />
                        </div>
                        <h2 className="text-2xl font-semibold mb-2">Video Generator + Captcha</h2>
                        <p className="text-muted-foreground max-w-md">
                            Generate video dengan captcha token injection otomatis dari server custom Anda.
                            Mendukung Text-to-Video dan Image-to-Video.
                        </p>
                        <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full">
                                <Shield className="w-3 h-3" />
                                Captcha Protected
                            </span>
                            <span>⏱️ 1-3 menit per video</span>
                        </div>
                    </div>
                ) : (
                    generatedVideos.map((video) => (
                        <div key={video.id} className="space-y-3">
                            {/* User prompt bubble */}
                            <div className="flex justify-end">
                                <div className="bg-primary text-primary-foreground rounded-2xl rounded-br-sm px-4 py-2 max-w-[80%]">
                                    <p className="text-sm">{video.prompt}</p>
                                    {video.startImage && (
                                        <div className="mt-2">
                                            <img
                                                src={video.startImage}
                                                alt="Start frame"
                                                className="w-12 h-12 rounded object-cover"
                                            />
                                        </div>
                                    )}
                                    {video.referenceImages && video.referenceImages.length > 0 && (
                                        <div className="mt-2 flex gap-1">
                                            {video.referenceImages.map((img, idx) => (
                                                <img
                                                    key={idx}
                                                    src={img}
                                                    alt={`Reference ${idx + 1}`}
                                                    className="w-10 h-10 rounded object-cover"
                                                />
                                            ))}
                                            <span className="text-[10px] self-end opacity-70">R2V</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Generated video */}
                            <div className="flex justify-start">
                                <Card className="overflow-hidden max-w-md w-full bg-gradient-to-br from-background to-muted/30 border-muted-foreground/20">
                                    {/* Video container */}
                                    <div className={`${getAspectRatioClass(video.aspectRatio)} w-full relative overflow-hidden bg-black`}>
                                        <video
                                            src={getProxiedVideoUrl(video.videoUrl)}
                                            controls
                                            playsInline
                                            preload="metadata"
                                            className="w-full h-full object-contain"
                                            poster=""
                                        />
                                    </div>

                                    {/* Info and actions */}
                                    <div className="p-3 space-y-3">
                                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                                            <span className="flex items-center gap-1.5">
                                                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
                                                {video.aspectRatio === "landscape" ? "🖼️ Landscape" : "📱 Portrait"}
                                                <span className="text-emerald-500 ml-1">🔐 Captcha</span>
                                            </span>
                                            <span>{video.createdAt.toLocaleTimeString()}</span>
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="flex-1 min-w-[80px]"
                                                onClick={() => {
                                                    setPreviewVideo(getProxiedVideoUrl(video.videoUrl))
                                                    setPreviewAspectRatio(video.aspectRatio)
                                                }}
                                            >
                                                <Play className="w-4 h-4 mr-1" />
                                                Preview
                                            </Button>
                                            <Button
                                                variant="default"
                                                size="sm"
                                                className="flex-1 min-w-[80px]"
                                                onClick={() => downloadVideo(video.videoUrl, `captcha-video-${video.id}.mp4`)}
                                            >
                                                <Download className="w-4 h-4 mr-1" />
                                                Download
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        </div>
                    ))
                )}

                {isGenerating && (
                    <div className="flex justify-start">
                        <Card className="p-6">
                            <div className="flex items-center gap-3">
                                <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
                                <div>
                                    <span className="text-sm text-muted-foreground">Generating video dengan captcha...</span>
                                    <p className="text-xs text-muted-foreground mt-1">⏱️ Estimasi 1-3 menit</p>
                                </div>
                            </div>
                        </Card>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input Area - Fixed at bottom */}
            <div className="border-t bg-background p-3">
                {/* Image Previews */}
                {(startImage || referenceImages.length > 0) && (
                    <div className="flex gap-2 mb-3 flex-wrap">
                        {imageMode === "startFrame" && startImage && (
                            <div className="relative">
                                <img
                                    src={startImage}
                                    alt="Start frame"
                                    className="w-14 h-14 rounded-lg object-cover border"
                                />
                                <button
                                    onClick={removeStartImage}
                                    className="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[10px] bg-emerald-500 text-white px-1 rounded">
                                    Start
                                </span>
                            </div>
                        )}
                        {imageMode === "reference" && referenceImages.map((img, idx) => (
                            <div key={idx} className="relative">
                                <img
                                    src={img}
                                    alt={`Reference ${idx + 1}`}
                                    className="w-14 h-14 rounded-lg object-cover border"
                                />
                                <button
                                    onClick={() => removeReferenceImage(idx)}
                                    className="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[10px] bg-purple-500 text-white px-1 rounded">
                                    Ref {idx + 1}
                                </span>
                            </div>
                        ))}
                    </div>
                )}

                <div className="flex flex-col gap-2">
                    {/* Top row: Model label + Aspect Ratio + Image Mode */}
                    <div className="flex gap-2 items-center">
                        <span className="px-3 py-2 rounded-md text-sm bg-muted text-muted-foreground whitespace-nowrap">⚡ Veo 3.1 Fast</span>

                        <Select value={aspectRatio} onValueChange={(v) => setAspectRatio(v as AspectRatio)}>
                            <SelectTrigger className="flex-1">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {aspectRatioOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        <span className="flex items-center gap-2">
                                            <span>{option.icon}</span>
                                            <span>{option.label}</span>
                                        </span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={imageMode} onValueChange={(v) => switchImageMode(v as ImageMode)}>
                            <SelectTrigger className="w-[140px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="startFrame">
                                    <span className="flex items-center gap-2">
                                        <ImageIcon className="w-3 h-3" />
                                        <span>Start Frame</span>
                                    </span>
                                </SelectItem>
                                <SelectItem value="reference">
                                    <span className="flex items-center gap-2">
                                        <Images className="w-3 h-3" />
                                        <span>Reference</span>
                                    </span>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Main input row */}
                    <div className="flex gap-2 items-end">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImageUpload}
                            accept="image/jpeg,image/png,image/webp"
                            className="hidden"
                            multiple={imageMode === "reference"}
                        />
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => fileInputRef.current?.click()}
                            className="shrink-0 h-10 w-10"
                            disabled={imageMode === "startFrame" && !!startImage || imageMode === "reference" && referenceImages.length >= 3}
                            title={imageMode === "startFrame" ? "Tambah start image (I2V)" : `Tambah reference image (${referenceImages.length}/3)`}
                        >
                            {imageMode === "reference" ? (
                                <Images className="w-5 h-5" />
                            ) : (
                                <ImageIcon className="w-5 h-5" />
                            )}
                        </Button>

                        <Textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Deskripsikan video yang ingin dibuat..."
                            className="min-h-[40px] max-h-[100px] resize-none flex-1 text-sm"
                            rows={1}
                        />

                        <Button
                            onClick={handleGenerate}
                            disabled={!prompt.trim() || isGenerating}
                            className="shrink-0 h-10 w-10 bg-emerald-600 hover:bg-emerald-700"
                            size="icon"
                        >
                            {isGenerating ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <Send className="w-5 h-5" />
                            )}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Preview Modal */}
            {previewVideo && (
                <div
                    className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
                    onClick={() => setPreviewVideo(null)}
                >
                    <div className={`relative flex items-center justify-center ${previewAspectRatio === "portrait"
                        ? "max-w-[400px] max-h-[95vh]"
                        : "max-w-[95vw] max-h-[85vh]"
                        }`}>
                        <button
                            onClick={() => setPreviewVideo(null)}
                            className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors z-10"
                        >
                            <X className="w-8 h-8" />
                        </button>
                        <video
                            src={previewVideo}
                            controls
                            autoPlay
                            playsInline
                            preload="auto"
                            className={`rounded-lg shadow-2xl ${previewAspectRatio === "portrait"
                                ? "h-[85vh] w-auto max-w-full"
                                : "w-full max-h-[80vh]"
                                }`}
                            style={{ objectFit: "contain" }}
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                </div>
            )}
        </div>
    )
}
