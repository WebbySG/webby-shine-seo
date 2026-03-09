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

// ---------- Internal Links ----------
export interface InternalLinkSuggestion {
  id: string;
  from_url: string;
  to_url: string;
  anchor_text: string;
  reason: string;
  priority: "high" | "medium" | "low";
  status: "pending" | "implemented" | "dismissed";
  created_at: string;
}

export const getInternalLinks = (clientId: string) =>
  request<InternalLinkSuggestion[]>(`/clients/${clientId}/internal-links`);

export const updateInternalLinkStatus = (clientId: string, linkId: string, status: string) =>
  request<InternalLinkSuggestion>(`/clients/${clientId}/internal-links/${linkId}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });

// ---------- Content Plan ----------
export interface ContentSuggestion {
  id: string;
  cluster_name: string;
  keyword: string;
  suggested_slug: string | null;
  reason: string;
  priority: "high" | "medium" | "low";
  status: "pending" | "planned" | "published" | "dismissed";
  created_at: string;
}

export interface ContentPlanCluster {
  cluster_name: string;
  suggestions: ContentSuggestion[];
  high_priority_count: number;
}

export interface ContentPlanResponse {
  total: number;
  clusters: ContentPlanCluster[];
  flat: ContentSuggestion[];
}

export const getContentPlan = (clientId: string) =>
  request<ContentPlanResponse>(`/clients/${clientId}/content-plan`);

export const updateContentSuggestionStatus = (clientId: string, suggestionId: string, status: string) =>
  request<ContentSuggestion>(`/clients/${clientId}/content-plan/${suggestionId}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });

// ---------- SEO Briefs ----------
export interface SeoBriefHeading {
  level: string;
  text: string;
}

export interface SeoBriefFaq {
  question: string;
  answer: string;
}

export interface SeoBriefLink {
  from: string;
  to: string;
  anchor: string;
}

export interface SeoBrief {
  id: string;
  keyword: string;
  title: string;
  meta_description: string;
  headings: SeoBriefHeading[];
  faq: SeoBriefFaq[];
  entities: string[];
  internal_links: SeoBriefLink[];
  status: "draft" | "approved" | "published";
  created_at: string;
}

export const getBriefs = (clientId: string) =>
  request<SeoBrief[]>(`/clients/${clientId}/briefs`);

export const generateBrief = (clientId: string, keyword: string) =>
  request<SeoBrief>(`/briefs/generate`, {
    method: "POST",
    body: JSON.stringify({ client_id: clientId, keyword }),
  });

export const updateBriefStatus = (clientId: string, briefId: string, status: string) =>
  request<SeoBrief>(`/clients/${clientId}/briefs/${briefId}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });

// ---------- SEO Articles ----------
export interface SeoArticle {
  id: string;
  brief_id: string | null;
  title: string;
  meta_description: string;
  content: string;
  status: "draft" | "review" | "approved" | "published";
  target_keyword: string;
  slug: string | null;
  publish_date: string | null;
  cms_post_id: string | null;
  cms_post_url: string | null;
  created_at: string;
  updated_at: string;
}

export const getArticles = (clientId: string) =>
  request<SeoArticle[]>(`/clients/${clientId}/articles`);

export const generateArticle = (clientId: string, briefId: string) =>
  request<SeoArticle>(`/articles/generate`, {
    method: "POST",
    body: JSON.stringify({ client_id: clientId, brief_id: briefId }),
  });

export const updateArticle = (articleId: string, data: { title?: string; meta_description?: string; content?: string; slug?: string }) =>
  request<SeoArticle>(`/articles/${articleId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });

export const approveArticle = (articleId: string) =>
  request<SeoArticle>(`/articles/${articleId}/approve`, { method: "POST" });

export const updateArticleStatus = (articleId: string, status: string) =>
  request<SeoArticle>(`/articles/${articleId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });

export interface PublishResult {
  article: SeoArticle;
  wordpress: { id: number; url: string; status: string };
}

export const publishArticle = (articleId: string, scheduleDate?: string) =>
  request<PublishResult>(`/articles/${articleId}/publish`, {
    method: "POST",
    body: JSON.stringify({ schedule_date: scheduleDate }),
  });

// ---------- CMS Connections ----------
export interface CmsConnection {
  id: string;
  cms_type: "wordpress";
  site_url: string;
  username: string;
  created_at: string;
}

export const getCmsConnection = (clientId: string) =>
  request<CmsConnection | null>(`/clients/${clientId}/cms`);

export const saveCmsConnection = (clientId: string, data: { site_url: string; username: string; application_password: string }) =>
  request<CmsConnection>(`/clients/${clientId}/cms`, {
    method: "POST",
    body: JSON.stringify(data),
  });

export const deleteCmsConnection = (clientId: string) =>
  request<{ deleted: boolean }>(`/clients/${clientId}/cms`, { method: "DELETE" });

export const testCmsConnection = (clientId: string) =>
  request<{ success: boolean; message: string }>(`/clients/${clientId}/cms/test`, { method: "POST" });

// ---------- Social Posts ----------
export interface SocialPost {
  id: string;
  client_id: string;
  article_id: string;
  platform: "facebook" | "instagram" | "linkedin" | "twitter" | "tiktok";
  content: string;
  status: "draft" | "approved" | "scheduled" | "published";
  scheduled_time: string | null;
  created_at: string;
}

export const getSocialPosts = (articleId: string) =>
  request<SocialPost[]>(`/articles/${articleId}/social-posts`);

export const generateSocialPosts = (clientId: string, articleId: string) =>
  request<SocialPost[]>(`/social/generate`, {
    method: "POST",
    body: JSON.stringify({ client_id: clientId, article_id: articleId }),
  });

export const updateSocialPost = (postId: string, data: { content?: string; scheduled_time?: string }) =>
  request<SocialPost>(`/social/${postId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });

