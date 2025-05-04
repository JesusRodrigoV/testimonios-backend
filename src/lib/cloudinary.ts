import { v2 as cloudinary, type UploadApiOptions } from "cloudinary";
import type { Request } from "express";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadMedia = async (file: Request["file"], folder: string) => {
  if (!file) {
    throw new Error("No file provided");
  }

  const options: UploadApiOptions = {
    use_filename: true,
    unique_filename: true,
    overwrite: true,
    resource_type: "auto",
    folder: `legado_bolivia/${folder}`,
    allowed_formats: ["jpg", "png", "mp4", "mov", "mp3", "wav"],
    quality: "auto",
    fetch_format: "auto",
  };
  const result = await cloudinary.uploader.upload(file.path, options);
  console.log(result.public_id);
  return {
    url: result.secure_url,
    public_id: result.public_id,
    duration: result.duration,
    format: result.format,
  };
};

export const deleteMedia = async (publicId: string) => {
  return cloudinary.uploader.destroy(publicId);
};
