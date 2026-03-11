import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { uploadToCloudinary } from "@/lib/cloudinary"

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get("file") as File | null

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 })
  }

  const arrayBuffer = await file.arrayBuffer()
  const base64 = Buffer.from(arrayBuffer).toString("base64")
  const dataUrl = `data:${file.type};base64,${base64}`

  const result = await uploadToCloudinary(dataUrl, "affiliator-pro")
  return NextResponse.json(result)
}
