/**
 * Asset Generator — orchestrates prompt building, image generation, and storage.
 */
import pool from "../../db.js";
import { getImageProvider } from "./imageProvider.js";
import { buildPrompt, getDimensions } from "./promptBuilder.js";
import { storeAsset } from "./storageProvider.js";

export interface GenerateRequest {
  clientId: string;
  sourceType: string;
  sourceId: string;
  assetType: string;
  platform?: string;
  stylePreset?: string;
  aspectRatio?: string;
  variantCount?: number;
  customPrompt?: string;
}

export async function generateCreativeAsset(req: GenerateRequest) {
  const style = req.stylePreset || "clean_modern";
  const aspect = req.aspectRatio || "16:9";
  const dims = getDimensions(aspect);

  // Fetch source content for prompt building
  let title = "";
  let content = "";

  if (req.sourceType === "article") {
    const { rows } = await pool.query(`SELECT title, content FROM seo_articles WHERE id = $1`, [req.sourceId]);
    if (rows[0]) { title = rows[0].title; content = rows[0].content?.substring(0, 1000) || ""; }
  } else if (req.sourceType === "social_post") {
    const { rows } = await pool.query(`SELECT content, platform FROM social_posts WHERE id = $1`, [req.sourceId]);
    if (rows[0]) { content = rows[0].content; req.platform = req.platform || rows[0].platform; }
  } else if (req.sourceType === "gbp_post") {
    const { rows } = await pool.query(`SELECT title, content FROM gbp_post_drafts WHERE id = $1`, [req.sourceId]);
    if (rows[0]) { title = rows[0].title; content = rows[0].content; }
  } else if (req.sourceType === "video_asset") {
    const { rows } = await pool.query(`SELECT video_script, caption_text FROM video_assets WHERE id = $1`, [req.sourceId]);
    if (rows[0]) { title = rows[0].caption_text; content = rows[0].video_script?.substring(0, 500) || ""; }
  }

  const prompt = req.customPrompt || await buildPrompt({
    clientId: req.clientId, sourceType: req.sourceType, assetType: req.assetType,
    platform: req.platform, stylePreset: style, title, content,
  });

  // Create asset record
  const { rows: [asset] } = await pool.query(
    `INSERT INTO creative_assets (client_id, asset_type, source_type, source_id, platform, title, prompt, aspect_ratio, style_preset, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'generating') RETURNING *`,
    [req.clientId, req.assetType, req.sourceType, req.sourceId, req.platform, title || req.assetType, prompt, aspect, style]
  );

  // Log generation
  await pool.query(
    `INSERT INTO asset_approval_logs (client_id, creative_asset_id, action, note) VALUES ($1,$2,'generate',$3)`,
    [req.clientId, asset.id, `Generated with style: ${style}, aspect: ${aspect}`]
  );

  // Generate image
  const provider = getImageProvider();
  try {
    const result = await provider.generate({ prompt, width: dims.width, height: dims.height, style });
    const storedUrl = await storeAsset(req.clientId, asset.id, result.imageUrl);

    await pool.query(
      `UPDATE creative_assets SET file_url=$2, thumbnail_url=$3, provider=$4, metadata_json=$5, status='review', updated_at=NOW() WHERE id=$1`,
      [asset.id, storedUrl, storedUrl, result.provider, JSON.stringify(result.metadata)]
    );

    // Generate variants if requested
    const variantCount = Math.min(req.variantCount || 1, 4);
    for (let i = 1; i < variantCount; i++) {
      const variantResult = await provider.generate({ prompt: prompt + ` Variation ${i + 1}.`, width: dims.width, height: dims.height, style });
      const variantUrl = await storeAsset(req.clientId, `${asset.id}_v${i + 1}`, variantResult.imageUrl);

      await pool.query(
        `INSERT INTO creative_asset_variants (creative_asset_id, variant_label, prompt, file_url, thumbnail_url, status)
         VALUES ($1,$2,$3,$4,$5,'review')`,
        [asset.id, `Variant ${i + 1}`, prompt + ` Variation ${i + 1}.`, variantUrl, variantUrl]
      );
    }

    return { ...asset, file_url: storedUrl, status: "review", provider: result.provider };
  } catch (err: any) {
    await pool.query(
      `UPDATE creative_assets SET status='failed', metadata_json=$2, updated_at=NOW() WHERE id=$1`,
      [asset.id, JSON.stringify({ error: err.message })]
    );
    throw err;
  }
}

export async function regenerateCreativeAsset(assetId: string, newPrompt?: string) {
  const { rows } = await pool.query(`SELECT * FROM creative_assets WHERE id = $1`, [assetId]);
  if (rows.length === 0) throw new Error("Asset not found");
  const asset = rows[0];

  const prompt = newPrompt || asset.prompt;
  const dims = getDimensions(asset.aspect_ratio || "16:9");

  await pool.query(`UPDATE creative_assets SET status='generating', prompt=$2, updated_at=NOW() WHERE id=$1`, [assetId, prompt]);
  await pool.query(
    `INSERT INTO asset_approval_logs (client_id, creative_asset_id, action, note) VALUES ($1,$2,'regenerate',$3)`,
    [asset.client_id, assetId, `Regenerated with prompt update`]
  );

  const provider = getImageProvider();
  try {
    const result = await provider.generate({ prompt, width: dims.width, height: dims.height, style: asset.style_preset });
    const storedUrl = await storeAsset(asset.client_id, assetId, result.imageUrl);

    await pool.query(
      `UPDATE creative_assets SET file_url=$2, thumbnail_url=$3, provider=$4, metadata_json=$5, status='review', updated_at=NOW() WHERE id=$1`,
      [assetId, storedUrl, storedUrl, result.provider, JSON.stringify(result.metadata)]
    );
    return { ...asset, file_url: storedUrl, status: "review" };
  } catch (err: any) {
    await pool.query(`UPDATE creative_assets SET status='failed', updated_at=NOW() WHERE id=$1`, [assetId]);
    throw err;
  }
}
