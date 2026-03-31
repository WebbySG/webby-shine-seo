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
  return useMutation({ mutationFn: (data: { name: string; domain: string }) => api.createClient(data), onSuccess: () => qc.invalidateQueries({ queryKey: ["clients"] }) });
}
export function useDeleteClient() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => api.deleteClient(id), onSuccess: () => qc.invalidateQueries({ queryKey: ["clients"] }) });
}

// ---------- Keywords ----------
export function useKeywords(clientId: string) {
  return useQuery({ queryKey: ["keywords", clientId], queryFn: () => api.getKeywords(clientId), enabled: !!clientId });
}
export function useCreateKeyword(clientId: string) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data: { keyword: string }) => api.createKeyword(clientId, data), onSuccess: () => qc.invalidateQueries({ queryKey: ["keywords", clientId] }) });
}
export function useFetchRankings(clientId: string) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: () => api.fetchRankings(clientId), onSuccess: () => qc.invalidateQueries({ queryKey: ["keywords", clientId] }) });
}

// ---------- Competitors ----------
export function useCompetitors(clientId: string) {
  return useQuery({ queryKey: ["competitors", clientId], queryFn: () => api.getCompetitors(clientId), enabled: !!clientId });
}
export function useCreateCompetitor(clientId: string) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data: { domain: string; label?: string }) => api.createCompetitor(clientId, data), onSuccess: () => qc.invalidateQueries({ queryKey: ["competitors", clientId] }) });
}

// ---------- Audit ----------
export function useAuditRuns(clientId: string) {
  return useQuery({ queryKey: ["audit-runs", clientId], queryFn: () => api.getAuditRuns(clientId), enabled: !!clientId });
}
export function useAuditRunDetail(runId: string) {
  return useQuery({ queryKey: ["audit-run", runId], queryFn: () => api.getAuditRunDetail(runId), enabled: !!runId });
}
export function useAuditIssues(clientId: string) {
  return useQuery({ queryKey: ["audit-issues", clientId], queryFn: () => api.getAuditIssues(clientId), enabled: !!clientId });
}
export function useAuditIssueDetail(issueId: string) {
  return useQuery({ queryKey: ["audit-issue", issueId], queryFn: () => api.getAuditIssueDetail(issueId), enabled: !!issueId });
}
export function useStartAudit(clientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { domain: string; scope?: string; provider?: string }) =>
      api.startAudit({ ...data, client_id: clientId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["audit-runs", clientId] }),
  });
}
export function useUpdateAuditIssueStatus(clientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ issueId, status }: { issueId: string; status: string }) => api.updateAuditIssueStatus(issueId, status),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["audit-issues", clientId] }); qc.invalidateQueries({ queryKey: ["audit-runs", clientId] }); },
  });
}
export function useRecheckIssue(clientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (issueId: string) => api.recheckAuditIssue(issueId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["audit-issues", clientId] }); qc.invalidateQueries({ queryKey: ["audit-runs", clientId] }); },
  });
}
export function useRecheckRun(clientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (runId: string) => api.recheckAuditRun(runId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["audit-issues", clientId] }); qc.invalidateQueries({ queryKey: ["audit-runs", clientId] }); },
  });
}

// ---------- Opportunities ----------
export function useOpportunities(clientId: string) {
  return useQuery({ queryKey: ["opportunities", clientId], queryFn: () => api.getOpportunities(clientId), enabled: !!clientId });
}

// ---------- Internal Links ----------
export function useInternalLinks(clientId: string) {
  return useQuery({ queryKey: ["internal-links", clientId], queryFn: () => api.getInternalLinks(clientId), enabled: !!clientId });
}

// ---------- Content Plan ----------
export function useContentPlan(clientId: string) {
  return useQuery({ queryKey: ["content-plan", clientId], queryFn: () => api.getContentPlan(clientId), enabled: !!clientId });
}

