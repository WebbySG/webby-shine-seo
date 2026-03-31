import { supabase } from "@/integrations/supabase/client";

// Re-export request for pages that still use it directly
export async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options?.headers as Record<string, string>) || {}),
  };
  const baseUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;
  const res = await fetch(`${baseUrl}${path}`, { ...options, headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `API error ${res.status}`);
  }
  return res.json();
}

// ---------- Types ----------
export interface Client {
  id: string; name: string; domain: string; keywords_count: number; competitors_count: number;
  health_score: number; status: string; created_at: string; updated_at: string;
  user_id?: string;
}
export interface KeywordRanking {
  id: string; keyword: string; current_position: number | null; last_position: number | null;
  change: number | null; ranking_url: string | null; tracked_date: string | null;
}
export interface Competitor { id: string; domain: string; label: string | null; source: string; confirmed: boolean; }

export interface AuditIssue {
  id: string; issue_type: string; severity: "critical" | "warning" | "info"; affected_url: string;
  description: string; fix_instruction: string | null; status: "open" | "in_progress" | "fixed" | "ignored" | "regressed";
  provider?: string; category?: string; why_it_matters?: string;
  first_seen_at?: string; last_checked_at?: string; recheck_count?: number;
  evidence?: AuditEvidence[]; rechecks?: AuditRecheck[];
}
export interface AuditRun {
  id: string; client_id: string; domain: string | null; scope: string; provider: string;
  pages_crawled: number; pages_limit: number; score: number | null; status: string;
  total_issues: number; critical_count: number; warning_count: number; info_count: number;
  started_at: string | null; completed_at: string | null; created_at: string;
  issues?: AuditIssue[]; pages?: AuditPage[];
}
export interface AuditPage {
  id: string; audit_run_id: string; url: string; status_code: number | null;
  title: string | null; meta_description: string | null; word_count: number | null;
  load_time_ms: number | null; issues_count: number;
}
export interface AuditEvidence {
  id: string; audit_issue_id: string; evidence_type: string; key: string;
  value: string | null; expected_value: string | null;
}
export interface AuditRecheck {
  id: string; audit_issue_id: string; provider: string; previous_status: string;
  new_status: string; previous_evidence: any; new_evidence: any;
  diff_summary: string | null; checked_at: string;
}

export interface Opportunity {
  id: string; type: "near_win" | "content_gap" | "page_expansion" | "technical_fix";
  keyword: string | null; target_url: string | null; current_position: number | null;
  recommended_action: string; priority: "high" | "medium" | "low";
  status: "open" | "in_progress" | "done" | "dismissed"; created_at: string;
}

export interface SeoBriefHeading { level: string; text: string; }
export interface SeoBriefFaq { question: string; answer: string; }
export interface SeoBriefLink { from: string; to: string; anchor: string; }
export interface SeoBriefSection { title: string; guidance: string; word_count_target?: number; }
export interface SeoBriefEvidence { type: "keyword" | "competitor" | "audit"; source: string; detail: string; }
export interface SeoBrief {
  id: string; keyword: string; title: string; meta_description: string; headings: SeoBriefHeading[];
  faq: SeoBriefFaq[]; entities: string[]; internal_links: SeoBriefLink[];
  status: "draft" | "approved" | "published" | "under_review" | "changes_requested" | "rejected" | "ready_for_publishing";
  created_at: string;
  page_type?: string; secondary_keywords?: string[]; search_intent?: string;
  target_audience?: string; page_goal?: string; recommended_slug?: string;
  suggested_h1?: string; cta_angle?: string; sections?: SeoBriefSection[];
  competitor_context?: string[]; audit_context?: string[]; evidence?: SeoBriefEvidence[];
  priority?: "high" | "medium" | "low"; source_mapping_id?: string;
  client_id?: string;
}
export interface SeoBriefDraft {
  id: string; brief_id: string; title: string; slug: string; content: string;
  meta_description: string; version: number; status: "draft" | "under_review" | "changes_requested" | "approved" | "rejected" | "ready_for_publishing";
  review_checks?: DraftReviewCheck[]; internal_link_suggestions?: SeoBriefLink[];
  created_at: string; updated_at: string;
}
export interface DraftReviewCheck {
  id: string; check_type: string; label: string; status: "pass" | "fail" | "warning" | "pending";
  detail: string;
}

export interface SeoArticle {
  id: string; brief_id: string | null; title: string; meta_description: string; content: string;
  status: "draft" | "review" | "approved" | "published"; target_keyword: string; slug: string | null;
  publish_date: string | null; cms_post_id: string | null; cms_post_url: string | null;
  created_at: string; updated_at: string;
}

export interface RankSnapshot {
  id: string; client_id: string; keyword_id: string; keyword: string;
  position: number | null; previous_position: number | null;
  url: string | null; snapshot_date: string; provider: string;
}

// ======================== HELPER ========================
async function sbQuery<T>(query: any): Promise<T> {
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data as T;
}

