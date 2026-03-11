"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Copy, Check, Image, Video, Zap, Clock, FileImage, Key, RefreshCw, Eye, EyeOff, Download } from "lucide-react"
import { getUserApiToken, regenerateApiToken } from "@/app/actions/api-token"

interface CodeBlockProps {
    language: string
    code: string
}

function CodeBlock({ language, code }: CodeBlockProps) {
    const [copied, setCopied] = useState(false)

    const copyToClipboard = () => {
        navigator.clipboard.writeText(code)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className="relative group">
            <pre className="bg-zinc-950 text-zinc-100 p-4 rounded-lg overflow-x-auto text-sm">
                <code>{code}</code>
            </pre>
            <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                onClick={copyToClipboard}
            >
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </Button>
        </div>
    )
}

interface EndpointCardProps {
    method: "GET" | "POST"
    endpoint: string
    description: string
    children: React.ReactNode
}

function EndpointCard({ method, endpoint, description, children }: EndpointCardProps) {
    return (
        <Card className="mb-6">
            <CardHeader>
                <div className="flex items-center gap-3">
                    <Badge variant={method === "POST" ? "default" : "secondary"} className="font-mono">
                        {method}
                    </Badge>
                    <code className="text-sm bg-muted px-2 py-1 rounded">{endpoint}</code>
                </div>
                <CardDescription className="mt-2">{description}</CardDescription>
            </CardHeader>
            <CardContent>{children}</CardContent>
        </Card>
    )
}