// ---------- SEO Briefs ----------
export function useBriefs(clientId: string) {
  return useQuery({ queryKey: ["briefs", clientId], queryFn: () => api.getBriefs(clientId), enabled: !!clientId });
}
export function useBriefDetail(briefId: string) {
  return useQuery({ queryKey: ["brief", briefId], queryFn: () => api.getBriefDetail(briefId), enabled: !!briefId });
}
export function useGenerateBrief(clientId: string) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (keyword: string) => api.generateBrief(clientId, keyword), onSuccess: () => qc.invalidateQueries({ queryKey: ["briefs", clientId] }) });
}
export function useCreateBriefFromMapping(clientId: string) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data: Parameters<typeof api.createBriefFromMapping>[0]) => api.createBriefFromMapping(data), onSuccess: () => qc.invalidateQueries({ queryKey: ["briefs", clientId] }) });
}
export function useUpdateBrief(clientId: string) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ briefId, data }: { briefId: string; data: Partial<api.SeoBrief> }) => api.updateBrief(briefId, data), onSuccess: (_d, vars) => { qc.invalidateQueries({ queryKey: ["briefs", clientId] }); qc.invalidateQueries({ queryKey: ["brief", vars.briefId] }); } });
}
export function useGenerateDraft(clientId: string) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (briefId: string) => api.generateDraftFromBrief(briefId), onSuccess: (_d, briefId) => { qc.invalidateQueries({ queryKey: ["brief-drafts", briefId] }); qc.invalidateQueries({ queryKey: ["briefs", clientId] }); } });
}
export function useBriefDrafts(briefId: string) {
  return useQuery({ queryKey: ["brief-drafts", briefId], queryFn: () => api.getBriefDrafts(briefId), enabled: !!briefId });
}
export function useUpdateDraft(briefId: string) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ draftId, data }: { draftId: string; data: Partial<api.SeoBriefDraft> }) => api.updateDraft(draftId, data), onSuccess: () => qc.invalidateQueries({ queryKey: ["brief-drafts", briefId] }) });
}
export function useUpdateDraftStatus(briefId: string) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ draftId, status }: { draftId: string; status: string }) => api.updateDraftStatus(draftId, status), onSuccess: () => { qc.invalidateQueries({ queryKey: ["brief-drafts", briefId] }); qc.invalidateQueries({ queryKey: ["briefs"] }); } });
}

// ---------- SEO Articles ----------
export function useArticles(clientId: string) {
  return useQuery({ queryKey: ["articles", clientId], queryFn: () => api.getArticles(clientId), enabled: !!clientId });
}
export function useGenerateArticle(clientId: string) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (briefId: string) => api.generateArticle(clientId, briefId), onSuccess: () => qc.invalidateQueries({ queryKey: ["articles", clientId] }) });
}
export function useUpdateArticle(clientId: string) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ articleId, data }: { articleId: string; data: { title?: string; meta_description?: string; content?: string; slug?: string } }) => api.updateArticle(articleId, data), onSuccess: () => qc.invalidateQueries({ queryKey: ["articles", clientId] }) });
}
export function useApproveArticle(clientId: string) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (articleId: string) => api.approveArticle(articleId), onSuccess: () => qc.invalidateQueries({ queryKey: ["articles", clientId] }) });
}
export function usePublishArticle(clientId: string) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ articleId, scheduleDate }: { articleId: string; scheduleDate?: string }) => api.publishArticle(articleId, scheduleDate), onSuccess: () => qc.invalidateQueries({ queryKey: ["articles", clientId] }) });
}

// ---------- CMS Connections ----------
export function useCmsConnection(clientId: string) {
  return useQuery({ queryKey: ["cms", clientId], queryFn: () => api.getCmsConnection(clientId), enabled: !!clientId });
}
export function useSaveCmsConnection(clientId: string) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data: { site_url: string; username: string; application_password: string }) => api.saveCmsConnection(clientId, data), onSuccess: () => qc.invalidateQueries({ queryKey: ["cms", clientId] }) });
}
export function useTestCmsConnection(clientId: string) {
  return useMutation({ mutationFn: () => api.testCmsConnection(clientId) });
}

// ---------- Social Posts ----------
export function useSocialPosts(articleId: string) {
  return useQuery({ queryKey: ["social-posts", articleId], queryFn: () => api.getSocialPosts(articleId), enabled: !!articleId });
}
export function useGenerateSocialPosts(clientId: string) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (articleId: string) => api.generateSocialPosts(clientId, articleId), onSuccess: (_data, articleId) => qc.invalidateQueries({ queryKey: ["social-posts", articleId] }) });
}
export function useUpdateSocialPost(articleId: string) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ postId, data }: { postId: string; data: { content?: string; scheduled_time?: string } }) => api.updateSocialPost(postId, data), onSuccess: () => qc.invalidateQueries({ queryKey: ["social-posts", articleId] }) });
}
export function useApproveSocialPost(articleId: string) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (postId: string) => api.approveSocialPost(postId), onSuccess: () => qc.invalidateQueries({ queryKey: ["social-posts", articleId] }) });
}