// ======================== CLIENTS ========================
export const getClients = async (): Promise<Client[]> => {
  const { data, error } = await supabase.from("clients").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []).map((c: any) => ({
    ...c, keywords_count: 0, competitors_count: 0,
  }));
};
export const getClient = (id: string) => sbQuery<Client>(supabase.from("clients").select("*").eq("id", id).single());
export const createClient = async (data: { name: string; domain: string }): Promise<Client> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return sbQuery<Client>(supabase.from("clients").insert({ ...data, user_id: user.id }).select().single());
};
export const updateClient = (id: string, data: Partial<Client>) =>
  sbQuery<Client>(supabase.from("clients").update(data as any).eq("id", id).select().single());
export const deleteClient = async (id: string) => {
  const { error } = await supabase.from("clients").delete().eq("id", id);
  if (error) throw new Error(error.message);
  return { deleted: true };
};

// ======================== KEYWORDS ========================
export const getKeywords = async (clientId: string): Promise<KeywordRanking[]> => {
  const { data, error } = await supabase.from("keywords").select("*").eq("client_id", clientId);
  if (error) throw new Error(error.message);
  return (data || []).map((k: any) => ({
    id: k.id, keyword: k.keyword, current_position: null, last_position: null,
    change: null, ranking_url: null, tracked_date: k.created_at,
  }));
};
export const createKeyword = async (clientId: string, data: { keyword: string }) =>
  sbQuery<any>(supabase.from("keywords").insert({ client_id: clientId, keyword: data.keyword }).select().single());

// ======================== COMPETITORS ========================
export const getCompetitors = (clientId: string) =>
  sbQuery<Competitor[]>(supabase.from("competitors").select("*").eq("client_id", clientId));
export const createCompetitor = (clientId: string, data: { domain: string; label?: string }) =>
  sbQuery<Competitor>(supabase.from("competitors").insert({ client_id: clientId, ...data }).select().single());

// ======================== AUDIT ========================
export const getAuditRuns = (clientId: string) =>
  sbQuery<AuditRun[]>(supabase.from("audit_runs").select("*").eq("client_id", clientId).order("created_at", { ascending: false }));
export const getAuditRunDetail = async (runId: string): Promise<AuditRun> => {
  const run = await sbQuery<AuditRun>(supabase.from("audit_runs").select("*").eq("id", runId).single());
  const issues = await sbQuery<AuditIssue[]>(supabase.from("audit_issues").select("*").eq("audit_run_id", runId));
  const pages = await sbQuery<AuditPage[]>(supabase.from("audit_pages").select("*").eq("audit_run_id", runId));
  return { ...run, issues, pages };
};
export const startAudit = async (data: { client_id: string; domain: string; scope?: string; provider?: string }) =>
  sbQuery<AuditRun>(supabase.from("audit_runs").insert({
    client_id: data.client_id, domain: data.domain, scope: data.scope || "full",
    provider: data.provider || "internal", status: "pending",
  }).select().single());
export const getAuditIssues = (clientId: string) =>
  sbQuery<AuditIssue[]>(supabase.from("audit_issues").select("*").eq("client_id", clientId));
export const getAuditIssueDetail = async (issueId: string): Promise<AuditIssue> => {
  const issue = await sbQuery<AuditIssue>(supabase.from("audit_issues").select("*").eq("id", issueId).single());
  const evidence = await sbQuery<AuditEvidence[]>(supabase.from("audit_evidence").select("*").eq("audit_issue_id", issueId));
  const rechecks = await sbQuery<AuditRecheck[]>(supabase.from("audit_rechecks").select("*").eq("audit_issue_id", issueId));
  return { ...issue, evidence, rechecks };
};
export const updateAuditIssueStatus = (issueId: string, status: string) =>
  sbQuery<AuditIssue>(supabase.from("audit_issues").update({ status } as any).eq("id", issueId).select().single());
export const recheckAuditIssue = async (issueId: string): Promise<AuditRecheck> => {
  // Placeholder — actual recheck requires external API
  return sbQuery<AuditRecheck>(supabase.from("audit_rechecks").insert({
    audit_issue_id: issueId, provider: "manual", previous_status: "open",
    new_status: "open", diff_summary: "Manual recheck — pending external verification",
  }).select().single());
};
export const recheckAuditRun = async (runId: string) => {
  return { rechecked: 0, rechecks: [] };
};

// ======================== OPPORTUNITIES ========================
export const getOpportunities = (clientId: string) =>
  sbQuery<Opportunity[]>(supabase.from("opportunities").select("*").eq("client_id", clientId).order("created_at", { ascending: false }));
export const updateOpportunityStatus = (clientId: string, oppId: string, status: string) =>
  sbQuery<Opportunity>(supabase.from("opportunities").update({ status } as any).eq("id", oppId).select().single());

// ======================== SEO BRIEFS ========================
export const getBriefs = (clientId: string) =>
  sbQuery<SeoBrief[]>(supabase.from("seo_briefs").select("*").eq("client_id", clientId).order("created_at", { ascending: false }));
