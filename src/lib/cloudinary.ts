import { v2 as cloudinary } from 'cloudinary';

function assertConfigured(): void {
  if (
    !process.env.CLOUDINARY_CLOUD_NAME ||
    !process.env.CLOUDINARY_API_KEY ||
    !process.env.CLOUDINARY_API_SECRET
  ) {
    throw new Error('Cloudinary no está configurado. Verifica las variables de entorno');
  }
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadImage(buffer: Buffer, folder: string): Promise<string> {
  assertConfigured();
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ folder, resource_type: 'image' }, (error, result) => {
        if (error || !result) {
          reject(new Error(error?.message ?? 'Error al subir la imagen a Cloudinary'));
          return;
        }
        resolve(result.secure_url);
      })
      .end(buffer);
  });
}

export async function deleteImage(publicId: string): Promise<void> {
  assertConfigured();
  await cloudinary.uploader.destroy(publicId);
}
