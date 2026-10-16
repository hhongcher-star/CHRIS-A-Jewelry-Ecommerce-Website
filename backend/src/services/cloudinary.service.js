import crypto from 'node:crypto';
import { env } from '../config/env.js';
import { AppError } from '../errors/app-error.js';

function cloudinarySignature(parameters) {
  const value = Object.entries(parameters)
    .filter(([, item]) => item !== undefined && item !== '')
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, item]) => `${key}=${item}`)
    .join('&');

  return crypto.createHash('sha1').update(`${value}${env.CLOUDINARY_API_SECRET}`).digest('hex');
}

export async function uploadImageAsWebp({ dataUrl, filename, folder }) {
  if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
    throw new AppError(503, 'IMAGE_STORAGE_NOT_CONFIGURED', 'Cloudinary image storage is not configured.');
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const publicId = `${Date.now()}-${crypto.randomUUID()}`;
  const parameters = {
    folder: `${env.CLOUDINARY_FOLDER}/${folder}`,
    format: 'webp',
    public_id: publicId,
    timestamp
  };
  const body = new FormData();

  body.append('file', dataUrl);
  body.append('api_key', env.CLOUDINARY_API_KEY);
  body.append('signature', cloudinarySignature(parameters));
  Object.entries(parameters).forEach(([key, value]) => body.append(key, String(value)));

  let response;
  try {
    response = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(env.CLOUDINARY_CLOUD_NAME)}/image/upload`, {
      method: 'POST',
      body,
      signal: AbortSignal.timeout(45_000)
    });
  } catch (error) {
    throw new AppError(502, 'IMAGE_UPLOAD_FAILED', `Cloudinary could not upload ${filename}. Please try again.`);
  }

  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.secure_url) {
    throw new AppError(502, 'IMAGE_UPLOAD_FAILED', result.error?.message || `Cloudinary could not upload ${filename}.`);
  }

  return {
    imageUrl: result.secure_url,
    publicId: result.public_id,
    format: result.format
  };
}
