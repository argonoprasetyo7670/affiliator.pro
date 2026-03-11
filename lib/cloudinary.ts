import { v2 as cloudinary } from "cloudinary"

// SDK automatically reads CLOUDINARY_URL env var
// Format: cloudinary://API_KEY:API_SECRET@CLOUD_NAME
if (!process.env.CLOUDINARY_URL) {
  console.warn("CLOUDINARY_URL is not set")
}

export interface CloudinaryUploadResult {
  url: string
  publicId: string
}

/**
 * Upload an image or video to Cloudinary.
 * Accepts a base64 data URL (data:image/...;base64,...) or a remote https:// URL.
 */
export async function uploadToCloudinary(
  source: string,
  folder = "affiliator-pro"
): Promise<CloudinaryUploadResult> {
  const result = await cloudinary.uploader.upload(source, {
    folder,
    resource_type: "auto",
    // For remote URLs Cloudinary fetches the file directly.
    // For base64 data URLs the SDK handles the upload inline.
  })
  return { url: result.secure_url, publicId: result.public_id }
}

/**
 * Delete an asset from Cloudinary by its public_id.
 * resource_type is "image" or "video".
 */
export async function deleteFromCloudinary(
  publicId: string,
  resourceType: "image" | "video" = "image"
): Promise<void> {
  await cloudinary.uploader.destroy(publicId, { resource_type: resourceType })
}

export default cloudinary
