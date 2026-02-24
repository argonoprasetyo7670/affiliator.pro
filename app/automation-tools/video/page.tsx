"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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
    Video,
    Play,
    Loader2,
    Sparkles,
    Clock,
    FileVideo,
    Trash2,
    ShoppingBag,
    Youtube,
    Film,
    Smartphone,
    Megaphone,
    Clapperboard,
    Star,
    Package
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

// Video Templates
const videoTemplates = [
    {
        id: "review-product",
        name: "Review Product",
        description: "Video review produk untuk affiliate marketing",
        icon: ShoppingBag,
        color: "from-orange-500 to-amber-500",
        aspectRatio: "portrait",
        promptPrefix: "Product review video showcasing"
    },
    {
        id: "short-video",
        name: "Short Video",
        description: "Video pendek untuk TikTok, Reels, Shorts",
        icon: Smartphone,
        color: "from-pink-500 to-rose-500",
        aspectRatio: "portrait",
        promptPrefix: "Short viral video about"
    },
    {
        id: "youtube-video",
        name: "YouTube Video",
        description: "Video landscape untuk YouTube",
        icon: Youtube,
        color: "from-red-500 to-red-600",
        aspectRatio: "landscape",
        promptPrefix: "YouTube style video about"
    },
    {
        id: "promo-video",
        name: "Promo Video",
        description: "Video promosi produk/jasa",
        icon: Megaphone,
        color: "from-blue-500 to-cyan-500",
        aspectRatio: "landscape",
        promptPrefix: "Promotional video for"
    },
    {
        id: "unboxing",
        name: "Unboxing",
        description: "Video unboxing produk",
        icon: Package,
        color: "from-purple-500 to-violet-500",
        aspectRatio: "portrait",
        promptPrefix: "Unboxing video of"
    },
    {
        id: "testimonial",
        name: "Testimonial",
        description: "Video testimonial/review pelanggan",
        icon: Star,
        color: "from-yellow-500 to-orange-500",
        aspectRatio: "portrait",
        promptPrefix: "Customer testimonial video about"
    },
    {
        id: "cinematic",
        name: "Cinematic",
        description: "Video sinematik berkualitas tinggi",
        icon: Film,
        color: "from-slate-600 to-slate-800",
        aspectRatio: "landscape",
        promptPrefix: "Cinematic video of"
    },
    {
        id: "custom",
        name: "Custom",
        description: "Buat video dengan prompt custom",
        icon: Clapperboard,
        color: "from-green-500 to-emerald-500",
        aspectRatio: "landscape",
        promptPrefix: ""
    },
]

interface VideoJob {
    id: string
    prompt: string
    status: "pending" | "processing" | "completed" | "failed"
    aspectRatio: string
    template: string
    createdAt: Date
    videoUrl?: string
}

