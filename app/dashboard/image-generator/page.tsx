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
    X,
    Loader2,
    Download,
    Sparkles,
    ZoomIn,
} from "lucide-react"
import { generateTextToImage, generateImageToImage, checkImageJobStatus, upscaleImage } from "@/app/actions/generate-image"
import { toast } from "sonner"

type AspectRatio = "landscape" | "portrait"

interface GeneratedImage {
    id: string
    prompt: string
    imageUrl: string
    aspectRatio: AspectRatio
    referenceImages: string[]
    createdAt: Date
    mediaGenerationId?: string  // For upscale feature
    isUpscaled?: boolean
}

const aspectRatioOptions: { value: AspectRatio; label: string; icon: string }[] = [
    { value: "landscape", label: "Landscape (16:9)", icon: "🖼️" },
    { value: "portrait", label: "Portrait (9:16)", icon: "📱" },
]

export default function ImageGeneratorPage() {
    const [prompt, setPrompt] = useState("")
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>("landscape")
    const [referenceImages, setReferenceImages] = useState<string[]>([])
    const [isGenerating, setIsGenerating] = useState(false)
    const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([])
    const [previewImage, setPreviewImage] = useState<string | null>(null)
    const [upscalingId, setUpscalingId] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const MAX_REFERENCE_IMAGES = 3

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (files) {
            const remainingSlots = MAX_REFERENCE_IMAGES - referenceImages.length
            if (remainingSlots <= 0) {
                toast.error(`Maximum ${MAX_REFERENCE_IMAGES} reference images allowed`)
                return
            }
            Array.from(files).slice(0, remainingSlots).forEach(file => {
                const reader = new FileReader()
                reader.onload = (event) => {
                    if (event.target?.result) {
                        setReferenceImages(prev => {
                            if (prev.length >= MAX_REFERENCE_IMAGES) return prev
                            return [...prev, event.target!.result as string]
                        })
                    }
                }
                reader.readAsDataURL(file)
            })
        }
    }

    const removeReferenceImage = (index: number) => {
        setReferenceImages(prev => prev.filter((_, i) => i !== index))
    }

    // Poll for job completion
    const pollJobStatus = async (jobId: string, operation: "textToImage" | "imageToImage", maxAttempts = 60): Promise<string | null> => {
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            await new Promise(resolve => setTimeout(resolve, 5000)) // Wait 5 seconds

            const statusResult = await checkImageJobStatus(jobId, operation)

            if (statusResult.status === "completed" && statusResult.imageUrls?.length) {
                return statusResult.imageUrls[0]
            }

            if (statusResult.status === "failed") {
                throw new Error(statusResult.error || "Job failed")
            }
        }
        throw new Error("Job timed out")
    }

    const handleGenerate = async () => {
        if (!prompt.trim()) return

        setIsGenerating(true)
        const currentPrompt = prompt.trim()
        const currentReferenceImages = [...referenceImages]

        // Scroll to show loading indicator
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
        }, 50)

        try {
            let result

            if (currentReferenceImages.length > 0) {
                // Image-to-image: use up to 3 reference images
                const base64Images = currentReferenceImages.slice(0, 3).map(img =>
                    img.split(",")[1] || img
                )
                result = await generateImageToImage({
                    prompt: currentPrompt,
                    referenceImagesBase64: base64Images,
                    aspectRatio,
                })
            } else {
                // Text-to-image
                result = await generateTextToImage({
                    prompt: currentPrompt,
                    aspectRatio,
                })
            }

            if (!result.success) {
                throw new Error(result.error || "Failed to generate image")
            }

            let imageUrl = result.imageUrl

            // If we got a jobId instead of immediate result, poll for completion
            if (!imageUrl && result.jobId) {
                toast.info("Generating image, please wait...")
                const operation = currentReferenceImages.length > 0 ? "imageToImage" : "textToImage"
                imageUrl = await pollJobStatus(result.jobId, operation) || ""
            }

            if (!imageUrl) {
                throw new Error("No image URL received")
            }

            const newImage: GeneratedImage = {
                id: Date.now().toString(),
                prompt: currentPrompt,
                imageUrl,
                aspectRatio,
                referenceImages: currentReferenceImages,
                createdAt: new Date(),
                mediaGenerationId: result.mediaGenerationId,
            }

            setGeneratedImages(prev => [...prev, newImage])
            setPrompt("")
            setReferenceImages([])
            toast.success("Image generated successfully!")

            // Scroll to bottom
            setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
            }, 100)
        } catch (error) {
            console.error("Generation failed:", error)
            toast.error(error instanceof Error ? error.message : "Failed to generate image")
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

    // Proxy external images to bypass CORS
    const getProxiedImageUrl = (url: string) => {
        return `/api/image-proxy?url=${encodeURIComponent(url)}`
    }

    const downloadImage = async (imageUrl: string, filename: string) => {
        try {
            // Handle data URLs differently from external URLs
            if (imageUrl.startsWith('data:')) {
                const a = document.createElement("a")
                a.href = imageUrl
                a.download = filename
                document.body.appendChild(a)
                a.click()
                document.body.removeChild(a)
            } else {
                const proxiedUrl = getProxiedImageUrl(imageUrl)
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
            }
            toast.success("Image downloaded!")
        } catch (error) {
            console.error("Failed to download image:", error)
            toast.error("Failed to download image")
        }
    }

    const handleUpscale = async (imageId: string, mediaGenerationId: string) => {
        try {
            setUpscalingId(imageId)
            toast.info("Upscaling image to 2K resolution...")

            const result = await upscaleImage({
                mediaGenerationId,
                resolution: "2k",
            })

            if (!result.success) {
                throw new Error(result.error || "Failed to upscale image")
            }

            // Update the image with upscaled version
            setGeneratedImages(prev => prev.map(img =>
                img.id === imageId
                    ? { ...img, imageUrl: result.imageUrl!, isUpscaled: true }
                    : img
            ))

            toast.success("Image upscaled to 2K successfully!")
        } catch (error) {
            console.error("Upscale failed:", error)
            toast.error(error instanceof Error ? error.message : "Failed to upscale image")
        } finally {
            setUpscalingId(null)
        }
    }

    const getAspectRatioClass = (ratio: AspectRatio) => {
        switch (ratio) {
            case "landscape": return "aspect-video"
            case "portrait": return "aspect-[9/16] max-h-[500px]"
            default: return "aspect-video"
        }
    }

    return (
        <div className="flex flex-col h-[calc(100vh-5rem)] max-h-[calc(100vh-5rem)]">
            {/* Results Area - Scrollable */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {generatedImages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mb-4">
                            <Sparkles className="w-10 h-10 text-purple-500" />
                        </div>
                        <h2 className="text-2xl font-semibold mb-2">AI Image Generator</h2>
                        <p className="text-muted-foreground max-w-md">
                            Enter a prompt below to generate stunning images. You can also add reference images for style guidance.
                        </p>
                    </div>
                ) : (
                    generatedImages.map((image) => (
                        <div key={image.id} className="space-y-3">
                            {/* User prompt bubble */}
                            <div className="flex justify-end">
                                <div className="bg-primary text-primary-foreground rounded-2xl rounded-br-sm px-4 py-2 max-w-[80%]">
                                    <p className="text-sm">{image.prompt}</p>
                                    {image.referenceImages.length > 0 && (
                                        <div className="flex gap-2 mt-2">
                                            {image.referenceImages.map((ref, idx) => (
                                                <img
                                                    key={idx}
                                                    src={ref}
                                                    alt="Reference"
                                                    className="w-12 h-12 rounded object-cover"
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Generated image */}
                            <div className="flex justify-start">
                                <Card className="overflow-hidden max-w-md w-full bg-gradient-to-br from-background to-muted/30 border-muted-foreground/20">
                                    {/* Image container */}
                                    <div className={`${getAspectRatioClass(image.aspectRatio)} w-full relative overflow-hidden bg-muted/20 flex items-center justify-center`}>
                                        <img
                                            src={image.imageUrl.startsWith('data:') ? image.imageUrl : getProxiedImageUrl(image.imageUrl)}
                                            alt={image.prompt}
                                            className="max-w-full max-h-full object-contain"
                                            onError={(e) => {
                                                console.error("Image load error:", image.imageUrl.substring(0, 100))
                                            }}
                                        />
                                    </div>

                                    {/* Info and actions */}
                                    <div className="p-3 space-y-3">
                                        {/* Metadata */}
                                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                                            <span className="flex items-center gap-1.5">
                                                <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
                                                {image.aspectRatio === "landscape" ? "🖼️ Landscape" : "📱 Portrait"}
                                            </span>
                                            <span>{image.createdAt.toLocaleTimeString()}</span>
                                        </div>

                                        {/* Action buttons */}
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="flex-1"
                                                onClick={() => setPreviewImage(image.imageUrl.startsWith('data:') ? image.imageUrl : getProxiedImageUrl(image.imageUrl))}
                                            >
                                                <Sparkles className="w-4 h-4 mr-2" />
                                                Preview
                                            </Button>
                                            {image.mediaGenerationId && !image.isUpscaled && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="flex-1"
                                                    onClick={() => handleUpscale(image.id, image.mediaGenerationId!)}
                                                    disabled={upscalingId === image.id}
                                                >
                                                    {upscalingId === image.id ? (
                                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                    ) : (
                                                        <ZoomIn className="w-4 h-4 mr-2" />
                                                    )}
                                                    {upscalingId === image.id ? "Upscaling..." : "Upscale 2K"}
                                                </Button>
                                            )}
                                            {image.isUpscaled && (
                                                <span className="flex-1 flex items-center justify-center text-xs text-green-500 font-medium">
                                                    ✓ 2K Upscaled
                                                </span>
                                            )}
                                            <Button
                                                variant="default"
                                                size="sm"
                                                className="flex-1"
                                                onClick={() => downloadImage(image.imageUrl, `generated-${image.id}.${image.isUpscaled ? 'jpg' : 'png'}`)}
                                            >
                                                <Download className="w-4 h-4 mr-2" />
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
                                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                                <span className="text-sm text-muted-foreground">Generating your image...</span>
                            </div>
                        </Card>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input Area - Fixed at bottom */}
            <div className="border-t bg-background p-3">
                {/* Reference Images Preview */}
                {referenceImages.length > 0 && (
                    <div className="flex gap-2 mb-3 flex-wrap">
                        {referenceImages.map((img, index) => (
                            <div key={index} className="relative">
                                <img
                                    src={img}
                                    alt={`Reference ${index + 1}`}
                                    className="w-14 h-14 rounded-lg object-cover border"
                                />
                                <button
                                    onClick={() => removeReferenceImage(index)}
                                    className="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
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
                        {/* Reference Image Upload */}
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImageUpload}
                            accept="image/jpeg,image/png"
                            multiple
                            className="hidden"
                        />
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => fileInputRef.current?.click()}
                            className="shrink-0 h-10 w-10"
                        >
                            <ImageIcon className="w-5 h-5" />
                        </Button>

                        {/* Prompt Input */}
                        <Textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Describe the image..."
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
            {previewImage && (
                <div
                    className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
                    onClick={() => setPreviewImage(null)}
                >
                    <button
                        onClick={() => setPreviewImage(null)}
                        className="fixed top-4 right-4 text-white hover:text-gray-300 transition-colors z-[60] bg-black/50 rounded-full p-2"
                    >
                        <X className="w-6 h-6" />
                    </button>
                    <div className="w-full h-full flex items-center justify-center p-4">
                        <img
                            src={previewImage}
                            alt="Preview"
                            className="max-w-full max-h-full object-contain"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                </div>
            )}
        </div>
    )
}


