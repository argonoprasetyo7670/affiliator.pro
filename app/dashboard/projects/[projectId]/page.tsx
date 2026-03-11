"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
  ArrowLeft, Download, Film, ImageIcon, LayoutGrid,
  Loader2, Plus, Sparkles, Trash2, Video, X, Zap, FastForward, AlertTriangle,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { CREDIT_COSTS } from "@/lib/credit-packages"
import Lottie from "lottie-react"

import { getProject, addProjectAsset, deleteProjectAsset } from "@/app/actions/project"
import { generateTextToImage, generateImageToImage, checkImageJobStatus, upscaleImage } from "@/app/actions/generate-image"
import { generateTextToVideo, generateImageToVideo, generateFrameToFrameVideo, generateReferenceToVideo, checkVideoJobStatus, upscaleVideo, extendVideo } from "@/app/actions/generate-video"

type AspectRatio = "landscape" | "portrait"
type VideoMode = "text" | "frames" | "reference"
// Model is always veo-3.1-fast-relaxed
type FilterType = "all" | "images" | "videos"

type Asset = {
  id: string
  type: string
  source: string
  name: string
  url: string
  prompt: string | null
  aspectRatio: string | null
  mediaGenerationId: string | null
  createdAt: string
}

type Project = {
  id: string
  name: string
  description: string | null
  assets: Asset[]
}

