import { Router } from "express";
import pool from "../db.js";

const router = Router();

// GET /api/articles/:articleId/social-posts
router.get("/:articleId/social-posts", async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM social_posts WHERE article_id = $1 ORDER BY platform`,
      [req.params.articleId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch social posts" });
  }
});

// POST /api/social/generate — generate social posts from an article
router.post("/generate", async (req, res) => {
  const { client_id, article_id } = req.body;
  if (!client_id || !article_id) {
    return res.status(400).json({ error: "client_id and article_id are required" });
  }

  try {
    const { rows: articleRows } = await pool.query(
      `SELECT a.*, b.keyword, b.faq FROM seo_articles a
       LEFT JOIN seo_briefs b ON b.id = a.brief_id
       WHERE a.id = $1 AND a.client_id = $2`,
      [article_id, client_id]
    );
    if (articleRows.length === 0) {
      return res.status(404).json({ error: "Article not found" });
    }

    const article = articleRows[0];
    const posts = generateSocialPosts(article);

    const inserted = [];
    for (const post of posts) {
      const { rows } = await pool.query(
        `INSERT INTO social_posts (client_id, article_id, platform, content)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [client_id, article_id, post.platform, post.content]
      );
      inserted.push(rows[0]);
    }

    res.status(201).json(inserted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate social posts" });
  }
});

// PUT /api/social/:id — edit a social post
router.put("/:id", async (req, res) => {
  const { content, scheduled_time } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE social_posts
       SET content = COALESCE($1, content),
           scheduled_time = COALESCE($2, scheduled_time)
       WHERE id = $3
       RETURNING *`,
      [content, scheduled_time || null, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Not found" });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update social post" });
  }
});

// POST /api/social/:id/approve
router.post("/:id/approve", async (req, res) => {
  try {
    const { rows } = await pool.query(
      `UPDATE social_posts SET status = 'approved' WHERE id = $1 RETURNING *`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Not found" });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to approve social post" });
  }
});

function generateSocialPosts(article: any) {
  const title = article.title;
  const keyword = article.target_keyword || article.keyword || "";
  const meta = article.meta_description || "";
  const year = new Date().getFullYear();

  // Extract first meaningful paragraph from content
  const lines = (article.content || "").split("\n").filter((l: string) => {
    const t = l.trim();
    return t && !t.startsWith("#") && !t.startsWith("--") && !t.startsWith("*Internal") && !t.startsWith("<!--");
  });
  const snippet = lines[0]?.replace(/\*\*/g, "").trim() || meta;

  return [
    {
      platform: "facebook",
      content: `📌 ${title}\n\n${snippet}\n\n👉 Read the full guide on our website.\n\n#${keyword.replace(/\s+/g, "")} #${keyword.split(" ")[0]} #SEO`,
    },
    {
      platform: "instagram",
      content: `✨ ${title}\n\n${meta}\n\nSave this post for later! 🔖\n\n.\n.\n.\n#${keyword.replace(/\s+/g, "")} #${keyword.split(" ")[0]} #digitalmarketing #seo #contentmarketing #${year}`,
    },
    {
      platform: "linkedin",
      content: `I just published a comprehensive guide on ${keyword}.\n\n${snippet}\n\nKey takeaways:\n✅ Expert insights and actionable tips\n✅ Updated for ${year}\n✅ Practical strategies you can implement today\n\nRead the full article — link in the comments.\n\n#${keyword.replace(/\s+/g, "")} #SEO #ContentMarketing`,
    },
    {
      platform: "twitter",
      content: `🧵 New guide: ${title}\n\n${meta.slice(0, 180)}\n\nFull article 👇\n\n#${keyword.replace(/\s+/g, "")} #SEO`,
    },
    {
      platform: "tiktok",
      content: `${title} — everything you need to know in 60 seconds ⚡ #${keyword.replace(/\s+/g, "")} #seo #learnontiktok #${keyword.split(" ")[0]}`,
    },
  ];
}

export default router;
