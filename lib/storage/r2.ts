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

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

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
  // Basic magic-byte sniffing for extra safety.
  const magicOk = sniffMatchesType(buffer, file.type);
  if (!magicOk) {
    throw new Error("File content does not match declared type");
  }
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

function sniffMatchesType(buf: Buffer, declared: string): boolean {
  if (declared === "image/jpeg") {
    // FF D8 ... FF D9
    return buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
  }
  if (declared === "image/png") {
    // 89 50 4E 47 0D 0A 1A 0A
    return (
      buf.length > 8 &&
      buf[0] === 0x89 &&
      buf[1] === 0x50 &&
      buf[2] === 0x4e &&
      buf[3] === 0x47 &&
      buf[4] === 0x0d &&
      buf[5] === 0x0a &&
      buf[6] === 0x1a &&
      buf[7] === 0x0a
    );
  }
  if (declared === "image/webp") {
    // RIFF .... WEBP
    return (
      buf.length > 12 &&
      buf[0] === 0x52 &&
      buf[1] === 0x49 &&
      buf[2] === 0x46 &&
      buf[3] === 0x46 &&
      buf[8] === 0x57 &&
      buf[9] === 0x45 &&
      buf[10] === 0x42 &&
      buf[11] === 0x50
    );
  }
  if (declared === "image/gif") {
    // GIF87a or GIF89a
    return (
      buf.length > 5 &&
      buf[0] === 0x47 &&
      buf[1] === 0x49 &&
      buf[2] === 0x46 &&
      buf[3] === 0x38 &&
      (buf[4] === 0x37 || buf[4] === 0x39) &&
      buf[5] === 0x61
    );
  }
  return false;
}
