import { Router, Request, Response } from "express";
import pool from "../db.js";
import {
  fetchGbpProfile,
  calculateCompleteness,
  fetchGbpReviews,
  fetchGbpQuestions,
  publishGbpPost,
  respondToReview,
  answerQuestion,
  generateLocalSeoInsights,
} from "../services/local/gbpService.js";
import { getAiProvider } from "../services/ai/provider.js";

const router = Router();

// ---- GBP Connections ----
// POST /api/gbp/connect
router.post("/connect", async (req: Request, res: Response) => {
  try {
    const { client_id, location_id, account_id, business_name, primary_category, site_url, access_token, refresh_token } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO gbp_connections (client_id, location_id, account_id, business_name, primary_category, site_url, access_token, refresh_token, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'connected')
       ON CONFLICT DO NOTHING RETURNING *`,
      [client_id, location_id, account_id, business_name, primary_category, site_url, access_token, refresh_token]
    );
    res.json(rows[0] || { message: "Connection already exists" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/clients/:id/gbp-connection
router.get("/:id/gbp-connection", async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, client_id, location_id, account_id, business_name, primary_category, site_url, status, created_at, updated_at FROM gbp_connections WHERE client_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [req.params.id]
    );
    res.json(rows[0] || null);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/gbp/:id/disconnect
router.delete("/:id/disconnect", async (req: Request, res: Response) => {
  try {
    await pool.query(`UPDATE gbp_connections SET status = 'disconnected', updated_at = NOW() WHERE id = $1`, [req.params.id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ---- Profile & Sync ----
// POST /api/gbp/sync
router.post("/sync", async (req: Request, res: Response) => {
  try {
    const { client_id } = req.body;
    const { rows: conns } = await pool.query(
      `SELECT * FROM gbp_connections WHERE client_id = $1 AND status = 'connected'`, [client_id]
    );
    if (conns.length === 0) return res.status(404).json({ error: "No connected GBP profile" });

    const conn = conns[0];
    const profile = await fetchGbpProfile({
      accessToken: conn.access_token, refreshToken: conn.refresh_token,
      accountId: conn.account_id, locationId: conn.location_id,
    });

    const completeness = calculateCompleteness(profile);

    await pool.query(
      `INSERT INTO gbp_profile_snapshots
       (client_id, location_id, business_name, primary_category, additional_categories, address, phone, website_url, business_description, opening_hours, services_count, products_count, photos_count, posts_count, reviews_count, average_rating, qna_count, completeness_score)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)`,
      [client_id, conn.location_id, profile.businessName, profile.primaryCategory,
        JSON.stringify(profile.additionalCategories), profile.address, profile.phone, profile.websiteUrl,
        profile.businessDescription, profile.openingHours ? JSON.stringify(profile.openingHours) : null,
        profile.servicesCount, profile.productsCount, profile.photosCount, profile.postsCount,
        profile.reviewsCount, profile.averageRating, profile.qnaCount, completeness.score]
    );

    // Sync reviews
    const reviews = await fetchGbpReviews({
      accessToken: conn.access_token, refreshToken: conn.refresh_token,
      accountId: conn.account_id, locationId: conn.location_id,
    });
    for (const r of reviews) {
      await pool.query(
        `INSERT INTO gbp_review_items (client_id, review_id, reviewer_name, rating, review_text, review_date)
         VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT DO NOTHING`,
        [client_id, r.reviewId, r.reviewerName, r.rating, r.reviewText, r.reviewDate]
      );
    }

    // Sync Q&A
    const questions = await fetchGbpQuestions({
      accessToken: conn.access_token, refreshToken: conn.refresh_token,
      accountId: conn.account_id, locationId: conn.location_id,
    });
    for (const q of questions) {
      await pool.query(
        `INSERT INTO gbp_qna_items (client_id, question_id, question_text)
         VALUES ($1,$2,$3) ON CONFLICT DO NOTHING`,
        [client_id, q.questionId, q.questionText]
      );
    }

    // Generate insights
    const insightCount = await generateLocalSeoInsights(client_id);

    res.json({ success: true, completeness, reviews_synced: reviews.length, qna_synced: questions.length, insights_generated: insightCount });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/clients/:id/gbp-profile
router.get("/:id/gbp-profile", async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM gbp_profile_snapshots WHERE client_id = $1 ORDER BY snapshot_date DESC LIMIT 1`,
      [req.params.id]
    );
    if (rows.length === 0) return res.json(null);
    const profile = rows[0];
    const completeness = calculateCompleteness({
      businessName: profile.business_name, primaryCategory: profile.primary_category,
      additionalCategories: profile.additional_categories || [], address: profile.address,
      phone: profile.phone, websiteUrl: profile.website_url, businessDescription: profile.business_description,
      openingHours: profile.opening_hours, servicesCount: profile.services_count, productsCount: profile.products_count,
      photosCount: profile.photos_count, postsCount: profile.posts_count, reviewsCount: profile.reviews_count,
      averageRating: profile.average_rating, qnaCount: profile.qna_count,
    });
    res.json({ ...profile, completeness });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ---- GBP Posts ----
// POST /api/gbp/posts/generate
router.post("/posts/generate", async (req: Request, res: Response) => {
  try {
    const { client_id, article_id } = req.body;
    const { rows: articles } = await pool.query(`SELECT * FROM seo_articles WHERE id = $1`, [article_id]);
    if (articles.length === 0) return res.status(404).json({ error: "Article not found" });
    const article = articles[0];

    const ai = getAiProvider();
    const prompt = `Create a Google Business Profile post from this article. Keep it under 300 words, local-business friendly. Include a call-to-action.\n\nTitle: ${article.title}\n\nContent: ${article.content?.substring(0, 1500)}`;
    let postContent: string;
    try {
      const raw = await ai.generate(prompt, { format: "text" });
      postContent = raw;
    } catch {
      postContent = `${article.title}\n\nRead our latest article to learn more. Visit our website for details!`;
    }

    const { rows } = await pool.query(
      `INSERT INTO gbp_post_drafts (client_id, article_id, title, content, cta_type, cta_url, status)
       VALUES ($1,$2,$3,$4,'LEARN_MORE',$5,'draft') RETURNING *`,
      [client_id, article_id, article.title, postContent, article.slug ? `/${article.slug}` : null]
    );
    res.json(rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/clients/:id/gbp-posts
router.get("/:id/gbp-posts", async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM gbp_post_drafts WHERE client_id = $1 ORDER BY created_at DESC`, [req.params.id]
    );
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/gbp/posts/:id
router.put("/posts/:id", async (req: Request, res: Response) => {
  try {
    const { title, content, cta_type, cta_url, image_prompt, scheduled_time } = req.body;
    const { rows } = await pool.query(
      `UPDATE gbp_post_drafts SET title=COALESCE($2,title), content=COALESCE($3,content), cta_type=COALESCE($4,cta_type), cta_url=COALESCE($5,cta_url), image_prompt=COALESCE($6,image_prompt), scheduled_time=COALESCE($7,scheduled_time), updated_at=NOW() WHERE id=$1 RETURNING *`,
      [req.params.id, title, content, cta_type, cta_url, image_prompt, scheduled_time]
    );
    res.json(rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/gbp/posts/:id/approve
router.post("/posts/:id/approve", async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(
      `UPDATE gbp_post_drafts SET status='approved', updated_at=NOW() WHERE id=$1 RETURNING *`, [req.params.id]
    );
    res.json(rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/gbp/posts/:id/publish
router.post("/posts/:id/publish", async (req: Request, res: Response) => {
  try {
    const { rows: posts } = await pool.query(`SELECT * FROM gbp_post_drafts WHERE id=$1`, [req.params.id]);
    if (posts.length === 0) return res.status(404).json({ error: "Post not found" });

    // Queue as publishing job
    await pool.query(
      `INSERT INTO publishing_jobs (client_id, asset_type, asset_id, platform, job_type, publish_status, provider)
       VALUES ($1, 'article', $2, 'gbp', 'publish', 'queued', 'gbp')`,
      [posts[0].client_id, req.params.id]
    );
    await pool.query(`UPDATE gbp_post_drafts SET status='scheduled', updated_at=NOW() WHERE id=$1`, [req.params.id]);
    res.json({ queued: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ---- Reviews ----
// POST /api/gbp/reviews/sync — handled by /sync above
// GET /api/clients/:id/gbp-reviews
router.get("/:id/gbp-reviews", async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM gbp_review_items WHERE client_id = $1 ORDER BY review_date DESC NULLS LAST`, [req.params.id]
    );
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/gbp/reviews/:id/generate-response
router.post("/reviews/:id/generate-response", async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(`SELECT * FROM gbp_review_items WHERE id=$1`, [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: "Review not found" });
    const review = rows[0];

    const ai = getAiProvider();
    const prompt = `Write a professional, friendly response to this ${review.rating}-star review:\n"${review.review_text}"\nKeep it under 150 words, empathetic and helpful.`;
    let draft: string;
    try { draft = await ai.generate(prompt, { format: "text" }); }
    catch { draft = `Thank you for your ${review.rating}-star review! We appreciate your feedback and are committed to providing excellent service.`; }

    const { rows: updated } = await pool.query(
      `UPDATE gbp_review_items SET response_draft=$2, response_status='drafted', updated_at=NOW() WHERE id=$1 RETURNING *`,
      [req.params.id, draft]
    );
    res.json(updated[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/gbp/reviews/:id
router.put("/reviews/:id", async (req: Request, res: Response) => {
  try {
    const { response_draft } = req.body;
    const { rows } = await pool.query(
      `UPDATE gbp_review_items SET response_draft=COALESCE($2,response_draft), updated_at=NOW() WHERE id=$1 RETURNING *`,
      [req.params.id, response_draft]
    );
    res.json(rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/gbp/reviews/:id/approve
router.post("/reviews/:id/approve", async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(
      `UPDATE gbp_review_items SET response_status='approved', updated_at=NOW() WHERE id=$1 RETURNING *`, [req.params.id]
    );
    res.json(rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/gbp/reviews/:id/respond
router.post("/reviews/:id/respond", async (req: Request, res: Response) => {
  try {
    // Queue as worker job
    const { rows } = await pool.query(`SELECT * FROM gbp_review_items WHERE id=$1`, [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: "Review not found" });
    await pool.query(
      `INSERT INTO publishing_jobs (client_id, asset_type, asset_id, platform, job_type, publish_status, provider)
       VALUES ($1, 'article', $2, 'gbp', 'publish', 'queued', 'gbp_review')`,
      [rows[0].client_id, req.params.id]
    );
    res.json({ queued: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ---- Q&A ----
// GET /api/clients/:id/gbp-qna
router.get("/:id/gbp-qna", async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM gbp_qna_items WHERE client_id = $1 ORDER BY created_at DESC`, [req.params.id]
    );
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/gbp/qna/:id/generate-answer
router.post("/qna/:id/generate-answer", async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(`SELECT * FROM gbp_qna_items WHERE id=$1`, [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: "Question not found" });

    const ai = getAiProvider();
    const prompt = `Write a helpful, professional answer to this customer question:\n"${rows[0].question_text}"\nKeep it under 100 words.`;
    let draft: string;
    try { draft = await ai.generate(prompt, { format: "text" }); }
    catch { draft = `Great question! Please contact us directly for more details. We're happy to help.`; }

    const { rows: updated } = await pool.query(
      `UPDATE gbp_qna_items SET answer_draft=$2, status='drafted', updated_at=NOW() WHERE id=$1 RETURNING *`,
      [req.params.id, draft]
    );
    res.json(updated[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/gbp/qna/:id
router.put("/qna/:id", async (req: Request, res: Response) => {
  try {
    const { answer_draft } = req.body;
    const { rows } = await pool.query(
      `UPDATE gbp_qna_items SET answer_draft=COALESCE($2,answer_draft), updated_at=NOW() WHERE id=$1 RETURNING *`,
      [req.params.id, answer_draft]
    );
    res.json(rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/gbp/qna/:id/approve
router.post("/qna/:id/approve", async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(
      `UPDATE gbp_qna_items SET status='approved', updated_at=NOW() WHERE id=$1 RETURNING *`, [req.params.id]
    );
    res.json(rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/gbp/qna/:id/respond
router.post("/qna/:id/respond", async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(`SELECT * FROM gbp_qna_items WHERE id=$1`, [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: "Question not found" });
    await pool.query(
      `INSERT INTO publishing_jobs (client_id, asset_type, asset_id, platform, job_type, publish_status, provider)
       VALUES ($1, 'article', $2, 'gbp', 'publish', 'queued', 'gbp_qna')`,
      [rows[0].client_id, req.params.id]
    );
    res.json({ queued: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ---- Local SEO Insights ----
// GET /api/clients/:id/local-seo-insights
router.get("/:id/local-seo-insights", async (req: Request, res: Response) => {
  try {
    const status = req.query.status || "open";
    const { rows } = await pool.query(
      `SELECT * FROM local_seo_insights WHERE client_id = $1 AND status = $2 ORDER BY CASE priority WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END, created_at DESC`,
      [req.params.id, status]
    );
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/gbp/insights/:id
router.patch("/insights/:id", async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const { rows } = await pool.query(
      `UPDATE local_seo_insights SET status=$2, updated_at=NOW() WHERE id=$1 RETURNING *`, [req.params.id, status]
    );
    res.json(rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
