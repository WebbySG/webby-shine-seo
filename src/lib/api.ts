const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `API error ${res.status}`);
  }
  return res.json();
}

// ---------- Types ----------
export interface Client {
  id: string;
  name: string;
  domain: string;
  keywords_count: number;
  competitors_count: number;
  health_score: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface KeywordRanking {
  id: string;
  keyword: string;
  current_position: number | null;
  last_position: number | null;
  change: number | null;
  ranking_url: string | null;
  tracked_date: string | null;
}

export interface Competitor {
  id: string;
  domain: string;
  label: string | null;
  source: string;
  confirmed: boolean;
}

export interface AuditIssue {
  id: string;
  issue_type: string;
  severity: "critical" | "warning" | "info";
  affected_url: string;
  description: string;
  fix_instruction: string | null;
  status: "open" | "in_progress" | "done";
}

// ---------- Clients ----------
export const getClients = () => request<Client[]>("/clients");
export const getClient = (id: string) => request<Client>(`/clients/${id}`);
export const createClient = (data: { name: string; domain: string }) =>
  request<Client>("/clients", { method: "POST", body: JSON.stringify(data) });
export const updateClient = (id: string, data: Partial<Client>) =>
  request<Client>(`/clients/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const deleteClient = (id: string) =>
  request<{ deleted: boolean }>(`/clients/${id}`, { method: "DELETE" });

// ---------- Keywords ----------
export const getKeywords = (clientId: string) =>
  request<KeywordRanking[]>(`/clients/${clientId}/keywords`);
export const createKeyword = (clientId: string, data: { keyword: string }) =>
  request<any>(`/clients/${clientId}/keywords`, { method: "POST", body: JSON.stringify(data) });

// ---------- Competitors ----------
export const getCompetitors = (clientId: string) =>
  request<Competitor[]>(`/clients/${clientId}/competitors`);
export const createCompetitor = (clientId: string, data: { domain: string; label?: string }) =>
  request<Competitor>(`/clients/${clientId}/competitors`, { method: "POST", body: JSON.stringify(data) });

// ---------- Audit ----------
export const getAuditIssues = (clientId: string) =>
  request<AuditIssue[]>(`/audit/issues?client_id=${clientId}`);

// ---------- Opportunities ----------
export interface Opportunity {
  id: string;
  type: "near_win" | "content_gap" | "page_expansion" | "technical_fix";
  keyword: string | null;
  target_url: string | null;
  current_position: number | null;
  recommended_action: string;
  priority: "high" | "medium" | "low";
  status: "open" | "in_progress" | "done" | "dismissed";
  created_at: string;
}

export const getOpportunities = (clientId: string) =>
  request<Opportunity[]>(`/clients/${clientId}/opportunities`);

export const updateOpportunityStatus = (clientId: string, oppId: string, status: string) =>
  request<Opportunity>(`/clients/${clientId}/opportunities/${oppId}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
