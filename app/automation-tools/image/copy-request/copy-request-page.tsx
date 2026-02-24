"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Copy, CheckCircle2, FileJson, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { buildFlowImagePayload, type AspectRatio } from "@/lib/flow-image"

export default function CopyRequestPage() {
    const [prompt, setPrompt] = useState("")
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>("16:9")
    const [recaptchaToken, setRecaptchaToken] = useState("")
    const [authToken, setAuthToken] = useState("")
    const [count, setCount] = useState(2)
    const [copied, setCopied] = useState<string | null>(null)

    const payload = prompt.trim()
        ? buildFlowImagePayload({
              prompt: prompt.trim(),
              aspectRatio,
              recaptchaToken: recaptchaToken || "<RECAPTCHA_TOKEN>",
              count,
          })
        : null

    const curlCommand = payload
        ? `curl -X POST \\
  'https://aisandbox-pa.googleapis.com/v1:batchGenerateImages' \\
  -H 'Authorization: ${authToken || "<AUTH_TOKEN>"}' \\
  -H 'Content-Type: application/json' \\
  -d '${JSON.stringify(payload)}'`
        : ""

    const headers = {
        Authorization: authToken || "<AUTH_TOKEN>",
        "Content-Type": "application/json",
    }

    const handleCopy = async (text: string, label: string) => {
        try {
            await navigator.clipboard.writeText(text)
            setCopied(label)
            toast.success(`${label} berhasil disalin!`)
            setTimeout(() => setCopied(null), 2000)
        } catch {
            toast.error("Gagal menyalin ke clipboard")
        }
    }

    return (
        <div className="p-4 md:p-6 space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
                            <FileJson className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <CardTitle className="text-lg">Copy Request</CardTitle>
                            <CardDescription>
                                Generate dan salin request payload untuk Google Flow Image API
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
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
                        <div className="space-y-2">
                            <Label>Jumlah Gambar</Label>
                            <Input
                                type="number"
                                min={1}
                                max={4}
                                value={count}
                                onChange={(e) => setCount(Number(e.target.value))}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Auth Token (opsional)</Label>
                        <Input
                            type="password"
                            placeholder="ya29.a0..."
                            value={authToken}
                            onChange={(e) => setAuthToken(e.target.value)}
                            className="font-mono text-xs"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>reCAPTCHA Token (opsional)</Label>
                        <Input
                            placeholder="Token reCAPTCHA..."
                            value={recaptchaToken}
                            onChange={(e) => setRecaptchaToken(e.target.value)}
                            className="font-mono text-xs"
                        />
                    </div>
                </CardContent>
            </Card>

            {payload && (
                <>
                    {/* JSON Payload */}
                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-base">JSON Payload</CardTitle>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleCopy(JSON.stringify(payload, null, 2), "Payload")}
                                    className="gap-2"
                                >
                                    {copied === "Payload" ? (
                                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                                    ) : (
                                        <Copy className="w-4 h-4" />
                                    )}
                                    Copy
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto max-h-80 overflow-y-auto font-mono">
                                {JSON.stringify(payload, null, 2)}
                            </pre>
                        </CardContent>
                    </Card>

                    {/* Headers */}
                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-base">Headers</CardTitle>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleCopy(JSON.stringify(headers, null, 2), "Headers")}
                                    className="gap-2"
                                >
                                    {copied === "Headers" ? (
                                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                                    ) : (
                                        <Copy className="w-4 h-4" />
                                    )}
                                    Copy
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto font-mono">
                                {JSON.stringify(headers, null, 2)}
                            </pre>
                        </CardContent>
                    </Card>

                    {/* cURL Command */}
                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-base">cURL Command</CardTitle>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleCopy(curlCommand, "cURL")}
                                    className="gap-2"
                                >
                                    {copied === "cURL" ? (
                                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                                    ) : (
                                        <Copy className="w-4 h-4" />
                                    )}
                                    Copy
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto max-h-60 overflow-y-auto font-mono whitespace-pre-wrap break-all">
                                {curlCommand}
                            </pre>
                        </CardContent>
                    </Card>
                </>
            )}

            {!payload && (
                <Card className="border-dashed">
                    <CardContent className="py-8 text-center text-muted-foreground">
                        <Sparkles className="w-10 h-10 mx-auto mb-3 opacity-50" />
                        <p>Masukkan prompt untuk generate request payload</p>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
