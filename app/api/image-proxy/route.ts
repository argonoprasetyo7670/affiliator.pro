import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
    const url = request.nextUrl.searchParams.get("url")

    if (!url) {
        return NextResponse.json({ error: "URL is required" }, { status: 400 })
    }

    try {
        const response = await fetch(url)

        if (!response.ok) {
            return NextResponse.json(
                { error: `Failed to fetch image: ${response.status}` },
                { status: response.status }
            )
        }

        const contentType = response.headers.get("content-type") || "image/png"
        const buffer = await response.arrayBuffer()

        return new NextResponse(buffer, {
            headers: {
                "Content-Type": contentType,
                "Cache-Control": "public, max-age=31536000",
            },
        })
    } catch (error) {
        console.error("Image proxy error:", error)
        return NextResponse.json(
            { error: "Failed to proxy image" },
            { status: 500 }
        )
    }
}