export const approveSocialPost = (postId: string) =>
  request<SocialPost>(`/social/${postId}/approve`, { method: "POST" });

// ---------- Video Assets ----------
export interface VideoSceneBreakdown {
  scene_number: number;
  duration: string;
  visual: string;
  voiceover: string;
}

export interface VideoAsset {
  id: string;
  client_id: string;
  article_id: string | null;
  social_post_id: string | null;
  platform: "tiktok" | "instagram_reels" | "facebook_reels" | "youtube_shorts";
  video_script: string;
  scene_breakdown: VideoSceneBreakdown[];
  caption_text: string;
  avatar_type: string;
  voice_type: string;
  video_url: string | null;
  thumbnail_url: string | null;
  status: "draft" | "rendering" | "review" | "approved" | "published";
  created_at: string;
}

export const getVideos = (clientId: string) =>
  request<VideoAsset[]>(`/clients/${clientId}/videos`);

export const generateVideo = (data: {
  client_id: string;
  article_id?: string;
  social_post_id?: string;
  platform: string;
  avatar_type?: string;
  voice_type?: string;
}) =>
  request<VideoAsset>(`/videos/generate`, {
    method: "POST",
    body: JSON.stringify(data),
  });

export const updateVideo = (videoId: string, data: { video_script?: string; caption_text?: string; avatar_type?: string; voice_type?: string }) =>
  request<VideoAsset>(`/videos/${videoId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });

export const approveVideo = (videoId: string) =>
  request<VideoAsset>(`/videos/${videoId}/approve`, { method: "POST" });

// ---------- Publishing Jobs ----------
export interface PublishingJob {
  id: string;
  client_id: string;
  asset_type: "article" | "social_post" | "video_asset";
  asset_id: string;
  platform: string;
  scheduled_time: string | null;
  job_type: "publish" | "render" | "schedule";
  publish_status: "queued" | "scheduled" | "processing" | "published" | "failed" | "cancelled";
  provider: string | null;
  external_post_id: string | null;
  published_url: string | null;
  error_message: string | null;
  retry_count: number;
  created_at: string;
  updated_at: string;
}

export const getPublishingJobs = (clientId: string) =>
  request<PublishingJob[]>(`/clients/${clientId}/publishing-jobs`);

export const schedulePublishingJob = (data: {
  client_id: string;
  asset_type: string;
  asset_id: string;
  platform: string;
  job_type: string;
  scheduled_time?: string;
}) =>
  request<PublishingJob>(`/publishing/schedule`, {
    method: "POST",
    body: JSON.stringify(data),
  });

export const retryPublishingJob = (jobId: string) =>
  request<PublishingJob>(`/publishing/${jobId}/retry`, { method: "POST" });

export const cancelPublishingJob = (jobId: string) =>
  request<PublishingJob>(`/publishing/${jobId}/cancel`, { method: "POST" });

export const reschedulePublishingJob = (jobId: string, scheduledTime: string) =>
  request<PublishingJob>(`/publishing/${jobId}/reschedule`, {
    method: "PUT",
    body: JSON.stringify({ scheduled_time: scheduledTime }),
  });

// ---------- AI Generation Endpoints ----------
export const aiGenerateArticle = (clientId: string, briefId: string) =>
  request<SeoArticle>(`/ai/articles/generate`, {
    method: "POST",
    body: JSON.stringify({ client_id: clientId, brief_id: briefId }),
  });

export const aiGenerateSocial = (clientId: string, articleId: string) =>
  request<SocialPost[]>(`/ai/social/generate`, {
    method: "POST",
    body: JSON.stringify({ client_id: clientId, article_id: articleId }),
  });

export const aiGenerateVideo = (data: {
  client_id: string;
  article_id?: string;
  social_post_id?: string;
  platform: string;
  avatar_type?: string;
  voice_type?: string;
}) =>
  request<VideoAsset>(`/ai/videos/generate`, {
    method: "POST",
    body: JSON.stringify(data),
  });