// ---------- Video Assets ----------
export function useVideos(clientId: string) {
  return useQuery({ queryKey: ["videos", clientId], queryFn: () => api.getVideos(clientId), enabled: !!clientId });
}
export function useGenerateVideo(clientId: string) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data: Omit<Parameters<typeof api.generateVideo>[0], "client_id">) => api.generateVideo({ ...data, client_id: clientId }), onSuccess: () => qc.invalidateQueries({ queryKey: ["videos", clientId] }) });
}
export function useUpdateVideo(clientId: string) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ videoId, data }: { videoId: string; data: { video_script?: string; caption_text?: string; avatar_type?: string; voice_type?: string } }) => api.updateVideo(videoId, data), onSuccess: () => qc.invalidateQueries({ queryKey: ["videos", clientId] }) });
}
export function useApproveVideo(clientId: string) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (videoId: string) => api.approveVideo(videoId), onSuccess: () => qc.invalidateQueries({ queryKey: ["videos", clientId] }) });
}

// ---------- Publishing Jobs ----------
export function usePublishingJobs(clientId: string) {
  return useQuery({ queryKey: ["publishing-jobs", clientId], queryFn: () => api.getPublishingJobs(clientId), enabled: !!clientId, refetchInterval: 15000 });
}
export function useScheduleJob(clientId: string) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data: Omit<Parameters<typeof api.schedulePublishingJob>[0], "client_id">) => api.schedulePublishingJob({ ...data, client_id: clientId }), onSuccess: () => qc.invalidateQueries({ queryKey: ["publishing-jobs", clientId] }) });
}
export function useRetryJob(clientId: string) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (jobId: string) => api.retryPublishingJob(jobId), onSuccess: () => qc.invalidateQueries({ queryKey: ["publishing-jobs", clientId] }) });
}
export function useCancelJob(clientId: string) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (jobId: string) => api.cancelPublishingJob(jobId), onSuccess: () => qc.invalidateQueries({ queryKey: ["publishing-jobs", clientId] }) });
}
export function useRescheduleJob(clientId: string) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ jobId, scheduledTime }: { jobId: string; scheduledTime: string }) => api.reschedulePublishingJob(jobId, scheduledTime), onSuccess: () => qc.invalidateQueries({ queryKey: ["publishing-jobs", clientId] }) });
}

// ---------- AI Generation ----------
export function useAiGenerateArticle(clientId: string) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (briefId: string) => api.aiGenerateArticle(clientId, briefId), onSuccess: () => qc.invalidateQueries({ queryKey: ["articles", clientId] }) });
}
export function useAiGenerateSocial(clientId: string) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (articleId: string) => api.aiGenerateSocial(clientId, articleId), onSuccess: (_data, articleId) => qc.invalidateQueries({ queryKey: ["social-posts", articleId] }) });
}
export function useAiGenerateVideo(clientId: string) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data: Omit<Parameters<typeof api.aiGenerateVideo>[0], "client_id">) => api.aiGenerateVideo({ ...data, client_id: clientId }), onSuccess: () => qc.invalidateQueries({ queryKey: ["videos", clientId] }) });
}

// ---------- Analytics ----------
export function useAnalyticsConnections(clientId: string) {
  return useQuery({ queryKey: ["analytics-connections", clientId], queryFn: () => api.getAnalyticsConnections(clientId), enabled: !!clientId });
}
export function useSyncAnalytics() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (clientId: string) => api.syncAnalytics(clientId), onSuccess: (_data, clientId) => { qc.invalidateQueries({ queryKey: ["performance-insights", clientId] }); qc.invalidateQueries({ queryKey: ["performance-summary", clientId] }); } });
}
export function usePerformanceSummary(clientId: string, days?: number) {
  return useQuery({ queryKey: ["performance-summary", clientId, days], queryFn: () => api.getPerformanceSummary(clientId, days), enabled: !!clientId });
}
export function usePagePerformance(clientId: string, days?: number) {
  return useQuery({ queryKey: ["page-performance", clientId, days], queryFn: () => api.getPagePerformance(clientId, days), enabled: !!clientId });
}
export function useKeywordPerformance(clientId: string, days?: number) {
  return useQuery({ queryKey: ["keyword-performance", clientId, days], queryFn: () => api.getKeywordPerformance(clientId, days), enabled: !!clientId });
}
export function useAssetPerformance(clientId: string, days?: number, assetType?: string) {
  return useQuery({ queryKey: ["asset-performance", clientId, days, assetType], queryFn: () => api.getAssetPerformance(clientId, days, assetType), enabled: !!clientId });
}
export function usePerformanceInsights(clientId: string, status?: string) {
  return useQuery({ queryKey: ["performance-insights", clientId, status], queryFn: () => api.getPerformanceInsights(clientId, status), enabled: !!clientId });
}
export function useUpdateInsightStatus(clientId: string) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ insightId, status }: { insightId: string; status: string }) => api.updateInsightStatus(insightId, status), onSuccess: () => qc.invalidateQueries({ queryKey: ["performance-insights", clientId] }) });
}

