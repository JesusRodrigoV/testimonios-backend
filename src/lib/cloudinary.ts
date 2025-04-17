import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: "dk9yiccx7",
  api_key: "957593388719322",
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export const uploadMedia = async (fileUrl: string, options = {}) => {
  try {
    const result = await cloudinary.uploader.upload(fileUrl, {
      resource_type: "auto",
      allowed_formats: ["mp4", "mov", "avi", "mp3", "wav"],
      ...options,
    });

    return {
      public_id: result.public_id,
      url: result.secure_url,
      duration: result.duration,
      format: result.format,
    };
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    throw new Error(`Cloudinary Error: ${errorMessage}`);
  }
};

export const generateOptimizedUrl = (publicId: string) => {
  return cloudinary.url(publicId, {
    fetch_format: "auto",
    quality: "auto",
    crop: "scale",
    width: 1280, // Para videos
  });
};