export const getBriefDetail = (briefId: string) =>
  sbQuery<SeoBrief>(supabase.from("seo_briefs").select("*").eq("id", briefId).single());
export const generateBrief = async (clientId: string, keyword: string): Promise<SeoBrief> => {
  const { data, error } = await supabase.functions.invoke("generate-brief", {
    body: { client_id: clientId, keyword },
  });
  if (error) throw new Error(error.message || "Brief generation failed");
  return data;
};
export const createBriefFromMapping = async (data: any): Promise<SeoBrief> => {
  const { data: result, error } = await supabase.functions.invoke("generate-brief", {
    body: data,
  });
  if (error) throw new Error(error.message || "Brief generation failed");
  return result;
};
export const updateBrief = (briefId: string, data: Partial<SeoBrief>) =>
  sbQuery<SeoBrief>(supabase.from("seo_briefs").update(data as any).eq("id", briefId).select().single());
export const updateBriefStatus = (clientId: string, briefId: string, status: string) =>
  sbQuery<SeoBrief>(supabase.from("seo_briefs").update({ status } as any).eq("id", briefId).select().single());
export const generateDraftFromBrief = async (briefId: string): Promise<SeoBriefDraft> => {
  // Get brief to get client_id
  const brief = await getBriefDetail(briefId);
  const { data, error } = await supabase.functions.invoke("generate-article", {
    body: { client_id: (brief as any).client_id, brief_id: briefId },
  });
  if (error) throw new Error(error.message || "Draft generation failed");
  return data;
};
export const getBriefDrafts = (briefId: string) =>
  sbQuery<SeoBriefDraft[]>(supabase.from("seo_brief_drafts").select("*").eq("brief_id", briefId).order("version", { ascending: false }));
export const updateDraft = (draftId: string, data: Partial<SeoBriefDraft>) =>
  sbQuery<SeoBriefDraft>(supabase.from("seo_brief_drafts").update(data as any).eq("id", draftId).select().single());
export const updateDraftStatus = (draftId: string, status: string) =>
  sbQuery<SeoBriefDraft>(supabase.from("seo_brief_drafts").update({ status } as any).eq("id", draftId).select().single());

// ======================== SEO ARTICLES ========================
export const getArticles = (clientId: string) =>
  sbQuery<SeoArticle[]>(supabase.from("seo_articles").select("*").eq("client_id", clientId).order("created_at", { ascending: false }));
export const generateArticle = async (clientId: string, briefId: string): Promise<SeoArticle> => {
  const { data, error } = await supabase.functions.invoke("generate-article", {
    body: { client_id: clientId, brief_id: briefId },
  });
  if (error) throw new Error(error.message || "Article generation failed");
  return data;
};
export const updateArticle = (articleId: string, data: { title?: string; meta_description?: string; content?: string; slug?: string }) =>
  sbQuery<SeoArticle>(supabase.from("seo_articles").update(data).eq("id", articleId).select().single());
export const approveArticle = (articleId: string) =>
  sbQuery<SeoArticle>(supabase.from("seo_articles").update({ status: "approved" }).eq("id", articleId).select().single());
export const updateArticleStatus = (articleId: string, status: string) =>
  sbQuery<SeoArticle>(supabase.from("seo_articles").update({ status } as any).eq("id", articleId).select().single());
export interface PublishResult { article: SeoArticle; wordpress: { id: number; url: string; status: string }; }
export const publishArticle = async (articleId: string, scheduleDate?: string): Promise<PublishResult> => {
  const article = await sbQuery<SeoArticle>(
    supabase.from("seo_articles").update({ status: "published", publish_date: scheduleDate || new Date().toISOString() })
      .eq("id", articleId).select().single()
  );
  return { article, wordpress: { id: 0, url: "", status: "pending" } };
};

// ======================== RANK SNAPSHOTS ========================
export const getRankSnapshots = (clientId: string, keywordId?: string) => {
  let query = supabase.from("rank_snapshots").select("*").eq("client_id", clientId).order("snapshot_date", { ascending: false });
  if (keywordId) query = query.eq("keyword_id", keywordId);
  return sbQuery<RankSnapshot[]>(query);
};

// ======================== WORKSPACE STATE ========================
export const getWorkspaceState = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("workspace_state").select("*").eq("user_id", user.id).single();
  return data;
};
export const upsertWorkspaceState = async (state: any) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("workspace_state").upsert({ user_id: user.id, ...state }, { onConflict: "user_id" });
};

// ======================== ACTIVITY LOG ========================
export interface ActivityLogEntry { id: string; user_id: string | null; client_id: string | null; actor_name: string; action: string; entity_type: string; entity_id: string | null; summary: string | null; metadata_json: any; created_at: string; }
export const getActivityLog = async (params?: { client_id?: string; entity_type?: string; limit?: number }) => {
  let query = supabase.from("activity_log").select("*").order("created_at", { ascending: false });
  if (params?.client_id) query = query.eq("client_id", params.client_id);
  if (params?.entity_type) query = query.eq("entity_type", params.entity_type);
  if (params?.limit) query = query.limit(params.limit);
  return sbQuery<ActivityLogEntry[]>(query);
};