function ApiTokenSection() {
    const [token, setToken] = useState<string>("")
    const [showToken, setShowToken] = useState(false)
    const [loading, setLoading] = useState(true)
    const [regenerating, setRegenerating] = useState(false)
    const [copied, setCopied] = useState(false)

    useEffect(() => {
        loadToken()
    }, [])

    const loadToken = async () => {
        setLoading(true)
        const result = await getUserApiToken()
        if (result.success && result.token) {
            setToken(result.token)
        }
        setLoading(false)
    }

    const handleRegenerate = async () => {
        if (!confirm("Are you sure? This will invalidate your current token.")) return

        setRegenerating(true)
        const result = await regenerateApiToken()
        if (result.success && result.token) {
            setToken(result.token)
        }
        setRegenerating(false)
    }

    const copyToken = () => {
        navigator.clipboard.writeText(token)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const maskedToken = token ? `${token.slice(0, 8)}${"•".repeat(32)}${token.slice(-8)}` : ""

    return (
        <Card className="mb-8 border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardHeader>
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <Key className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <CardTitle>Your API Token</CardTitle>
                        <CardDescription>
                            Use this token in the Authorization header for all API requests
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Loading token...
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <div className="flex-1 relative">
                                <Input
                                    readOnly
                                    value={showToken ? token : maskedToken}
                                    className="font-mono text-sm pr-20"
                                />
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-10 top-1/2 -translate-y-1/2 h-8 w-8"
                                    onClick={() => setShowToken(!showToken)}
                                >
                                    {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                                    onClick={copyToken}
                                >
                                    {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                </Button>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleRegenerate}
                                disabled={regenerating}
                            >
                                {regenerating ? (
                                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                )}
                                Regenerate
                            </Button>
                        </div>

                        <div className="p-3 bg-muted/50 rounded-lg">
                            <p className="text-sm font-medium mb-2">Usage:</p>
                            <code className="text-xs bg-zinc-950 text-zinc-100 px-3 py-2 rounded block">
                                Authorization: Bearer {showToken ? token : "<your_token>"}
                            </code>
                        </div>

                        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                            <p className="text-sm text-amber-600 dark:text-amber-400">
                                <strong>Warning:</strong> Keep your token secret. Do not share it publicly or commit it to version control.
                            </p>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

export default function ApiDocsPage() {
    const baseUrl = "https://affiliator.pro"

    return (
        <div className="container mx-auto py-8 px-4 max-w-5xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">API Documentation</h1>
                <p className="text-muted-foreground">
                    Complete API reference for Image and Video generation endpoints
                </p>
            </div>

            {/* API Token Section */}
            <ApiTokenSection />

            {/* Postman Collection Download */}
            <Card className="mb-8 border-2 border-orange-500/20 bg-gradient-to-br from-orange-500/5 to-transparent">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-orange-500/10 rounded-lg">
                                <Download className="h-5 w-5 text-orange-500" />
                            </div>
                            <div>
                                <CardTitle>Postman Collection</CardTitle>
                                <CardDescription>
                                    Download and import into Postman for easy API testing
                                </CardDescription>
                            </div>
                        </div>
                        <Button asChild className="bg-orange-500 hover:bg-orange-600">
                            <a href="/affiliator-pro-api.postman_collection.json" download>
                                <Download className="h-4 w-4 mr-2" />
                                Download Collection
                            </a>
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="p-4 bg-muted/50 rounded-lg">
                        <h4 className="font-medium mb-2">Setup Instructions:</h4>
                        <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                            <li>Download the collection file</li>
                            <li>Open Postman and click Import</li>
                            <li>Select the downloaded JSON file</li>
                            <li>Go to collection variables and set <code className="bg-zinc-200 dark:bg-zinc-800 px-1 rounded">api_token</code> with your token</li>
                            <li>Start testing the API endpoints!</li>
                        </ol>
                    </div>
                </CardContent>
            </Card>

            {/* Quick Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-500/10 rounded-lg">
                                <Image className="h-5 w-5 text-purple-500" />
                            </div>
                            <div>
                                <p className="font-medium">Image Generation</p>
                                <p className="text-sm text-muted-foreground">Nano Bananan Pro Model</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-500/10 rounded-lg">
                                <Video className="h-5 w-5 text-blue-500" />
                            </div>
                            <div>
                                <p className="font-medium">Video Generation</p>
                                <p className="text-sm text-muted-foreground">Veo 3.1 Model</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-500/10 rounded-lg">
                                <Zap className="h-5 w-5 text-green-500" />
                            </div>
                            <div>
                                <p className="font-medium">Async Processing</p>
                                <p className="text-sm text-muted-foreground">Job-based Queue</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Base URL */}
            <Card className="mb-8">
                <CardHeader>
                    <CardTitle>Base URL</CardTitle>
                    <CardDescription>All API endpoints use this base URL</CardDescription>
                </CardHeader>
                <CardContent>
                    <CodeBlock
                        language="text"
                        code={baseUrl}
                    />
                </CardContent>
            </Card>

            {/* Authentication */}
            <Card className="mb-8">
                <CardHeader>
                    <CardTitle>Authentication</CardTitle>
                    <CardDescription>All API requests require Bearer token authentication</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                        Include your API token in the Authorization header of every request:
                    </p>
                    <CodeBlock
                        language="text"
                        code={`Authorization: Bearer <your_api_token>`}
                    />
                    <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                        <p className="text-sm text-red-600 dark:text-red-400">
                            <strong>401 Unauthorized</strong> will be returned if the token is missing or invalid.
                        </p>
                    </div>
                </CardContent>
            </Card>

            <Tabs defaultValue="image" className="mb-8">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="image" className="flex items-center gap-2">
                        <Image className="h-4 w-4" /> Image Generation
                    </TabsTrigger>
                    <TabsTrigger value="video" className="flex items-center gap-2">
                        <Video className="h-4 w-4" /> Video Generation
                    </TabsTrigger>
                </TabsList>

                {/* Image Generation APIs */}
                <TabsContent value="image" className="mt-6">
                    <EndpointCard
                        method="POST"
                        endpoint="/api/generate/image"
                        description="Generate images from text prompts using Nano Banana Pro model"
                    >
                        <h4 className="font-medium mb-3">Request Body</h4>
                        <CodeBlock
                            language="json"
                            code={`{
  "prompt": "A beautiful sunset over mountains",
  "aspectRatio": "landscape",  // "landscape" or "portrait"
  "referenceImages": []        // Optional: up to 3 base64 images
}`}
                        />

                        <h4 className="font-medium mt-6 mb-3">Response</h4>
                        <CodeBlock
                            language="json"
                            code={`{
  "success": true,
  "imageUrl": "https://storage.googleapis.com/...",
  "jobId": "j123..."  // If async processing needed
}`}
                        />

                        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                            <h4 className="font-medium flex items-center gap-2 mb-2">
                                <FileImage className="h-4 w-4" /> Image-to-Image Mode
                            </h4>
                            <p className="text-sm text-muted-foreground">
                                Include up to 3 reference images in base64 format for style-guided generation.
                            </p>
                        </div>

                        <h4 className="font-medium mt-6 mb-3">Example (cURL)</h4>
                        <CodeBlock
                            language="bash"
                            code={`curl -X POST ${baseUrl}/api/generate/image \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer <your_api_token>" \\
  -d '{
    "prompt": "A futuristic cityscape at night",
    "aspectRatio": "landscape"
  }'`}
                        />

                        <h4 className="font-medium mt-6 mb-3">Example (JavaScript)</h4>
                        <CodeBlock
                            language="javascript"
                            code={`const response = await fetch('${baseUrl}/api/generate/image', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer <your_api_token>',
  },
  body: JSON.stringify({
    prompt: 'A futuristic cityscape at night',
    aspectRatio: 'landscape',
  }),
});

const data = await response.json();
console.log(data.imageUrl);`}
                        />

                        <h4 className="font-medium mt-6 mb-3">With Reference Images (FormData)</h4>
                        <CodeBlock
                            language="bash"
                            code={`# Using cURL with file upload
curl -X POST ${baseUrl}/api/generate/image \\
  -H "Authorization: Bearer <your_api_token>" \\
  -F "prompt=Transform this into an oil painting" \\
  -F "aspectRatio=landscape" \\
  -F "referenceImages=@/path/to/image1.jpg" \\
  -F "referenceImages=@/path/to/image2.jpg"`}
                        />

                        <h4 className="font-medium mt-6 mb-3">With Reference Images (JavaScript FormData)</h4>
                        <CodeBlock
                            language="javascript"
                            code={`// Using FormData for file upload
const formData = new FormData();
formData.append('prompt', 'Transform this into an oil painting');
formData.append('aspectRatio', 'landscape');
formData.append('referenceImages', imageFile1);  // File object
formData.append('referenceImages', imageFile2);  // Up to 3 images

const response = await fetch('${baseUrl}/api/generate/image', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer <your_api_token>',
    // Note: Don't set Content-Type, browser will set it with boundary
  },
  body: formData,
});

const data = await response.json();
console.log(data.imageUrl);`}
                        />
                    </EndpointCard>

                    {/* Upscale Image */}
                    <EndpointCard
                        method="POST"
                        endpoint="/api/upscale/image"
                        description="Upscale a generated image to 2K or 4K resolution"
                    >
                        <div className="flex items-center gap-2 mb-4">
                            <Zap className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                                Costs 0.1 credit per upscale
                            </span>
                        </div>

                        <h4 className="font-medium mb-3">Request Body</h4>
                        <CodeBlock
                            language="json"
                            code={`{
  "mediaGenerationId": "abc123...",  // Required: from image generation response
  "resolution": "2k"                   // Optional: "2k" or "4k" (default: "2k")
}`}
                        />

                        <h4 className="font-medium mt-6 mb-3">Response</h4>
                        <CodeBlock
                            language="json"
                            code={`{
  "success": true,
  "imageUrl": "data:image/jpeg;base64,...",  // Base64 data URL
  "remainingCredits": 99.9
}`}
                        />

                        <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                            <p className="text-sm text-amber-600 dark:text-amber-400">
                                <strong>Note:</strong> The <code className="bg-zinc-200 dark:bg-zinc-800 px-1 rounded">mediaGenerationId</code> is returned in the image generation response.
                                Only images generated with the Nano Banana Pro model can be upscaled.
                            </p>
                        </div>

                        <h4 className="font-medium mt-6 mb-3">Example (cURL)</h4>
                        <CodeBlock
                            language="bash"
                            code={`curl -X POST ${baseUrl}/api/upscale/image \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer <your_api_token>" \\
  -d '{
    "mediaGenerationId": "abc123def456...",
    "resolution": "2k"
  }'`}
                        />

                        <h4 className="font-medium mt-6 mb-3">Example (JavaScript)</h4>
                        <CodeBlock
                            language="javascript"
                            code={`// Step 1: Generate image and get mediaGenerationId
const genResponse = await fetch('${baseUrl}/api/generate/image', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer <your_api_token>',
  },
  body: JSON.stringify({
    prompt: 'A beautiful landscape',
    aspectRatio: 'landscape',
  }),
});
const genData = await genResponse.json();
const { mediaGenerationId } = genData;

// Step 2: Upscale the image
const upscaleResponse = await fetch('${baseUrl}/api/upscale/image', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer <your_api_token>',
  },
  body: JSON.stringify({
    mediaGenerationId,
    resolution: '2k',
  }),
});

const upscaleData = await upscaleResponse.json();
console.log(upscaleData.imageUrl);  // Base64 data URL`}
                        />
                    </EndpointCard>
                </TabsContent>

                {/* Video Generation APIs */}
                <TabsContent value="video" className="mt-6">
                    <EndpointCard
                        method="POST"
                        endpoint="/api/generate/video"
                        description="Generate videos from text prompts using Veo 3.1 model"
                    >
                        <div className="flex items-center gap-2 mb-4">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                                Video generation takes 1-3 minutes
                            </span>
                        </div>

                        <h4 className="font-medium mb-3">Request Body</h4>
                        <CodeBlock
                            language="json"
                            code={`{
  "prompt": "A drone flying over a forest",
  "aspectRatio": "landscape",       // "landscape" or "portrait"
  "startImage": "base64...",        // Optional: for Image-to-Video (I2V)
  "endImage": "base64...",          // Optional: for Frame-to-Frame (I2V-FL), requires startImage
  "referenceImages": ["base64..."]  // Optional: 1-3 images for Reference-to-Video (R2V)
}`}
                        />

                        <h4 className="font-medium mt-6 mb-3">Response</h4>
                        <CodeBlock
                            language="json"
                            code={`{
  "success": true,
  "jobId": "j1731859234567v-u12345-..."
}`}
                        />

                        <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                            <p className="text-sm text-amber-600 dark:text-amber-400">
                                <strong>Note:</strong> Video generation always returns a jobId.
                                Poll the /api/jobs/{"{jobId}"} endpoint until status is "completed".
                            </p>
                        </div>

                        <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                            <p className="text-sm text-blue-600 dark:text-blue-400 mb-2">
                                <strong>Video Modes:</strong>
                            </p>
                            <ul className="text-sm text-blue-600 dark:text-blue-400 list-disc list-inside space-y-1">
                                <li><strong>T2V</strong> — Text-to-Video: prompt only, no images</li>
                                <li><strong>I2V</strong> — Image-to-Video: prompt + startImage</li>
                                <li><strong>I2V-FL</strong> — Frame-to-Frame: prompt + startImage + endImage</li>
                                <li><strong>R2V</strong> — Reference-to-Video: prompt + referenceImages (1-3)</li>
                            </ul>
                        </div>

                        <h4 className="font-medium mt-6 mb-3">Example (cURL)</h4>
                        <CodeBlock
                            language="bash"
                            code={`curl -X POST ${baseUrl}/api/generate/video \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer <your_api_token>" \\
  -d '{
    "prompt": "A serene mountain landscape at sunset with camera panning right",
    "aspectRatio": "landscape"
  }'`}
                        />

                        <h4 className="font-medium mt-6 mb-3">Example (JavaScript)</h4>
                        <CodeBlock
                            language="javascript"
                            code={`const response = await fetch('${baseUrl}/api/generate/video', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'Authorization': 'Bearer <your_api_token>',
  },
  body: JSON.stringify({
    prompt: 'A serene mountain landscape at sunset',
    aspectRatio: 'landscape',
  }),
});

const { jobId } = await response.json();
console.log('Job started:', jobId);

// Poll for completion
const videoUrl = await pollForCompletion(jobId);`}
                        />

                        <h4 className="font-medium mt-6 mb-3">Image-to-Video (FormData with file upload)</h4>
                        <CodeBlock
                            language="bash"
                            code={`# Using cURL with file upload for Image-to-Video
curl -X POST ${baseUrl}/api/generate/video \\
  -H "Authorization: Bearer <your_api_token>" \\
  -F "prompt=Animate this image with gentle camera zoom" \\
  -F "aspectRatio=landscape" \\
  -F "startImage=@/path/to/your-image.jpg"`}
                        />

                        <h4 className="font-medium mt-6 mb-3">Image-to-Video (JavaScript FormData)</h4>
                        <CodeBlock
                            language="javascript"
                            code={`// Using FormData for Image-to-Video
const formData = new FormData();
formData.append('prompt', 'Animate with gentle camera zoom');
formData.append('aspectRatio', 'landscape');
formData.append('startImage', imageFile);  // File object

const response = await fetch('${baseUrl}/api/generate/video', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer <your_api_token>',
  },
  body: formData,
});

const { jobId } = await response.json();
// Poll for completion...`}
                        />

                        <h4 className="font-medium mt-6 mb-3">Frame-to-Frame / I2V-FL (start + end frame)</h4>
                        <CodeBlock
                            language="bash"
                            code={`# Frame-to-Frame: generates video transitioning from start to end image
curl -X POST ${baseUrl}/api/generate/video \\
  -H "Authorization: Bearer <your_api_token>" \\
  -F "prompt=Smooth transition between two scenes" \\
  -F "aspectRatio=landscape" \\
  -F "startImage=@/path/to/start-frame.jpg" \\
  -F "endImage=@/path/to/end-frame.jpg"`}
                        />

                        <h4 className="font-medium mt-6 mb-3">Frame-to-Frame (JavaScript FormData)</h4>
                        <CodeBlock
                            language="javascript"
                            code={`// Frame-to-Frame: start image + end image
const formData = new FormData();
formData.append('prompt', 'Smooth cinematic transition');
formData.append('aspectRatio', 'landscape');
formData.append('startImage', startImageFile);  // File object
formData.append('endImage', endImageFile);      // File object

const response = await fetch('${baseUrl}/api/generate/video', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer <your_api_token>' },
  body: formData,
});

const { jobId } = await response.json();
// Poll for completion...`}
                        />

                        <h4 className="font-medium mt-6 mb-3">Reference-to-Video / R2V (1-3 reference images)</h4>
                        <CodeBlock
                            language="bash"
                            code={`# R2V: use reference images for style/composition guidance
curl -X POST ${baseUrl}/api/generate/video \\
  -H "Authorization: Bearer <your_api_token>" \\
  -F "prompt=A person walking in this style" \\
  -F "aspectRatio=landscape" \\
  -F "referenceImages=@/path/to/ref1.jpg" \\
  -F "referenceImages=@/path/to/ref2.jpg"`}
                        />

                        <h4 className="font-medium mt-6 mb-3">Reference-to-Video (JavaScript)</h4>
                        <CodeBlock
                            language="javascript"
                            code={`// R2V with JSON body (base64 images)
const response = await fetch('${baseUrl}/api/generate/video', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer <your_api_token>',
  },
  body: JSON.stringify({
    prompt: 'A person walking in this style',
    aspectRatio: 'landscape',
    referenceImages: [base64Image1, base64Image2],  // Up to 3
  }),
});

const { jobId } = await response.json();
// Poll for completion...`}
                        />
                    </EndpointCard>

                    <EndpointCard
                        method="GET"
                        endpoint="/api/jobs/{jobId}"
                        description="Check the status of an async generation job"
                    >
                        <h4 className="font-medium mb-3">Response (Completed)</h4>
                        <CodeBlock
                            language="json"
                            code={`{
  "success": true,
  "status": "completed",
  "videoUrls": [
    "https://storage.googleapis.com/..."
  ]
}`}
                        />

                        <h4 className="font-medium mt-6 mb-3">Status Values</h4>
                        <div className="space-y-2">
                            <div className="flex items-center gap-3">
                                <Badge variant="outline">created</Badge>
                                <span className="text-sm text-muted-foreground">Job queued, not started</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <Badge variant="secondary">running</Badge>
                                <span className="text-sm text-muted-foreground">Processing in progress</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <Badge variant="default" className="bg-green-500">completed</Badge>
                                <span className="text-sm text-muted-foreground">Ready for download</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <Badge variant="destructive">failed</Badge>
                                <span className="text-sm text-muted-foreground">Generation failed</span>
                            </div>
                        </div>

                        <h4 className="font-medium mt-6 mb-3">Polling Example</h4>
                        <CodeBlock
                            language="javascript"
                            code={`async function pollForCompletion(jobId, token) {
  const maxAttempts = 60;  // 5 minutes max
  
  for (let i = 0; i < maxAttempts; i++) {
    const response = await fetch(\`${baseUrl}/api/jobs/\${jobId}\`, {
      headers: {
        'Authorization': \`Bearer \${token}\`,
      },
    });
    const data = await response.json();
    
    if (data.status === 'completed') {
      return data.videoUrls[0];
    }
    
    if (data.status === 'failed') {
      throw new Error(data.error || 'Generation failed');
    }
    
    // Wait 5 seconds before next poll
    await new Promise(r => setTimeout(r, 5000));
  }
  
  throw new Error('Job timed out');
}`}
                        />
                    </EndpointCard>

                    {/* Video Upscale */}
                    <EndpointCard
                        method="POST"
                        endpoint="/api/upscale/video"
                        description="Upscale a generated video to 1080p or 4K resolution"
                    >
                        <div className="flex items-center gap-2 mb-4">
                            <Zap className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                                Costs 0.5 credit per upscale
                            </span>
                        </div>

                        <h4 className="font-medium mb-3">Request Body</h4>
                        <CodeBlock
                            language="json"
                            code={`{
  "mediaGenerationId": "user:12345-email:...-video:...",  // Required
  "resolution": "1080p"                                    // Optional: "1080p" or "4K"
}`}
                        />

                        <h4 className="font-medium mt-6 mb-3">Response</h4>
                        <CodeBlock
                            language="json"
                            code={`{
  "success": true,
  "jobId": "j1737312345678v-...",
  "remainingCredits": 99.5
}`}
                        />

                        <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                            <p className="text-sm text-amber-600 dark:text-amber-400">
                                <strong>Note:</strong> Video upscaling is async. Use <code className="bg-zinc-200 dark:bg-zinc-800 px-1 rounded">GET /api/jobs/{"{jobId}"}</code> to poll for completion.
                            </p>
                        </div>

                        <h4 className="font-medium mt-6 mb-3">Example (cURL)</h4>
                        <CodeBlock
                            language="bash"
                            code={`curl -X POST ${baseUrl}/api/upscale/video \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer <your_api_token>" \\
  -d '{
    "mediaGenerationId": "user:12345-email:...-video:...",
    "resolution": "1080p"
  }'`}
                        />

                        <h4 className="font-medium mt-6 mb-3">Example (JavaScript)</h4>
                        <CodeBlock
                            language="javascript"
                            code={`// After generating a video, get its mediaGenerationId from job response
const upscaleResponse = await fetch('${baseUrl}/api/upscale/video', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer <your_api_token>',
  },
  body: JSON.stringify({
    mediaGenerationId: 'user:12345-email:...-video:...',
    resolution: '1080p',
  }),
});

const { jobId } = await upscaleResponse.json();

// Poll for completion
const upscaledVideoUrl = await pollForCompletion(jobId);`}
                        />
                    </EndpointCard>
                </TabsContent>
            </Tabs>

            {/* Rate Limits */}
            <Card>
                <CardHeader>
                    <CardTitle>Rate Limits & Best Practices</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-muted/50 rounded-lg">
                            <h4 className="font-medium mb-2">Image Generation</h4>
                            <ul className="text-sm text-muted-foreground space-y-1">
                                <li>• Max 3 reference images per request</li>
                                <li>• Aspect ratios: landscape (16:9), portrait (9:16)</li>
                                <li>• Response time: ~10-30 seconds</li>
                            </ul>
                        </div>
                        <div className="p-4 bg-muted/50 rounded-lg">
                            <h4 className="font-medium mb-2">Video Generation</h4>
                            <ul className="text-sm text-muted-foreground space-y-1">
                                <li>• Always returns jobId for polling</li>
                                <li>• Poll every 5 seconds for status</li>
                                <li>• Response time: 1-3 minutes</li>
                            </ul>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
