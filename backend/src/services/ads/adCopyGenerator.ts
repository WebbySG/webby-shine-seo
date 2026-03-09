/**
 * Ad Copy Generator — creates Google Ads compliant search ad copy.
 */
import pool from "../../db.js";
import { getAiProvider } from "../ai/provider.js";

export async function generateAdCopy(params: {
  clientId: string;
  campaignId?: string;
  adGroupId?: string;
  targetKeyword: string;
  finalUrl?: string;
}): Promise<any> {
  // Get brand context
  const { rows: brands } = await pool.query(`SELECT * FROM brand_profiles WHERE client_id = $1`, [params.clientId]);
  const brand = brands[0];

  // Get client info
  const { rows: clients } = await pool.query(`SELECT name, domain FROM clients WHERE id = $1`, [params.clientId]);
  const client = clients[0];

  const ai = getAiProvider();
  const prompt = `Generate Google Ads search ad copy for the keyword "${params.targetKeyword}".
Business: ${brand?.brand_name || client?.name || "Business"}
Website: ${client?.domain || "example.com"}
${brand?.tone ? `Tone: ${brand.tone}` : ""}

Requirements:
- Headline 1: max 30 characters, include keyword
- Headline 2: max 30 characters, value proposition
- Headline 3: max 30 characters, call to action
- Description 1: max 90 characters, expand on benefits
- Description 2: max 90 characters, urgency or social proof
- Path 1: max 15 characters
- Path 2: max 15 characters

Return JSON: { "headline_1": "", "headline_2": "", "headline_3": "", "description_1": "", "description_2": "", "path_1": "", "path_2": "" }`;

  let copy: any;
  try {
    const raw = await ai.generate(prompt, { format: "json" });
    copy = typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch {
    // Template fallback
    const kw = params.targetKeyword;
    const bizName = brand?.brand_name || client?.name || "Our Service";
    copy = {
      headline_1: kw.substring(0, 30),
      headline_2: `${bizName} - Trusted`.substring(0, 30),
      headline_3: "Get a Free Quote Today".substring(0, 30),
      description_1: `Looking for ${kw}? ${bizName} delivers quality results you can trust.`.substring(0, 90),
      description_2: `Contact us today. Serving Singapore. Professional & reliable service.`.substring(0, 90),
      path_1: kw.split(" ")[0]?.substring(0, 15) || "services",
      path_2: "quote",
    };
  }

  const finalUrl = params.finalUrl || `https://${client?.domain || "example.com"}`;

  const { rows: [draft] } = await pool.query(
    `INSERT INTO ads_copy_drafts (client_id, campaign_id, ad_group_id, target_keyword, headline_1, headline_2, headline_3, description_1, description_2, final_url, path_1, path_2, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'draft') RETURNING *`,
    [params.clientId, params.campaignId || null, params.adGroupId || null, params.targetKeyword,
      copy.headline_1, copy.headline_2, copy.headline_3, copy.description_1, copy.description_2,
      finalUrl, copy.path_1, copy.path_2]
  );

  return draft;
}