// ======================== STUBS for modules not yet migrated ========================
// These return empty arrays to prevent UI crashes. Will be implemented in Phase 2.

export interface InternalLinkSuggestion { id: string; from_url: string; to_url: string; anchor_text: string; reason: string; priority: "high" | "medium" | "low"; status: "pending" | "implemented" | "dismissed"; created_at: string; }
export const getInternalLinks = async (clientId: string): Promise<InternalLinkSuggestion[]> => [];
export const updateInternalLinkStatus = async (clientId: string, linkId: string, status: string): Promise<InternalLinkSuggestion> => ({} as any);

export interface ContentSuggestion { id: string; cluster_name: string; keyword: string; suggested_slug: string | null; reason: string; priority: "high" | "medium" | "low"; status: "pending" | "planned" | "published" | "dismissed"; created_at: string; }
export interface ContentPlanCluster { cluster_name: string; suggestions: ContentSuggestion[]; high_priority_count: number; }
export interface ContentPlanResponse { total: number; clusters: ContentPlanCluster[]; flat: ContentSuggestion[]; }
export const getContentPlan = async (clientId: string): Promise<ContentPlanResponse> => ({ total: 0, clusters: [], flat: [] });
export const updateContentSuggestionStatus = async (clientId: string, sid: string, status: string): Promise<ContentSuggestion> => ({} as any);

export interface CmsConnection { id: string; cms_type: "wordpress"; site_url: string; username: string; created_at: string; }
export const getCmsConnection = async (clientId: string): Promise<CmsConnection | null> => null;
export const saveCmsConnection = async (clientId: string, data: any): Promise<CmsConnection> => ({} as any);
export const deleteCmsConnection = async (clientId: string) => ({ deleted: true });
export const testCmsConnection = async (clientId: string) => ({ success: false, message: "Not configured" });

export interface SocialPost { id: string; client_id: string; article_id: string; platform: "facebook" | "instagram" | "linkedin" | "twitter" | "tiktok"; content: string; status: "draft" | "approved" | "scheduled" | "published"; scheduled_time: string | null; created_at: string; }
export const getSocialPosts = async (articleId: string): Promise<SocialPost[]> => [];
export const generateSocialPosts = async (clientId: string, articleId: string): Promise<SocialPost[]> => [];
export const updateSocialPost = async (postId: string, data: any): Promise<SocialPost> => ({} as any);
export const approveSocialPost = async (postId: string): Promise<SocialPost> => ({} as any);

export interface VideoSceneBreakdown { scene_number: number; duration: string; visual: string; voiceover: string; }
export interface VideoAsset { id: string; client_id: string; article_id: string | null; social_post_id: string | null; platform: string; video_script: string; scene_breakdown: VideoSceneBreakdown[]; caption_text: string; avatar_type: string; voice_type: string; video_url: string | null; thumbnail_url: string | null; status: string; created_at: string; }
export const getVideos = async (clientId: string): Promise<VideoAsset[]> => [];
export const generateVideo = async (data: any): Promise<VideoAsset> => ({} as any);
export const updateVideo = async (videoId: string, data: any): Promise<VideoAsset> => ({} as any);
export const approveVideo = async (videoId: string): Promise<VideoAsset> => ({} as any);

export interface PublishingJob { id: string; client_id: string; asset_type: string; asset_id: string; platform: string; scheduled_time: string | null; job_type: string; publish_status: string; provider: string | null; external_post_id: string | null; published_url: string | null; error_message: string | null; retry_count: number; created_at: string; updated_at: string; }
export const getPublishingJobs = async (clientId: string): Promise<PublishingJob[]> => [];
export const schedulePublishingJob = async (data: any): Promise<PublishingJob> => ({} as any);
export const retryPublishingJob = async (jobId: string): Promise<PublishingJob> => ({} as any);
export const cancelPublishingJob = async (jobId: string): Promise<PublishingJob> => ({} as any);
export const reschedulePublishingJob = async (jobId: string, time: string): Promise<PublishingJob> => ({} as any);

export const aiGenerateArticle = generateArticle;
export const aiGenerateSocial = generateSocialPosts;
export const aiGenerateVideo = generateVideo;

