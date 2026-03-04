export interface Client {
  id: string;
  name: string;
  domain: string;
  keywords_count: number;
  competitors_count: number;
  health_score: number;
  created_at: string;
}

export interface KeywordRanking {
  id: string;
  client_id: string;
  keyword: string;
  current_position: number;
  last_position: number;
  change: number;
  ranking_url: string;
  tracked_date: string;
}

export interface Competitor {
  id: string;
  client_id: string;
  domain: string;
  overlap_score: number;
}

export interface AuditIssue {
  id: string;
  client_id: string;
  type: string;
  severity: "critical" | "warning" | "info";
  affected_url: string;
  description: string;
  fix_instruction: string;
  status: "open" | "in_progress" | "done";
}

export const clients: Client[] = [
  { id: "1", name: "Renovo Interiors", domain: "renovo.sg", keywords_count: 24, competitors_count: 2, health_score: 72, created_at: "2025-11-01" },
  { id: "2", name: "HomeStyle SG", domain: "homestyle.sg", keywords_count: 30, competitors_count: 2, health_score: 85, created_at: "2025-10-15" },
  { id: "3", name: "Kitchen Pro Asia", domain: "kitchenpro.asia", keywords_count: 18, competitors_count: 1, health_score: 58, created_at: "2025-12-03" },
  { id: "4", name: "CleanSpace Solutions", domain: "cleanspace.com.sg", keywords_count: 12, competitors_count: 2, health_score: 91, created_at: "2026-01-10" },
];

export const rankings: KeywordRanking[] = [
  { id: "r1", client_id: "1", keyword: "renovation singapore", current_position: 12, last_position: 18, change: 6, ranking_url: "https://renovo.sg/services", tracked_date: "2026-02-24" },
  { id: "r2", client_id: "1", keyword: "kitchen renovation singapore", current_position: 9, last_position: 5, change: -4, ranking_url: "https://renovo.sg/kitchen", tracked_date: "2026-02-24" },
  { id: "r3", client_id: "1", keyword: "hdb renovation contractor", current_position: 4, last_position: 7, change: 3, ranking_url: "https://renovo.sg/hdb", tracked_date: "2026-02-24" },
  { id: "r4", client_id: "1", keyword: "bathroom renovation cost singapore", current_position: 15, last_position: 14, change: -1, ranking_url: "https://renovo.sg/bathroom", tracked_date: "2026-02-24" },
  { id: "r5", client_id: "1", keyword: "home renovation ideas", current_position: 22, last_position: 30, change: 8, ranking_url: "https://renovo.sg/blog/ideas", tracked_date: "2026-02-24" },
  { id: "r6", client_id: "1", keyword: "best renovation company singapore", current_position: 7, last_position: 6, change: -1, ranking_url: "https://renovo.sg/", tracked_date: "2026-02-24" },
  { id: "r7", client_id: "1", keyword: "condo renovation singapore", current_position: 11, last_position: 19, change: 8, ranking_url: "https://renovo.sg/condo", tracked_date: "2026-02-24" },
  { id: "r8", client_id: "1", keyword: "renovation permit singapore", current_position: 3, last_position: 3, change: 0, ranking_url: "https://renovo.sg/blog/permits", tracked_date: "2026-02-24" },
  { id: "r9", client_id: "1", keyword: "interior design singapore", current_position: 18, last_position: 25, change: 7, ranking_url: "https://renovo.sg/interior", tracked_date: "2026-02-24" },
  { id: "r10", client_id: "1", keyword: "renovation loan singapore", current_position: 35, last_position: 32, change: -3, ranking_url: "https://renovo.sg/blog/loan", tracked_date: "2026-02-24" },
  { id: "r11", client_id: "2", keyword: "home decor singapore", current_position: 5, last_position: 8, change: 3, ranking_url: "https://homestyle.sg/decor", tracked_date: "2026-02-24" },
  { id: "r12", client_id: "2", keyword: "furniture singapore", current_position: 14, last_position: 11, change: -3, ranking_url: "https://homestyle.sg/furniture", tracked_date: "2026-02-24" },
  { id: "r13", client_id: "3", keyword: "kitchen cabinet singapore", current_position: 19, last_position: 28, change: 9, ranking_url: "https://kitchenpro.asia/cabinets", tracked_date: "2026-02-24" },
];

