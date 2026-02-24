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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Send,
    Image as ImageIcon,
    X,
    Loader2,
    Download,
    Sparkles,
    Play,
    Video,
    Zap
} from "lucide-react"
import { generateTextToVideo, generateImageToVideo, checkVideoJobStatus, upscaleVideo } from "@/app/actions/generate-video"
import { toast } from "sonner"

type AspectRatio = "landscape" | "portrait"

interface UpscaledVersion {
    resolution: "1080p" | "4K"
    videoUrl: string
    createdAt: Date
}

interface GeneratedVideo {
    id: string
    prompt: string
    videoUrl: string
    aspectRatio: AspectRatio
    startImage: string | null
    createdAt: Date
    mediaGenerationId?: string
    upscaledVersions?: UpscaledVersion[]
}

const aspectRatioOptions: { value: AspectRatio; label: string; icon: string }[] = [
    { value: "landscape", label: "Landscape (16:9)", icon: "🖼️" },
    { value: "portrait", label: "Portrait (9:16)", icon: "📱" },
]

export default function VideoGeneratorPage() {
    const [prompt, setPrompt] = useState("")
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>("landscape")
    const [startImage, setStartImage] = useState<string | null>(null)
    const [isGenerating, setIsGenerating] = useState(false)
    const [generatedVideos, setGeneratedVideos] = useState<GeneratedVideo[]>([])
    const [previewVideo, setPreviewVideo] = useState<string | null>(null)
    const [previewAspectRatio, setPreviewAspectRatio] = useState<AspectRatio>("landscape")
    const [upscalingVideoId, setUpscalingVideoId] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (files && files[0]) {
            const file = files[0]

            // Validate file type
            if (!file.type.startsWith('image/')) {
                toast.error("Please select an image file")
                return
            }

            // Validate file size (max 10MB)
            if (file.size > 10 * 1024 * 1024) {
                toast.error("Image size must be less than 10MB")
                return
            }

            const reader = new FileReader()
            reader.onload = (event) => {
                if (event.target?.result) {
                    const result = event.target.result as string
                    setStartImage(result)
                    toast.success("Start image added")
                }
            }
            reader.onerror = () => {
                toast.error("Failed to read image file")
            }
            reader.readAsDataURL(file)
        }

        // Reset input to allow selecting the same file again
        if (fileInputRef.current) {
            fileInputRef.current.value = ""
        }
    }

    const removeStartImage = () => {
        setStartImage(null)
    }

    // Proxy external videos to bypass CORS
    const getProxiedVideoUrl = (url: string) => {
        return `/api/image-proxy?url=${encodeURIComponent(url)}`
    }

    // Poll for job completion - returns video URL and mediaGenerationId
    const pollJobStatus = async (
        jobId: string,
        operation: "textToVideo" | "imageToVideo",
        maxAttempts = 120
    ): Promise<{ videoUrl: string; mediaGenerationId?: string } | null> => {
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            await new Promise(resolve => setTimeout(resolve, 5000)) // Wait 5 seconds

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

            // Update progress toast
            if (attempt > 0 && attempt % 6 === 0) {
                toast.info(`Still generating... (${Math.round((attempt * 5) / 60)} min elapsed)`)
            }
        }
        throw new Error("Job timed out")
    }

    // Poll for upscale job completion - uses upscaleVideo operation type for credit deduction
    const pollUpscaleJobStatus = async (
        jobId: string,
        maxAttempts = 120
    ): Promise<{ videoUrl: string } | null> => {
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            await new Promise(resolve => setTimeout(resolve, 5000)) // Wait 5 seconds

            const statusResult = await checkVideoJobStatus(jobId, "upscaleVideo")

            if (statusResult.status === "completed" && statusResult.videoUrls?.length) {
                return {
                    videoUrl: statusResult.videoUrls[0],
                }
            }

            if (statusResult.status === "failed") {
                throw new Error(statusResult.error || "Upscale job failed")
            }

            // Update progress toast
            if (attempt > 0 && attempt % 6 === 0) {
                toast.info(`Still upscaling... (${Math.round((attempt * 5) / 60)} min elapsed)`)
            }
        }
        throw new Error("Upscale job timed out")
    }

    const handleGenerate = async () => {
        if (!prompt.trim()) return

        setIsGenerating(true)
        const currentPrompt = prompt.trim()
        const currentStartImage = startImage

        // Scroll to show loading indicator
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
        }, 50)

        try {
            let result

            if (currentStartImage) {
                // Image-to-video: use start image
                const base64Image = currentStartImage.split(",")[1] || currentStartImage
                result = await generateImageToVideo({
                    prompt: currentPrompt,
                    startImageBase64: base64Image,
                    aspectRatio,
                })
            } else {
                // Text-to-video
                result = await generateTextToVideo({
                    prompt: currentPrompt,
                    aspectRatio,
                })
            }

            if (!result.success) {
                throw new Error(result.error || "Failed to generate video")
            }

            let videoUrl = result.videoUrl
            let mediaGenerationId: string | undefined

            // If we got a jobId, poll for completion
            if (!videoUrl && result.jobId) {
                toast.info("Generating video... This may take 1-3 minutes.")
                const operation = currentStartImage ? "imageToVideo" : "textToVideo"
                const pollResult = await pollJobStatus(result.jobId, operation)
                if (pollResult) {
                    videoUrl = pollResult.videoUrl
                    mediaGenerationId = pollResult.mediaGenerationId
                }
            }

            if (!videoUrl) {
                throw new Error("No video URL received")
            }

            const newVideo: GeneratedVideo = {
                id: Date.now().toString(),
                prompt: currentPrompt,
                videoUrl,
                aspectRatio,
                startImage: currentStartImage,
                createdAt: new Date(),
                mediaGenerationId,
            }

            setGeneratedVideos(prev => [...prev, newVideo])
            setPrompt("")
            setStartImage(null)
            toast.success("Video generated successfully!")

            // Scroll to bottom
            setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
            }, 100)
        } catch (error) {
            console.error("Generation failed:", error)
            toast.error(error instanceof Error ? error.message : "Failed to generate video")
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
            toast.success("Video downloaded!")
        } catch (error) {
            console.error("Failed to download video:", error)
            toast.error("Failed to download video")
        }
    }

    const handleUpscale = async (video: GeneratedVideo, resolution: "1080p" | "4K") => {
        if (!video.mediaGenerationId) {
            toast.error("Cannot upscale: missing media generation ID")
            return
        }

        setUpscalingVideoId(video.id)
        toast.info(`Starting upscale to ${resolution}... This may take a few minutes.`)

        try {
            const result = await upscaleVideo({
                mediaGenerationId: video.mediaGenerationId,
                resolution,
            })

            if (!result.success) {
                throw new Error(result.error || "Upscale failed")
            }

            let upscaledVideoUrl: string | undefined

            // If async job, poll for completion with correct operation type
            if (result.jobId) {
                // Use upscaleVideo operation type for credit deduction on completion
                const pollResult = await pollUpscaleJobStatus(result.jobId, 120)
                upscaledVideoUrl = pollResult?.videoUrl
            } else if (result.videoUrl) {
                upscaledVideoUrl = result.videoUrl
            }

            if (upscaledVideoUrl) {
                // Add upscaled version to the original video
                const upscaledVersion: UpscaledVersion = {
                    resolution,
                    videoUrl: upscaledVideoUrl,
                    createdAt: new Date(),
                }

                // Update the original video with the new upscaled version
                setGeneratedVideos(prev => prev.map(v =>
                    v.id === video.id
                        ? {
                            ...v,
                            upscaledVersions: [...(v.upscaledVersions || []), upscaledVersion]
                        }
                        : v
                ))

                toast.success(`Video upscaled to ${resolution}!`)

                // Scroll to show the upscaled video
                setTimeout(() => {
                    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
                }, 100)
            } else {
                throw new Error("No upscaled video received")
            }
        } catch (error) {
            console.error("Upscale failed:", error)
            toast.error(error instanceof Error ? error.message : "Upscale failed")
        } finally {
            setUpscalingVideoId(null)
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
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center mb-4">
                            <Video className="w-10 h-10 text-blue-500" />
                        </div>
                        <h2 className="text-2xl font-semibold mb-2">AI Video Generator</h2>
                        <p className="text-muted-foreground max-w-md">
                            Enter a prompt below to generate stunning videos. You can also add a start image for image-to-video generation.
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                            ⏱️ Video generation takes 1-3 minutes
                        </p>
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
                                        {/* Metadata */}
                                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                                            <span className="flex items-center gap-1.5">
                                                <span className="inline-block w-2 h-2 rounded-full bg-blue-500"></span>
                                                {video.aspectRatio === "landscape" ? "🖼️ Landscape" : "📱 Portrait"}
                                            </span>
                                            <span>{video.createdAt.toLocaleTimeString()}</span>
                                        </div>

                                        {/* Action buttons */}
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
                                                onClick={() => downloadVideo(video.videoUrl, `generated-${video.id}.mp4`)}
                                            >
                                                <Download className="w-4 h-4 mr-1" />
                                                Download
                                            </Button>
                                            {video.mediaGenerationId && (
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button
                                                            variant="secondary"
                                                            size="sm"
                                                            className="flex-1 min-w-[80px]"
                                                            disabled={upscalingVideoId === video.id}
                                                        >
                                                            {upscalingVideoId === video.id ? (
                                                                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                                            ) : (
                                                                <Zap className="w-4 h-4 mr-1" />
                                                            )}
                                                            Upscale
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem
                                                            onClick={() => handleUpscale(video, "1080p")}
                                                            disabled={upscalingVideoId === video.id || video.upscaledVersions?.some(v => v.resolution === "1080p")}
                                                        >
                                                            <Zap className="w-4 h-4 mr-2" />
                                                            <div className="flex flex-col">
                                                                <span>1080p HD {video.upscaledVersions?.some(v => v.resolution === "1080p") ? "✓" : ""}</span>
                                                                <span className="text-xs text-muted-foreground">0.5 credit</span>
                                                            </div>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => handleUpscale(video, "4K")}
                                                            disabled={upscalingVideoId === video.id || video.upscaledVersions?.some(v => v.resolution === "4K")}
                                                        >
                                                            <Zap className="w-4 h-4 mr-2 text-amber-500" />
                                                            <div className="flex flex-col">
                                                                <span>4K Ultra HD {video.upscaledVersions?.some(v => v.resolution === "4K") ? "✓" : ""}</span>
                                                                <span className="text-xs text-muted-foreground">0.5 credit</span>
                                                            </div>
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            )}
                                        </div>

                                        {/* Upscaled Versions - Side by Side */}
                                        {video.upscaledVersions && video.upscaledVersions.length > 0 && (
                                            <div className="mt-3 pt-3 border-t">
                                                <p className="text-xs text-muted-foreground mb-2">Upscaled Versions:</p>
                                                <div className="flex gap-2 flex-wrap">
                                                    {video.upscaledVersions.map((upscaled) => (
                                                        <div
                                                            key={upscaled.resolution}
                                                            className="flex-1 min-w-[120px] bg-muted/50 rounded-lg p-2"
                                                        >
                                                            <div className="flex items-center justify-between mb-2">
                                                                <span className="text-xs font-medium text-green-600 dark:text-green-400">
                                                                    ✓ {upscaled.resolution}
                                                                </span>
                                                            </div>
                                                            <div className="flex gap-1">
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="flex-1 h-7 text-xs"
                                                                    onClick={() => {
                                                                        setPreviewVideo(getProxiedVideoUrl(upscaled.videoUrl))
                                                                        setPreviewAspectRatio(video.aspectRatio)
                                                                    }}
                                                                >
                                                                    <Play className="w-3 h-3 mr-1" />
                                                                    Play
                                                                </Button>
                                                                <Button
                                                                    variant="default"
                                                                    size="sm"
                                                                    className="flex-1 h-7 text-xs"
                                                                    onClick={() => downloadVideo(upscaled.videoUrl, `upscaled-${upscaled.resolution}-${video.id}.mp4`)}
                                                                >
                                                                    <Download className="w-3 h-3 mr-1" />
                                                                    Save
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
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
                                <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                                <div>
                                    <span className="text-sm text-muted-foreground">Generating your video...</span>
                                    <p className="text-xs text-muted-foreground mt-1">This may take 1-3 minutes</p>
                                </div>
                            </div>
                        </Card>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input Area - Fixed at bottom */}
            <div className="border-t bg-background p-3">
                {/* Start Image Preview */}
                {startImage && (
                    <div className="flex gap-2 mb-3">
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
                            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[10px] bg-blue-500 text-white px-1 rounded">
                                Start
                            </span>
                        </div>
                    </div>
                )}

                {/* Stack layout for both mobile and desktop */}
                <div className="flex flex-col gap-2">
                    {/* Top row: Aspect Ratio */}
                    <div className="flex gap-2">
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
                    </div>

                    {/* Main input row */}
                    <div className="flex gap-2 items-end">
                        {/* Start Image Upload */}
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImageUpload}
                            accept="image/jpeg,image/png"
                            className="hidden"
                        />
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => fileInputRef.current?.click()}
                            className="shrink-0 h-10 w-10"
                            title="Add start image for I2V"
                        >
                            <ImageIcon className="w-5 h-5" />
                        </Button>

                        {/* Prompt Input */}
                        <Textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Describe the video..."
                            className="min-h-[40px] max-h-[100px] resize-none flex-1 text-sm"
                            rows={1}
                        />

                        {/* Generate Button */}
                        <Button
                            onClick={handleGenerate}
                            disabled={!prompt.trim() || isGenerating}
                            className="shrink-0 h-10 w-10"
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