export interface AnalyticsConnection { id: string; client_id: string; provider: string; property_id: string | null; site_url: string | null; status: string; created_at: string; updated_at: string; }
export interface PerformanceInsight { id: string; client_id: string; asset_type: string | null; asset_id: string | null; insight_type: string; priority: string; title: string; description: string; recommended_action: string | null; status: string; created_at: string; }
export interface PerformanceSummaryResponse { summary: { total_clicks: number; total_impressions: number; avg_ctr: number; avg_position: number; total_sessions: number; }; topPages: any[]; topKeywords: any[]; insightCounts: any[]; }
export const getAnalyticsConnections = async (clientId: string): Promise<AnalyticsConnection[]> => [];
export const connectAnalytics = async (data: any): Promise<AnalyticsConnection> => ({} as any);
export const disconnectAnalytics = async (connectionId: string) => ({ success: true });
export const syncAnalytics = async (clientId: string) => ({ success: true, insights_generated: 0 });
export const getPerformanceSummary = async (clientId: string, days?: number): Promise<PerformanceSummaryResponse> => ({
  summary: { total_clicks: 0, total_impressions: 0, avg_ctr: 0, avg_position: 0, total_sessions: 0 },
  topPages: [], topKeywords: [], insightCounts: [],
});
export const getPagePerformance = async (clientId: string, days?: number): Promise<any[]> => [];
export const getKeywordPerformance = async (clientId: string, days?: number): Promise<any[]> => [];
export const getAssetPerformance = async (clientId: string, days?: number, assetType?: string): Promise<any[]> => [];
export const getPerformanceInsights = async (clientId: string, status?: string): Promise<PerformanceInsight[]> => [];
export const updateInsightStatus = async (insightId: string, status: string): Promise<PerformanceInsight> => ({} as any);

// GBP stubs
export interface GbpConnection { id: string; client_id: string; location_id: string | null; account_id: string | null; business_name: string | null; primary_category: string | null; site_url: string | null; status: string; created_at: string; updated_at: string; }
export interface GbpProfile { business_name: string; primary_category: string; reviews_count: number; average_rating: number; photos_count: number; posts_count: number; qna_count: number; completeness: { score: number; missingItems: string[]; priorityActions: string[] }; [key: string]: any; }
export interface GbpPostDraft { id: string; client_id: string; article_id: string | null; title: string; content: string; cta_type: string | null; cta_url: string | null; image_prompt: string | null; status: string; scheduled_time: string | null; created_at: string; }
export interface GbpReviewItem { id: string; client_id: string; review_id: string; reviewer_name: string; rating: number; review_text: string; review_date: string; response_draft: string | null; response_status: string; created_at: string; }
export interface GbpQnaItem { id: string; client_id: string; question_id: string; question_text: string; answer_draft: string | null; status: string; created_at: string; }
export interface LocalSeoInsight { id: string; client_id: string; insight_type: string; priority: string; title: string; description: string; recommended_action: string | null; status: string; created_at: string; }
export const getGbpConnection = async (clientId: string): Promise<GbpConnection | null> => null;
export const getGbpProfile = async (clientId: string): Promise<GbpProfile | null> => null;
export const getGbpPosts = async (clientId: string): Promise<GbpPostDraft[]> => [];
export const getGbpReviews = async (clientId: string): Promise<GbpReviewItem[]> => [];
export const getGbpQna = async (clientId: string): Promise<GbpQnaItem[]> => [];
export const getLocalSeoInsights = async (clientId: string, status?: string): Promise<LocalSeoInsight[]> => [];
export const syncGbp = async (clientId: string) => ({});
export const generateGbpPost = async (clientId: string, articleId: string): Promise<GbpPostDraft> => ({} as any);
export const approveGbpPost = async (postId: string): Promise<GbpPostDraft> => ({} as any);
export const generateReviewResponse = async (reviewId: string): Promise<GbpReviewItem> => ({} as any);
export const approveReviewResponse = async (reviewId: string): Promise<GbpReviewItem> => ({} as any);
export const generateQnaAnswer = async (qnaId: string): Promise<GbpQnaItem> => ({} as any);
export const approveQnaAnswer = async (qnaId: string): Promise<GbpQnaItem> => ({} as any);
export const updateLocalInsightStatus = async (insightId: string, status: string): Promise<LocalSeoInsight> => ({} as any);

// Creative stubs
export interface CreativeAsset { id: string; client_id: string; asset_type: string; source_type: string; source_id: string; platform: string | null; title: string | null; prompt: string | null; aspect_ratio: string; style_preset: string; provider: string | null; file_url: string | null; thumbnail_url: string | null; status: string; metadata_json: any; created_at: string; updated_at: string; variants?: any[]; }
export interface BrandProfile { id: string; client_id: string; brand_name: string | null; primary_color: string | null; secondary_color: string | null; font_style: string | null; tone: string | null; logo_url: string | null; image_style_notes: string | null; }
export const getCreativeAssets = async (clientId: string, sourceType?: string): Promise<CreativeAsset[]> => [];
export const getCreativeAsset = async (id: string): Promise<CreativeAsset> => ({} as any);
export const generateCreativeAsset = async (data: any): Promise<CreativeAsset> => ({} as any);
export const approveCreativeAsset = async (id: string): Promise<CreativeAsset> => ({} as any);
export const regenerateCreativeAsset = async (id: string, prompt?: string): Promise<CreativeAsset> => ({} as any);
export const deleteCreativeAsset = async (id: string) => ({ deleted: true });
export const getBrandProfile = async (clientId: string): Promise<BrandProfile | null> => null;
export const saveBrandProfile = async (data: any): Promise<BrandProfile> => ({} as any);