export const competitors: Competitor[] = [
  { id: "c1", client_id: "1", domain: "renocraft.sg", overlap_score: 78 },
  { id: "c2", client_id: "1", domain: "buildmate.com.sg", overlap_score: 65 },
  { id: "c3", client_id: "2", domain: "hipvan.com", overlap_score: 82 },
  { id: "c4", client_id: "2", domain: "castlery.com", overlap_score: 71 },
];

export const auditIssues: AuditIssue[] = [
  { id: "a1", client_id: "1", type: "Missing Title", severity: "critical", affected_url: "https://renovo.sg/about", description: "Page has no <title> tag", fix_instruction: "Add a unique, descriptive title tag under 60 characters.", status: "open" },
  { id: "a2", client_id: "1", type: "Missing Meta Description", severity: "warning", affected_url: "https://renovo.sg/services", description: "No meta description found", fix_instruction: "Add a compelling meta description under 160 characters.", status: "open" },
  { id: "a3", client_id: "1", type: "Multiple H1", severity: "warning", affected_url: "https://renovo.sg/kitchen", description: "Page contains 3 H1 tags", fix_instruction: "Consolidate to a single H1 tag. Use H2–H6 for subheadings.", status: "in_progress" },
  { id: "a4", client_id: "1", type: "Broken Internal Link", severity: "critical", affected_url: "https://renovo.sg/blog/tips", description: "Link to /old-page returns 404", fix_instruction: "Update or remove the broken link. Set up 301 redirect if page moved.", status: "open" },
  { id: "a5", client_id: "1", type: "Redirect Chain", severity: "warning", affected_url: "https://renovo.sg/promo", description: "3-hop redirect chain detected", fix_instruction: "Update links to point directly to the final destination URL.", status: "done" },
  { id: "a6", client_id: "1", type: "Missing Canonical", severity: "info", affected_url: "https://renovo.sg/blog/ideas", description: "No canonical tag set", fix_instruction: "Add a self-referencing canonical tag to avoid duplicate content.", status: "open" },
  { id: "a7", client_id: "1", type: "Thin Content", severity: "warning", affected_url: "https://renovo.sg/faq", description: "Page has only 85 words", fix_instruction: "Expand content to at least 300 words with relevant information.", status: "open" },
  { id: "a8", client_id: "1", type: "Missing Title", severity: "critical", affected_url: "https://renovo.sg/contact", description: "Page has no <title> tag", fix_instruction: "Add a unique, descriptive title tag.", status: "in_progress" },
];

// Helpers
export function getClientRankings(clientId: string) {
  return rankings.filter((r) => r.client_id === clientId);
}

export function getTopGainers(clientId: string, limit = 5) {
  return getClientRankings(clientId)
    .filter((r) => r.change > 0)
    .sort((a, b) => b.change - a.change)
    .slice(0, limit);
}

export function getTopLosers(clientId: string, limit = 5) {
  return getClientRankings(clientId)
    .filter((r) => r.change < 0)
    .sort((a, b) => a.change - b.change)
    .slice(0, limit);
}

export function getNearWins(clientId: string) {
  return getClientRankings(clientId).filter(
    (r) => r.current_position >= 11 && r.current_position <= 20
  );
}

export function getOpportunities(clientId: string) {
  const kws = getClientRankings(clientId);
  return {
    nearWins: kws.filter((r) => r.current_position >= 11 && r.current_position <= 20),
    improving: kws.filter((r) => r.change > 0).sort((a, b) => b.change - a.change),
    dropping: kws.filter((r) => r.change < 0).sort((a, b) => a.change - b.change),
  };
}

export function getClientAuditIssues(clientId: string) {
  return auditIssues.filter((i) => i.client_id === clientId);
}

export function getClientCompetitors(clientId: string) {
  return competitors.filter((c) => c.client_id === clientId);
}