const POLL_INTERVAL = 4000

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.projectId as string

  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)
  const [filter, setFilter] = useState<FilterType>("all")
  const [previewAsset, setPreviewAsset] = useState<Asset | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Asset | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [assetPickerOpen, setAssetPickerOpen] = useState(false)
  const [assetPickerMode, setAssetPickerMode] = useState<"reference" | "start" | "end">("reference")

  // Generate bar state
  const [generateType, setGenerateType] = useState<"image" | "video">("image")
  const [prompt, setPrompt] = useState("")
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("landscape")
  const videoModel = "veo-3.1-fast-relaxed"
  const [videoMode, setVideoMode] = useState<VideoMode>("text")
  const [videoCount, setVideoCount] = useState(1)
  const [referenceImages, setReferenceImages] = useState<string[]>([])
  const [startImage, setStartImage] = useState<string | null>(null)
  const [endImage, setEndImage] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isUpscaling, setIsUpscaling] = useState(false)
  const [showExtendInput, setShowExtendInput] = useState(false)
  const [extendPrompt, setExtendPrompt] = useState("")
  const [pollingJobId, setPollingJobId] = useState<string | null>(null)
  const [processingLabel, setProcessingLabel] = useState<string | null>(null)
  const [catAnimation, setCatAnimation] = useState<object | null>(null)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const pollingCompletedRef = useRef(false)
  const loadingSkeletonRef = useRef<HTMLDivElement>(null)
  const uploadFileRef = useRef<HTMLInputElement>(null)
  const refImgInputRef = useRef<HTMLInputElement>(null)
  const startImgInputRef = useRef<HTMLInputElement>(null)
  const endImgInputRef = useRef<HTMLInputElement>(null)

  const fetchProject = useCallback(async () => {
    const res = await getProject(projectId)
    if (res.success && res.project) {
      const p = res.project as unknown as Project
      setProject(p)
      setSelectedAsset(prev => {
        if (prev) return p.assets.find(a => a.id === prev.id) ?? p.assets[0] ?? null
        return p.assets[0] ?? null
      })
    } else {
      toast.error("Project tidak ditemukan")
      router.push("/dashboard/projects")
    }
    setLoading(false)
  }, [projectId, router])

  useEffect(() => { fetchProject() }, [fetchProject])
  useEffect(() => () => { if (pollingRef.current) clearInterval(pollingRef.current) }, [])

  // Load cat Lottie animation
  useEffect(() => {
    fetch("/cat-loading.json")
      .then(res => res.json())
      .then(data => setCatAnimation(data))
      .catch(() => {})
  }, [])

  const filteredAssets = (project?.assets ?? []).filter(a =>
    filter === "images" ? a.type === "image"
    : filter === "videos" ? a.type === "video"
    : true
  )

  // ── Polling helpers ────────────────────────────────────────────

  const startPollingImage = (jobId: string, pr: string, ratio: AspectRatio) => {
    setPollingJobId(jobId)
    pollingCompletedRef.current = false
    pollingRef.current = setInterval(async () => {
      if (pollingCompletedRef.current) return
      const s = await checkImageJobStatus(jobId, "textToImage")
      if (pollingCompletedRef.current) return
      if (s.status === "completed" && s.imageUrls?.[0]) {
        pollingCompletedRef.current = true
        clearInterval(pollingRef.current!); setPollingJobId(null); setIsGenerating(false)
        await saveAsset("image", s.imageUrls[0], pr, ratio, s.mediaGenerationId)
      } else if (s.status === "failed") {
        pollingCompletedRef.current = true
        clearInterval(pollingRef.current!); setPollingJobId(null); setIsGenerating(false)
        toast.error("Generasi gambar gagal")
      }
    }, POLL_INTERVAL)
  }

  const startPollingVideo = (jobId: string, pr: string, ratio: AspectRatio, op: "textToVideo" | "imageToVideo") => {
    setPollingJobId(jobId)
    pollingCompletedRef.current = false
    pollingRef.current = setInterval(async () => {
      if (pollingCompletedRef.current) return
      const s = await checkVideoJobStatus(jobId, op)
      if (pollingCompletedRef.current) return
      if (s.status === "completed" && s.videoUrls?.[0]) {
        pollingCompletedRef.current = true
        clearInterval(pollingRef.current!); setPollingJobId(null); setIsGenerating(false)
        await saveAsset("video", s.videoUrls[0], pr, ratio, s.mediaGenerationId)
      } else if (s.status === "failed") {
        pollingCompletedRef.current = true
        clearInterval(pollingRef.current!); setPollingJobId(null); setIsGenerating(false)
        toast.error("Generasi video gagal")
      }
    }, POLL_INTERVAL)
  }

  const saveAsset = async (type: "image" | "video", url: string, pr: string, ratio: AspectRatio, mediaGenId?: string) => {
    const res = await addProjectAsset(projectId, {
      type, source: "generated",
      name: `${type === "image" ? "Image" : "Video"} - ${new Date().toLocaleString("id-ID")}`,
      url, prompt: pr, aspectRatio: ratio,
      mediaGenerationId: mediaGenId,
    })
    if (res.success) {
      toast.success(`${type === "image" ? "Gambar" : "Video"} berhasil digenerate!`)
      setPrompt(""); setReferenceImages([]); setStartImage(null); setEndImage(null)
      fetchProject()
    } else {
      toast.error("Gagal menyimpan hasil generate")
    }
  }

  const saveAssetRaw = async (source: "upscaled" | "extended", label: string, url: string, pr?: string, ratio?: string, mediaGenId?: string) => {
    const res = await addProjectAsset(projectId, {
      type: "video", source,
      name: `${label} - ${new Date().toLocaleString("id-ID")}`,
      url, prompt: pr, aspectRatio: ratio,
      mediaGenerationId: mediaGenId,
    })
    if (res.success) {
      toast.success(`Video berhasil di-${source === "upscaled" ? "upscale" : "extend"} dan disimpan!`)
      fetchProject()
    } else {
      toast.error(`Gagal menyimpan hasil ${source === "upscaled" ? "upscale" : "extend"}`)
    }
  }

  const startPollingUpscale = (jobId: string, resolution: string, creditOp: "upscaleVideo" | "upscaleVideo4K", pr?: string, ratio?: string) => {
    setPollingJobId(jobId)
    setProcessingLabel(`Upscaling video ke ${resolution}`)
    pollingCompletedRef.current = false
    pollingRef.current = setInterval(async () => {
      if (pollingCompletedRef.current) return
      const s = await checkVideoJobStatus(jobId, creditOp)
      if (pollingCompletedRef.current) return
      if (s.status === "completed" && s.videoUrls?.[0]) {
        pollingCompletedRef.current = true
        clearInterval(pollingRef.current!); setPollingJobId(null); setIsGenerating(false); setProcessingLabel(null)
        await saveAssetRaw("upscaled", `Upscaled ${resolution}`, s.videoUrls[0], pr, ratio, s.mediaGenerationId)
      } else if (s.status === "failed") {
        pollingCompletedRef.current = true
        clearInterval(pollingRef.current!); setPollingJobId(null); setIsGenerating(false); setProcessingLabel(null)
        toast.error("Upscale video gagal")
      }
    }, POLL_INTERVAL)
  }

  const startPollingExtend = (jobId: string, pr: string, ratio?: string) => {
    setPollingJobId(jobId)
    setProcessingLabel("Extending video")
    pollingCompletedRef.current = false
    pollingRef.current = setInterval(async () => {
      if (pollingCompletedRef.current) return
      const s = await checkVideoJobStatus(jobId, "extendVideo")
      if (pollingCompletedRef.current) return
      if (s.status === "completed" && s.videoUrls?.[0]) {
        pollingCompletedRef.current = true
        clearInterval(pollingRef.current!); setPollingJobId(null); setIsGenerating(false); setProcessingLabel(null)
        await saveAssetRaw("extended", "Extended", s.videoUrls[0], pr, ratio, s.mediaGenerationId)
      } else if (s.status === "failed") {
        pollingCompletedRef.current = true
        clearInterval(pollingRef.current!); setPollingJobId(null); setIsGenerating(false); setProcessingLabel(null)
        toast.error("Extend video gagal")
      }
    }, POLL_INTERVAL)
  }

  // ── Generate ───────────────────────────────────────────────────

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return
    setIsGenerating(true)

    // Auto-scroll to loading skeleton after render
    setTimeout(() => {
      loadingSkeletonRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
    }, 100)

    if (generateType === "image") {
      let result
      if (referenceImages.length > 0) {
        const stripped = referenceImages.map(img => img.includes(",") ? img.split(",")[1] : img)
        result = await generateImageToImage({ prompt: prompt.trim(), referenceImagesBase64: stripped, aspectRatio })
      } else {
        result = await generateTextToImage({ prompt: prompt.trim(), aspectRatio })
      }
      if (!result.success) { toast.error(result.error || "Gagal"); setIsGenerating(false); return }
      if (result.jobId) return startPollingImage(result.jobId, prompt.trim(), aspectRatio)
      if (result.imageUrl) { setIsGenerating(false); await saveAsset("image", result.imageUrl, prompt.trim(), aspectRatio, result.mediaGenerationId) }
    } else {
      let result
      if (videoMode === "frames" && startImage) {
        const strippedStart = startImage.includes(",") ? startImage.split(",")[1] : startImage
        if (endImage) {
          // I2V-FL mode (start + end frame)
          const strippedEnd = endImage.includes(",") ? endImage.split(",")[1] : endImage
          result = await generateFrameToFrameVideo({ prompt: prompt.trim(), startImageBase64: strippedStart, endImageBase64: strippedEnd, aspectRatio, model: videoModel })
        } else {
          // I2V mode (start frame only)
          result = await generateImageToVideo({ prompt: prompt.trim(), startImageBase64: strippedStart, aspectRatio, model: videoModel })
        }
        if (!result.success) { toast.error(result.error || "Gagal"); setIsGenerating(false); return }
        if (result.jobId) return startPollingVideo(result.jobId, prompt.trim(), aspectRatio, "imageToVideo")
      } else if (videoMode === "reference" && referenceImages.length > 0) {
        // R2V mode
        const stripped = referenceImages.map(img => img.includes(",") ? img.split(",")[1] : img)
        result = await generateReferenceToVideo({ prompt: prompt.trim(), referenceImagesBase64: stripped, aspectRatio, model: videoModel })
        if (!result.success) { toast.error(result.error || "Gagal"); setIsGenerating(false); return }
        if (result.jobId) return startPollingVideo(result.jobId, prompt.trim(), aspectRatio, "imageToVideo")
      } else {
        // T2V mode
        result = await generateTextToVideo({ prompt: prompt.trim(), aspectRatio, model: videoModel })
        if (!result.success) { toast.error(result.error || "Gagal"); setIsGenerating(false); return }
        if (result.jobId) return startPollingVideo(result.jobId, prompt.trim(), aspectRatio, "textToVideo")
      }
      if (result?.videoUrl) { setIsGenerating(false); await saveAsset("video", result.videoUrl, prompt.trim(), aspectRatio) }
    }
  }

  // ── File upload ─────────────────────────────────────────────────

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    for (const file of Array.from(files)) {
      const isImage = file.type.startsWith("image/")
      const isVideo = file.type.startsWith("video/")
      if (!isImage && !isVideo) { toast.error(`"${file.name}" tidak didukung`); continue }

      // Upload to Cloudinary via API route, then save URL to DB
      const formData = new FormData()
      formData.append("file", file)
      const uploadRes = await fetch("/api/upload-asset", { method: "POST", body: formData })
      if (!uploadRes.ok) { toast.error(`Gagal upload "${file.name}"`); continue }
      const { url } = await uploadRes.json()

      const res = await addProjectAsset(projectId, {
        type: isImage ? "image" : "video", source: "uploaded", name: file.name, url,
      })
      if (res.success) { toast.success(`"${file.name}" diupload`); fetchProject() }
      else toast.error(`Gagal upload "${file.name}"`)
    }
    e.target.value = ""
  }

  // ── Pick from project ──────────────────────────────────────────

  const handlePickFromProject = (asset: Asset) => {
    if (assetPickerMode === "reference") {
      if (referenceImages.includes(asset.url)) {
        setReferenceImages(prev => prev.filter(u => u !== asset.url))
      } else if (referenceImages.length < 3) {
        setReferenceImages(prev => [...prev, asset.url])
      }
    } else if (assetPickerMode === "end") {
      setEndImage(asset.url)
      setAssetPickerOpen(false)
    } else {
      setStartImage(asset.url)
      setAssetPickerOpen(false)
    }
  }

  const handleDeleteAsset = async (asset: Asset) => {
    setDeleteTarget(asset)
  }

  const confirmDeleteAsset = async () => {
    if (!deleteTarget) return
    setIsDeleting(true)
    const res = await deleteProjectAsset(projectId, deleteTarget.id)
    if (res.success) {
      toast.success("Asset dihapus")
      if (selectedAsset?.id === deleteTarget.id) setSelectedAsset(null)
      fetchProject()
    } else toast.error("Gagal menghapus")
    setIsDeleting(false)
    setDeleteTarget(null)
  }

  const handleDownload = (asset: Asset) => {
    const a = document.createElement("a")
    a.href = asset.url
    a.download = asset.name
    a.target = "_blank"
    a.click()
  }

  const handleRefImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    Array.from(e.target.files).slice(0, 3 - referenceImages.length).forEach(file => {
      const reader = new FileReader()
      reader.onload = ev => {
        if (ev.target?.result) setReferenceImages(prev => prev.length < 3 ? [...prev, ev.target!.result as string] : prev)
      }
      reader.readAsDataURL(file)
    })
    e.target.value = ""
  }

  const handleStartImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => { if (ev.target?.result) setStartImage(ev.target.result as string) }
    reader.readAsDataURL(file)
    e.target.value = ""
  }

  const handleEndImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => { if (ev.target?.result) setEndImage(ev.target.result as string) }
    reader.readAsDataURL(file)
    e.target.value = ""
  }

  const creditCost = generateType === "image"
    ? (referenceImages.length > 0 ? CREDIT_COSTS.imageToImage : CREDIT_COSTS.textToImage)
    : ((videoMode === "frames" || videoMode === "reference") ? CREDIT_COSTS.imageToVideo : CREDIT_COSTS.textToVideo) * videoCount

  if (loading) {
    return (
      <div className="-mx-4 -mb-4 flex items-center justify-center bg-white" style={{ height: "calc(100vh - 64px)" }}>
        <Loader2 className="size-5 animate-spin text-black/30" />
      </div>
    )
  }

  if (!project) return null

  return (
    <div
      className="-mx-4 -mb-4 bg-white text-gray-900 flex flex-col overflow-hidden"
      style={{ height: "calc(100vh - 64px)" }}
    >
      {/* ── Top bar ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-black/10 shrink-0">
        <button
          onClick={() => router.push("/dashboard/projects")}
          className="text-black/40 hover:text-black transition-colors p-1 rounded-lg hover:bg-black/5"
        >
          <ArrowLeft className="size-4" />
        </button>
        <h1 className="text-sm font-medium text-black/80 flex-1 truncate">{project.name}</h1>
        <button
          onClick={() => uploadFileRef.current?.click()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-black/50 hover:text-black hover:bg-black/5 transition-colors border border-black/10"
        >
          <Plus className="size-3.5" /> Upload
        </button>
      </div>

      {/* ── Body ─────────────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0">

        {/* Left icon sidebar */}
        <div className="w-12 border-r border-black/10 flex flex-col items-center pt-4 gap-1.5 shrink-0">
          {(["all", "videos", "images"] as FilterType[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              title={f === "all" ? "All" : f === "images" ? "Images" : "Videos"}
              className={cn(
                "p-2.5 rounded-xl transition-colors",
                filter === f ? "bg-black/10 text-black" : "text-black/30 hover:text-black/60 hover:bg-black/5"
              )}
            >
              {f === "all" ? <LayoutGrid className="size-4" />
                : f === "videos" ? <Film className="size-4" />
                : <ImageIcon className="size-4" />}
            </button>
          ))}
        </div>

        {/* Center: scrollable media grid */}
        <div className="flex-1 overflow-y-auto px-5 py-4 pb-44">
          {filteredAssets.length === 0 && !isGenerating ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center py-20">
              <p className="text-black/30 text-sm">
                {filter === "all" ? "Belum ada media. Upload atau generate!" : `Belum ada ${filter === "images" ? "gambar" : "video"}.`}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {/* Lottie skeleton loading — first grid item */}
              {isGenerating && (
                <div ref={loadingSkeletonRef} className="rounded-2xl overflow-hidden bg-gray-50 border border-black/5">
                  <div className="relative aspect-square w-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-50">
                    {catAnimation ? (
                      <Lottie
                        animationData={catAnimation}
                        loop
                        className="w-28 h-28"
                      />
                    ) : (
                      <Loader2 className="size-8 animate-spin text-black/20" />
                    )}
                  </div>
                  <div className="px-3 py-2 space-y-2">
                    <div className="flex items-center gap-1.5">
                      <Loader2 className="size-3 animate-spin text-black/30" />
                      <span className="text-[11px] text-black/40 font-medium">
                        {pollingJobId
                          ? (processingLabel || `Processing ${generateType === "video" ? "video" : "image"}...`)
                          : "Sending..."}
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      <div className="h-2 bg-black/5 rounded-full w-3/4 animate-pulse" />
                      <div className="h-2 bg-black/5 rounded-full w-1/2 animate-pulse" />
                    </div>
                  </div>
                </div>
              )}

              {filteredAssets.map(asset => {
                const createdMs = new Date(asset.createdAt).getTime()
                const now = Date.now()
                const msIn3Days = 3 * 24 * 60 * 60 * 1000
                const remaining = msIn3Days - (now - createdMs)
                const isExpired = remaining <= 0
                const isExpiring = remaining > 0 && remaining <= msIn3Days
                const hoursLeft = Math.max(0, Math.ceil(remaining / (60 * 60 * 1000)))

                return (
                <div
                  key={asset.id}
                  className={cn("rounded-2xl overflow-hidden bg-white border", isExpired ? "border-red-300 opacity-60" : isExpiring && hoursLeft <= 24 ? "border-orange-300" : "border-black/5")}
                >
                  {asset.type === "image" ? (
                    <div className="relative">
                      <img
                        src={asset.url}
                        alt={asset.name}
                        className="w-full aspect-square object-cover block cursor-pointer"
                        onClick={() => setPreviewAsset(asset)}
                      />
                      {isExpiring && (
                        <div className={cn("absolute top-2 left-2 flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium backdrop-blur-sm", hoursLeft <= 24 ? "bg-red-500/80 text-white" : "bg-orange-500/80 text-white")}>
                          <AlertTriangle className="size-3" />
                          {hoursLeft <= 24 ? `Expired in ${hoursLeft}h` : `Expired in ${Math.ceil(hoursLeft / 24)}d`}
                        </div>
                      )}
                      {isExpired && (
                        <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium bg-red-600/80 text-white backdrop-blur-sm">
                          <AlertTriangle className="size-3" /> Expired
                        </div>
                      )}
                    </div>
                  ) : (
                    <div
                      className="relative bg-gray-100 aspect-square cursor-pointer"
                      onClick={() => setPreviewAsset(asset)}
                    >
                      <video src={asset.url} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors">
                        <div className="w-10 h-10 rounded-full bg-white/80 flex items-center justify-center">
                          <Video className="size-4 text-black/70" />
                        </div>
                      </div>
                      {isExpiring && (
                        <div className={cn("absolute top-2 left-2 flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium backdrop-blur-sm", hoursLeft <= 24 ? "bg-red-500/80 text-white" : "bg-orange-500/80 text-white")}>
                          <AlertTriangle className="size-3" />
                          {hoursLeft <= 24 ? `${hoursLeft}j lagi` : `${Math.ceil(hoursLeft / 24)}h lagi`}
                        </div>
                      )}
                      {isExpired && (
                        <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium bg-red-600/80 text-white backdrop-blur-sm">
                          <AlertTriangle className="size-3" /> Expired
                        </div>
                      )}
                    </div>
                  )}
                  <div className="px-3 py-2">
                    {asset.prompt && (
                      <p className="text-black/50 text-xs line-clamp-2 mb-2">{asset.prompt}</p>
                    )}
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleDownload(asset)}
                        className="p-1.5 rounded-lg bg-black/5 hover:bg-black/10 text-black/40 hover:text-black transition-colors"
                        title="Download"
                      >
                        <Download className="size-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteAsset(asset)}
                        className="p-1.5 rounded-lg bg-black/5 hover:bg-red-500/20 text-black/40 hover:text-red-400 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Generate bar (bottom) ────────────────────────────────── */}
      <div className="shrink-0 px-4 pb-4 pt-3 border-t border-black/10 bg-white">
        <div className="mx-auto max-w-2xl bg-gray-50 rounded-2xl border border-black/10 overflow-hidden">

          {/* Options row */}
          <div className="flex items-center gap-1 px-3 pt-2.5 pb-1 flex-wrap">
            {/* Image / Video tab */}
            <div className="flex gap-0.5 bg-black/5 rounded-lg p-0.5 mr-2">
              <button
                onClick={() => { setGenerateType("image"); setStartImage(null); setEndImage(null); setVideoMode("text") }}
                disabled={isGenerating}
                className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors", generateType === "image" ? "bg-black/10 text-black" : "text-black/40 hover:text-black/70")}
              >
                <ImageIcon className="size-3" /> Image
              </button>
              <button
                onClick={() => { setGenerateType("video"); setReferenceImages([]) }}
                disabled={isGenerating}
                className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors", generateType === "video" ? "bg-black/10 text-black" : "text-black/40 hover:text-black/70")}
              >
                <Video className="size-3" /> Video
              </button>
            </div>

            {/* Aspect ratio */}
            <div className="flex gap-0.5 bg-black/5 rounded-lg p-0.5 mr-2">
              {(["landscape", "portrait"] as AspectRatio[]).map(r => (
                <button
                  key={r}
                  onClick={() => setAspectRatio(r)}
                  disabled={isGenerating}
                  className={cn("px-2.5 py-1 rounded-md text-xs font-medium transition-colors capitalize", aspectRatio === r ? "bg-black/10 text-black" : "text-black/40 hover:text-black/70")}
                >
                  {r}
                </button>
              ))}
            </div>

            {/* Model */}
            {generateType === "video" ? (
              <span className="px-2.5 py-1 rounded-lg text-xs bg-black/5 text-black/40">⚡ Veo 3.1 Fast</span>
            ) : (
              <span className="px-2.5 py-1 rounded-lg text-xs bg-black/5 text-black/40">🍌 Nano Banana 2</span>
            )}
          </div>

          {/* Video mode & count row */}
          {generateType === "video" && (
            <div className="flex items-center gap-1 px-3 pb-1 flex-wrap">
              {/* Video mode selector */}
              <div className="flex gap-0.5 bg-black/5 rounded-lg p-0.5 mr-2">
                {([
                  { value: "text" as VideoMode, label: "Text" },
                  { value: "frames" as VideoMode, label: "Frames" },
                  { value: "reference" as VideoMode, label: "Reference" },
                ]).map(m => (
                  <button
                    key={m.value}
                    onClick={() => {
                      setVideoMode(m.value)
                      if (m.value === "text") { setStartImage(null); setEndImage(null); setReferenceImages([]) }
                      if (m.value === "frames") { setReferenceImages([]) }
                      if (m.value === "reference") { setStartImage(null); setEndImage(null) }
                    }}
                    disabled={isGenerating}
                    className={cn("px-2.5 py-1 rounded-md text-xs font-medium transition-colors", videoMode === m.value ? "bg-black/10 text-black" : "text-black/40 hover:text-black/70")}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              {/* Count selector */}
              <div className="flex gap-0.5 bg-black/5 rounded-lg p-0.5">
                {[1, 2].map(c => (
                  <button
                    key={c}
                    onClick={() => setVideoCount(c)}
                    disabled={isGenerating}
                    className={cn("px-2.5 py-1 rounded-md text-xs font-medium transition-colors", videoCount === c ? "bg-black/10 text-black" : "text-black/40 hover:text-black/70")}
                  >
                    {c}×
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Reference / start / end image chips */}
          {(referenceImages.length > 0 || startImage || endImage) && (
            <div className="flex gap-2 px-3 py-1.5 items-center">
              {generateType === "image" && referenceImages.map((img, i) => (
                <div key={i} className="relative size-9 rounded-lg overflow-hidden shrink-0">
                  <img src={img} className="w-full h-full object-cover" alt="" />
                  <button
                    onClick={() => setReferenceImages(prev => prev.filter((_, j) => j !== i))}
                    className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                  >
                    <X className="size-3 text-white" />
                  </button>
                </div>
              ))}
              {generateType === "video" && videoMode === "reference" && referenceImages.map((img, i) => (
                <div key={i} className="relative size-9 rounded-lg overflow-hidden shrink-0">
                  <img src={img} className="w-full h-full object-cover" alt="" />
                  <button
                    onClick={() => setReferenceImages(prev => prev.filter((_, j) => j !== i))}
                    className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                  >
                    <X className="size-3 text-white" />
                  </button>
                </div>
              ))}
              {generateType === "video" && videoMode === "frames" && startImage && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-black/30 font-medium">START</span>
                  <div className="relative size-9 rounded-lg overflow-hidden shrink-0">
                    <img src={startImage} className="w-full h-full object-cover" alt="" />
                    <button
                      onClick={() => setStartImage(null)}
                      className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                    >
                      <X className="size-3 text-white" />
                    </button>
                  </div>
                </div>
              )}
              {generateType === "video" && videoMode === "frames" && endImage && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-black/30 font-medium">END</span>
                  <div className="relative size-9 rounded-lg overflow-hidden shrink-0">
                    <img src={endImage} className="w-full h-full object-cover" alt="" />
                    <button
                      onClick={() => setEndImage(null)}
                      className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                    >
                      <X className="size-3 text-white" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Prompt input row */}
          <div className="flex items-end gap-2 px-3 pb-2.5">
            {(generateType === "image" || videoMode !== "text") && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  disabled={isGenerating}
                  title="Tambah gambar"
                  className="p-2 rounded-xl text-black/30 hover:text-black/60 hover:bg-black/5 transition-colors shrink-0"
                >
                  <Plus className="size-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="bg-white border-black/10 text-black">
                {generateType === "image" ? (
                  <>
                    <DropdownMenuItem
                      onClick={() => { setAssetPickerMode("reference"); setAssetPickerOpen(true) }}
                      className="hover:bg-black/5 focus:bg-black/5 text-black text-xs cursor-pointer gap-2"
                    >
                      <LayoutGrid className="size-3.5" /> Pilih dari Project
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => refImgInputRef.current?.click()}
                      className="hover:bg-black/5 focus:bg-black/5 text-black text-xs cursor-pointer gap-2"
                    >
                      <ImageIcon className="size-3.5" /> Upload dari Device
                    </DropdownMenuItem>
                  </>
                ) : videoMode === "frames" ? (
                  <>
                    <DropdownMenuItem
                      onClick={() => { setAssetPickerMode("start"); setAssetPickerOpen(true) }}
                      className="hover:bg-black/5 focus:bg-black/5 text-black text-xs cursor-pointer gap-2"
                    >
                      <LayoutGrid className="size-3.5" /> Start Frame dari Project
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => startImgInputRef.current?.click()}
                      className="hover:bg-black/5 focus:bg-black/5 text-black text-xs cursor-pointer gap-2"
                    >
                      <ImageIcon className="size-3.5" /> Upload Start Frame
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => { setAssetPickerMode("end"); setAssetPickerOpen(true) }}
                      className="hover:bg-black/5 focus:bg-black/5 text-black text-xs cursor-pointer gap-2"
                    >
                      <LayoutGrid className="size-3.5" /> End Frame dari Project
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => endImgInputRef.current?.click()}
                      className="hover:bg-black/5 focus:bg-black/5 text-black text-xs cursor-pointer gap-2"
                    >
                      <ImageIcon className="size-3.5" /> Upload End Frame
                    </DropdownMenuItem>
                  </>
                ) : videoMode === "reference" ? (
                  <>
                    <DropdownMenuItem
                      onClick={() => { setAssetPickerMode("reference"); setAssetPickerOpen(true) }}
                      className="hover:bg-black/5 focus:bg-black/5 text-black text-xs cursor-pointer gap-2"
                    >
                      <LayoutGrid className="size-3.5" /> Pilih dari Project
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => refImgInputRef.current?.click()}
                      className="hover:bg-black/5 focus:bg-black/5 text-black text-xs cursor-pointer gap-2"
                    >
                      <ImageIcon className="size-3.5" /> Upload dari Device
                    </DropdownMenuItem>
                  </>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
            )}

            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleGenerate() } }}
              placeholder="What do you want to create?"
              disabled={isGenerating}
              rows={1}
              className="flex-1 bg-transparent text-black/80 placeholder:text-black/25 text-sm resize-none outline-none py-2 max-h-20"
              style={{ lineHeight: "1.5" }}
            />

            <button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors shrink-0",
                isGenerating || !prompt.trim()
                  ? "bg-black/5 text-black/25 cursor-not-allowed"
                  : "bg-black/10 hover:bg-black/20 text-black"
              )}
            >
              {isGenerating
                ? <><Loader2 className="size-3.5 animate-spin" />{pollingJobId ? "Processing…" : "Sending…"}</>
                : <>{generateType === "image" ? <ImageIcon className="size-3.5" /> : <Video className="size-3.5" />} Generate</>
              }
            </button>
          </div>

          {/* Credits info */}
          <div className="px-4 pb-2 text-[11px] text-black/30">
            Generating will use {creditCost} credits
          </div>
        </div>
      </div>

      {/* Hidden inputs */}
      <input ref={uploadFileRef} type="file" accept="image/*,video/*" multiple className="hidden" onChange={handleFileUpload} />
      <input ref={refImgInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleRefImageUpload} />
      <input ref={startImgInputRef} type="file" accept="image/*" className="hidden" onChange={handleStartImageUpload} />
      <input ref={endImgInputRef} type="file" accept="image/*" className="hidden" onChange={handleEndImageUpload} />

      {/* ── Asset picker ─────────────────────────────────────── */}
      {assetPickerOpen && (() => {
        const projectImages = (project?.assets ?? []).filter(a => a.type === "image")
        return (
          <div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
            onClick={() => setAssetPickerOpen(false)}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[70vh] flex flex-col overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-black/8 shrink-0">
                <p className="text-sm font-medium text-black/80">
                  {assetPickerMode === "reference" ? "Pilih reference image (maks 3)" : assetPickerMode === "end" ? "Pilih end frame" : "Pilih start frame"}
                </p>
                <button onClick={() => setAssetPickerOpen(false)} className="p-1.5 rounded-lg hover:bg-black/5 transition-colors">
                  <X className="size-4 text-black/40" />
                </button>
              </div>
              <div className="overflow-y-auto p-4">
                {projectImages.length === 0 ? (
                  <p className="text-center text-black/30 text-sm py-10">Belum ada gambar di project ini.</p>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {projectImages.map(asset => {
                      const selected = assetPickerMode === "reference"
                        ? referenceImages.includes(asset.url)
                        : assetPickerMode === "end"
                        ? endImage === asset.url
                        : startImage === asset.url
                      return (
                        <button
                          key={asset.id}
                          onClick={() => handlePickFromProject(asset)}
                          className={cn(
                            "relative aspect-square rounded-xl overflow-hidden transition-all",
                            selected ? "ring-2 ring-black/60" : "hover:ring-2 hover:ring-black/20"
                          )}
                        >
                          <img src={asset.url} className="w-full h-full object-cover" alt={asset.name} />
                          {selected && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                              <span className="text-white text-lg">✓</span>
                            </div>
                          )}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
              {assetPickerMode === "reference" && (
                <div className="px-4 py-3 border-t border-black/8 shrink-0">
                  <button
                    onClick={() => setAssetPickerOpen(false)}
                    className="w-full py-2 rounded-xl bg-black/8 hover:bg-black/12 text-black/70 text-sm font-medium transition-colors"
                  >
                    Selesai ({referenceImages.length}/3 dipilih)
                  </button>
                </div>
              )}
            </div>
          </div>
        )
      })()}

      {/* ── Preview dialog ──────────────────────────────────── */}
      {previewAsset && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => { setPreviewAsset(null); setShowExtendInput(false) }}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="relative">
              {previewAsset.type === "video" ? (
                <video
                  src={previewAsset.url}
                  controls
                  autoPlay
                  playsInline
                  className="w-full max-h-[60vh] object-contain bg-black"
                />
              ) : (
                <img
                  src={previewAsset.url}
                  alt={previewAsset.name}
                  className="w-full max-h-[60vh] object-contain bg-gray-50"
                />
              )}
              <button
                className="absolute top-3 right-3 p-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors"
                onClick={() => { setPreviewAsset(null); setShowExtendInput(false) }}
              >
                <X className="size-4" />
              </button>
            </div>
            {previewAsset.prompt && (
              <p className="text-black/50 text-xs px-4 pt-3 line-clamp-2">{previewAsset.prompt}</p>
            )}
            <div className="flex items-center gap-2 px-4 py-3 flex-wrap">
              {/* Use as Reference — image only */}
              {previewAsset.type === "image" && (
                <button
                  onClick={() => {
                    setReferenceImages(prev => {
                      if (prev.includes(previewAsset.url)) return prev
                      if (prev.length >= 3) { toast.error("Maksimal 3 reference images"); return prev }
                      return [...prev, previewAsset.url]
                    })
                    setGenerateType("image")
                    setPreviewAsset(null)
                    toast.success("Ditambahkan sebagai reference image")
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-black/5 hover:bg-black/10 text-black/70 hover:text-black transition-colors"
                >
                  <ImageIcon className="size-3.5" /> Use as Reference
                </button>
              )}

              {/* Upscale — image */}
              {previewAsset.type === "image" && (
                <button
                  onClick={async () => {
                    if (!previewAsset.mediaGenerationId) {
                      toast.error("Image ini tidak bisa di-upscale karena tidak memiliki mediaGenerationId.")
                      return
                    }
                    setIsUpscaling(true)
                    const result = await upscaleImage({ mediaGenerationId: previewAsset.mediaGenerationId })
                    if (result.success && result.imageUrl) {
                      const res = await addProjectAsset(projectId, {
                        type: "image",
                        source: "upscaled",
                        name: `Upscaled - ${new Date().toLocaleString("id-ID")}`,
                        url: result.imageUrl,
                        prompt: previewAsset.prompt || undefined,
                        aspectRatio: previewAsset.aspectRatio || undefined,
                      })
                      if (res.success) {
                        toast.success("Image berhasil di-upscale dan disimpan!")
                        fetchProject()
                      } else {
                        toast.error("Gagal menyimpan hasil upscale")
                      }
                    } else {
                      toast.error(result.error || "Upscale gagal")
                    }
                    setIsUpscaling(false)
                    setPreviewAsset(null)
                  }}
                  disabled={isUpscaling}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-black/5 hover:bg-black/10 text-black/70 hover:text-black transition-colors"
                >
                  {isUpscaling
                    ? <><Loader2 className="size-3.5 animate-spin" /> Upscaling…</>
                    : <><Sparkles className="size-3.5" /> Upscale</>
                  }
                </button>
              )}

              {/* Upscale — video */}
              {previewAsset.type === "video" && (["1080p", "4K"] as const).map((res) => (
                <button
                  key={res}
                  onClick={async () => {
                    if (!previewAsset.mediaGenerationId) {
                      toast.error("Video ini tidak bisa di-upscale karena tidak memiliki mediaGenerationId.")
                      return
                    }
                    const creditOp = res === "4K" ? "upscaleVideo4K" as const : "upscaleVideo" as const
                    const assetPrompt = previewAsset.prompt || undefined
                    const assetRatio = previewAsset.aspectRatio || undefined
                    const mediaGenId = previewAsset.mediaGenerationId
                    setPreviewAsset(null); setShowExtendInput(false)
                    setIsGenerating(true)
                    setTimeout(() => loadingSkeletonRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 100)
                    toast.info(`Memulai upscale video ke ${res}...`)
                    const result = await upscaleVideo({ mediaGenerationId: mediaGenId, resolution: res })
                    if (!result.success) {
                      toast.error(result.error || "Upscale gagal")
                      setIsGenerating(false)
                      return
                    }
                    if (result.jobId) {
                      startPollingUpscale(result.jobId, res, creditOp, assetPrompt, assetRatio)
                    } else if (result.videoUrl) {
                      setIsGenerating(false)
                      await saveAssetRaw("upscaled", `Upscaled ${res}`, result.videoUrl, assetPrompt, assetRatio)
                    }
                  }}
                  disabled={isGenerating}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-black/5 hover:bg-black/10 text-black/70 hover:text-black transition-colors"
                >
                  <Zap className="size-3.5" /> Upscale {res}
                </button>
              ))}

              {/* Extend — video only */}
              {previewAsset.type === "video" && !showExtendInput && (
                <button
                  onClick={() => {
                    if (!previewAsset.mediaGenerationId) {
                      toast.error("Video ini tidak bisa di-extend karena tidak memiliki mediaGenerationId.")
                      return
                    }
                    setExtendPrompt("")
                    setShowExtendInput(true)
                  }}
                  disabled={isGenerating}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-black/5 hover:bg-black/10 text-black/70 hover:text-black transition-colors"
                >
                  <FastForward className="size-3.5" /> Extend
                </button>
              )}

              <div className="flex-1" />
              <button
                onClick={() => { handleDownload(previewAsset); setPreviewAsset(null) }}
                className="p-2 rounded-xl bg-black/5 hover:bg-black/10 text-black/40 hover:text-black transition-colors"
              >
                <Download className="size-4" />
              </button>
            </div>

            {/* Extend prompt input */}
            {showExtendInput && previewAsset.type === "video" && (
              <div className="flex gap-2 px-4 pb-4">
                <input
                  type="text"
                  value={extendPrompt}
                  onChange={(e) => setExtendPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      setShowExtendInput(false)
                      setExtendPrompt("")
                    }
                  }}
                  placeholder="Deskripsikan apa yang terjadi selanjutnya..."
                  autoFocus
                  disabled={isGenerating}
                  className="flex-1 px-3 py-2 rounded-xl text-xs bg-black/5 border border-black/10 focus:border-black/30 focus:outline-none placeholder:text-black/30"
                />
                <button
                  onClick={async () => {
                    if (!extendPrompt.trim()) {
                      toast.error("Prompt wajib diisi untuk extend video.")
                      return
                    }
                    const trimmedPrompt = extendPrompt.trim()
                    const assetRatio = previewAsset.aspectRatio || undefined
                    const mediaGenId = previewAsset.mediaGenerationId!
                    setPreviewAsset(null); setShowExtendInput(false); setExtendPrompt("")
                    setIsGenerating(true)
                    setTimeout(() => loadingSkeletonRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 100)
                    toast.info("Memulai extend video...")
                    const result = await extendVideo({
                      mediaGenerationId: mediaGenId,
                      prompt: trimmedPrompt,
                    })
                    if (!result.success) {
                      toast.error(result.error || "Extend gagal")
                      setIsGenerating(false)
                      return
                    }
                    if (result.jobId) {
                      startPollingExtend(result.jobId, trimmedPrompt, assetRatio)
                    } else if (result.videoUrl) {
                      setIsGenerating(false)
                      await saveAssetRaw("extended", "Extended", result.videoUrl, trimmedPrompt, assetRatio)
                    }
                  }}
                  disabled={isGenerating || !extendPrompt.trim()}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium bg-black text-white hover:bg-black/80 disabled:opacity-40 transition-colors"
                >
                  <FastForward className="size-3.5" /> Extend
                </button>
                <button
                  onClick={() => { setShowExtendInput(false); setExtendPrompt("") }}
                  disabled={isGenerating}
                  className="p-2 rounded-xl bg-black/5 hover:bg-black/10 text-black/40 hover:text-black transition-colors"
                >
                  <X className="size-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!isDeleting && !open) setDeleteTarget(null) }}>
        <DialogContent className="sm:max-w-md">
          {isDeleting ? (
            <div className="flex flex-col items-center gap-4 py-8">
              <Loader2 className="h-10 w-10 animate-spin text-red-500" />
              <div className="text-center">
                <p className="font-medium">Menghapus asset...</p>
                <p className="text-sm text-black/40 mt-1">Menghapus asset.</p>
              </div>
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" /> Hapus Asset
                </DialogTitle>
                <DialogDescription>
                  Hapus &quot;{deleteTarget?.name}&quot;? Aksi ini tidak bisa dibatalkan.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="gap-2 sm:gap-0">
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="px-4 py-2 rounded-lg border border-black/10 hover:bg-black/5 text-sm font-medium transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={confirmDeleteAsset}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 text-sm font-medium transition-colors"
                >
                  <Trash2 className="h-4 w-4" /> Hapus
                </button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
