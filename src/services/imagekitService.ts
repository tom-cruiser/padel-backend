import ImageKit from 'imagekit';
import path from 'path';
import fs from 'fs';

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY!,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT!,
});

export const uploadToImageKit = async (filePath: string, folder: string) => {
  const fileName = path.basename(filePath);
  const fileBuffer = fs.readFileSync(filePath);
  return imagekit.upload({
    file: fileBuffer,
    fileName: `${folder}/${fileName}`,
    folder: `/${folder}`,
    useUniqueFileName: true,
    overwriteFile: true,
  });
};