// ---------- GBP / Local SEO ----------
export function useGbpConnection(clientId: string) { return useQuery({ queryKey: ["gbp-connection", clientId], queryFn: () => api.getGbpConnection(clientId), enabled: !!clientId }); }
export function useGbpProfile(clientId: string) { return useQuery({ queryKey: ["gbp-profile", clientId], queryFn: () => api.getGbpProfile(clientId), enabled: !!clientId }); }
export function useGbpPosts(clientId: string) { return useQuery({ queryKey: ["gbp-posts", clientId], queryFn: () => api.getGbpPosts(clientId), enabled: !!clientId }); }
export function useGbpReviews(clientId: string) { return useQuery({ queryKey: ["gbp-reviews", clientId], queryFn: () => api.getGbpReviews(clientId), enabled: !!clientId }); }
export function useGbpQna(clientId: string) { return useQuery({ queryKey: ["gbp-qna", clientId], queryFn: () => api.getGbpQna(clientId), enabled: !!clientId }); }
export function useLocalSeoInsights(clientId: string) { return useQuery({ queryKey: ["local-seo-insights", clientId], queryFn: () => api.getLocalSeoInsights(clientId), enabled: !!clientId }); }
export function useSyncGbp() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (clientId: string) => api.syncGbp(clientId), onSuccess: (_data, clientId) => { qc.invalidateQueries({ queryKey: ["gbp-profile", clientId] }); qc.invalidateQueries({ queryKey: ["gbp-reviews", clientId] }); qc.invalidateQueries({ queryKey: ["gbp-qna", clientId] }); qc.invalidateQueries({ queryKey: ["local-seo-insights", clientId] }); } });
}
export function useApproveGbpPost(clientId: string) { const qc = useQueryClient(); return useMutation({ mutationFn: (postId: string) => api.approveGbpPost(postId), onSuccess: () => qc.invalidateQueries({ queryKey: ["gbp-posts", clientId] }) }); }
export function useGenerateReviewResponse(clientId: string) { const qc = useQueryClient(); return useMutation({ mutationFn: (reviewId: string) => api.generateReviewResponse(reviewId), onSuccess: () => qc.invalidateQueries({ queryKey: ["gbp-reviews", clientId] }) }); }
export function useApproveReviewResponse(clientId: string) { const qc = useQueryClient(); return useMutation({ mutationFn: (reviewId: string) => api.approveReviewResponse(reviewId), onSuccess: () => qc.invalidateQueries({ queryKey: ["gbp-reviews", clientId] }) }); }
export function useGenerateQnaAnswer(clientId: string) { const qc = useQueryClient(); return useMutation({ mutationFn: (qnaId: string) => api.generateQnaAnswer(qnaId), onSuccess: () => qc.invalidateQueries({ queryKey: ["gbp-qna", clientId] }) }); }
export function useApproveQnaAnswer(clientId: string) { const qc = useQueryClient(); return useMutation({ mutationFn: (qnaId: string) => api.approveQnaAnswer(qnaId), onSuccess: () => qc.invalidateQueries({ queryKey: ["gbp-qna", clientId] }) }); }
export function useUpdateLocalInsightStatus(clientId: string) { const qc = useQueryClient(); return useMutation({ mutationFn: ({ insightId, status }: { insightId: string; status: string }) => api.updateLocalInsightStatus(insightId, status), onSuccess: () => qc.invalidateQueries({ queryKey: ["local-seo-insights", clientId] }) }); }

