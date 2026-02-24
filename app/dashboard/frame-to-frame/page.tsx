"use client"

import { useState, useRef, useCallback } from "react"
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
    X,
    Loader2,
    Download,
    Play,
    Film,
    ArrowRight
} from "lucide-react"
import { generateFrameToFrameVideo, checkVideoJobStatus } from "@/app/actions/generate-video"
import { toast } from "sonner"

type AspectRatio = "landscape" | "portrait"

interface GeneratedVideo {
    id: string
    prompt: string
    videoUrl: string
    aspectRatio: AspectRatio
    startImage: string
    endImage: string
    createdAt: Date
    mediaGenerationId?: string
}

const aspectRatioOptions: { value: AspectRatio; label: string; icon: string }[] = [
    { value: "landscape", label: "Landscape (16:9)", icon: "🖼️" },
    { value: "portrait", label: "Portrait (9:16)", icon: "📱" },
]

export default function FrameToFramePage() {
    const [prompt, setPrompt] = useState("")
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>("landscape")
    const [startImage, setStartImage] = useState<string | null>(null)
    const [endImage, setEndImage] = useState<string | null>(null)
    const [isGenerating, setIsGenerating] = useState(false)
    const [generatedVideos, setGeneratedVideos] = useState<GeneratedVideo[]>([])
    const [previewVideo, setPreviewVideo] = useState<string | null>(null)
    const [previewAspectRatio, setPreviewAspectRatio] = useState<AspectRatio>("landscape")
    const startImageInputRef = useRef<HTMLInputElement>(null)
    const endImageInputRef = useRef<HTMLInputElement>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const handleImageUpload = (
        e: React.ChangeEvent<HTMLInputElement>,
        setImage: (img: string | null) => void,
        imageName: string
    ) => {
        const files = e.target.files
        if (files && files[0]) {
            const file = files[0]

            if (!file.type.startsWith('image/')) {
                toast.error("Please select an image file")
                return
            }

            if (file.size > 10 * 1024 * 1024) {
                toast.error("Image size must be less than 10MB")
                return
            }

            const reader = new FileReader()
            reader.onload = (event) => {
                if (event.target?.result) {
                    setImage(event.target.result as string)
                    toast.success(`${imageName} added`)
                }
            }
            reader.onerror = () => {
                toast.error("Failed to read image file")
            }
            reader.readAsDataURL(file)
        }
    }

    const getProxiedVideoUrl = (url: string) => {
        return `/api/image-proxy?url=${encodeURIComponent(url)}`
    }

    const pollJobStatus = useCallback(async (
        jobId: string,
        maxAttempts = 120
    ): Promise<{ videoUrl: string; mediaGenerationId?: string } | null> => {
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            await new Promise(resolve => setTimeout(resolve, 5000))

            const statusResult = await checkVideoJobStatus(jobId, "imageToVideo")

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
                toast.info(`Still generating... (${Math.round((attempt * 5) / 60)} min elapsed)`)
            }
        }
        throw new Error("Job timed out")
    }, [])

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            toast.error("Please enter a prompt")
            return
        }

        if (!startImage) {
            toast.error("Please add a start frame image")
            return
        }

        if (!endImage) {
            toast.error("Please add an end frame image")
            return
        }

        setIsGenerating(true)
        const currentPrompt = prompt.trim()
        const currentStartImage = startImage
        const currentEndImage = endImage

        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
        }, 50)

        try {
            const base64Start = currentStartImage.split(",")[1] || currentStartImage
            const base64End = currentEndImage.split(",")[1] || currentEndImage

            const result = await generateFrameToFrameVideo({
                prompt: currentPrompt,
                startImageBase64: base64Start,
                endImageBase64: base64End,
                aspectRatio,
            })

            if (!result.success) {
                throw new Error(result.error || "Failed to generate video")
            }

            let videoUrl = result.videoUrl
            let mediaGenerationId: string | undefined

            if (!videoUrl && result.jobId) {
                toast.info("Generating Frame-to-Frame video... This may take 1-3 minutes.")
                const pollResult = await pollJobStatus(result.jobId)
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
                endImage: currentEndImage,
                createdAt: new Date(),
                mediaGenerationId,
            }

            setGeneratedVideos(prev => [...prev, newVideo])
            setPrompt("")
            setStartImage(null)
            setEndImage(null)
            toast.success("Frame-to-Frame video generated successfully!")

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

    const getAspectRatioClass = (ratio: AspectRatio) => {
        switch (ratio) {
            case "landscape": return "aspect-video"
            case "portrait": return "aspect-[3/4] max-h-[400px]"
            default: return "aspect-video"
        }
    }

    return (
        <div className="flex flex-col h-[calc(100vh-5rem)] max-h-[calc(100vh-5rem)]">
            {/* Results Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {generatedVideos.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mb-4">
                            <Film className="w-10 h-10 text-purple-500" />
                        </div>
                        <h2 className="text-2xl font-semibold mb-2">Frame-to-Frame Video</h2>
                        <p className="text-muted-foreground max-w-md">
                            Create smooth video transitions between two images.
                            Upload a start frame and end frame, then describe the motion.
                        </p>
                        <div className="flex items-center gap-4 mt-6 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
                                    <ImageIcon className="w-6 h-6 text-blue-500" />
                                </div>
                                <span>Start Frame</span>
                            </div>
                            <ArrowRight className="w-5 h-5" />
                            <div className="flex items-center gap-2">
                                <div className="w-12 h-12 rounded-lg bg-pink-500/20 flex items-center justify-center">
                                    <ImageIcon className="w-6 h-6 text-pink-500" />
                                </div>
                                <span>End Frame</span>
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-4">
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
                                    <div className="mt-2 flex items-center gap-2">
                                        <div className="relative">
                                            <img
                                                src={video.startImage}
                                                alt="Start frame"
                                                className="w-12 h-12 rounded object-cover"
                                            />
                                            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[8px] bg-blue-500 text-white px-1 rounded">
                                                Start
                                            </span>
                                        </div>
                                        <ArrowRight className="w-4 h-4" />
                                        <div className="relative">
                                            <img
                                                src={video.endImage}
                                                alt="End frame"
                                                className="w-12 h-12 rounded object-cover"
                                            />
                                            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[8px] bg-pink-500 text-white px-1 rounded">
                                                End
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Generated video */}
                            <div className="flex justify-start">
                                <Card className="overflow-hidden max-w-md w-full bg-gradient-to-br from-background to-muted/30 border-muted-foreground/20">
                                    <div className={`${getAspectRatioClass(video.aspectRatio)} w-full relative overflow-hidden bg-black`}>
                                        <video
                                            src={getProxiedVideoUrl(video.videoUrl)}
                                            controls
                                            playsInline
                                            preload="metadata"
                                            className="w-full h-full object-contain"
                                        />
                                    </div>

                                    <div className="p-3 space-y-3">
                                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                                            <span className="flex items-center gap-1.5">
                                                <span className="inline-block w-2 h-2 rounded-full bg-purple-500"></span>
                                                Frame-to-Frame
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
                                                onClick={() => downloadVideo(video.videoUrl, `frame-to-frame-${video.id}.mp4`)}
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
                                <Loader2 className="w-5 h-5 animate-spin text-purple-500" />
                                <div>
                                    <span className="text-sm text-muted-foreground">Generating Frame-to-Frame video...</span>
                                    <p className="text-xs text-muted-foreground mt-1">This may take 1-3 minutes</p>
                                </div>
                            </div>
                        </Card>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t bg-background p-3">
                {/* Image Previews */}
                {(startImage || endImage) && (
                    <div className="flex gap-3 mb-3 items-center">
                        {/* Start Image */}
                        {startImage ? (
                            <div className="relative">
                                <img
                                    src={startImage}
                                    alt="Start frame"
                                    className="w-16 h-16 rounded-lg object-cover border-2 border-blue-500"
                                />
                                <button
                                    onClick={() => setStartImage(null)}
                                    className="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[10px] bg-blue-500 text-white px-1.5 rounded">
                                    Start
                                </span>
                            </div>
                        ) : (
                            <div
                                onClick={() => startImageInputRef.current?.click()}
                                className="w-16 h-16 rounded-lg border-2 border-dashed border-blue-500/50 flex items-center justify-center cursor-pointer hover:bg-blue-500/10 transition-colors"
                            >
                                <ImageIcon className="w-6 h-6 text-blue-500/50" />
                            </div>
                        )}

                        <ArrowRight className="w-5 h-5 text-muted-foreground shrink-0" />

                        {/* End Image */}
                        {endImage ? (
                            <div className="relative">
                                <img
                                    src={endImage}
                                    alt="End frame"
                                    className="w-16 h-16 rounded-lg object-cover border-2 border-pink-500"
                                />
                                <button
                                    onClick={() => setEndImage(null)}
                                    className="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[10px] bg-pink-500 text-white px-1.5 rounded">
                                    End
                                </span>
                            </div>
                        ) : (
                            <div
                                onClick={() => endImageInputRef.current?.click()}
                                className="w-16 h-16 rounded-lg border-2 border-dashed border-pink-500/50 flex items-center justify-center cursor-pointer hover:bg-pink-500/10 transition-colors"
                            >
                                <ImageIcon className="w-6 h-6 text-pink-500/50" />
                            </div>
                        )}
                    </div>
                )}

                <div className="flex flex-col gap-2">
                    {/* Aspect Ratio */}
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
                        {/* Hidden file inputs */}
                        <input
                            type="file"
                            ref={startImageInputRef}
                            onChange={(e) => handleImageUpload(e, setStartImage, "Start frame")}
                            accept="image/jpeg,image/png"
                            className="hidden"
                        />
                        <input
                            type="file"
                            ref={endImageInputRef}
                            onChange={(e) => handleImageUpload(e, setEndImage, "End frame")}
                            accept="image/jpeg,image/png"
                            className="hidden"
                        />

                        {/* Start Image Button */}
                        <Button
                            variant={startImage ? "default" : "outline"}
                            size="icon"
                            onClick={() => startImageInputRef.current?.click()}
                            className={`shrink-0 h-10 w-10 ${startImage ? 'bg-blue-500 hover:bg-blue-600' : ''}`}
                            title="Add start frame"
                        >
                            <ImageIcon className="w-5 h-5" />
                        </Button>

                        {/* End Image Button */}
                        <Button
                            variant={endImage ? "default" : "outline"}
                            size="icon"
                            onClick={() => endImageInputRef.current?.click()}
                            className={`shrink-0 h-10 w-10 ${endImage ? 'bg-pink-500 hover:bg-pink-600' : ''}`}
                            title="Add end frame"
                        >
                            <ImageIcon className="w-5 h-5" />
                        </Button>

                        {/* Prompt Input */}
                        <Textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Describe the motion between frames..."
                            className="min-h-[40px] max-h-[100px] resize-none flex-1 text-sm"
                            rows={1}
                        />

                        {/* Generate Button */}
                        <Button
                            onClick={handleGenerate}
                            disabled={!prompt.trim() || !startImage || !endImage || isGenerating}
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
