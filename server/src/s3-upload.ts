/**
 * AWS S3 Upload Utilities
 * Production-ready file upload to S3 with CloudFront CDN
 * Replaces local disk storage (multer) for scalability
 */

import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl as getS3SignedUrl } from '@aws-sdk/s3-request-presigner';
import multer from 'multer';
import sharp from 'sharp';

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: process.env.AWS_ACCESS_KEY_ID ? {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  } : undefined,
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET || 'bumpin-media-prod';
const CDN_BASE_URL = process.env.CDN_BASE_URL || `https://${BUCKET_NAME}.s3.amazonaws.com`;

/**
 * Check if S3 is configured
 */
export function isS3Configured(): boolean {
  return !!(process.env.AWS_S3_BUCKET && process.env.AWS_ACCESS_KEY_ID);
}

/**
 * Upload selfie to S3 with compression
 * Compresses image to WebP format (80% smaller)
 */
export async function uploadSelfieToS3(
  userId: string,
  buffer: Buffer,
  originalFilename: string
): Promise<string> {
  try {
    // Compress image: JPEG → WebP (800x800 max, 80% quality)
    const compressedBuffer = await sharp(buffer)
      .resize(800, 800, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .webp({ quality: 80 })
      .toBuffer();

    const key = `users/${userId}/selfie-${Date.now()}.webp`;

    // Upload to S3
    await s3Client.send(new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: compressedBuffer,
      ContentType: 'image/webp',
      CacheControl: 'public, max-age=31536000, immutable', // 1 year cache
      Metadata: {
        originalFilename,
        userId,
        uploadedAt: new Date().toISOString()
      }
    }));

    const url = `${CDN_BASE_URL}/${key}`;
    
    console.log(`[S3] Selfie uploaded: ${key} (${(compressedBuffer.length / 1024).toFixed(2)}KB)`);
    
    return url;
  } catch (error) {
    console.error('[S3] Selfie upload failed:', error);
    throw new Error('Failed to upload selfie to S3');
  }
}

/**
 * Upload video to S3
 * Videos are not re-encoded (done client-side or async job)
 */
export async function uploadVideoToS3(
  userId: string,
  buffer: Buffer,
  originalFilename: string
): Promise<string> {
  try {
    const key = `users/${userId}/intro-${Date.now()}.webm`;

    // Upload to S3
    await s3Client.send(new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: 'video/webm',
      CacheControl: 'public, max-age=31536000, immutable',
      Metadata: {
        originalFilename,
        userId,
        uploadedAt: new Date().toISOString()
      }
    }));

    const url = `${CDN_BASE_URL}/${key}`;
    
    console.log(`[S3] Video uploaded: ${key} (${(buffer.length / 1024 / 1024).toFixed(2)}MB)`);
    
    return url;
  } catch (error) {
    console.error('[S3] Video upload failed:', error);
    throw new Error('Failed to upload video to S3');
  }
}

/**
 * Delete file from S3 (for user data deletion / GDPR)
 */
export async function deleteFromS3(url: string): Promise<void> {
  try {
    // Extract key from CDN URL
    const key = url.replace(`${CDN_BASE_URL}/`, '');
    
    await s3Client.send(new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key
    }));
    
    console.log(`[S3] File deleted: ${key}`);
  } catch (error) {
    console.error('[S3] Delete failed:', error);
    throw new Error('Failed to delete file from S3');
  }
}

/**
 * Generate signed URL for temporary access (1 hour)
 * Use for private files that shouldn't be public
 */
export async function generateSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key
    });
    
    const signedUrl = await getS3SignedUrl(s3Client, command, { expiresIn });
    return signedUrl;
  } catch (error) {
    console.error('[S3] Failed to generate signed URL:', error);
    throw new Error('Failed to generate signed URL');
  }
}

/**
 * Multer configuration for memory storage (uploads to S3 instead of disk)
 */
export const s3Upload = multer({
  storage: multer.memoryStorage(), // Store in memory, then upload to S3
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max
  },
  fileFilter: (req, file, cb) => {
    console.log(`[Upload] Received - Field: ${file.fieldname}, MIME: ${file.mimetype}`);
    
    if (file.fieldname === 'selfie') {
      if (!file.mimetype.startsWith('image/')) {
        return cb(new Error('Only images allowed for selfie'));
      }
    } else if (file.fieldname === 'video') {
      const isVideo = file.mimetype.startsWith('video/') || 
                      file.mimetype === 'application/octet-stream' ||
                      file.originalname.match(/\.(webm|mp4|mov)$/i);
      
      if (!isVideo) {
        return cb(new Error('Only videos allowed for intro video'));
      }
    }
    
    cb(null, true);
  },
});