// ---------- Creative Assets ----------
export function useCreativeAssets(clientId: string, sourceType?: string) { return useQuery({ queryKey: ["creative-assets", clientId, sourceType], queryFn: () => api.getCreativeAssets(clientId, sourceType), enabled: !!clientId }); }
export function useGenerateCreative(clientId: string) { const qc = useQueryClient(); return useMutation({ mutationFn: (data: Parameters<typeof api.generateCreativeAsset>[0]) => api.generateCreativeAsset(data), onSuccess: () => qc.invalidateQueries({ queryKey: ["creative-assets", clientId] }) }); }
export function useApproveCreativeAsset(clientId: string) { const qc = useQueryClient(); return useMutation({ mutationFn: (id: string) => api.approveCreativeAsset(id), onSuccess: () => qc.invalidateQueries({ queryKey: ["creative-assets", clientId] }) }); }
export function useRegenerateCreativeAsset(clientId: string) { const qc = useQueryClient(); return useMutation({ mutationFn: ({ assetId, prompt }: { assetId: string; prompt?: string }) => api.regenerateCreativeAsset(assetId, prompt), onSuccess: () => qc.invalidateQueries({ queryKey: ["creative-assets", clientId] }) }); }
export function useDeleteCreativeAsset(clientId: string) { const qc = useQueryClient(); return useMutation({ mutationFn: (id: string) => api.deleteCreativeAsset(id), onSuccess: () => qc.invalidateQueries({ queryKey: ["creative-assets", clientId] }) }); }
export function useBrandProfile(clientId: string) { return useQuery({ queryKey: ["brand-profile", clientId], queryFn: () => api.getBrandProfile(clientId), enabled: !!clientId }); }
export function useSaveBrandProfile(clientId: string) { const qc = useQueryClient(); return useMutation({ mutationFn: (data: Parameters<typeof api.saveBrandProfile>[0]) => api.saveBrandProfile(data), onSuccess: () => qc.invalidateQueries({ queryKey: ["brand-profile", clientId] }) }); }

// ---------- Google Ads ----------
export function useAdsCampaigns(clientId: string) { return useQuery({ queryKey: ["ads-campaigns", clientId], queryFn: () => api.getAdsCampaigns(clientId), enabled: !!clientId }); }
export function useAdsRecommendations(clientId: string) { return useQuery({ queryKey: ["ads-recommendations", clientId], queryFn: () => api.getAdsRecommendations(clientId), enabled: !!clientId }); }
export function useAdsCopy(clientId: string) { return useQuery({ queryKey: ["ads-copy", clientId], queryFn: () => api.getAdsCopy(clientId), enabled: !!clientId }); }
export function useAdsInsights(clientId: string) { return useQuery({ queryKey: ["ads-insights", clientId], queryFn: () => api.getAdsInsights(clientId), enabled: !!clientId }); }
export function useAdsPerformance(clientId: string, days?: number) { return useQuery({ queryKey: ["ads-performance", clientId, days], queryFn: () => api.getAdsPerformance(clientId, days), enabled: !!clientId }); }
export function useGenerateAdsRecommendations() { const qc = useQueryClient(); return useMutation({ mutationFn: (clientId: string) => api.generateAdsRecommendations(clientId), onSuccess: (_d, clientId) => qc.invalidateQueries({ queryKey: ["ads-recommendations", clientId] }) }); }
export function useGenerateAdCopy(clientId: string) { const qc = useQueryClient(); return useMutation({ mutationFn: (data: Parameters<typeof api.generateAdCopy>[0]) => api.generateAdCopy(data), onSuccess: () => qc.invalidateQueries({ queryKey: ["ads-copy", clientId] }) }); }
export function useApproveAdCopy(clientId: string) { const qc = useQueryClient(); return useMutation({ mutationFn: (id: string) => api.approveAdCopy(id), onSuccess: () => qc.invalidateQueries({ queryKey: ["ads-copy", clientId] }) }); }
export function useUpdateAdsRecommendation(clientId: string) { const qc = useQueryClient(); return useMutation({ mutationFn: ({ recId, status }: { recId: string; status: string }) => api.updateAdsRecommendation(recId, status), onSuccess: () => qc.invalidateQueries({ queryKey: ["ads-recommendations", clientId] }) }); }
export function useSyncAds() { const qc = useQueryClient(); return useMutation({ mutationFn: (clientId: string) => api.syncAds(clientId), onSuccess: (_d, clientId) => { qc.invalidateQueries({ queryKey: ["ads-campaigns", clientId] }); qc.invalidateQueries({ queryKey: ["ads-insights", clientId] }); qc.invalidateQueries({ queryKey: ["ads-performance", clientId] }); } }); }

