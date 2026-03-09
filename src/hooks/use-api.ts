import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as api from "@/lib/api";

// ---------- Clients ----------
export function useClients() {
  return useQuery({ queryKey: ["clients"], queryFn: api.getClients });
}

export function useClient(id: string) {
  return useQuery({ queryKey: ["clients", id], queryFn: () => api.getClient(id), enabled: !!id });
}

export function useCreateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; domain: string }) => api.createClient(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["clients"] }),
  });
}

export function useDeleteClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteClient(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["clients"] }),
  });
}

// ---------- Keywords ----------
export function useKeywords(clientId: string) {
  return useQuery({
    queryKey: ["keywords", clientId],
    queryFn: () => api.getKeywords(clientId),
    enabled: !!clientId,
  });
}

export function useCreateKeyword(clientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { keyword: string }) => api.createKeyword(clientId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["keywords", clientId] }),
  });
}

// ---------- Competitors ----------
export function useCompetitors(clientId: string) {
  return useQuery({
    queryKey: ["competitors", clientId],
    queryFn: () => api.getCompetitors(clientId),
    enabled: !!clientId,
  });
}

export function useCreateCompetitor(clientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { domain: string; label?: string }) => api.createCompetitor(clientId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["competitors", clientId] }),
  });
}

// ---------- Audit ----------
export function useAuditIssues(clientId: string) {
  return useQuery({
    queryKey: ["audit-issues", clientId],
    queryFn: () => api.getAuditIssues(clientId),
    enabled: !!clientId,
  });
}

// ---------- Opportunities ----------
export function useOpportunities(clientId: string) {
  return useQuery({
    queryKey: ["opportunities", clientId],
    queryFn: () => api.getOpportunities(clientId),
    enabled: !!clientId,
  });
}

// ---------- Internal Links ----------
export function useInternalLinks(clientId: string) {
  return useQuery({
    queryKey: ["internal-links", clientId],
    queryFn: () => api.getInternalLinks(clientId),
    enabled: !!clientId,
  });
}

// ---------- Content Plan ----------
export function useContentPlan(clientId: string) {
  return useQuery({
    queryKey: ["content-plan", clientId],
    queryFn: () => api.getContentPlan(clientId),
    enabled: !!clientId,
  });
}

// ---------- SEO Briefs ----------
export function useBriefs(clientId: string) {
  return useQuery({
    queryKey: ["briefs", clientId],
    queryFn: () => api.getBriefs(clientId),
    enabled: !!clientId,
  });
}

export function useGenerateBrief(clientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (keyword: string) => api.generateBrief(clientId, keyword),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["briefs", clientId] }),
  });
}

// ---------- SEO Articles ----------
export function useArticles(clientId: string) {
  return useQuery({
    queryKey: ["articles", clientId],
    queryFn: () => api.getArticles(clientId),
    enabled: !!clientId,
  });
}

export function useGenerateArticle(clientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (briefId: string) => api.generateArticle(clientId, briefId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["articles", clientId] }),
  });
}

export function useUpdateArticle(clientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ articleId, data }: { articleId: string; data: { title?: string; meta_description?: string; content?: string; slug?: string } }) =>
      api.updateArticle(articleId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["articles", clientId] }),
  });
}

export function useApproveArticle(clientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (articleId: string) => api.approveArticle(articleId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["articles", clientId] }),
  });
}

export function usePublishArticle(clientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ articleId, scheduleDate }: { articleId: string; scheduleDate?: string }) =>
      api.publishArticle(articleId, scheduleDate),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["articles", clientId] }),
  });
}

// ---------- CMS Connections ----------
export function useCmsConnection(clientId: string) {
  return useQuery({
    queryKey: ["cms", clientId],
    queryFn: () => api.getCmsConnection(clientId),
    enabled: !!clientId,
  });
}

export function useSaveCmsConnection(clientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { site_url: string; username: string; application_password: string }) =>
      api.saveCmsConnection(clientId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cms", clientId] }),
  });
}

export function useTestCmsConnection(clientId: string) {
  return useMutation({
    mutationFn: () => api.testCmsConnection(clientId),
  });
}

// ---------- Social Posts ----------
export function useSocialPosts(articleId: string) {
  return useQuery({
    queryKey: ["social-posts", articleId],
    queryFn: () => api.getSocialPosts(articleId),
    enabled: !!articleId,
  });
}

export function useGenerateSocialPosts(clientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (articleId: string) => api.generateSocialPosts(clientId, articleId),
    onSuccess: (_data, articleId) => qc.invalidateQueries({ queryKey: ["social-posts", articleId] }),
  });
}

