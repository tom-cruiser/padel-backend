import ImageKit from 'imagekit';
import logger from '../utils/logger';

// Validate ImageKit credentials
// Initialize ImageKit with environment variables
const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY || '',
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY || '',
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT || '',
});

// Validate ImageKit configuration
if (!process.env.IMAGEKIT_PUBLIC_KEY || !process.env.IMAGEKIT_PRIVATE_KEY || !process.env.IMAGEKIT_URL_ENDPOINT) {
  logger.error('Missing ImageKit configuration. Please check your environment variables.');
}

export const uploadToImageKit = async (file: Express.Multer.File, folder: string = 'gallery') => {
  try {
    // Validate file
    if (!file) {
      throw new Error('No file provided');
    }

    if (!file.buffer) {
      throw new Error('No file buffer found');
    }

    if (!file.mimetype.startsWith('image/')) {
      throw new Error('Invalid file type. Only images are allowed');
    }

    logger.info('Starting image upload to ImageKit', {
      filename: file.originalname,
      size: file.size,
      mimetype: file.mimetype
    });

    // Convert file buffer to base64
    const base64Image = file.buffer.toString('base64');
    const fileName = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.]/g, '_')}`;

    // Validate ImageKit configuration before upload
    if (!imagekit.privateKey || !imagekit.publicKey || !imagekit.urlEndpoint) {
      throw new Error('ImageKit configuration is missing');
    }

    logger.info('Uploading to ImageKit...', { fileName });

    const result = await imagekit.upload({
      file: base64Image,
      fileName,
      folder: `/${folder}`,
      useUniqueFileName: true,
      tags: ['padel-gallery'],
    });

    if (!result || !result.url) {
      throw new Error('ImageKit upload failed - no URL returned');
    }

    logger.info('Upload successful', {
      url: result.url,
      fileId: result.fileId,
      fileName: result.name
    });

    return {
      url: result.url,
      fileId: result.fileId,
      name: result.name
    };
  } catch (error: any) {
    logger.error('ImageKit upload error:', {
      error: error.message,
      stack: error.stack,
      fileName: file?.originalname,
      size: file?.size
    });
    
    if (error.message.includes('configuration')) {
      throw new Error('Server configuration error. Please contact administrator.');
    } else if (error.message.includes('Invalid file type')) {
      throw new Error('Only image files (jpg, png, gif) are allowed.');
    } else {
      throw new Error('Failed to upload image. Please try again.');
    }
  }
};