// ---------- Command Center ----------
export function useCommandCenterSummary(clientId: string) { return useQuery({ queryKey: ["command-center", clientId], queryFn: () => api.getCommandCenterSummary(clientId), enabled: !!clientId }); }
export function useMarketingPriorities(clientId: string, status?: string) { return useQuery({ queryKey: ["marketing-priorities", clientId, status], queryFn: () => api.getMarketingPriorities(clientId, status), enabled: !!clientId }); }
export function useCrossChannelRecommendations(clientId: string, status?: string) { return useQuery({ queryKey: ["cross-channel-recs", clientId, status], queryFn: () => api.getCrossChannelRecommendations(clientId, status), enabled: !!clientId }); }
export function useWeeklyActionPlans(clientId: string) { return useQuery({ queryKey: ["weekly-plans", clientId], queryFn: () => api.getWeeklyActionPlans(clientId), enabled: !!clientId }); }
export function useWeeklyPlanItems(planId: string) { return useQuery({ queryKey: ["weekly-plan-items", planId], queryFn: () => api.getWeeklyPlanItems(planId), enabled: !!planId }); }
export function useMarketingGoals(clientId: string) { return useQuery({ queryKey: ["marketing-goals", clientId], queryFn: () => api.getMarketingGoals(clientId), enabled: !!clientId }); }
export function useQuickWins(clientId: string) { return useQuery({ queryKey: ["quick-wins", clientId], queryFn: () => api.getQuickWins(clientId), enabled: !!clientId }); }
export function useRecomputePriorities() { const qc = useQueryClient(); return useMutation({ mutationFn: (clientId: string) => api.recomputePriorities(clientId), onSuccess: (_d, clientId) => { qc.invalidateQueries({ queryKey: ["marketing-priorities", clientId] }); qc.invalidateQueries({ queryKey: ["command-center", clientId] }); qc.invalidateQueries({ queryKey: ["quick-wins", clientId] }); } }); }
export function useGenerateCrossChannelRecs() { const qc = useQueryClient(); return useMutation({ mutationFn: (clientId: string) => api.generateCrossChannelRecommendations(clientId), onSuccess: (_d, clientId) => qc.invalidateQueries({ queryKey: ["cross-channel-recs", clientId] }) }); }
export function useGenerateWeeklyPlan() { const qc = useQueryClient(); return useMutation({ mutationFn: (clientId: string) => api.generateWeeklyPlan(clientId), onSuccess: (_d, clientId) => { qc.invalidateQueries({ queryKey: ["weekly-plans", clientId] }); qc.invalidateQueries({ queryKey: ["command-center", clientId] }); } }); }
export function useUpdatePriorityStatus(clientId: string) { const qc = useQueryClient(); return useMutation({ mutationFn: ({ priorityId, status }: { priorityId: string; status: string }) => api.updateMarketingPriority(priorityId, status), onSuccess: () => { qc.invalidateQueries({ queryKey: ["marketing-priorities", clientId] }); qc.invalidateQueries({ queryKey: ["command-center", clientId] }); } }); }
export function useUpdateRecommendationStatus(clientId: string) { const qc = useQueryClient(); return useMutation({ mutationFn: ({ recId, status }: { recId: string; status: string }) => api.updateCrossChannelRecommendation(recId, status), onSuccess: () => qc.invalidateQueries({ queryKey: ["cross-channel-recs", clientId] }) }); }
export function useUpdateWeeklyItemStatus(clientId: string, planId: string) { const qc = useQueryClient(); return useMutation({ mutationFn: ({ itemId, status }: { itemId: string; status: string }) => api.updateWeeklyItem(itemId, status), onSuccess: () => { qc.invalidateQueries({ queryKey: ["weekly-plan-items", planId] }); qc.invalidateQueries({ queryKey: ["command-center", clientId] }); } }); }