export function useUpdateSocialPost(articleId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ postId, data }: { postId: string; data: { content?: string; scheduled_time?: string } }) =>
      api.updateSocialPost(postId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["social-posts", articleId] }),
  });
}

export function useApproveSocialPost(articleId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (postId: string) => api.approveSocialPost(postId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["social-posts", articleId] }),
  });
}

// ---------- Video Assets ----------
export function useVideos(clientId: string) {
  return useQuery({
    queryKey: ["videos", clientId],
    queryFn: () => api.getVideos(clientId),
    enabled: !!clientId,
  });
}

export function useGenerateVideo(clientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Parameters<typeof api.generateVideo>[0], "client_id">) =>
      api.generateVideo({ ...data, client_id: clientId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["videos", clientId] }),
  });
}

export function useUpdateVideo(clientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ videoId, data }: { videoId: string; data: { video_script?: string; caption_text?: string; avatar_type?: string; voice_type?: string } }) =>
      api.updateVideo(videoId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["videos", clientId] }),
  });
}

export function useApproveVideo(clientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (videoId: string) => api.approveVideo(videoId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["videos", clientId] }),
  });
}

// ---------- Publishing Jobs ----------
export function usePublishingJobs(clientId: string) {
  return useQuery({
    queryKey: ["publishing-jobs", clientId],
    queryFn: () => api.getPublishingJobs(clientId),
    enabled: !!clientId,
    refetchInterval: 15000, // poll every 15s for job status updates
  });
}

export function useScheduleJob(clientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Parameters<typeof api.schedulePublishingJob>[0], "client_id">) =>
      api.schedulePublishingJob({ ...data, client_id: clientId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["publishing-jobs", clientId] }),
  });
}

export function useRetryJob(clientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (jobId: string) => api.retryPublishingJob(jobId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["publishing-jobs", clientId] }),
  });
}

export function useCancelJob(clientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (jobId: string) => api.cancelPublishingJob(jobId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["publishing-jobs", clientId] }),
  });
}

export function useRescheduleJob(clientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ jobId, scheduledTime }: { jobId: string; scheduledTime: string }) =>
      api.reschedulePublishingJob(jobId, scheduledTime),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["publishing-jobs", clientId] }),
  });
}

// ---------- AI Generation (uses AI provider abstraction) ----------
export function useAiGenerateArticle(clientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (briefId: string) => api.aiGenerateArticle(clientId, briefId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["articles", clientId] }),
  });
}

export function useAiGenerateSocial(clientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (articleId: string) => api.aiGenerateSocial(clientId, articleId),
    onSuccess: (_data, articleId) => qc.invalidateQueries({ queryKey: ["social-posts", articleId] }),
  });
}

export function useAiGenerateVideo(clientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Parameters<typeof api.aiGenerateVideo>[0], "client_id">) =>
      api.aiGenerateVideo({ ...data, client_id: clientId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["videos", clientId] }),
  });
}

// ---------- Analytics ----------
export function useAnalyticsConnections(clientId: string) {
  return useQuery({
    queryKey: ["analytics-connections", clientId],
    queryFn: () => api.getAnalyticsConnections(clientId),
    enabled: !!clientId,
  });
}

export function useSyncAnalytics() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (clientId: string) => api.syncAnalytics(clientId),
    onSuccess: (_data, clientId) => {
      qc.invalidateQueries({ queryKey: ["performance-insights", clientId] });
      qc.invalidateQueries({ queryKey: ["performance-summary", clientId] });
    },
  });
}

export function usePerformanceSummary(clientId: string, days?: number) {
  return useQuery({
    queryKey: ["performance-summary", clientId, days],
    queryFn: () => api.getPerformanceSummary(clientId, days),
    enabled: !!clientId,
  });
}

export function usePagePerformance(clientId: string, days?: number) {
  return useQuery({
    queryKey: ["page-performance", clientId, days],
    queryFn: () => api.getPagePerformance(clientId, days),
    enabled: !!clientId,
  });
}

export function useKeywordPerformance(clientId: string, days?: number) {
  return useQuery({
    queryKey: ["keyword-performance", clientId, days],
    queryFn: () => api.getKeywordPerformance(clientId, days),
    enabled: !!clientId,
  });
}

export function useAssetPerformance(clientId: string, days?: number, assetType?: string) {
  return useQuery({
    queryKey: ["asset-performance", clientId, days, assetType],
    queryFn: () => api.getAssetPerformance(clientId, days, assetType),
    enabled: !!clientId,
  });
}

