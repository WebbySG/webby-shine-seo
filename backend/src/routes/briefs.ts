import { Router } from "express";
import pool from "../db.js";

const router = Router();

// GET /api/clients/:id/briefs
router.get("/:id/briefs", async (req, res) => {
  const clientId = req.params.id;
  const statusFilter = req.query.status as string | undefined;

  try {
    let query = `
      SELECT id, keyword, title, meta_description, headings, faq, entities, internal_links, status, created_at
      FROM seo_briefs
      WHERE client_id = $1
    `;
    const params: any[] = [clientId];

    if (statusFilter) {
      params.push(statusFilter);
      query += ` AND status = $${params.length}`;
    }

    query += ` ORDER BY created_at DESC`;

    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch briefs" });
  }
});

// POST /api/briefs/generate — generate a brief for a keyword
router.post("/generate", async (req, res) => {
  const { client_id, keyword } = req.body;
  if (!client_id || !keyword) {
    return res.status(400).json({ error: "client_id and keyword are required" });
  }

  try {
    // Gather context from existing data
    const [keywordData, internalLinks, rankings] = await Promise.all([
      pool.query(
        `SELECT k.keyword, k.target_url, k.search_volume, k.difficulty
         FROM keywords k WHERE k.client_id = $1 AND k.keyword ILIKE $2 LIMIT 1`,
        [client_id, `%${keyword}%`]
      ),
      pool.query(
        `SELECT from_url, to_url, anchor_text FROM internal_link_suggestions
         WHERE client_id = $1 AND status = 'pending' LIMIT 5`,
        [client_id]
      ),
      pool.query(
        `SELECT rs.position, rs.url FROM rank_snapshots rs
         JOIN keywords k ON k.id = rs.keyword_id
         WHERE k.client_id = $1 AND k.keyword ILIKE $2
         ORDER BY rs.tracked_at DESC LIMIT 1`,
        [client_id, `%${keyword}%`]
      ),
    ]);

    const kw = keywordData.rows[0];
    const links = internalLinks.rows;
    const currentRank = rankings.rows[0];

    // Generate structured brief using template-based logic
    // (Can be replaced with AI API call in future)
    const brief = generateBrief(keyword, kw, links, currentRank);

    const { rows } = await pool.query(
      `INSERT INTO seo_briefs (client_id, keyword, title, meta_description, headings, faq, entities, internal_links)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        client_id,
        keyword,
        brief.title,
        brief.meta_description,
        JSON.stringify(brief.headings),
        JSON.stringify(brief.faq),
        JSON.stringify(brief.entities),
        JSON.stringify(brief.internal_links),
      ]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate brief" });
  }
});

// PATCH /api/clients/:id/briefs/:briefId — update status
router.patch("/:id/briefs/:briefId", async (req, res) => {
  const { status } = req.body;
  if (!["draft", "approved", "published"].includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  try {
    const { rows } = await pool.query(
      `UPDATE seo_briefs SET status = $1 WHERE id = $2 AND client_id = $3 RETURNING *`,
      [status, req.params.briefId, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Not found" });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update brief" });
  }
});

// DELETE /api/clients/:id/briefs/:briefId
router.delete("/:id/briefs/:briefId", async (req, res) => {
  try {
    const { rowCount } = await pool.query(
      `DELETE FROM seo_briefs WHERE id = $1 AND client_id = $2`,
      [req.params.briefId, req.params.id]
    );
    if (rowCount === 0) return res.status(404).json({ error: "Not found" });
    res.json({ deleted: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete brief" });
  }
});

/** Template-based brief generator — deterministic, no AI dependency */
function generateBrief(
  keyword: string,
  kwData: any,
  links: any[],
  currentRank: any
) {
  const titleKeyword = keyword
    .split(" ")
    .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  const year = new Date().getFullYear();

  const title = `${titleKeyword}: Complete Guide (${year})`;

  const meta_description = `Learn everything about ${keyword}. Our comprehensive ${year} guide covers costs, tips, and expert advice to help you make informed decisions.`;

  const headings = [
    { level: "H1", text: title },
    { level: "H2", text: `What Is ${titleKeyword}?` },
    { level: "H2", text: `Why ${titleKeyword} Matters` },
    { level: "H3", text: "Key Benefits" },
    { level: "H3", text: "Common Challenges" },
    { level: "H2", text: `How to Choose the Best ${titleKeyword}` },
    { level: "H3", text: "Factors to Consider" },
    { level: "H3", text: "Cost Breakdown" },
    { level: "H2", text: `${titleKeyword} Tips from Experts` },
    { level: "H2", text: "Frequently Asked Questions" },
  ];

  const faq = [
    { question: `How much does ${keyword} cost?`, answer: `The cost of ${keyword} varies depending on scope, materials, and provider. Get multiple quotes for best results.` },
    { question: `How long does ${keyword} take?`, answer: `Typical timelines range from a few weeks to several months depending on complexity.` },
    { question: `What should I look for in a ${keyword} provider?`, answer: `Look for experience, reviews, portfolio quality, and transparent pricing.` },
    { question: `Is ${keyword} worth the investment?`, answer: `Yes — when done correctly, ${keyword} delivers strong ROI and long-term value.` },
  ];

  const entities = [
    keyword,
    ...keyword.split(" ").filter((w: string) => w.length > 3),
    "cost",
    "guide",
    "tips",
    "reviews",
  ].filter((v, i, a) => a.indexOf(v) === i);

  const internal_links = links.map((l) => ({
    from: l.from_url,
    to: l.to_url,
    anchor: l.anchor_text,
  }));

  return { title, meta_description, headings, faq, entities, internal_links };
}

export default router;
