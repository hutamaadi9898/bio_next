import { PutObjectCommand } from "@aws-sdk/client-s3";
import { Buffer } from "node:buffer";
import { randomUUID } from "node:crypto";

import { env } from "@/lib/env";
import { r2Client } from "@/lib/r2/client";

type UploadResult = {
  key: string;
  url: string;
  contentType: string;
  sizeBytes: number;
};

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5MB limit for now

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

function inferExtension(contentType: string) {
  switch (contentType) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
    default:
      return "bin";
  }
}

export async function uploadImageToR2(userId: string, file: File): Promise<UploadResult> {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error("Unsupported file type");
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error("File is too large");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const extension = inferExtension(file.type);
  const key = `${userId}/${new Date().getFullYear()}/${new Date().getMonth() + 1}/${randomUUID()}.${extension}`;

  await r2Client.send(
    new PutObjectCommand({
      Bucket: env.R2_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: file.type,
    }),
  );

  const url = `${env.R2_PUBLIC_BASE_URL.replace(/\/$/, "")}/${key}`;

  return {
    key,
    url,
    contentType: file.type,
    sizeBytes: buffer.byteLength,
  };
}
