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
  id: string; name: string; domain: string; keywords_count: number; competitors_count: number;
  health_score: number; status: string; created_at: string; updated_at: string;
}
export interface KeywordRanking {
  id: string; keyword: string; current_position: number | null; last_position: number | null;
  change: number | null; ranking_url: string | null; tracked_date: string | null;
}
export interface Competitor { id: string; domain: string; label: string | null; source: string; confirmed: boolean; }
export interface AuditIssue {
  id: string; issue_type: string; severity: "critical" | "warning" | "info"; affected_url: string;
  description: string; fix_instruction: string | null; status: "open" | "in_progress" | "done";
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
export const getKeywords = (clientId: string) => request<KeywordRanking[]>(`/clients/${clientId}/keywords`);
export const createKeyword = (clientId: string, data: { keyword: string }) =>
  request<any>(`/clients/${clientId}/keywords`, { method: "POST", body: JSON.stringify(data) });

// ---------- Competitors ----------
export const getCompetitors = (clientId: string) => request<Competitor[]>(`/clients/${clientId}/competitors`);
export const createCompetitor = (clientId: string, data: { domain: string; label?: string }) =>
  request<Competitor>(`/clients/${clientId}/competitors`, { method: "POST", body: JSON.stringify(data) });

// ---------- Audit ----------
export const getAuditIssues = (clientId: string) => request<AuditIssue[]>(`/audit/issues?client_id=${clientId}`);

// ---------- Opportunities ----------
export interface Opportunity {
  id: string; type: "near_win" | "content_gap" | "page_expansion" | "technical_fix";
  keyword: string | null; target_url: string | null; current_position: number | null;
  recommended_action: string; priority: "high" | "medium" | "low";
  status: "open" | "in_progress" | "done" | "dismissed"; created_at: string;
}
export const getOpportunities = (clientId: string) => request<Opportunity[]>(`/clients/${clientId}/opportunities`);
export const updateOpportunityStatus = (clientId: string, oppId: string, status: string) =>
  request<Opportunity>(`/clients/${clientId}/opportunities/${oppId}`, { method: "PATCH", body: JSON.stringify({ status }) });

// ---------- Internal Links ----------
export interface InternalLinkSuggestion {
  id: string; from_url: string; to_url: string; anchor_text: string; reason: string;
  priority: "high" | "medium" | "low"; status: "pending" | "implemented" | "dismissed"; created_at: string;
}
export const getInternalLinks = (clientId: string) => request<InternalLinkSuggestion[]>(`/clients/${clientId}/internal-links`);
export const updateInternalLinkStatus = (clientId: string, linkId: string, status: string) =>
  request<InternalLinkSuggestion>(`/clients/${clientId}/internal-links/${linkId}`, { method: "PATCH", body: JSON.stringify({ status }) });

// ---------- Content Plan ----------
export interface ContentSuggestion { id: string; cluster_name: string; keyword: string; suggested_slug: string | null; reason: string; priority: "high" | "medium" | "low"; status: "pending" | "planned" | "published" | "dismissed"; created_at: string; }
export interface ContentPlanCluster { cluster_name: string; suggestions: ContentSuggestion[]; high_priority_count: number; }
export interface ContentPlanResponse { total: number; clusters: ContentPlanCluster[]; flat: ContentSuggestion[]; }
export const getContentPlan = (clientId: string) => request<ContentPlanResponse>(`/clients/${clientId}/content-plan`);
export const updateContentSuggestionStatus = (clientId: string, suggestionId: string, status: string) =>
  request<ContentSuggestion>(`/clients/${clientId}/content-plan/${suggestionId}`, { method: "PATCH", body: JSON.stringify({ status }) });

// ---------- SEO Briefs ----------
export interface SeoBriefHeading { level: string; text: string; }
export interface SeoBriefFaq { question: string; answer: string; }
export interface SeoBriefLink { from: string; to: string; anchor: string; }
export interface SeoBrief {
  id: string; keyword: string; title: string; meta_description: string; headings: SeoBriefHeading[];
  faq: SeoBriefFaq[]; entities: string[]; internal_links: SeoBriefLink[];
  status: "draft" | "approved" | "published"; created_at: string;
}
export const getBriefs = (clientId: string) => request<SeoBrief[]>(`/clients/${clientId}/briefs`);
export const generateBrief = (clientId: string, keyword: string) =>
  request<SeoBrief>(`/briefs/generate`, { method: "POST", body: JSON.stringify({ client_id: clientId, keyword }) });
export const updateBriefStatus = (clientId: string, briefId: string, status: string) =>
  request<SeoBrief>(`/clients/${clientId}/briefs/${briefId}`, { method: "PATCH", body: JSON.stringify({ status }) });

// ---------- SEO Articles ----------
export interface SeoArticle {
  id: string; brief_id: string | null; title: string; meta_description: string; content: string;
  status: "draft" | "review" | "approved" | "published"; target_keyword: string; slug: string | null;
  publish_date: string | null; cms_post_id: string | null; cms_post_url: string | null;
  created_at: string; updated_at: string;
}
export const getArticles = (clientId: string) => request<SeoArticle[]>(`/clients/${clientId}/articles`);
export const generateArticle = (clientId: string, briefId: string) =>
  request<SeoArticle>(`/articles/generate`, { method: "POST", body: JSON.stringify({ client_id: clientId, brief_id: briefId }) });
export const updateArticle = (articleId: string, data: { title?: string; meta_description?: string; content?: string; slug?: string }) =>
  request<SeoArticle>(`/articles/${articleId}`, { method: "PUT", body: JSON.stringify(data) });
export const approveArticle = (articleId: string) => request<SeoArticle>(`/articles/${articleId}/approve`, { method: "POST" });
export const updateArticleStatus = (articleId: string, status: string) =>
  request<SeoArticle>(`/articles/${articleId}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
export interface PublishResult { article: SeoArticle; wordpress: { id: number; url: string; status: string }; }
export const publishArticle = (articleId: string, scheduleDate?: string) =>
  request<PublishResult>(`/articles/${articleId}/publish`, { method: "POST", body: JSON.stringify({ schedule_date: scheduleDate }) });

// ---------- CMS Connections ----------
export interface CmsConnection { id: string; cms_type: "wordpress"; site_url: string; username: string; created_at: string; }
export const getCmsConnection = (clientId: string) => request<CmsConnection | null>(`/clients/${clientId}/cms`);
export const saveCmsConnection = (clientId: string, data: { site_url: string; username: string; application_password: string }) =>
  request<CmsConnection>(`/clients/${clientId}/cms`, { method: "POST", body: JSON.stringify(data) });
export const deleteCmsConnection = (clientId: string) => request<{ deleted: boolean }>(`/clients/${clientId}/cms`, { method: "DELETE" });
export const testCmsConnection = (clientId: string) => request<{ success: boolean; message: string }>(`/clients/${clientId}/cms/test`, { method: "POST" });

// ---------- Social Posts ----------
export interface SocialPost {
  id: string; client_id: string; article_id: string; platform: "facebook" | "instagram" | "linkedin" | "twitter" | "tiktok";
  content: string; status: "draft" | "approved" | "scheduled" | "published"; scheduled_time: string | null; created_at: string;
}
export const getSocialPosts = (articleId: string) => request<SocialPost[]>(`/articles/${articleId}/social-posts`);
export const generateSocialPosts = (clientId: string, articleId: string) =>
  request<SocialPost[]>(`/social/generate`, { method: "POST", body: JSON.stringify({ client_id: clientId, article_id: articleId }) });
export const updateSocialPost = (postId: string, data: { content?: string; scheduled_time?: string }) =>
  request<SocialPost>(`/social/${postId}`, { method: "PUT", body: JSON.stringify(data) });
export const approveSocialPost = (postId: string) => request<SocialPost>(`/social/${postId}/approve`, { method: "POST" });

// ---------- Video Assets ----------
export interface VideoSceneBreakdown { scene_number: number; duration: string; visual: string; voiceover: string; }
export interface VideoAsset {
  id: string; client_id: string; article_id: string | null; social_post_id: string | null;
  platform: "tiktok" | "instagram_reels" | "facebook_reels" | "youtube_shorts";
  video_script: string; scene_breakdown: VideoSceneBreakdown[]; caption_text: string;
  avatar_type: string; voice_type: string; video_url: string | null; thumbnail_url: string | null;
  status: "draft" | "rendering" | "review" | "approved" | "published"; created_at: string;
}
export const getVideos = (clientId: string) => request<VideoAsset[]>(`/clients/${clientId}/videos`);
export const generateVideo = (data: { client_id: string; article_id?: string; social_post_id?: string; platform: string; avatar_type?: string; voice_type?: string; }) =>
  request<VideoAsset>(`/videos/generate`, { method: "POST", body: JSON.stringify(data) });
export const updateVideo = (videoId: string, data: { video_script?: string; caption_text?: string; avatar_type?: string; voice_type?: string }) =>
  request<VideoAsset>(`/videos/${videoId}`, { method: "PUT", body: JSON.stringify(data) });
export const approveVideo = (videoId: string) => request<VideoAsset>(`/videos/${videoId}/approve`, { method: "POST" });

// ---------- Publishing Jobs ----------
export interface PublishingJob {
  id: string; client_id: string; asset_type: "article" | "social_post" | "video_asset"; asset_id: string;
  platform: string; scheduled_time: string | null; job_type: "publish" | "render" | "schedule";
  publish_status: "queued" | "scheduled" | "processing" | "published" | "failed" | "cancelled";
  provider: string | null; external_post_id: string | null; published_url: string | null;
  error_message: string | null; retry_count: number; created_at: string; updated_at: string;
}
export const getPublishingJobs = (clientId: string) => request<PublishingJob[]>(`/clients/${clientId}/publishing-jobs`);
export const schedulePublishingJob = (data: { client_id: string; asset_type: string; asset_id: string; platform: string; job_type: string; scheduled_time?: string; }) =>
  request<PublishingJob>(`/publishing/schedule`, { method: "POST", body: JSON.stringify(data) });
export const retryPublishingJob = (jobId: string) => request<PublishingJob>(`/publishing/${jobId}/retry`, { method: "POST" });
export const cancelPublishingJob = (jobId: string) => request<PublishingJob>(`/publishing/${jobId}/cancel`, { method: "POST" });
export const reschedulePublishingJob = (jobId: string, scheduledTime: string) =>
  request<PublishingJob>(`/publishing/${jobId}/reschedule`, { method: "PUT", body: JSON.stringify({ scheduled_time: scheduledTime }) });

// ---------- AI Generation ----------
export const aiGenerateArticle = (clientId: string, briefId: string) =>
  request<SeoArticle>(`/ai/articles/generate`, { method: "POST", body: JSON.stringify({ client_id: clientId, brief_id: briefId }) });
export const aiGenerateSocial = (clientId: string, articleId: string) =>
  request<SocialPost[]>(`/ai/social/generate`, { method: "POST", body: JSON.stringify({ client_id: clientId, article_id: articleId }) });
export const aiGenerateVideo = (data: { client_id: string; article_id?: string; social_post_id?: string; platform: string; avatar_type?: string; voice_type?: string; }) =>
  request<VideoAsset>(`/ai/videos/generate`, { method: "POST", body: JSON.stringify(data) });

// ---------- Analytics ----------
export interface AnalyticsConnection { id: string; client_id: string; provider: "gsc" | "ga4"; property_id: string | null; site_url: string | null; status: "active" | "expired" | "disconnected"; created_at: string; updated_at: string; }
export interface PerformanceInsight { id: string; client_id: string; asset_type: string | null; asset_id: string | null; insight_type: string; priority: "high" | "medium" | "low"; title: string; description: string; recommended_action: string | null; status: "open" | "reviewed" | "done"; created_at: string; }
export interface PerformanceSummaryResponse { summary: { total_clicks: number; total_impressions: number; avg_ctr: number; avg_position: number; total_sessions: number; }; topPages: any[]; topKeywords: any[]; insightCounts: any[]; }
export const getAnalyticsConnections = (clientId: string) => request<AnalyticsConnection[]>(`/clients/${clientId}/analytics-connections`);
export const connectAnalytics = (data: { client_id: string; provider: string; property_id?: string; site_url?: string; access_token?: string; refresh_token?: string }) =>
  request<AnalyticsConnection>(`/analytics/connect`, { method: "POST", body: JSON.stringify(data) });
export const disconnectAnalytics = (connectionId: string) => request<{ success: boolean }>(`/analytics/${connectionId}/disconnect`, { method: "DELETE" });
export const syncAnalytics = (clientId: string) => request<{ success: boolean; insights_generated: number }>(`/analytics/sync`, { method: "POST", body: JSON.stringify({ client_id: clientId }) });
export const getPerformanceSummary = (clientId: string, days?: number) => request<PerformanceSummaryResponse>(`/clients/${clientId}/performance-summary?days=${days || 14}`);
export const getPagePerformance = (clientId: string, days?: number) => request<any[]>(`/clients/${clientId}/page-performance?days=${days || 14}`);
export const getKeywordPerformance = (clientId: string, days?: number) => request<any[]>(`/clients/${clientId}/keyword-performance?days=${days || 14}`);
export const getAssetPerformance = (clientId: string, days?: number, assetType?: string) => request<any[]>(`/clients/${clientId}/asset-performance?days=${days || 14}${assetType ? `&asset_type=${assetType}` : ""}`);
export const getPerformanceInsights = (clientId: string, status?: string) => request<PerformanceInsight[]>(`/clients/${clientId}/performance-insights?status=${status || "open"}`);
export const updateInsightStatus = (insightId: string, status: string) => request<PerformanceInsight>(`/analytics/insights/${insightId}`, { method: "PATCH", body: JSON.stringify({ status }) });

// ---------- GBP / Local SEO ----------
export interface GbpConnection { id: string; client_id: string; location_id: string | null; account_id: string | null; business_name: string | null; primary_category: string | null; site_url: string | null; status: string; created_at: string; updated_at: string; }
export interface GbpProfile { business_name: string; primary_category: string; reviews_count: number; average_rating: number; photos_count: number; posts_count: number; qna_count: number; completeness: { score: number; missingItems: string[]; priorityActions: string[] }; [key: string]: any; }
export interface GbpPostDraft { id: string; client_id: string; article_id: string | null; title: string; content: string; cta_type: string | null; cta_url: string | null; image_prompt: string | null; status: string; scheduled_time: string | null; created_at: string; }
export interface GbpReviewItem { id: string; client_id: string; review_id: string; reviewer_name: string; rating: number; review_text: string; review_date: string; response_draft: string | null; response_status: string; created_at: string; }
export interface GbpQnaItem { id: string; client_id: string; question_id: string; question_text: string; answer_draft: string | null; status: string; created_at: string; }
export interface LocalSeoInsight { id: string; client_id: string; insight_type: string; priority: string; title: string; description: string; recommended_action: string | null; status: string; created_at: string; }
export const getGbpConnection = (clientId: string) => request<GbpConnection | null>(`/clients/${clientId}/gbp-connection`);
export const getGbpProfile = (clientId: string) => request<GbpProfile | null>(`/clients/${clientId}/gbp-profile`);
export const getGbpPosts = (clientId: string) => request<GbpPostDraft[]>(`/clients/${clientId}/gbp-posts`);
export const getGbpReviews = (clientId: string) => request<GbpReviewItem[]>(`/clients/${clientId}/gbp-reviews`);
export const getGbpQna = (clientId: string) => request<GbpQnaItem[]>(`/clients/${clientId}/gbp-qna`);
export const getLocalSeoInsights = (clientId: string, status?: string) => request<LocalSeoInsight[]>(`/clients/${clientId}/local-seo-insights?status=${status || "open"}`);
export const syncGbp = (clientId: string) => request<any>(`/gbp/sync`, { method: "POST", body: JSON.stringify({ client_id: clientId }) });
export const generateGbpPost = (clientId: string, articleId: string) => request<GbpPostDraft>(`/gbp/posts/generate`, { method: "POST", body: JSON.stringify({ client_id: clientId, article_id: articleId }) });
export const approveGbpPost = (postId: string) => request<GbpPostDraft>(`/gbp/posts/${postId}/approve`, { method: "POST" });
export const generateReviewResponse = (reviewId: string) => request<GbpReviewItem>(`/gbp/reviews/${reviewId}/generate-response`, { method: "POST" });
export const approveReviewResponse = (reviewId: string) => request<GbpReviewItem>(`/gbp/reviews/${reviewId}/approve`, { method: "POST" });
export const generateQnaAnswer = (qnaId: string) => request<GbpQnaItem>(`/gbp/qna/${qnaId}/generate-answer`, { method: "POST" });
export const approveQnaAnswer = (qnaId: string) => request<GbpQnaItem>(`/gbp/qna/${qnaId}/approve`, { method: "POST" });
export const updateLocalInsightStatus = (insightId: string, status: string) => request<LocalSeoInsight>(`/gbp/insights/${insightId}`, { method: "PATCH", body: JSON.stringify({ status }) });

// ---------- Creative Assets ----------
export interface CreativeAsset { id: string; client_id: string; asset_type: string; source_type: string; source_id: string; platform: string | null; title: string | null; prompt: string | null; aspect_ratio: string; style_preset: string; provider: string | null; file_url: string | null; thumbnail_url: string | null; status: string; metadata_json: any; created_at: string; updated_at: string; variants?: any[]; }
export interface BrandProfile { id: string; client_id: string; brand_name: string | null; primary_color: string | null; secondary_color: string | null; font_style: string | null; tone: string | null; logo_url: string | null; image_style_notes: string | null; }
export const getCreativeAssets = (clientId: string, sourceType?: string) => request<CreativeAsset[]>(`/clients/${clientId}/creative-assets${sourceType ? `?source_type=${sourceType}` : ""}`);
export const getCreativeAsset = (id: string) => request<CreativeAsset>(`/creative/${id}`);
export const generateCreativeAsset = (data: { client_id: string; source_type: string; source_id: string; asset_type: string; platform?: string; style_preset?: string; aspect_ratio?: string; variant_count?: number; custom_prompt?: string; }) => request<CreativeAsset>(`/creative/generate`, { method: "POST", body: JSON.stringify(data) });
export const approveCreativeAsset = (id: string) => request<CreativeAsset>(`/creative/${id}/approve`, { method: "POST" });
export const regenerateCreativeAsset = (id: string, prompt?: string) => request<CreativeAsset>(`/creative/${id}/regenerate`, { method: "POST", body: JSON.stringify({ prompt }) });
export const deleteCreativeAsset = (id: string) => request<{ deleted: boolean }>(`/creative/${id}/delete`, { method: "POST" });
export const getBrandProfile = (clientId: string) => request<BrandProfile | null>(`/creative/brand/${clientId}`);
export const saveBrandProfile = (data: { client_id: string; brand_name?: string; primary_color?: string; secondary_color?: string; font_style?: string; tone?: string; logo_url?: string; image_style_notes?: string }) => request<BrandProfile>(`/creative/brand`, { method: "POST", body: JSON.stringify(data) });

// ---------- Google Ads ----------
export interface AdsCampaign { id: string; client_id: string; name: string; campaign_type: string; status: string; budget_daily: number | null; location_targets: string[]; created_at: string; }
export interface AdsRecommendation { id: string; recommendation_type: string; campaign_name: string | null; ad_group_name: string | null; keyword_text: string | null; landing_page_url: string | null; recommended_budget: number | null; recommended_action: string; priority: string; status: string; }
export interface AdsCopyDraft { id: string; target_keyword: string; headline_1: string; headline_2: string; headline_3: string; description_1: string; description_2: string; final_url: string; path_1: string; path_2: string; status: string; }
export interface AdsInsight { id: string; insight_type: string; priority: string; title: string; description: string; recommended_action: string | null; status: string; }
export interface AdsPerformanceResponse { summary: { total_impressions: number; total_clicks: number; avg_ctr: number; avg_cpc: number; total_cost: number; total_conversions: number; cost_per_conversion: number }; campaigns: any[]; }
export const getAdsCampaigns = (clientId: string) => request<AdsCampaign[]>(`/clients/${clientId}/ads-campaigns`);
export const getAdsRecommendations = (clientId: string) => request<AdsRecommendation[]>(`/clients/${clientId}/ads-recommendations`);
export const getAdsCopy = (clientId: string) => request<AdsCopyDraft[]>(`/clients/${clientId}/ads-copy`);
export const getAdsInsights = (clientId: string) => request<AdsInsight[]>(`/clients/${clientId}/ads-insights`);
export const getAdsPerformance = (clientId: string, days?: number) => request<AdsPerformanceResponse>(`/clients/${clientId}/ads-performance?days=${days || 14}`);
export const generateAdsRecommendations = (clientId: string) => request<{ count: number }>(`/ads/recommendations/generate`, { method: "POST", body: JSON.stringify({ client_id: clientId }) });
export const generateAdCopy = (data: { clientId: string; targetKeyword: string; finalUrl?: string; campaignId?: string; adGroupId?: string }) =>
  request<AdsCopyDraft>(`/ads/copy/generate`, { method: "POST", body: JSON.stringify({ client_id: data.clientId, target_keyword: data.targetKeyword, final_url: data.finalUrl, campaign_id: data.campaignId, ad_group_id: data.adGroupId }) });
export const approveAdCopy = (id: string) => request<AdsCopyDraft>(`/ads/copy/${id}/approve`, { method: "POST" });
export const updateAdsRecommendation = (id: string, status: string) => request<AdsRecommendation>(`/ads/recommendations/${id}`, { method: "PUT", body: JSON.stringify({ status }) });
export const syncAds = (clientId: string) => request<any>(`/ads/sync`, { method: "POST", body: JSON.stringify({ client_id: clientId }) });

// ---------- Command Center ----------
export interface CommandCenterSummary { totalPriorities: number; highPriorityCount: number; quickWinsCount: number; repurposeCount: number; decliningAssetsCount: number; nearPage1Count: number; gbpIssuesCount: number; adsOpportunitiesCount: number; weeklyTasksDue: number; weeklyTasksCompleted: number; topGrowthChannels: { channel: string; score: number }[]; topUnderperformingChannels: { channel: string; score: number }[]; }
export interface MarketingPriority { id: string; client_id: string; priority_type: string; source_module: string; source_id: string | null; title: string; description: string | null; recommended_action: string | null; priority_score: number; impact_score: number; effort_score: number; confidence_score: number; status: string; due_date: string | null; created_at: string; }
export interface CrossChannelRecommendation { id: string; client_id: string; recommendation_type: string; source_asset_type: string | null; source_asset_id: string | null; target_channel: string | null; title: string; description: string | null; recommended_action: string | null; priority: string; status: string; metadata_json: any; created_at: string; }
export interface WeeklyActionPlan { id: string; client_id: string; week_start: string; summary: string | null; top_goal: string | null; status: string; created_at: string; }
export interface MarketingGoal { id: string; client_id: string; goal_type: string; goal_name: string; target_value: number | null; timeframe: string | null; status: string; created_at: string; }
export const getCommandCenterSummary = (clientId: string) => request<CommandCenterSummary>(`/clients/${clientId}/command-center`);
export const getMarketingPriorities = (clientId: string, status?: string) => request<MarketingPriority[]>(`/clients/${clientId}/marketing-priorities${status ? `?status=${status}` : ""}`);
export const updateMarketingPriority = (priorityId: string, status: string) => request<MarketingPriority>(`/command/priorities/${priorityId}`, { method: "PUT", body: JSON.stringify({ status }) });
export const recomputePriorities = (clientId: string) => request<{ success: boolean; priorities_generated: number }>(`/clients/${clientId}/priorities/recompute`, { method: "POST" });
export const getCrossChannelRecommendations = (clientId: string, status?: string) => request<CrossChannelRecommendation[]>(`/clients/${clientId}/cross-channel-recommendations${status ? `?status=${status}` : ""}`);
export const updateCrossChannelRecommendation = (recId: string, status: string) => request<CrossChannelRecommendation>(`/command/recommendations/${recId}`, { method: "PUT", body: JSON.stringify({ status }) });
export const generateCrossChannelRecommendations = (clientId: string) => request<{ success: boolean; recommendations_generated: number }>(`/clients/${clientId}/recommendations/generate`, { method: "POST" });
export const getWeeklyActionPlans = (clientId: string) => request<WeeklyActionPlan[]>(`/clients/${clientId}/weekly-action-plans`);
export const generateWeeklyPlan = (clientId: string) => request<WeeklyActionPlan>(`/clients/${clientId}/weekly-action-plan/generate`, { method: "POST" });
export const updateWeeklyItem = (itemId: string, status: string) => request<any>(`/command/items/${itemId}`, { method: "PUT", body: JSON.stringify({ status }) });
export const getMarketingGoals = (clientId: string) => request<MarketingGoal[]>(`/clients/${clientId}/marketing-goals`);
export const getQuickWins = (clientId: string) => request<MarketingPriority[]>(`/clients/${clientId}/quick-wins`);

// ---------- CRM ----------
export interface CrmContact { id: string; client_id: string; first_name: string | null; last_name: string | null; full_name: string; email: string | null; phone: string | null; company_name: string | null; job_title: string | null; status: string; source_type: string | null; lead_source: string | null; notes: string | null; created_at: string; updated_at: string; }
export interface CrmDeal { id: string; client_id: string; contact_id: string | null; deal_name: string; deal_value: number; deal_stage: string; pipeline_name: string; expected_close_date: string | null; won_date: string | null; lost_reason: string | null; notes: string | null; contact_name?: string; contact_email?: string; created_at: string; updated_at: string; }
export interface CrmActivity { id: string; client_id: string; contact_id: string | null; deal_id: string | null; activity_type: string; title: string; description: string | null; due_date: string | null; completed_at: string | null; created_at: string; }
export interface CrmInsight { id: string; client_id: string; insight_type: string; priority: string; title: string; description: string | null; recommended_action: string | null; status: string; created_at: string; }
export interface AttributionOverview { byChannel: { channel: string; attribution_model: string; total_credit: number; contacts: number }[]; dealAttribution: { channel: string; attribution_model: string; attributed_revenue: number; deals: number }[]; }
export interface AttributionContact { id: string; channel: string; attribution_model: string; credit: number; campaign_name: string | null; full_name: string; email: string | null; contact_status: string; }
export interface AttributionDeal { channel: string; attribution_model: string; credit: number; campaign_name: string | null; deal_name: string; deal_value: number; deal_stage: string; won_date: string | null; contact_name: string; }
export const getCrmContacts = (clientId: string) => request<CrmContact[]>(`/clients/${clientId}/crm/contacts`);
export const createCrmContact = (data: any) => request<CrmContact>(`/crm/contacts`, { method: "POST", body: JSON.stringify(data) });
export const updateCrmContact = (id: string, data: any) => request<CrmContact>(`/crm/contacts/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const deleteCrmContact = (id: string) => request<{ deleted: boolean }>(`/crm/contacts/${id}`, { method: "DELETE" });
export const getCrmDeals = (clientId: string) => request<CrmDeal[]>(`/clients/${clientId}/crm/deals`);
export const createCrmDeal = (data: any) => request<CrmDeal>(`/crm/deals`, { method: "POST", body: JSON.stringify(data) });
export const updateCrmDeal = (id: string, data: any) => request<CrmDeal>(`/crm/deals/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const deleteCrmDeal = (id: string) => request<{ deleted: boolean }>(`/crm/deals/${id}`, { method: "DELETE" });
export const getCrmActivities = (clientId: string) => request<CrmActivity[]>(`/clients/${clientId}/crm/activities`);
export const createCrmActivity = (data: any) => request<CrmActivity>(`/crm/activities`, { method: "POST", body: JSON.stringify(data) });
export const completeCrmActivity = (id: string) => request<CrmActivity>(`/crm/activities/${id}/complete`, { method: "PUT" });
export const deleteCrmActivity = (id: string) => request<{ deleted: boolean }>(`/crm/activities/${id}`, { method: "DELETE" });
export const captureLead = (data: any) => request<any>(`/crm/leads/capture`, { method: "POST", body: JSON.stringify(data) });
export const getCrmInsights = (clientId: string, status?: string) => request<CrmInsight[]>(`/clients/${clientId}/crm/insights${status ? `?status=${status}` : ""}`);
export const recomputeCrmInsights = (clientId: string) => request<any>(`/clients/${clientId}/crm/insights/recompute`, { method: "POST" });
export const updateCrmInsightStatus = (id: string, status: string) => request<CrmInsight>(`/crm/insights/${id}`, { method: "PUT", body: JSON.stringify({ status }) });
export const getAttributionOverview = (clientId: string) => request<AttributionOverview>(`/clients/${clientId}/attribution/overview`);
export const getAttributionContacts = (clientId: string) => request<AttributionContact[]>(`/clients/${clientId}/attribution/contacts`);
export const getAttributionDeals = (clientId: string) => request<AttributionDeal[]>(`/clients/${clientId}/attribution/deals`);
export const recomputeAttribution = (clientId: string) => request<any>(`/clients/${clientId}/attribution/recompute`, { method: "POST" });

// ---------- Onboarding ----------
export const startOnboarding = (workspaceId: string) => request<any>(`/onboarding/start`, { method: "POST", body: JSON.stringify({ workspace_id: workspaceId }) });
export const getOnboarding = (workspaceId: string) => request<any>(`/onboarding/${workspaceId}`);
export const updateOnboarding = (workspaceId: string, data: any) => request<any>(`/onboarding/${workspaceId}`, { method: "PUT", body: JSON.stringify(data) });
export const completeOnboarding = (workspaceId: string) => request<any>(`/onboarding/${workspaceId}/complete`, { method: "POST" });

// ---------- Templates ----------
export const getTemplates = (industry?: string) => request<any[]>(`/templates${industry ? `?industry=${industry}` : ""}`);
export const getTemplate = (id: string) => request<any>(`/templates/${id}`);

// ---------- Setup ----------
export const runSetup = (data: { workspace_id: string; client_id: string; template_id: string }) => request<any>(`/setup/run`, { method: "POST", body: JSON.stringify(data) });
export const getSetupStatus = (workspaceId: string) => request<any>(`/setup/${workspaceId}/status`);

// ---------- Activation Checklist ----------
export const getActivationChecklist = (clientId: string) => request<any[]>(`/clients/${clientId}/activation-checklist`);
export const updateChecklistItem = (itemId: string, status: string) => request<any>(`/activation-checklist/${itemId}`, { method: "PUT", body: JSON.stringify({ status }) });

// ---------- Reports ----------
export const getReportTemplates = (workspaceId?: string) => request<any[]>(`/report-templates${workspaceId ? `?workspace_id=${workspaceId}` : ""}`);
export const getReportRuns = (clientId: string) => request<any[]>(`/clients/${clientId}/reports`);
export const generateReportApi = (data: { workspace_id: string; client_id: string; template_id: string; date_from: string; date_to: string }) =>
  request<any>(`/reports/generate`, { method: "POST", body: JSON.stringify(data) });
export const getReportByToken = (token: string) => request<any>(`/reports/share/${token}`);
export const getScheduledReports = (workspaceId: string) => request<any[]>(`/workspaces/${workspaceId}/scheduled-reports`);
export const createScheduledReport = (data: any) => request<any>(`/scheduled-reports`, { method: "POST", body: JSON.stringify(data) });
export const updateScheduledReport = (id: string, data: any) => request<any>(`/scheduled-reports/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const deleteScheduledReport = (id: string) => request<{ deleted: boolean }>(`/scheduled-reports/${id}`, { method: "DELETE" });

// ---------- Activity Log ----------
export interface ActivityLogEntry { id: string; workspace_id: string | null; client_id: string | null; user_id: string | null; actor_name: string; action: string; entity_type: string; entity_id: string | null; summary: string | null; metadata_json: any; created_at: string; }
export const getActivityLog = (params?: { client_id?: string; entity_type?: string; limit?: number }) => {
  const q = new URLSearchParams();
  if (params?.client_id) q.set("client_id", params.client_id);
  if (params?.entity_type) q.set("entity_type", params.entity_type);
  if (params?.limit) q.set("limit", String(params.limit));
  return request<ActivityLogEntry[]>(`/activity?${q.toString()}`);
};

// ---------- Notifications ----------
export interface AppNotification { id: string; workspace_id: string | null; user_id: string | null; type: string; category: string; title: string; message: string | null; entity_type: string | null; entity_id: string | null; is_read: boolean; created_at: string; }
export const getNotifications = (params?: { is_read?: boolean; category?: string }) => {
  const q = new URLSearchParams();
  if (params?.is_read !== undefined) q.set("is_read", String(params.is_read));
  if (params?.category) q.set("category", params.category);
  return request<AppNotification[]>(`/notifications?${q.toString()}`);
};
export const markNotificationRead = (id: string) => request<AppNotification>(`/notifications/${id}/read`, { method: "PUT" });
export const markAllNotificationsRead = () => request<{ success: boolean }>(`/notifications/read-all`, { method: "PUT" });
export const getUnreadCount = () => request<{ count: number }>(`/notifications/unread-count`);

// ---------- Job Center ----------
export const getAllPublishingJobs = (params?: { status?: string; client_id?: string }) => {
  const q = new URLSearchParams();
  if (params?.status) q.set("status", params.status);
  if (params?.client_id) q.set("client_id", params.client_id);
  return request<(PublishingJob & { client_name?: string })[]>(`/publishing-jobs?${q.toString()}`);
};

// ---------- AI Visibility ----------
export interface AiVisPromptSet { id: string; client_id: string; name: string; description: string | null; topic_cluster: string | null; intent_type: string; status: string; prompt_count: number; run_count: number; created_at: string; }
export interface AiVisPrompt { id: string; prompt_set_id: string; prompt_text: string; target_entities: string[]; competitor_entities: string[]; created_at: string; }
export interface AiVisRun { id: string; client_id: string; prompt_set_id: string | null; prompt_set_name: string | null; provider: string; status: string; total_prompts: number; prompts_with_mention: number; prompts_with_citation: number; started_at: string | null; completed_at: string | null; created_at: string; }
export interface AiVisObservation { id: string; run_id: string; prompt_id: string; prompt_text: string; provider: string; brand_mentioned: boolean; brand_position: number | null; competitor_mentioned: boolean; competitor_names: string[]; citation_present: boolean; citation_url: string | null; sentiment: string | null; prominence: string; raw_snippet: string | null; }
export interface AiVisOverview { summary: { total_runs: number; total_prompts_checked: number; total_mentions: number; total_citations: number; visibility_rate: number; citation_rate: number }; trend: AiVisRun[]; byPromptSet: any[]; competitorMentions: { competitor: string; mention_count: number }[]; }

export const getAiVisPromptSets = (clientId: string) => request<AiVisPromptSet[]>(`/clients/${clientId}/ai-visibility/prompt-sets`);
export const createAiVisPromptSet = (data: { client_id: string; name: string; description?: string; topic_cluster?: string; intent_type?: string }) => request<AiVisPromptSet>(`/ai-visibility/prompt-sets`, { method: "POST", body: JSON.stringify(data) });
export const updateAiVisPromptSet = (id: string, data: any) => request<AiVisPromptSet>(`/ai-visibility/prompt-sets/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const deleteAiVisPromptSet = (id: string) => request<{ deleted: boolean }>(`/ai-visibility/prompt-sets/${id}`, { method: "DELETE" });

export const getAiVisPrompts = (setId: string) => request<AiVisPrompt[]>(`/ai-visibility/prompt-sets/${setId}/prompts`);
export const createAiVisPrompt = (data: { prompt_set_id: string; prompt_text: string; target_entities?: string[]; competitor_entities?: string[] }) => request<AiVisPrompt>(`/ai-visibility/prompts`, { method: "POST", body: JSON.stringify(data) });
export const createAiVisPromptsBulk = (data: { prompt_set_id: string; prompts: { prompt_text: string; target_entities?: string[]; competitor_entities?: string[] }[] }) => request<AiVisPrompt[]>(`/ai-visibility/prompts/bulk`, { method: "POST", body: JSON.stringify(data) });
export const deleteAiVisPrompt = (id: string) => request<{ deleted: boolean }>(`/ai-visibility/prompts/${id}`, { method: "DELETE" });

export const getAiVisRuns = (clientId: string) => request<AiVisRun[]>(`/clients/${clientId}/ai-visibility/runs`);
export const startAiVisRun = (data: { client_id: string; prompt_set_id: string; provider?: string }) => request<AiVisRun>(`/ai-visibility/runs`, { method: "POST", body: JSON.stringify(data) });

export const getAiVisObservations = (runId: string) => request<AiVisObservation[]>(`/ai-visibility/runs/${runId}/observations`);
export const updateAiVisObservation = (id: string, data: Partial<AiVisObservation>) => request<AiVisObservation>(`/ai-visibility/observations/${id}`, { method: "PUT", body: JSON.stringify(data) });

export const getAiVisOverview = (clientId: string) => request<AiVisOverview>(`/clients/${clientId}/ai-visibility/overview`);

export const getAiVisCompetitors = (clientId: string) => request<any[]>(`/clients/${clientId}/ai-visibility/competitors`);
export const createAiVisCompetitor = (data: { client_id: string; competitor_name: string; competitor_domain?: string }) => request<any>(`/ai-visibility/competitors`, { method: "POST", body: JSON.stringify(data) });