export default function AutomationVideoPage() {
    const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
    const [prompt, setPrompt] = useState("")
    const [aspectRatio, setAspectRatio] = useState("landscape")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [videoJobs, setVideoJobs] = useState<VideoJob[]>([])

    const handleTemplateSelect = (templateId: string) => {
        setSelectedTemplate(templateId)
        const template = videoTemplates.find(t => t.id === templateId)
        if (template) {
            setAspectRatio(template.aspectRatio)
            if (template.promptPrefix) {
                setPrompt(template.promptPrefix + " ")
            }
        }
    }

    const handleSubmit = async () => {
        if (!prompt.trim()) {
            toast.error("Masukkan prompt terlebih dahulu")
            return
        }

        if (!selectedTemplate) {
            toast.error("Pilih template terlebih dahulu")
            return
        }

        setIsSubmitting(true)

        try {
            const newJob: VideoJob = {
                id: Date.now().toString(),
                prompt: prompt.trim(),
                status: "pending",
                aspectRatio,
                template: selectedTemplate,
                createdAt: new Date()
            }

            setVideoJobs(prev => [newJob, ...prev])
            setPrompt("")
            toast.success("Job ditambahkan ke queue!")

        } catch (error) {
            toast.error("Gagal menambahkan job")
        } finally {
            setIsSubmitting(false)
        }
    }

    const removeJob = (id: string) => {
        setVideoJobs(prev => prev.filter(job => job.id !== id))
        toast.success("Job dihapus")
    }

    const getStatusBadge = (status: VideoJob["status"]) => {
        switch (status) {
            case "pending":
                return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>
            case "processing":
                return <Badge variant="default" className="bg-blue-500"><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Processing</Badge>
            case "completed":
                return <Badge variant="default" className="bg-green-500"><Play className="w-3 h-3 mr-1" /> Completed</Badge>
            case "failed":
                return <Badge variant="destructive">Failed</Badge>
        }
    }

    const getTemplateName = (templateId: string) => {
        return videoTemplates.find(t => t.id === templateId)?.name || templateId
    }

    return (
        <div className="p-4 md:p-6 space-y-6">
            {/* Template Selection */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                            <Video className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <CardTitle className="text-lg">Pilih Template Video</CardTitle>
                            <CardDescription>
                                Pilih jenis video yang ingin dibuat
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {videoTemplates.map((template) => (
                            <button
                                key={template.id}
                                onClick={() => handleTemplateSelect(template.id)}
                                className={cn(
                                    "relative p-4 rounded-xl border-2 transition-all text-left",
                                    "hover:shadow-md hover:scale-[1.02]",
                                    selectedTemplate === template.id
                                        ? "border-primary bg-primary/5 shadow-md"
                                        : "border-muted hover:border-muted-foreground/30"
                                )}
                            >
                                <div className={cn(
                                    "w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center mb-3",
                                    template.color
                                )}>
                                    <template.icon className="w-5 h-5 text-white" />
                                </div>
                                <h3 className="font-semibold text-sm">{template.name}</h3>
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                    {template.description}
                                </p>
                                {selectedTemplate === template.id && (
                                    <div className="absolute top-2 right-2">
                                        <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                                            <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Video Form - Only show when template is selected */}
            {selectedTemplate && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Detail Video</CardTitle>
                        <CardDescription>
                            Deskripsikan video yang ingin dibuat
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Prompt</Label>
                            <Textarea
                                placeholder="Lanjutkan deskripsi video..."
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                rows={3}
                            />
                        </div>

                        <div className="flex gap-4 flex-wrap">
                            <div className="space-y-2 flex-1 min-w-[150px]">
                                <Label>Aspect Ratio</Label>
                                <Select value={aspectRatio} onValueChange={setAspectRatio}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="landscape">🖼️ Landscape (16:9)</SelectItem>
                                        <SelectItem value="portrait">📱 Portrait (9:16)</SelectItem>
                                        <SelectItem value="square">⬜ Square (1:1)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <Button
                                onClick={handleSubmit}
                                disabled={!prompt.trim() || isSubmitting}
                            >
                                {isSubmitting ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                    <Sparkles className="w-4 h-4 mr-2" />
                                )}
                                Generate Video
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setSelectedTemplate(null)
                                    setPrompt("")
                                }}
                            >
                                Reset
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Video Jobs Queue */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                                <FileVideo className="w-5 h-5" />
                            </div>
                            <div>
                                <CardTitle className="text-lg">Video Queue</CardTitle>
                                <CardDescription>
                                    {videoJobs.length} video dalam antrian
                                </CardDescription>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {videoJobs.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <FileVideo className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>Belum ada video dalam antrian</p>
                            <p className="text-sm">Pilih template dan buat video baru</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {videoJobs.map((job) => (
                                <div
                                    key={job.id}
                                    className="flex items-start gap-4 p-4 border rounded-lg bg-muted/30"
                                >
                                    <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center shrink-0">
                                        {job.status === "completed" && job.videoUrl ? (
                                            <video src={job.videoUrl} className="w-full h-full object-cover rounded-lg" />
                                        ) : (
                                            <Video className="w-6 h-6 text-muted-foreground" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium line-clamp-2">{job.prompt}</p>
                                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                                            {getStatusBadge(job.status)}
                                            <Badge variant="outline" className="text-xs">
                                                {getTemplateName(job.template)}
                                            </Badge>
                                            <Badge variant="outline" className="text-xs">
                                                {job.aspectRatio === "landscape" ? "🖼️ 16:9" :
                                                    job.aspectRatio === "portrait" ? "📱 9:16" : "⬜ 1:1"}
                                            </Badge>
                                            <span className="text-xs text-muted-foreground">
                                                {job.createdAt.toLocaleTimeString('id-ID')}
                                            </span>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="shrink-0 text-muted-foreground hover:text-destructive"
                                        onClick={() => removeJob(job.id)}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
