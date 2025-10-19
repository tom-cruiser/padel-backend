import cloudinary from 'cloudinary';
import { v4 as uuidv4 } from 'uuid';

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadToCloudinary = async (filePath: string, folder: string) => {
  return cloudinary.v2.uploader.upload(filePath, {
    folder,
    public_id: uuidv4(),
    resource_type: 'image',
    overwrite: true,
  });
};