// ---------- Attribution (analytics-only) ----------
export function useAttributionOverview(clientId: string) { return useQuery({ queryKey: ["attribution-overview", clientId], queryFn: () => api.getAttributionOverview(clientId), enabled: !!clientId }); }
export function useAttributionContacts(clientId: string) { return useQuery({ queryKey: ["attribution-contacts", clientId], queryFn: () => api.getAttributionContacts(clientId), enabled: !!clientId }); }
export function useAttributionDeals(clientId: string) { return useQuery({ queryKey: ["attribution-deals", clientId], queryFn: () => api.getAttributionDeals(clientId), enabled: !!clientId }); }
export function useRecomputeAttribution() { const qc = useQueryClient(); return useMutation({ mutationFn: (clientId: string) => api.recomputeAttribution(clientId), onSuccess: (_d, clientId) => { qc.invalidateQueries({ queryKey: ["attribution-overview", clientId] }); qc.invalidateQueries({ queryKey: ["attribution-contacts", clientId] }); qc.invalidateQueries({ queryKey: ["attribution-deals", clientId] }); } }); }

// ---------- Onboarding ----------
export function useStartOnboarding() { return useMutation({ mutationFn: (workspaceId: string) => api.startOnboarding(workspaceId) }); }
export function useCompleteOnboarding() { return useMutation({ mutationFn: (workspaceId: string) => api.completeOnboarding(workspaceId) }); }
export function useTemplates(industry?: string) { return useQuery({ queryKey: ["templates", industry], queryFn: () => api.getTemplates(industry) }); }
export function useRunSetup() { return useMutation({ mutationFn: (data: { workspace_id: string; client_id: string; template_id: string }) => api.runSetup(data) }); }
export function useActivationChecklist(clientId: string) { return useQuery({ queryKey: ["activation-checklist", clientId], queryFn: () => api.getActivationChecklist(clientId), enabled: !!clientId }); }
export function useUpdateChecklistItem(clientId: string) { const qc = useQueryClient(); return useMutation({ mutationFn: ({ itemId, status }: { itemId: string; status: string }) => api.updateChecklistItem(itemId, status), onSuccess: () => qc.invalidateQueries({ queryKey: ["activation-checklist", clientId] }) }); }

// ---------- Reports ----------
export function useReportTemplates(workspaceId?: string) { return useQuery({ queryKey: ["report-templates", workspaceId], queryFn: () => api.getReportTemplates(workspaceId) }); }
export function useReportRuns(clientId: string) { return useQuery({ queryKey: ["report-runs", clientId], queryFn: () => api.getReportRuns(clientId), enabled: !!clientId }); }
export function useGenerateReport() { const qc = useQueryClient(); return useMutation({ mutationFn: (data: { workspace_id: string; client_id: string; template_id: string; date_from: string; date_to: string }) => api.generateReportApi(data), onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ["report-runs", vars.client_id] }) }); }
export function useScheduledReports(workspaceId: string) { return useQuery({ queryKey: ["scheduled-reports", workspaceId], queryFn: () => api.getScheduledReports(workspaceId), enabled: !!workspaceId }); }
export function useCreateScheduledReport() { const qc = useQueryClient(); return useMutation({ mutationFn: (data: any) => api.createScheduledReport(data), onSuccess: () => qc.invalidateQueries({ queryKey: ["scheduled-reports"] }) }); }

// ---------- Activity Log ----------
export function useActivityLog(params?: { client_id?: string; entity_type?: string; limit?: number }) {
  return useQuery({ queryKey: ["activity-log", params], queryFn: () => api.getActivityLog(params) });
}

// ---------- Notifications ----------
export function useNotifications(params?: { is_read?: boolean; category?: string }) {
  return useQuery({ queryKey: ["notifications", params], queryFn: () => api.getNotifications(params), refetchInterval: 30000 });
}
export function useUnreadCount() {
  return useQuery({ queryKey: ["unread-count"], queryFn: api.getUnreadCount, refetchInterval: 30000 });
}
export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => api.markNotificationRead(id), onSuccess: () => { qc.invalidateQueries({ queryKey: ["notifications"] }); qc.invalidateQueries({ queryKey: ["unread-count"] }); } });
}
export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: () => api.markAllNotificationsRead(), onSuccess: () => { qc.invalidateQueries({ queryKey: ["notifications"] }); qc.invalidateQueries({ queryKey: ["unread-count"] }); } });
}

// ---------- Job Center ----------
export function useAllPublishingJobs(params?: { status?: string; client_id?: string }) {
  return useQuery({ queryKey: ["all-publishing-jobs", params], queryFn: () => api.getAllPublishingJobs(params), refetchInterval: 15000 });
}