// Ads stubs
export interface AdsCampaign { id: string; client_id: string; name: string; campaign_type: string; status: string; budget_daily: number | null; location_targets: string[]; created_at: string; }
export interface AdsRecommendation { id: string; recommendation_type: string; campaign_name: string | null; ad_group_name: string | null; keyword_text: string | null; landing_page_url: string | null; recommended_budget: number | null; recommended_action: string; priority: string; status: string; }
export interface AdsCopyDraft { id: string; target_keyword: string; headline_1: string; headline_2: string; headline_3: string; description_1: string; description_2: string; final_url: string; path_1: string; path_2: string; status: string; }
export interface AdsInsight { id: string; insight_type: string; priority: string; title: string; description: string; recommended_action: string | null; status: string; }
export interface AdsPerformanceResponse { summary: { total_impressions: number; total_clicks: number; avg_ctr: number; avg_cpc: number; total_cost: number; total_conversions: number; cost_per_conversion: number }; campaigns: any[]; }
export const getAdsCampaigns = async (clientId: string): Promise<AdsCampaign[]> => [];
export const getAdsRecommendations = async (clientId: string): Promise<AdsRecommendation[]> => [];
export const getAdsCopy = async (clientId: string): Promise<AdsCopyDraft[]> => [];
export const getAdsInsights = async (clientId: string): Promise<AdsInsight[]> => [];
export const getAdsPerformance = async (clientId: string, days?: number): Promise<AdsPerformanceResponse> => ({ summary: { total_impressions: 0, total_clicks: 0, avg_ctr: 0, avg_cpc: 0, total_cost: 0, total_conversions: 0, cost_per_conversion: 0 }, campaigns: [] });
export const generateAdsRecommendations = async (clientId: string) => ({ count: 0 });
export const generateAdCopy = async (data: any): Promise<AdsCopyDraft> => ({} as any);
export const approveAdCopy = async (id: string): Promise<AdsCopyDraft> => ({} as any);
export const updateAdsRecommendation = async (id: string, status: string): Promise<AdsRecommendation> => ({} as any);
export const syncAds = async (clientId: string) => ({});

// Command center stubs
export interface CommandCenterSummary { totalPriorities: number; highPriorityCount: number; quickWinsCount: number; repurposeCount: number; decliningAssetsCount: number; nearPage1Count: number; gbpIssuesCount: number; adsOpportunitiesCount: number; weeklyTasksDue: number; weeklyTasksCompleted: number; topGrowthChannels: { channel: string; score: number }[]; topUnderperformingChannels: { channel: string; score: number }[]; }
export interface MarketingPriority { id: string; client_id: string; priority_type: string; source_module: string; source_id: string | null; title: string; description: string | null; recommended_action: string | null; priority_score: number; impact_score: number; effort_score: number; confidence_score: number; status: string; due_date: string | null; created_at: string; }
export interface CrossChannelRecommendation { id: string; client_id: string; recommendation_type: string; source_asset_type: string | null; source_asset_id: string | null; target_channel: string | null; title: string; description: string | null; recommended_action: string | null; priority: string; status: string; metadata_json: any; created_at: string; }
export interface WeeklyActionPlan { id: string; client_id: string; week_start: string; summary: string | null; top_goal: string | null; status: string; created_at: string; }
export interface MarketingGoal { id: string; client_id: string; goal_type: string; goal_name: string; target_value: number | null; timeframe: string | null; status: string; created_at: string; }
export const getCommandCenterSummary = async (clientId: string): Promise<CommandCenterSummary> => ({ totalPriorities: 0, highPriorityCount: 0, quickWinsCount: 0, repurposeCount: 0, decliningAssetsCount: 0, nearPage1Count: 0, gbpIssuesCount: 0, adsOpportunitiesCount: 0, weeklyTasksDue: 0, weeklyTasksCompleted: 0, topGrowthChannels: [], topUnderperformingChannels: [] });
export const getMarketingPriorities = async (clientId: string, status?: string): Promise<MarketingPriority[]> => [];
export const updateMarketingPriority = async (priorityId: string, status: string): Promise<MarketingPriority> => ({} as any);
export const recomputePriorities = async (clientId: string) => ({ success: true, priorities_generated: 0 });
export const getCrossChannelRecommendations = async (clientId: string, status?: string): Promise<CrossChannelRecommendation[]> => [];
export const updateCrossChannelRecommendation = async (recId: string, status: string): Promise<CrossChannelRecommendation> => ({} as any);
export const generateCrossChannelRecommendations = async (clientId: string) => ({ success: true, recommendations_generated: 0 });
export const getWeeklyActionPlans = async (clientId: string): Promise<WeeklyActionPlan[]> => [];
export const generateWeeklyPlan = async (clientId: string): Promise<WeeklyActionPlan> => ({} as any);
export const updateWeeklyItem = async (itemId: string, status: string) => ({});
export const getMarketingGoals = async (clientId: string): Promise<MarketingGoal[]> => [];
export const getQuickWins = async (clientId: string): Promise<MarketingPriority[]> => [];

