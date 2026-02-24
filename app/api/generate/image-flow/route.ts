import { NextRequest, NextResponse } from "next/server";

const GOOGLE_AI_SANDBOX_URL = "https://aisandbox-pa.googleapis.com/v1/projects";
const PROJECT_ID = "4ac269d2-84a9-455a-9e65-6ee9628e4721";

// Aspect ratio mapping
const ASPECT_RATIO_MAP: Record<string, string> = {
    "16:9": "IMAGE_ASPECT_RATIO_LANDSCAPE",
    "9:16": "IMAGE_ASPECT_RATIO_PORTRAIT",
};

// Generate random seed
function generateSeed(): number {
    return Math.floor(Math.random() * 1000000);
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            prompt,
            aspectRatio = "1:1",
            recaptchaToken,
            authToken,
            count = 2
        } = body;

        if (!prompt) {
            return NextResponse.json(
                { error: "Prompt is required" },
                { status: 400 }
            );
        }

        if (!recaptchaToken) {
            return NextResponse.json(
                { error: "reCAPTCHA token is required" },
                { status: 400 }
            );
        }

        if (!authToken) {
            return NextResponse.json(
                { error: "Auth token is required" },
                { status: 400 }
            );
        }

        const sessionId = `;${Date.now()}`;
        const imageAspectRatio = ASPECT_RATIO_MAP[aspectRatio] || ASPECT_RATIO_MAP["1:1"];

        // Build client context
        const clientContext = {
            recaptchaContext: {
                token: recaptchaToken,
                applicationType: "RECAPTCHA_APPLICATION_TYPE_WEB"
            },
            sessionId,
            projectId: PROJECT_ID,
            tool: "PINHOLE"
        };

        // Build requests array
        const requests = Array.from({ length: count }, () => ({
            clientContext,
            seed: generateSeed(),
            imageModelName: "GEM_PIX_2",
            imageAspectRatio,
            prompt,
            imageInputs: []
        }));

        // Build payload
        const payload = {
            clientContext,
            requests
        };

        // Make request to Google AI Sandbox
        const response = await fetch(
            `${GOOGLE_AI_SANDBOX_URL}/${PROJECT_ID}/flowMedia:batchGenerateImages`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "text/plain;charset=UTF-8",
                    "Authorization": `Bearer ${authToken}`,
                    "x-browser-channel": "stable",
                    "x-browser-year": "2026"
                },
                body: JSON.stringify(payload)
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Google AI Sandbox error:", errorText);
            return NextResponse.json(
                { error: `API error: ${response.status}`, details: errorText },
                { status: response.status }
            );
        }

        const result = await response.json();

        // Parse and return images
        const images = result.responses?.map((res: { image?: { imageBytes?: string }; seed?: number }) => ({
            imageBytes: res.image?.imageBytes,
            imageUrl: res.image?.imageBytes
                ? `data:image/png;base64,${res.image.imageBytes}`
                : undefined,
            seed: res.seed || 0
        })) || [];

        return NextResponse.json({ images });

    } catch (error) {
        console.error("Image generation error:", error);
        return NextResponse.json(
            { error: "Failed to generate image", details: String(error) },
            { status: 500 }
        );
    }
}
