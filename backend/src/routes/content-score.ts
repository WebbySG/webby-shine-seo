import { Router } from "express";
import pool from "../db.js";

const router = Router();

// GET /api/clients/:id/content-scores
router.get("/:id/content-scores", async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM content_scores WHERE client_id = $1 ORDER BY scored_at DESC`,
      [req.params.id]
    );
    res.json(rows);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// POST /api/content-score/analyze — score a piece of content
// 🔌 AI INTEGRATION: In production, use NLP analysis via AI provider
router.post("/analyze", async (req, res) => {
  const { client_id, article_id, url, title, target_keyword, content, meta_title, meta_description } = req.body;
  if (!client_id || !target_keyword || !content) {
    return res.status(400).json({ error: "client_id, target_keyword, and content required" });
  }

  try {
    const score = analyzeContent(content, target_keyword, title, meta_title, meta_description);

    const { rows } = await pool.query(
      `INSERT INTO content_scores (
        client_id, article_id, url, title, target_keyword,
        overall_score, word_count, word_count_target, word_count_score,
        heading_score, keyword_density, keyword_score, readability_score,
        focus_terms_found, focus_terms_total, focus_terms_score,
        internal_links_count, external_links_count, link_score,
        meta_title_length, meta_desc_length, meta_score,
        issues_json, suggestions_json, focus_terms_json
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24)
      RETURNING *`,
      [
        client_id, article_id || null, url || null, title || "Untitled", target_keyword,
        score.overall, score.wordCount, score.wordCountTarget, score.wordCountScore,
        score.headingScore, score.keywordDensity, score.keywordScore, score.readabilityScore,
        score.focusTermsFound, score.focusTermsTotal, score.focusTermsScore,
        score.internalLinks, score.externalLinks, score.linkScore,
        score.metaTitleLength, score.metaDescLength, score.metaScore,
        JSON.stringify(score.issues), JSON.stringify(score.suggestions), JSON.stringify(score.focusTerms),
      ]
    );

    res.status(201).json(rows[0]);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// GET /api/content-score/:scoreId
router.get("/:scoreId", async (req, res) => {
  try {
    const { rows } = await pool.query(`SELECT * FROM content_scores WHERE id = $1`, [req.params.scoreId]);
    if (rows.length === 0) return res.status(404).json({ error: "Not found" });
    res.json(rows[0]);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

/**
 * 🔌 CONTENT ANALYZER — Replace with NLP/AI analysis in production
 * Analyzes content against SEO best practices
 */
function analyzeContent(content: string, keyword: string, title?: string, metaTitle?: string, metaDesc?: string) {
  const words = content.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const wordCountTarget = 1500;
  const lowerContent = content.toLowerCase();
  const lowerKeyword = keyword.toLowerCase();

  // Word count score
  const wordCountRatio = Math.min(wordCount / wordCountTarget, 1.5);
  const wordCountScore = wordCountRatio >= 0.8 && wordCountRatio <= 1.3 ? 100 : wordCountRatio < 0.8 ? wordCountRatio * 100 : 80;

  // Keyword density
  const keywordCount = (lowerContent.match(new RegExp(lowerKeyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) || []).length;
  const keywordDensity = wordCount > 0 ? keywordCount / wordCount : 0;
  const keywordScore = keywordDensity >= 0.005 && keywordDensity <= 0.025 ? 100 : keywordDensity < 0.005 ? keywordDensity * 20000 : Math.max(0, 100 - (keywordDensity - 0.025) * 4000);

  // Heading analysis
  const h1Count = (content.match(/^# [^\n]+/gm) || []).length;
  const h2Count = (content.match(/^## [^\n]+/gm) || []).length;
  const h3Count = (content.match(/^### [^\n]+/gm) || []).length;
  const headingScore = Math.min(100, (h1Count >= 1 ? 30 : 0) + (h2Count >= 3 ? 40 : h2Count * 13) + (h3Count >= 2 ? 30 : h3Count * 15));

  // Readability (simple Flesch approximation)
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 5).length;
  const avgWordsPerSentence = sentences > 0 ? wordCount / sentences : wordCount;
  const readabilityScore = avgWordsPerSentence <= 20 ? 90 : avgWordsPerSentence <= 25 ? 70 : avgWordsPerSentence <= 30 ? 50 : 30;

  // Focus terms (generate related terms from keyword)
  const keywordParts = lowerKeyword.split(/\s+/);
  const focusTerms = [
    lowerKeyword,
    ...keywordParts,
    `best ${lowerKeyword}`,
    `${lowerKeyword} guide`,
    `${lowerKeyword} tips`,
    `how to ${lowerKeyword}`,
  ].filter((t, i, arr) => arr.indexOf(t) === i && t.length > 2);
  const focusTermsFound = focusTerms.filter(t => lowerContent.includes(t)).length;
  const focusTermsScore = focusTerms.length > 0 ? (focusTermsFound / focusTerms.length) * 100 : 0;

  // Links
  const internalLinks = (content.match(/\[([^\]]+)\]\(\/[^)]+\)/g) || []).length;
  const externalLinks = (content.match(/\[([^\]]+)\]\(https?:\/\/[^)]+\)/g) || []).length;
  const linkScore = Math.min(100, (internalLinks >= 3 ? 50 : internalLinks * 17) + (externalLinks >= 2 ? 50 : externalLinks * 25));

  // Meta tags
  const metaTitleLength = (metaTitle || title || "").length;
  const metaDescLength = (metaDesc || "").length;
  const metaTitleOk = metaTitleLength >= 30 && metaTitleLength <= 60;
  const metaDescOk = metaDescLength >= 120 && metaDescLength <= 160;
  const metaScore = (metaTitleOk ? 50 : metaTitleLength > 0 ? 25 : 0) + (metaDescOk ? 50 : metaDescLength > 0 ? 25 : 0);

  // Issues
  const issues: { type: string; severity: string; message: string }[] = [];
  if (wordCount < 1000) issues.push({ type: "word_count", severity: "high", message: `Content is only ${wordCount} words. Target ${wordCountTarget}+ for better rankings.` });
  if (h1Count === 0) issues.push({ type: "heading", severity: "high", message: "Missing H1 heading." });
  if (h1Count > 1) issues.push({ type: "heading", severity: "medium", message: "Multiple H1 headings detected. Use only one." });
  if (h2Count < 3) issues.push({ type: "heading", severity: "medium", message: `Only ${h2Count} H2 headings. Add more to improve structure.` });
  if (keywordDensity < 0.005) issues.push({ type: "keyword", severity: "high", message: `Keyword density (${(keywordDensity * 100).toFixed(2)}%) is too low. Include "${keyword}" more naturally.` });
  if (keywordDensity > 0.03) issues.push({ type: "keyword", severity: "high", message: `Keyword density (${(keywordDensity * 100).toFixed(2)}%) is too high. Reduce to avoid keyword stuffing.` });
  if (internalLinks === 0) issues.push({ type: "links", severity: "medium", message: "No internal links found. Add links to related pages." });
  if (metaTitleLength === 0) issues.push({ type: "meta", severity: "high", message: "Missing meta title." });
  if (metaTitleLength > 60) issues.push({ type: "meta", severity: "medium", message: `Meta title is ${metaTitleLength} chars. Keep under 60.` });
  if (metaDescLength === 0) issues.push({ type: "meta", severity: "high", message: "Missing meta description." });
  if (metaDescLength > 160) issues.push({ type: "meta", severity: "medium", message: `Meta description is ${metaDescLength} chars. Keep under 160.` });

  // Suggestions
  const suggestions: string[] = [];
  if (focusTermsFound < focusTerms.length * 0.6) suggestions.push(`Include more focus terms: ${focusTerms.filter(t => !lowerContent.includes(t)).slice(0, 3).join(", ")}`);
  if (avgWordsPerSentence > 22) suggestions.push("Shorten sentences for better readability.");
  if (externalLinks === 0) suggestions.push("Add authoritative external links for credibility.");

  // Overall score (weighted average)
  const overall = Math.round(
    wordCountScore * 0.15 + keywordScore * 0.20 + headingScore * 0.15 +
    readabilityScore * 0.10 + focusTermsScore * 0.15 + linkScore * 0.10 + metaScore * 0.15
  );

  return {
    overall: Math.min(100, Math.max(0, overall)),
    wordCount, wordCountTarget, wordCountScore: Math.round(wordCountScore),
    headingScore: Math.round(headingScore),
    keywordDensity: Math.round(keywordDensity * 10000) / 10000,
    keywordScore: Math.round(keywordScore),
    readabilityScore: Math.round(readabilityScore),
    focusTermsFound, focusTermsTotal: focusTerms.length,
    focusTermsScore: Math.round(focusTermsScore),
    internalLinks, externalLinks,
    linkScore: Math.round(linkScore),
    metaTitleLength, metaDescLength,
    metaScore: Math.round(metaScore),
    issues, suggestions,
    focusTerms: focusTerms.map(t => ({ term: t, found: lowerContent.includes(t) })),
  };
}

export default router;