// Attribution stubs
export interface AttributionOverview { byChannel: any[]; dealAttribution: any[]; }
export interface AttributionContact { id: string; channel: string; attribution_model: string; credit: number; campaign_name: string | null; full_name: string; email: string | null; contact_status: string; }
export interface AttributionDeal { channel: string; attribution_model: string; credit: number; campaign_name: string | null; deal_name: string; deal_value: number; deal_stage: string; won_date: string | null; contact_name: string; }
export const getAttributionOverview = async (clientId: string): Promise<AttributionOverview> => ({ byChannel: [], dealAttribution: [] });
export const getAttributionContacts = async (clientId: string): Promise<AttributionContact[]> => [];
export const getAttributionDeals = async (clientId: string): Promise<AttributionDeal[]> => [];
export const recomputeAttribution = async (clientId: string) => ({});

// Onboarding stubs
export const startOnboarding = async (workspaceId: string) => ({});
export const getOnboarding = async (workspaceId: string) => ({});
export const updateOnboarding = async (workspaceId: string, data: any) => ({});
export const completeOnboarding = async (workspaceId: string) => ({});
export const getTemplates = async (industry?: string): Promise<any[]> => [];
export const getTemplate = async (id: string) => ({});
export const runSetup = async (data: any) => ({});
export const getSetupStatus = async (workspaceId: string) => ({});
export const getActivationChecklist = async (clientId: string): Promise<any[]> => [];
export const updateChecklistItem = async (itemId: string, status: string) => ({});

// Reports stubs
export const getReportTemplates = async (workspaceId?: string): Promise<any[]> => [];
export const getReportRuns = async (clientId: string): Promise<any[]> => [];
export const generateReportApi = async (data: any) => ({});
export const getReportByToken = async (token: string) => ({});
export const getScheduledReports = async (workspaceId: string): Promise<any[]> => [];
export const createScheduledReport = async (data: any) => ({});
export const updateScheduledReport = async (id: string, data: any) => ({});
export const deleteScheduledReport = async (id: string) => ({ deleted: true });

// Notifications stubs
export interface AppNotification { id: string; workspace_id: string | null; user_id: string | null; type: string; category: string; title: string; message: string | null; entity_type: string | null; entity_id: string | null; is_read: boolean; created_at: string; }
export const getNotifications = async (params?: any): Promise<AppNotification[]> => [];
export const markNotificationRead = async (id: string): Promise<AppNotification> => ({} as any);
export const markAllNotificationsRead = async () => ({ success: true });
export const getUnreadCount = async () => ({ count: 0 });
export const getAllPublishingJobs = async (params?: any): Promise<any[]> => [];

// AI Visibility stubs
export interface AiVisPromptSet { id: string; client_id: string; name: string; description: string | null; topic_cluster: string | null; intent_type: string; status: string; prompt_count: number; run_count: number; created_at: string; }
export interface AiVisPrompt { id: string; prompt_set_id: string; prompt_text: string; target_entities: string[]; competitor_entities: string[]; created_at: string; }
export interface AiVisRun { id: string; client_id: string; prompt_set_id: string | null; prompt_set_name: string | null; provider: string; status: string; total_prompts: number; prompts_with_mention: number; prompts_with_citation: number; started_at: string | null; completed_at: string | null; created_at: string; }
export interface AiVisObservation { id: string; run_id: string; prompt_id: string; prompt_text: string; provider: string; brand_mentioned: boolean; brand_position: number | null; competitor_mentioned: boolean; competitor_names: string[]; citation_present: boolean; citation_url: string | null; sentiment: string | null; prominence: string; raw_snippet: string | null; }
export interface AiVisOverview { summary: { total_runs: number; total_prompts_checked: number; total_mentions: number; total_citations: number; visibility_rate: number; citation_rate: number }; trend: AiVisRun[]; byPromptSet: any[]; competitorMentions: { competitor: string; mention_count: number }[]; }
export const getAiVisPromptSets = async (clientId: string): Promise<AiVisPromptSet[]> => [];
export const createAiVisPromptSet = async (data: any): Promise<AiVisPromptSet> => ({} as any);
export const updateAiVisPromptSet = async (id: string, data: any): Promise<AiVisPromptSet> => ({} as any);
export const deleteAiVisPromptSet = async (id: string) => ({ deleted: true });
export const getAiVisPrompts = async (setId: string): Promise<AiVisPrompt[]> => [];
export const createAiVisPrompt = async (data: any): Promise<AiVisPrompt> => ({} as any);
export const createAiVisPromptsBulk = async (data: any): Promise<AiVisPrompt[]> => [];
export const deleteAiVisPrompt = async (id: string) => ({ deleted: true });
export const getAiVisRuns = async (clientId: string): Promise<AiVisRun[]> => [];
export const startAiVisRun = async (data: any): Promise<AiVisRun> => ({} as any);
export const getAiVisObservations = async (runId: string): Promise<AiVisObservation[]> => [];
export const updateAiVisObservation = async (id: string, data: any): Promise<AiVisObservation> => ({} as any);
export const getAiVisOverview = async (clientId: string): Promise<AiVisOverview> => ({ summary: { total_runs: 0, total_prompts_checked: 0, total_mentions: 0, total_citations: 0, visibility_rate: 0, citation_rate: 0 }, trend: [], byPromptSet: [], competitorMentions: [] });
export const getAiVisCompetitors = async (clientId: string): Promise<any[]> => [];
export const createAiVisCompetitor = async (data: any) => ({});

