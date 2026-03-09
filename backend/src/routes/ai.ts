import { Router } from "express";
import pool from "../db.js";
import { generateArticleContent } from "../services/ai/articleGenerator.js";
import { generateSocialContent } from "../services/ai/socialGenerator.js";
import { generateVideoScriptContent } from "../services/ai/videoScriptGenerator.js";

const router = Router();

// POST /api/ai/articles/generate — AI-powered article generation
router.post("/articles/generate", async (req, res) => {
  const { client_id, brief_id } = req.body;
  if (!client_id || !brief_id) {
    return res.status(400).json({ error: "client_id and brief_id are required" });
  }

  try {
    const { rows: briefRows } = await pool.query(
      `SELECT * FROM seo_briefs WHERE id = $1 AND client_id = $2`,
      [brief_id, client_id]
    );
    if (briefRows.length === 0) return res.status(404).json({ error: "Brief not found" });

    const brief = briefRows[0];
    const headings = typeof brief.headings === "string" ? JSON.parse(brief.headings) : brief.headings;
    const faq = typeof brief.faq === "string" ? JSON.parse(brief.faq) : brief.faq;
    const entities = typeof brief.entities === "string" ? JSON.parse(brief.entities) : brief.entities;
    const internalLinks = typeof brief.internal_links === "string" ? JSON.parse(brief.internal_links) : brief.internal_links;

    const content = await generateArticleContent({
      keyword: brief.keyword,
      title: brief.title,
      metaDescription: brief.meta_description,
      headings,
      faq,
      entities,
      internalLinks,
    });

    const slug = "/" + brief.keyword.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    const { rows } = await pool.query(
      `INSERT INTO seo_articles (client_id, brief_id, title, meta_description, content, target_keyword, slug)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [client_id, brief_id, brief.title, brief.meta_description, content, brief.keyword, slug]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate article" });
  }
});

// POST /api/ai/social/generate — AI-powered social content generation
router.post("/social/generate", async (req, res) => {
  const { client_id, article_id } = req.body;
  if (!client_id || !article_id) {
    return res.status(400).json({ error: "client_id and article_id are required" });
  }

  try {
    const { rows: articleRows } = await pool.query(
      `SELECT * FROM seo_articles WHERE id = $1 AND client_id = $2`,
      [article_id, client_id]
    );
    if (articleRows.length === 0) return res.status(404).json({ error: "Article not found" });

    const article = articleRows[0];
    const posts = await generateSocialContent({
      title: article.title,
      content: article.content,
      keyword: article.target_keyword,
      metaDescription: article.meta_description,
    });

    const inserted = [];
    for (const [platform, content] of Object.entries(posts)) {
      const { rows } = await pool.query(
        `INSERT INTO social_posts (client_id, article_id, platform, content)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [client_id, article_id, platform, content]
      );
      inserted.push(rows[0]);
    }

    res.status(201).json(inserted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate social posts" });
  }
});

// POST /api/ai/videos/generate — AI-powered video script generation
router.post("/videos/generate", async (req, res) => {
  const { client_id, article_id, social_post_id, platform, avatar_type, voice_type } = req.body;
  if (!client_id || !platform) {
    return res.status(400).json({ error: "client_id and platform are required" });
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
      sourceContent = rows[0].content || rows[0].meta_description || "";
      sourceKeyword = rows[0].target_keyword;
    } else if (social_post_id) {
      const { rows } = await pool.query(
        `SELECT sp.content, a.title, a.target_keyword
         FROM social_posts sp LEFT JOIN seo_articles a ON a.id = sp.article_id
         WHERE sp.id = $1 AND sp.client_id = $2`,
        [social_post_id, client_id]
      );
      if (rows.length === 0) return res.status(404).json({ error: "Social post not found" });
      sourceContent = rows[0].content;
      sourceTitle = rows[0].title || "Video";
      sourceKeyword = rows[0].target_keyword || "";
    }

    const script = await generateVideoScriptContent({
      title: sourceTitle,
      content: sourceContent,
      keyword: sourceKeyword,
      platform,
    });

    const { rows } = await pool.query(
      `INSERT INTO video_assets (client_id, article_id, social_post_id, platform, video_script, scene_breakdown, caption_text, avatar_type, voice_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [client_id, article_id || null, social_post_id || null, platform, script.video_script, JSON.stringify(script.scene_breakdown), script.caption_text, avatar_type || "professional", voice_type || "friendly"]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate video script" });
  }
});

export default router;
