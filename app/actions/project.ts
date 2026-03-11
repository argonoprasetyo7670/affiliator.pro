"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { uploadToCloudinary, deleteFromCloudinary } from "@/lib/cloudinary"

// ── Project CRUD ────────────────────────────────────────────────

export async function createProject(name: string, description?: string) {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: "Unauthorized" }

  const project = await prisma.project.create({
    data: { userId: session.user.id, name, description },
    include: { assets: true },
  })

  revalidatePath("/dashboard/projects")
  return { success: true, project }
}

export async function getProjects() {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: "Unauthorized", projects: [] }

  const projects = await prisma.project.findMany({
    where: { userId: session.user.id },
    include: { assets: { orderBy: { createdAt: "desc" } } },
    orderBy: { updatedAt: "desc" },
  })

  return { success: true, projects }
}

export async function getProject(projectId: string) {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: "Unauthorized", project: null }

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: session.user.id },
    include: { assets: { orderBy: { createdAt: "desc" } } },
  })

  if (!project) return { success: false, error: "Project not found", project: null }
  return { success: true, project }
}

export async function updateProject(projectId: string, name: string, description?: string) {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: "Unauthorized" }

  const project = await prisma.project.updateMany({
    where: { id: projectId, userId: session.user.id },
    data: { name, description },
  })

  revalidatePath("/dashboard/projects")
  revalidatePath(`/dashboard/projects/${projectId}`)
  return { success: true }
}

export async function deleteProject(projectId: string) {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: "Unauthorized" }

  await prisma.project.deleteMany({
    where: { id: projectId, userId: session.user.id },
  })

  revalidatePath("/dashboard/projects")
  return { success: true }
}

// ── Project Assets ───────────────────────────────────────────────

export async function addProjectAsset(
  projectId: string,
  asset: {
    type: "image" | "video"
    source: "uploaded" | "generated" | "upscaled" | "extended"
    name: string
    url: string
    prompt?: string
    aspectRatio?: string
    mediaGenerationId?: string
  }
) {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: "Unauthorized" }

  // Verify ownership
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: session.user.id },
  })
  if (!project) return { success: false, error: "Project not found" }

  // Upload to Cloudinary if URL is not already hosted there
  let finalUrl = asset.url
  if (asset.url && !asset.url.includes("res.cloudinary.com")) {
    try {
      const { url: cloudUrl } = await uploadToCloudinary(asset.url, "affiliator-pro")
      finalUrl = cloudUrl
    } catch (e) {
      console.error("Cloudinary upload failed, using original URL:", e)
    }
  }

  const created = await prisma.projectAsset.create({
    data: { projectId, ...asset, url: finalUrl },
  })

  // Touch the project's updatedAt
  await prisma.project.update({
    where: { id: projectId },
    data: { updatedAt: new Date() },
  })

  revalidatePath(`/dashboard/projects/${projectId}`)
  return { success: true, asset: created }
}

export async function deleteProjectAsset(projectId: string, assetId: string) {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: "Unauthorized" }

  // Find the asset first to get Cloudinary public_id
  const asset = await prisma.projectAsset.findFirst({
    where: {
      id: assetId,
      projectId,
      project: { userId: session.user.id },
    },
  })

  if (!asset) return { success: false, error: "Asset not found" }

  // Delete from Cloudinary if hosted there
  if (asset.url.includes("res.cloudinary.com")) {
    try {
      const parts = asset.url.split("/upload/")
      if (parts[1]) {
        // Remove version and extension: v1234567890/folder/file.ext -> folder/file
        const pathAfterUpload = parts[1].replace(/^v\d+\//, "")
        const publicId = pathAfterUpload.replace(/\.[^.]+$/, "")
        const resourceType = asset.type === "video" ? "video" : "image"
        await deleteFromCloudinary(publicId, resourceType)
      }
    } catch (e) {
      console.error("Cloudinary delete failed:", e)
    }
  }

  await prisma.projectAsset.delete({ where: { id: assetId } })

  revalidatePath(`/dashboard/projects/${projectId}`)
  return { success: true }
}
