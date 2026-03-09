import { Router, Request, Response } from "express";
import pool from "../db.js";
import { generateCreativeAsset, regenerateCreativeAsset } from "../services/creative/assetGenerator.js";
import { deleteAsset } from "../services/creative/storageProvider.js";

const router = Router();

// POST /api/creative/generate
router.post("/generate", async (req: Request, res: Response) => {
  try {
    const { client_id, source_type, source_id, asset_type, platform, style_preset, aspect_ratio, variant_count, custom_prompt } = req.body;

    // Queue as publishing job for async processing
    const { rows: [job] } = await pool.query(
      `INSERT INTO publishing_jobs (client_id, asset_type, asset_id, platform, job_type, publish_status, provider)
       VALUES ($1, $2, $3, $4, 'render', 'queued', 'creative')
       RETURNING *`,
      [client_id, source_type, source_id, platform || 'general']
    );

    // Also create the asset immediately for UI responsiveness
    const { rows: [asset] } = await pool.query(
      `INSERT INTO creative_assets (client_id, asset_type, source_type, source_id, platform, prompt, aspect_ratio, style_preset, status, metadata_json)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'generating',$9) RETURNING *`,
      [client_id, asset_type, source_type, source_id, platform, custom_prompt || '', aspect_ratio || '16:9', style_preset || 'clean_modern',
        JSON.stringify({ job_id: job.id, variant_count: variant_count || 1 })]
    );

    // Attempt synchronous generation (fallback for immediate feedback)
    try {
      const result = await generateCreativeAsset({
        clientId: client_id, sourceType: source_type, sourceId: source_id,
        assetType: asset_type, platform, stylePreset: style_preset,
        aspectRatio: aspect_ratio, variantCount: variant_count, customPrompt: custom_prompt,
      });
      // Delete the placeholder asset since generateCreativeAsset creates its own
      await pool.query(`DELETE FROM creative_assets WHERE id = $1`, [asset.id]);
      await pool.query(`UPDATE publishing_jobs SET publish_status = 'published' WHERE id = $1`, [job.id]);
      res.json(result);
    } catch (genErr: any) {
      // Mark job as failed, asset stays as generating for worker retry
      await pool.query(`UPDATE publishing_jobs SET publish_status = 'failed', error_message = $2 WHERE id = $1`, [job.id, genErr.message]);
      await pool.query(`UPDATE creative_assets SET status = 'failed', updated_at = NOW() WHERE id = $1`, [asset.id]);
      res.json({ ...asset, status: "failed", error: genErr.message });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/clients/:id/creative-assets
router.get("/:id/creative-assets", async (req: Request, res: Response) => {
  try {
    const { source_type, status } = req.query;
    let query = `SELECT * FROM creative_assets WHERE client_id = $1`;
    const params: any[] = [req.params.id];
    if (source_type) { query += ` AND source_type = $${params.length + 1}`; params.push(source_type); }
    if (status) { query += ` AND status = $${params.length + 1}`; params.push(status); }
    query += ` ORDER BY created_at DESC`;
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/creative/:id
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(
      `SELECT ca.*, json_agg(json_build_object('id', v.id, 'variant_label', v.variant_label, 'file_url', v.file_url, 'status', v.status)) FILTER (WHERE v.id IS NOT NULL) as variants
       FROM creative_assets ca
       LEFT JOIN creative_asset_variants v ON v.creative_asset_id = ca.id
       WHERE ca.id = $1 GROUP BY ca.id`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Not found" });
    res.json(rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/creative/:id
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const { title, prompt, negative_prompt, aspect_ratio, style_preset } = req.body;
    const { rows } = await pool.query(
      `UPDATE creative_assets SET title=COALESCE($2,title), prompt=COALESCE($3,prompt), negative_prompt=COALESCE($4,negative_prompt), aspect_ratio=COALESCE($5,aspect_ratio), style_preset=COALESCE($6,style_preset), updated_at=NOW() WHERE id=$1 RETURNING *`,
      [req.params.id, title, prompt, negative_prompt, aspect_ratio, style_preset]
    );
    res.json(rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/creative/:id/approve
router.post("/:id/approve", async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(
      `UPDATE creative_assets SET status='approved', updated_at=NOW() WHERE id=$1 RETURNING *`, [req.params.id]
    );
    if (rows[0]) {
      await pool.query(
        `INSERT INTO asset_approval_logs (client_id, creative_asset_id, action) VALUES ($1,$2,'approve')`,
        [rows[0].client_id, req.params.id]
      );
    }
    res.json(rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/creative/:id/regenerate
router.post("/:id/regenerate", async (req: Request, res: Response) => {
  try {
    const { prompt } = req.body;
    const result = await regenerateCreativeAsset(req.params.id, prompt);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/creative/:id/delete
router.post("/:id/delete", async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(`SELECT * FROM creative_assets WHERE id = $1`, [req.params.id]);
    if (rows[0]?.file_url) await deleteAsset(rows[0].file_url);
    await pool.query(`DELETE FROM creative_assets WHERE id = $1`, [req.params.id]);
    res.json({ deleted: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET source-specific creative assets
router.get("/by-source/:sourceType/:sourceId", async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM creative_assets WHERE source_type = $1 AND source_id = $2 ORDER BY created_at DESC`,
      [req.params.sourceType, req.params.sourceId]
    );
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ---- Brand Profiles ----
// GET /api/creative/brand/:clientId
router.get("/brand/:clientId", async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(`SELECT * FROM brand_profiles WHERE client_id = $1`, [req.params.clientId]);
    res.json(rows[0] || null);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/creative/brand
router.post("/brand", async (req: Request, res: Response) => {
  try {
    const { client_id, brand_name, primary_color, secondary_color, font_style, tone, logo_url, image_style_notes } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO brand_profiles (client_id, brand_name, primary_color, secondary_color, font_style, tone, logo_url, image_style_notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT (client_id) DO UPDATE SET brand_name=EXCLUDED.brand_name, primary_color=EXCLUDED.primary_color, secondary_color=EXCLUDED.secondary_color, font_style=EXCLUDED.font_style, tone=EXCLUDED.tone, logo_url=EXCLUDED.logo_url, image_style_notes=EXCLUDED.image_style_notes, updated_at=NOW()
       RETURNING *`,
      [client_id, brand_name, primary_color, secondary_color, font_style, tone, logo_url, image_style_notes]
    );
    res.json(rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