export function usePerformanceInsights(clientId: string, status?: string) {
  return useQuery({
    queryKey: ["performance-insights", clientId, status],
    queryFn: () => api.getPerformanceInsights(clientId, status),
    enabled: !!clientId,
  });
}

export function useUpdateInsightStatus(clientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ insightId, status }: { insightId: string; status: string }) =>
      api.updateInsightStatus(insightId, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["performance-insights", clientId] }),
  });
}

// ---------- GBP / Local SEO ----------
export function useGbpConnection(clientId: string) {
  return useQuery({ queryKey: ["gbp-connection", clientId], queryFn: () => api.getGbpConnection(clientId), enabled: !!clientId });
}
export function useGbpProfile(clientId: string) {
  return useQuery({ queryKey: ["gbp-profile", clientId], queryFn: () => api.getGbpProfile(clientId), enabled: !!clientId });
}
export function useGbpPosts(clientId: string) {
  return useQuery({ queryKey: ["gbp-posts", clientId], queryFn: () => api.getGbpPosts(clientId), enabled: !!clientId });
}
export function useGbpReviews(clientId: string) {
  return useQuery({ queryKey: ["gbp-reviews", clientId], queryFn: () => api.getGbpReviews(clientId), enabled: !!clientId });
}
export function useGbpQna(clientId: string) {
  return useQuery({ queryKey: ["gbp-qna", clientId], queryFn: () => api.getGbpQna(clientId), enabled: !!clientId });
}
export function useLocalSeoInsights(clientId: string) {
  return useQuery({ queryKey: ["local-seo-insights", clientId], queryFn: () => api.getLocalSeoInsights(clientId), enabled: !!clientId });
}
export function useSyncGbp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (clientId: string) => api.syncGbp(clientId),
    onSuccess: (_data, clientId) => {
      qc.invalidateQueries({ queryKey: ["gbp-profile", clientId] });
      qc.invalidateQueries({ queryKey: ["gbp-reviews", clientId] });
      qc.invalidateQueries({ queryKey: ["gbp-qna", clientId] });
      qc.invalidateQueries({ queryKey: ["local-seo-insights", clientId] });
    },
  });
}
export function useApproveGbpPost(clientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (postId: string) => api.approveGbpPost(postId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["gbp-posts", clientId] }),
  });
}
export function useGenerateReviewResponse(clientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (reviewId: string) => api.generateReviewResponse(reviewId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["gbp-reviews", clientId] }),
  });
}
export function useApproveReviewResponse(clientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (reviewId: string) => api.approveReviewResponse(reviewId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["gbp-reviews", clientId] }),
  });
}
export function useGenerateQnaAnswer(clientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (qnaId: string) => api.generateQnaAnswer(qnaId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["gbp-qna", clientId] }),
  });
}
export function useApproveQnaAnswer(clientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (qnaId: string) => api.approveQnaAnswer(qnaId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["gbp-qna", clientId] }),
  });
}
export function useUpdateLocalInsightStatus(clientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ insightId, status }: { insightId: string; status: string }) =>
      api.updateLocalInsightStatus(insightId, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["local-seo-insights", clientId] }),
  });
}

// ---------- Creative Assets ----------
export function useCreativeAssets(clientId: string, sourceType?: string) {
  return useQuery({ queryKey: ["creative-assets", clientId, sourceType], queryFn: () => api.getCreativeAssets(clientId, sourceType), enabled: !!clientId });
}
export function useGenerateCreative(clientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof api.generateCreativeAsset>[0]) => api.generateCreativeAsset(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["creative-assets", clientId] }),
  });
}
export function useApproveCreativeAsset(clientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.approveCreativeAsset(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["creative-assets", clientId] }),
  });
}
export function useRegenerateCreativeAsset(clientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ assetId, prompt }: { assetId: string; prompt?: string }) => api.regenerateCreativeAsset(assetId, prompt),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["creative-assets", clientId] }),
  });
}
export function useDeleteCreativeAsset(clientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteCreativeAsset(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["creative-assets", clientId] }),
  });
}
export function useBrandProfile(clientId: string) {
  return useQuery({ queryKey: ["brand-profile", clientId], queryFn: () => api.getBrandProfile(clientId), enabled: !!clientId });
}
export function useSaveBrandProfile(clientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof api.saveBrandProfile>[0]) => api.saveBrandProfile(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["brand-profile", clientId] }),
  });
}