// Planning memory stubs
export interface ContentInventoryItem { id: string; client_id: string; url: string; page_type: string; title: string | null; word_count: number | null; has_schema: boolean; schema_types: string[]; primary_keyword: string | null; mapped_keyword_ids: string[]; brief_id: string | null; article_id: string | null; publish_status: string; last_audit_run_id: string | null; last_audit_score: number | null; internal_links_in: number; internal_links_out: number; created_at: string; updated_at: string; last_crawled_at: string | null; }
export const getContentInventory = async (clientId: string): Promise<ContentInventoryItem[]> => [];
export interface ContentPerformanceSummary { id: string; client_id: string; content_url: string; article_id: string | null; brief_id: string | null; keyword: string | null; clicks_7d: number; clicks_30d: number; impressions_7d: number; impressions_30d: number; avg_position_7d: number | null; avg_position_30d: number | null; position_change_30d: number | null; ctr_7d: number | null; trend: "improving" | "stable" | "declining" | "new"; published_at: string | null; first_indexed_at: string | null; snapshot_date: string; }
export const getContentPerformance = async (clientId: string): Promise<ContentPerformanceSummary[]> => [];
export interface OpportunityEvidence { id: string; opportunity_id: string; evidence_type: string; source_module: string; source_id: string | null; summary: string; detail: string | null; captured_at: string; }
export interface OpportunityLifecycleEvent { id: string; opportunity_id: string; event_type: string; entity_type: string | null; entity_id: string | null; summary: string; actor: string | null; created_at: string; }
export interface OpportunityWithMemory extends Opportunity { confidence: number; sources: string[]; evidence_text: string; expected_impact: string; next_action: string; brief_id: string | null; draft_id: string | null; article_id: string | null; publishing_job_id: string | null; performance_summary_id: string | null; lifecycle: OpportunityLifecycleEvent[]; evidence_records: OpportunityEvidence[]; }
export const getOpportunityDetail = async (clientId: string, oppId: string): Promise<OpportunityWithMemory> => {
  const opp = await sbQuery<any>(supabase.from("opportunities").select("*").eq("id", oppId).single());
  return { ...opp, confidence: opp.confidence || 0.5, sources: opp.sources || [], evidence_text: opp.evidence_text || "", expected_impact: opp.expected_impact || "", next_action: opp.next_action || "", publishing_job_id: null, performance_summary_id: null, lifecycle: [], evidence_records: [] };
};
export interface PageRelationship { id: string; client_id: string; from_url: string; to_url: string; relationship_type: string; strength: number; brief_ids: string[]; keyword_ids: string[]; created_at: string; }
export const getPageRelationships = async (clientId: string): Promise<PageRelationship[]> => [];
export interface PublishedContentRecord { id: string; client_id: string; article_id: string | null; brief_id: string | null; opportunity_id: string | null; url: string; title: string; published_at: string; publisher: string; platform: string; initial_position: number | null; current_position: number | null; position_change: number | null; clicks_since_publish: number; impressions_since_publish: number; days_since_publish: number; }
export const getPublishedContentRecords = async (clientId: string): Promise<PublishedContentRecord[]> => [];

// Competitor benchmarks stubs
export interface CompetitorBenchmarkRun { id: string; client_id: string; target_domain: string; competitor_domain: string; scope: string; provider: string; status: string; own_audit_run_id: string | null; pages_crawled: number; indexable_pages: number; avg_crawl_depth: number | null; broken_links: number; redirect_issues: number; duplicate_titles: number; missing_titles: number; missing_meta: number; missing_h1: number; canonical_issues: number; avg_load_time_ms: number | null; lcp_avg_ms: number | null; cls_avg: number | null; fid_avg_ms: number | null; started_at: string | null; completed_at: string | null; created_at: string; pages?: any[]; recommendations?: any[]; }
export const getCompetitorBenchmarks = async (clientId: string): Promise<CompetitorBenchmarkRun[]> => [];
export const getCompetitorBenchmarkDetail = async (id: string): Promise<CompetitorBenchmarkRun> => ({} as any);
export const startCompetitorBenchmark = async (data: any): Promise<CompetitorBenchmarkRun> => ({} as any);
