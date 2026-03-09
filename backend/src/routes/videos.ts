import { Router } from "express";
import pool from "../db.js";

const router = Router();

// POST /api/videos/generate — generate video script from article or social post
router.post("/generate", async (req, res) => {
  const { client_id, article_id, social_post_id, platform, avatar_type, voice_type } = req.body;
  if (!client_id || !platform) {
    return res.status(400).json({ error: "client_id and platform are required" });
  }
  if (!article_id && !social_post_id) {
    return res.status(400).json({ error: "article_id or social_post_id is required" });
  }

  try {
    let sourceContent = "";
    let sourceTitle = "";
    let sourceKeyword = "";

    if (article_id) {
      const { rows } = await pool.query(
        `SELECT title, meta_description, content, target_keyword FROM seo_articles WHERE id = $1 AND client_id = $2`,
        [article_id, client_id]
      );
      if (rows.length === 0) return res.status(404).json({ error: "Article not found" });
      sourceTitle = rows[0].title;
      sourceContent = rows[0].meta_description || rows[0].content?.slice(0, 500) || "";
      sourceKeyword = rows[0].target_keyword;
    } else if (social_post_id) {
      const { rows } = await pool.query(
        `SELECT sp.content, sp.platform as src_platform, a.title, a.target_keyword
         FROM social_posts sp
         LEFT JOIN seo_articles a ON a.id = sp.article_id
         WHERE sp.id = $1 AND sp.client_id = $2`,
        [social_post_id, client_id]
      );
      if (rows.length === 0) return res.status(404).json({ error: "Social post not found" });
      sourceContent = rows[0].content;
      sourceTitle = rows[0].title || "Video";
      sourceKeyword = rows[0].target_keyword || "";
    }

    const script = generateVideoScript(sourceTitle, sourceContent, sourceKeyword, platform);

    const { rows } = await pool.query(
      `INSERT INTO video_assets (client_id, article_id, social_post_id, platform, video_script, scene_breakdown, caption_text, avatar_type, voice_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        client_id,
        article_id || null,
        social_post_id || null,
        platform,
        script.video_script,
        JSON.stringify(script.scene_breakdown),
        script.caption_text,
        avatar_type || "professional",
        voice_type || "friendly",
      ]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate video" });
  }
});

// GET /api/clients/:id/videos
router.get("/:id/videos", async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM video_assets WHERE client_id = $1 ORDER BY created_at DESC`,
      [req.params.id]
    );
    // Parse scene_breakdown from JSONB
    const parsed = rows.map((r: any) => ({
      ...r,
      scene_breakdown: typeof r.scene_breakdown === "string" ? JSON.parse(r.scene_breakdown) : r.scene_breakdown,
    }));
    res.json(parsed);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch videos" });
  }
});

// PUT /api/videos/:videoId — update video script/settings
router.put("/:videoId", async (req, res) => {
  const { video_script, caption_text, avatar_type, voice_type, scene_breakdown } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE video_assets
       SET video_script = COALESCE($1, video_script),
           caption_text = COALESCE($2, caption_text),
           avatar_type = COALESCE($3, avatar_type),
           voice_type = COALESCE($4, voice_type),
           scene_breakdown = COALESCE($5, scene_breakdown)
       WHERE id = $6
       RETURNING *`,
      [
        video_script,
        caption_text,
        avatar_type,
        voice_type,
        scene_breakdown ? JSON.stringify(scene_breakdown) : null,
        req.params.videoId,
      ]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Not found" });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update video" });
  }
});

// POST /api/videos/:videoId/approve
router.post("/:videoId/approve", async (req, res) => {
  try {
    const { rows } = await pool.query(
      `UPDATE video_assets SET status = 'approved' WHERE id = $1 RETURNING *`,
      [req.params.videoId]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Not found" });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to approve video" });
  }
});

interface SceneBreakdown {
  scene_number: number;
  duration: string;
  visual: string;
  voiceover: string;
}

interface VideoScript {
  video_script: string;
  scene_breakdown: SceneBreakdown[];
  caption_text: string;
}

function generateVideoScript(
  title: string,
  content: string,
  keyword: string,
  platform: string
): VideoScript {
  const maxDuration = platform === "tiktok" || platform === "instagram_reels" ? 60 : 90;
  const cleanContent = content.replace(/[#*_`]/g, "").replace(/\n+/g, " ").trim();
  const snippet = cleanContent.slice(0, 200);

  // Hook (first 3 seconds)
  const hooks = [
    `Stop scrolling! Here's what nobody tells you about ${keyword}.`,
    `Did you know this about ${keyword}? Most people don't.`,
    `${keyword} — here's the truth that experts won't share.`,
    `3 things about ${keyword} that will change everything.`,
  ];
  const hook = hooks[Math.floor(Math.random() * hooks.length)];

  // Body
  const body = `Here's what you need to know: ${snippet}`;

  // CTA
  const ctas = [
    "Follow for more tips like this! Link in bio.",
    "Save this for later and share with someone who needs it!",
    "Comment below if you want a deep dive on this topic!",
    "Follow us for more expert insights every week!",
  ];
  const cta = ctas[Math.floor(Math.random() * ctas.length)];

  const fullScript = `${hook}\n\n${body}\n\n${cta}`;

  const scene_breakdown: SceneBreakdown[] = [
    {
      scene_number: 1,
      duration: "0-3s",
      visual: "Avatar appears with animated text overlay showing hook",
      voiceover: hook,
    },
    {
      scene_number: 2,
      duration: `3-${Math.floor(maxDuration * 0.7)}s`,
      visual: "Avatar speaking with key points highlighted as text overlays",
      voiceover: body,
    },
    {
      scene_number: 3,
      duration: `${Math.floor(maxDuration * 0.7)}-${maxDuration}s`,
      visual: "Avatar with CTA text and subscribe/follow animation",
      voiceover: cta,
    },
  ];

  const hashtagKeyword = keyword.replace(/\s+/g, "");
  const caption_text = `${title}\n\n${hook}\n\n#${hashtagKeyword} #seo #digitalmarketing #shorts`;

  return { video_script: fullScript, scene_breakdown, caption_text };
}

export default router;
