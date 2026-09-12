import { config } from '../config';
import crypto from 'crypto';

export interface UploadRequest {
  filename: string;
  contentType: string;
  sizeBytes: number;
  folder?: 'avatars' | 'voyages' | 'posts' | 'evidence';
}

export interface UploadResponse {
  uploadUrl: string;
  publicUrl: string;
  fileKey: string;
  expiresInSeconds: number;
}

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
  'video/mp4',
];

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25MB

export const storageService = {
  getSignedUploadUrl: async (req: UploadRequest): Promise<UploadResponse> => {
    if (!ALLOWED_MIME_TYPES.includes(req.contentType)) {
      throw new Error(`Unsupported file type '${req.contentType}'. Allowed types: JPEG, PNG, WebP, GIF, PDF, MP4`);
    }

    if (req.sizeBytes > MAX_FILE_SIZE_BYTES) {
      throw new Error('File size exceeds the 25MB limit.');
    }

    const folder = req.folder || 'posts';
    const randomHex = crypto.randomBytes(8).toString('hex');
    const sanitizedFilename = req.filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileKey = `${folder}/${Date.now()}-${randomHex}-${sanitizedFilename}`;

    // Local / S3 / Cloudflare R2 abstraction
    if (config.storage.provider === 'r2' || config.storage.provider === 's3') {
      const publicUrl = `https://${config.storage.bucket}.${config.storage.endpoint || 'r2.cloudflarestorage.com'}/${fileKey}`;
      return {
        uploadUrl: publicUrl, // In prod: generate pre-signed S3 PUT URL via @aws-sdk/s3-request-presigner
        publicUrl,
        fileKey,
        expiresInSeconds: 900,
      };
    }

    // Local development fallback
    const publicUrl = `/uploads/${fileKey}`;
    return {
      uploadUrl: `/api/v1/storage/upload?key=${encodeURIComponent(fileKey)}`,
      publicUrl,
      fileKey,
      expiresInSeconds: 900,
    };
  },
};
