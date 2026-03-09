import { Router } from "express";
import pool from "../db.js";

const router = Router();

// POST /api/articles/generate — generate article from brief
router.post("/generate", async (req, res) => {
  const { client_id, brief_id } = req.body;
  if (!client_id || !brief_id) {
    return res.status(400).json({ error: "client_id and brief_id are required" });
  }

  try {
    // Fetch the brief
    const { rows: briefRows } = await pool.query(
      `SELECT * FROM seo_briefs WHERE id = $1 AND client_id = $2`,
      [brief_id, client_id]
    );
    if (briefRows.length === 0) {
      return res.status(404).json({ error: "Brief not found" });
    }

    const brief = briefRows[0];
    const headings = typeof brief.headings === "string" ? JSON.parse(brief.headings) : brief.headings;
    const faq = typeof brief.faq === "string" ? JSON.parse(brief.faq) : brief.faq;
    const entities = typeof brief.entities === "string" ? JSON.parse(brief.entities) : brief.entities;
    const internalLinks = typeof brief.internal_links === "string" ? JSON.parse(brief.internal_links) : brief.internal_links;

    // Generate article content from brief structure
    const content = generateArticleContent(brief.keyword, brief.title, headings, faq, entities, internalLinks);
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

// GET /api/clients/:id/articles
router.get("/:id/articles", async (req, res) => {
  const clientId = req.params.id;
  const statusFilter = req.query.status as string | undefined;

  try {
    let query = `
      SELECT id, brief_id, title, meta_description, content, status, target_keyword, slug, created_at, updated_at
      FROM seo_articles
      WHERE client_id = $1
    `;
    const params: any[] = [clientId];

    if (statusFilter) {
      params.push(statusFilter);
      query += ` AND status = $${params.length}`;
    }

    query += ` ORDER BY updated_at DESC`;

    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch articles" });
  }
});

// PUT /api/articles/:articleId — update article content
router.put("/:articleId", async (req, res) => {
  const { title, meta_description, content, slug } = req.body;

  try {
    const { rows } = await pool.query(
      `UPDATE seo_articles
       SET title = COALESCE($1, title),
           meta_description = COALESCE($2, meta_description),
           content = COALESCE($3, content),
           slug = COALESCE($4, slug),
           updated_at = now()
       WHERE id = $5
       RETURNING *`,
      [title, meta_description, content, slug, req.params.articleId]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Not found" });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update article" });
  }
});

// POST /api/articles/:articleId/approve — move to approved status
router.post("/:articleId/approve", async (req, res) => {
  try {
    const { rows } = await pool.query(
      `UPDATE seo_articles SET status = 'approved', updated_at = now() WHERE id = $1 RETURNING *`,
      [req.params.articleId]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Not found" });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to approve article" });
  }
});

// PATCH /api/articles/:articleId/status — generic status update
router.patch("/:articleId/status", async (req, res) => {
  const { status } = req.body;
  if (!["draft", "review", "approved", "published"].includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }
  try {
    const { rows } = await pool.query(
      `UPDATE seo_articles SET status = $1, updated_at = now() WHERE id = $2 RETURNING *`,
      [status, req.params.articleId]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Not found" });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update article status" });
  }
});

