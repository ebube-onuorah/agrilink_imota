// Produce image uploads. Uses Vercel Blob in production; falls back to inline
// data URLs locally when BLOB_READ_WRITE_TOKEN is not configured, so the app
// remains fully functional without external storage.

import { put } from "@vercel/blob";

const MAX_BYTES = 2 * 1024 * 1024; // 2 MB per image (per NFR / FR-03)
const MAX_IMAGES = 3;

export async function uploadProduceImages(files: File[]): Promise<string[]> {
  const valid = files.filter((f) => f && f.size > 0 && f.size <= MAX_BYTES).slice(0, MAX_IMAGES);
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  const urls: string[] = [];

  for (const file of valid) {
    if (token) {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const blob = await put(`listings/${Date.now()}-${safeName}`, file, {
        access: "public",
        token,
      });
      urls.push(blob.url);
    } else {
      const buffer = Buffer.from(await file.arrayBuffer());
      urls.push(`data:${file.type};base64,${buffer.toString("base64")}`);
    }
  }
  return urls;
}
