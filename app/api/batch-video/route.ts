import { NextResponse } from 'next/server'
import { getCaptchaToken } from '@/lib/chaptcha'

const USEAPI_TOKEN = process.env.USEAPI_TOKEN || process.env.USEAPI_API_TOKEN

// 10 diverse video prompts
const VIDEO_PROMPTS = [
    "A golden sunset over a calm ocean with waves gently crashing on the beach, cinematic 4K quality",
    "A majestic eagle soaring through mountain clouds at sunrise, slow motion dramatic footage",
    "Timelapse of a bustling city street at night with neon lights reflecting on wet pavement",
    "A beautiful coral reef underwater scene with colorful tropical fish swimming peacefully",
    "Cherry blossom petals falling in slow motion in a Japanese garden during spring",
    "Northern lights dancing across the Arctic sky with snow-covered mountains below",
    "A cozy coffee shop interior with steam rising from a cup, warm lighting, rain outside",
    "Drone shot flying over a lush green tropical forest with a waterfall in the center",
    "A vintage train traveling through snowy mountains during winter, smoke from chimney",
    "A cat playing with a butterfly in a sunlit meadow full of wildflowers, soft bokeh background",
]

export async function GET(request: Request) {
    if (!USEAPI_TOKEN) {
        return NextResponse.json({ error: 'USEAPI_TOKEN not configured' }, { status: 500 })
    }

    const results: Array<{
        index: number
        prompt: string
        success: boolean
        jobId?: string
        captchaToken?: string | null
        error?: string
        timestamp: string
    }> = []

    console.log('='.repeat(60))
    console.log('[Batch T2V] 🚀 Starting 10 sequential video requests with captcha')
    console.log('='.repeat(60))

    for (let i = 0; i < 10; i++) {
        const prompt = VIDEO_PROMPTS[i]
        const timestamp = new Date().toISOString()

        console.log(`\n[Batch T2V] ━━━ Request ${i + 1}/10 ━━━`)
        console.log(`[Batch T2V] 📝 Prompt: ${prompt.substring(0, 60)}...`)

        try {
            // Step 1: Get captcha token
            console.log(`[Batch T2V] 🔐 Getting captcha token...`)
            const captchaToken = await getCaptchaToken()

            if (captchaToken) {
                console.log(`[Batch T2V] ✅ Captcha token acquired (${captchaToken.substring(0, 20)}...)`)
            } else {
                console.warn(`[Batch T2V] ⚠️ No captcha token, proceeding without it`)
            }

            // Step 2: Submit video request
            const requestBody: Record<string, unknown> = {
                prompt,
                model: 'veo-3.1-fast-relaxed',
                aspectRatio: 'landscape',
                count: 1,
                async: true,
            }

            if (captchaToken) {
                requestBody.captchaToken = captchaToken
            }

            console.log(`[Batch T2V] 📤 Submitting to API...`)

            const response = await fetch('https://api.useapi.net/v1/google-flow/videos', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${USEAPI_TOKEN}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            })

            const data = await response.json()

            if (!response.ok && response.status !== 201) {
                const errorMsg = data.response?.error?.message || data.error || `API Error ${response.status}`
                console.error(`[Batch T2V] ❌ Request ${i + 1} failed: ${errorMsg}`)
                results.push({
                    index: i + 1,
                    prompt,
                    success: false,
                    captchaToken: captchaToken ? `${captchaToken.substring(0, 20)}...` : null,
                    error: errorMsg,
                    timestamp,
                })
                continue
            }

            const jobId = data.jobid || data.jobId
            console.log(`[Batch T2V] ✅ Request ${i + 1} succeeded! Job ID: ${jobId}`)

            results.push({
                index: i + 1,
                prompt,
                success: true,
                jobId,
                captchaToken: captchaToken ? `${captchaToken.substring(0, 20)}...` : null,
                timestamp,
            })
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error'
            console.error(`[Batch T2V] ❌ Request ${i + 1} error: ${errorMsg}`)
            results.push({
                index: i + 1,
                prompt,
                success: false,
                error: errorMsg,
                timestamp,
            })
        }

        // Small delay between requests to be respectful
        if (i < 9) {
            console.log(`[Batch T2V] ⏳ Waiting 2s before next request...`)
            await new Promise(resolve => setTimeout(resolve, 2000))
        }
    }

    // Summary
    const successCount = results.filter(r => r.success).length
    const failCount = results.filter(r => !r.success).length

    console.log('\n' + '='.repeat(60))
    console.log(`[Batch T2V] 🏁 DONE! Success: ${successCount}/10, Failed: ${failCount}/10`)
    console.log('='.repeat(60))

    return NextResponse.json({
        summary: {
            total: 10,
            success: successCount,
            failed: failCount,
            startedAt: results[0]?.timestamp,
            finishedAt: results[results.length - 1]?.timestamp,
        },
        results,
    })
}