// POST /api/articles/:articleId/publish — publish to WordPress
router.post("/:articleId/publish", async (req, res) => {
  const { schedule_date } = req.body; // optional ISO date string

  try {
    // Get article
    const { rows: articleRows } = await pool.query(
      `SELECT a.*, c.client_id FROM seo_articles a
       JOIN clients c ON c.id = a.client_id
       WHERE a.id = $1`,
      [req.params.articleId]
    );
    if (articleRows.length === 0) {
      return res.status(404).json({ error: "Article not found" });
    }

    const article = articleRows[0];
    if (article.status !== "approved") {
      return res.status(400).json({ error: "Article must be approved before publishing" });
    }

    // Get CMS connection
    const { rows: cmsRows } = await pool.query(
      `SELECT site_url, username, application_password FROM cms_connections WHERE client_id = $1 AND cms_type = 'wordpress'`,
      [article.client_id]
    );
    if (cmsRows.length === 0) {
      return res.status(400).json({ error: "No WordPress connection configured for this client" });
    }

    const { site_url, username, application_password } = cmsRows[0];
    const wpUrl = `${site_url.replace(/\/$/, "")}/wp-json/wp/v2/posts`;

    // Convert markdown to HTML (basic conversion)
    const htmlContent = markdownToHtml(article.content);

    // Prepare WordPress post data
    const postData: any = {
      title: article.title,
      content: htmlContent,
      slug: article.slug?.replace(/^\//, "") || "",
      status: schedule_date ? "future" : "publish",
      excerpt: article.meta_description,
    };

    if (schedule_date) {
      postData.date = schedule_date;
    }

    // Publish to WordPress
    const response = await fetch(wpUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(`${username}:${application_password}`).toString("base64")}`,
      },
      body: JSON.stringify(postData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("WordPress publish error:", errorText);
      return res.status(400).json({ error: `WordPress publish failed: ${response.status}`, details: errorText });
    }

    const wpPost = await response.json();

    // Update article with WordPress post info
    const { rows: updatedRows } = await pool.query(
      `UPDATE seo_articles
       SET status = 'published',
           cms_post_id = $1,
           cms_post_url = $2,
           publish_date = $3,
           updated_at = now()
       WHERE id = $4
       RETURNING *`,
      [
        String(wpPost.id),
        wpPost.link,
        schedule_date || new Date().toISOString(),
        req.params.articleId,
      ]
    );

    res.json({
      article: updatedRows[0],
      wordpress: {
        id: wpPost.id,
        url: wpPost.link,
        status: wpPost.status,
      },
    });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: "Failed to publish article", details: err.message });
  }
});

/** Basic markdown to HTML converter for WordPress */
function markdownToHtml(markdown: string): string {
  let html = markdown;

  // Headers
  html = html.replace(/^### (.+)$/gm, "<h3>$1</h3>");
  html = html.replace(/^## (.+)$/gm, "<h2>$1</h2>");
  html = html.replace(/^# (.+)$/gm, "<h1>$1</h1>");

  // Bold and italic
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");

  // Links
  html = html.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>');

  // Horizontal rules
  html = html.replace(/^---$/gm, "<hr>");

  // Lists
  html = html.replace(/^- (.+)$/gm, "<li>$1</li>");
  html = html.replace(/(<li>.*<\/li>\n?)+/g, (match) => `<ul>\n${match}</ul>\n`);

  // Paragraphs (wrap non-tag lines)
  const lines = html.split("\n");
  const wrappedLines = lines.map((line) => {
    const trimmed = line.trim();
    if (!trimmed) return "";
    if (trimmed.startsWith("<")) return line;
    if (trimmed.startsWith("<!--")) return line;
    return `<p>${trimmed}</p>`;
  });

  return wrappedLines.filter(Boolean).join("\n");
}


function generateArticleContent(
  keyword: string,
  title: string,
  headings: { level: string; text: string }[],
  faq: { question: string; answer: string }[],
  entities: string[],
  internalLinks: { from: string; to: string; anchor: string }[]
): string {
  const year = new Date().getFullYear();
  const sections: string[] = [];

  // Introduction
  sections.push(`# ${title}\n`);
  sections.push(
    `Looking for comprehensive information about **${keyword}**? You've come to the right place. ` +
    `In this ${year} guide, we cover everything you need to know — from the basics to expert tips ` +
    `that will help you make informed decisions.\n`
  );

  // Generate body sections from headings (skip H1 as it's the title)
  for (const heading of headings) {
    if (heading.level === "H1") continue;

    const prefix = heading.level === "H2" ? "##" : "###";
    sections.push(`${prefix} ${heading.text}\n`);

    // Generate placeholder paragraph for each heading
    if (heading.text.toLowerCase().includes("benefit")) {
      sections.push(
        `There are several key benefits to consider when it comes to ${keyword}. ` +
        `Understanding these advantages will help you make the most of your investment ` +
        `and achieve optimal results.\n`
      );
    } else if (heading.text.toLowerCase().includes("cost") || heading.text.toLowerCase().includes("price")) {
      sections.push(
        `The cost of ${keyword} varies based on multiple factors including scope, materials, ` +
        `and service provider. Below is a general breakdown to help you budget effectively.\n`
      );
    } else if (heading.text.toLowerCase().includes("challenge")) {
      sections.push(
        `While ${keyword} offers many benefits, there are some common challenges to be aware of. ` +
        `Being prepared for these will help you navigate the process more smoothly.\n`
      );
    } else if (heading.text.toLowerCase().includes("choose") || heading.text.toLowerCase().includes("select")) {
      sections.push(
        `Choosing the right approach to ${keyword} requires careful consideration. ` +
        `Here are the most important factors to evaluate before making your decision.\n`
      );
    } else if (heading.text.toLowerCase().includes("tip") || heading.text.toLowerCase().includes("expert")) {
      sections.push(
        `Industry experts recommend the following strategies for getting the best results with ${keyword}. ` +
        `These proven tips can save you time, money, and effort.\n`
      );
    } else {
      sections.push(
        `When it comes to ${heading.text.toLowerCase()}, there are several important aspects to consider. ` +
        `This section covers the essential information you need to know about this topic as it relates to ${keyword}.\n`
      );
    }
  }

  // FAQ section
  if (faq.length > 0) {
    sections.push(`## Frequently Asked Questions\n`);
    for (const item of faq) {
      sections.push(`### ${item.question}\n`);
      sections.push(`${item.answer}\n`);
    }
  }

  // Internal linking suggestions as a note
  if (internalLinks.length > 0) {
    sections.push(`---\n`);
    sections.push(`*Internal linking notes:*\n`);
    for (const link of internalLinks) {
      sections.push(`- Link to [${link.anchor}](${link.to}) from relevant sections\n`);
    }
  }

  // Conclusion
  sections.push(`## Conclusion\n`);
  sections.push(
    `We hope this comprehensive guide to **${keyword}** has been helpful. ` +
    `Whether you're just starting your research or ready to take action, ` +
    `the information and tips provided above should give you a solid foundation ` +
    `for making informed decisions. If you have any questions, don't hesitate to reach out.\n`
  );

  // Entity coverage note
  if (entities.length > 0) {
    sections.push(`\n<!-- Target entities: ${entities.join(", ")} -->`);
  }

  return sections.join("\n");
}

export default router;