// ---------- AI Visibility ----------
export function useAiVisPromptSets(clientId: string) { return useQuery({ queryKey: ["ai-vis-prompt-sets", clientId], queryFn: () => api.getAiVisPromptSets(clientId), enabled: !!clientId }); }
export function useCreateAiVisPromptSet() { const qc = useQueryClient(); return useMutation({ mutationFn: (data: Parameters<typeof api.createAiVisPromptSet>[0]) => api.createAiVisPromptSet(data), onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ["ai-vis-prompt-sets", vars.client_id] }) }); }
export function useDeleteAiVisPromptSet(clientId: string) { const qc = useQueryClient(); return useMutation({ mutationFn: (id: string) => api.deleteAiVisPromptSet(id), onSuccess: () => qc.invalidateQueries({ queryKey: ["ai-vis-prompt-sets", clientId] }) }); }
export function useAiVisPrompts(setId: string) { return useQuery({ queryKey: ["ai-vis-prompts", setId], queryFn: () => api.getAiVisPrompts(setId), enabled: !!setId }); }
export function useCreateAiVisPromptsBulk(setId: string) { const qc = useQueryClient(); return useMutation({ mutationFn: (data: Parameters<typeof api.createAiVisPromptsBulk>[0]) => api.createAiVisPromptsBulk(data), onSuccess: () => qc.invalidateQueries({ queryKey: ["ai-vis-prompts", setId] }) }); }
export function useAiVisRuns(clientId: string) { return useQuery({ queryKey: ["ai-vis-runs", clientId], queryFn: () => api.getAiVisRuns(clientId), enabled: !!clientId }); }
export function useStartAiVisRun(clientId: string) { const qc = useQueryClient(); return useMutation({ mutationFn: (data: Parameters<typeof api.startAiVisRun>[0]) => api.startAiVisRun(data), onSuccess: () => { qc.invalidateQueries({ queryKey: ["ai-vis-runs", clientId] }); qc.invalidateQueries({ queryKey: ["ai-vis-overview", clientId] }); } }); }
export function useAiVisObservations(runId: string) { return useQuery({ queryKey: ["ai-vis-observations", runId], queryFn: () => api.getAiVisObservations(runId), enabled: !!runId }); }
export function useUpdateAiVisObservation(runId: string) { const qc = useQueryClient(); return useMutation({ mutationFn: ({ id, data }: { id: string; data: any }) => api.updateAiVisObservation(id, data), onSuccess: () => qc.invalidateQueries({ queryKey: ["ai-vis-observations", runId] }) }); }
export function useAiVisOverview(clientId: string) { return useQuery({ queryKey: ["ai-vis-overview", clientId], queryFn: () => api.getAiVisOverview(clientId), enabled: !!clientId }); }

// ---------- Competitor Benchmarks ----------
export function useCompetitorBenchmarks(clientId: string) {
  return useQuery({ queryKey: ["competitor-benchmarks", clientId], queryFn: () => api.getCompetitorBenchmarks(clientId), enabled: !!clientId });
}
export function useCompetitorBenchmarkDetail(id: string) {
  return useQuery({ queryKey: ["competitor-benchmark", id], queryFn: () => api.getCompetitorBenchmarkDetail(id), enabled: !!id });
}
export function useStartCompetitorBenchmark(clientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Parameters<typeof api.startCompetitorBenchmark>[0], "client_id">) =>
      api.startCompetitorBenchmark({ ...data, client_id: clientId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["competitor-benchmarks", clientId] }),
  });
}

// ---------- Planning Memory ----------
export function useContentInventory(clientId: string) {
  return useQuery({ queryKey: ["content-inventory", clientId], queryFn: () => api.getContentInventory(clientId), enabled: !!clientId });
}
export function useContentPerformance(clientId: string) {
  return useQuery({ queryKey: ["content-performance", clientId], queryFn: () => api.getContentPerformance(clientId), enabled: !!clientId });
}
export function usePublishedContentRecords(clientId: string) {
  return useQuery({ queryKey: ["published-content", clientId], queryFn: () => api.getPublishedContentRecords(clientId), enabled: !!clientId });
}
export function usePageRelationships(clientId: string) {
  return useQuery({ queryKey: ["page-relationships", clientId], queryFn: () => api.getPageRelationships(clientId), enabled: !!clientId });
}
export function useRankSnapshots(clientId: string, keywordId?: string) {
  return useQuery({ queryKey: ["rank-snapshots", clientId, keywordId], queryFn: () => api.getRankSnapshots(clientId, keywordId), enabled: !!clientId });
}
