/**
 * Storage Provider — abstracts file storage for creative assets.
 * Currently stores URLs directly (placeholder/remote URLs).
 * Ready for local filesystem or cloud object storage integration.
 */
import fs from "fs";
import path from "path";

const STORAGE_MODE = process.env.CREATIVE_STORAGE_MODE || "url"; // "url" | "local" | "s3"
const LOCAL_STORAGE_PATH = process.env.CREATIVE_STORAGE_PATH || "./uploads/creative";

export async function storeAsset(clientId: string, assetId: string, sourceUrl: string): Promise<string> {
  switch (STORAGE_MODE) {
    case "local":
      return storeLocal(clientId, assetId, sourceUrl);
    case "s3":
      // TODO: Implement S3/cloud storage
      console.log(`[Storage] S3 storage not yet implemented, falling back to URL mode`);
      return sourceUrl;
    default:
      // URL mode — just pass through the URL
      return sourceUrl;
  }
}

async function storeLocal(clientId: string, assetId: string, sourceUrl: string): Promise<string> {
  const dir = path.join(LOCAL_STORAGE_PATH, clientId);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  try {
    const response = await fetch(sourceUrl);
    if (!response.ok) return sourceUrl;

    const buffer = Buffer.from(await response.arrayBuffer());
    const ext = sourceUrl.includes(".png") ? ".png" : ".jpg";
    const filePath = path.join(dir, `${assetId}${ext}`);
    fs.writeFileSync(filePath, buffer);

    return `/uploads/creative/${clientId}/${assetId}${ext}`;
  } catch (err: any) {
    console.error(`[Storage] Failed to store locally:`, err.message);
    return sourceUrl;
  }
}

export async function deleteAsset(fileUrl: string): Promise<boolean> {
  if (STORAGE_MODE === "local" && fileUrl.startsWith("/uploads/")) {
    try {
      const fullPath = path.join(".", fileUrl);
      if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
      return true;
    } catch { return false; }
  }
  return true;
}
