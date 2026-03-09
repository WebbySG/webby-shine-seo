import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useClient, useKeywords, useCompetitors, useAuditIssues, useInternalLinks, useContentPlan, useBriefs, useGenerateBrief, useArticles, useGenerateArticle, useUpdateArticle, useApproveArticle, usePublishArticle, useCmsConnection, useSaveCmsConnection, useTestCmsConnection, useSocialPosts, useGenerateSocialPosts, useUpdateSocialPost, useApproveSocialPost, useVideos, useGenerateVideo, useUpdateVideo, useApproveVideo, usePublishingJobs, useScheduleJob, useRetryJob, useCancelJob } from "@/hooks/use-api";
import { clients as dummyClients, getClientRankings, getClientCompetitors, getClientAuditIssues } from "@/data/dummy";
import { RankChangeIndicator } from "@/components/RankChangeIndicator";
import { ArrowLeft, Globe, TrendingUp, TrendingDown, Target, Link2, ExternalLink, FileText, FolderTree, BookOpen, Sparkles, ChevronDown, ChevronUp, Pencil, Check, X, FileEdit, Settings, Upload, Loader2, Share2, MessageSquare, Video, Play, User, Clock, RotateCcw, Ban, Calendar as CalendarIcon, ListTodo, Key, AlertTriangle, Activity, BarChart3 } from "lucide-react";
import type { InternalLinkSuggestion, ContentSuggestion, ContentPlanCluster, SeoBrief, SeoArticle, CmsConnection, SocialPost, VideoAsset, PublishingJob } from "@/lib/api";
import { toast } from "sonner";

const PRIORITY_BADGE: Record<string, "destructive" | "secondary" | "outline"> = {
  high: "destructive",
  medium: "secondary",
  low: "outline",
};

function buildDummyInternalLinks(): InternalLinkSuggestion[] {
  return [
    { id: "il1", from_url: "https://renovo.sg/services", to_url: "https://renovo.sg/kitchen", anchor_text: "kitchen renovation singapore", reason: 'Boost "kitchen renovation singapore" (currently #9) by adding internal link from related page.', priority: "high", status: "pending", created_at: new Date().toISOString() },
    { id: "il2", from_url: "https://renovo.sg/hdb", to_url: "https://renovo.sg/condo", anchor_text: "condo renovation singapore", reason: 'Link from high-ranking page (#4) to boost "condo renovation singapore" at #11.', priority: "high", status: "pending", created_at: new Date().toISOString() },
    { id: "il3", from_url: "https://renovo.sg/blog/ideas", to_url: "https://renovo.sg/interior", anchor_text: "interior design singapore", reason: 'Boost "interior design singapore" (currently #18) by adding internal link from related page.', priority: "medium", status: "pending", created_at: new Date().toISOString() },
  ];
}

function buildDummyContentPlan(): ContentPlanCluster[] {
  return [
    {
      cluster_name: "renovation singapore",
      high_priority_count: 2,
      suggestions: [
        { id: "cs1", cluster_name: "renovation singapore", keyword: "renovation cost singapore 2026", suggested_slug: "/renovation-cost-singapore-2026", reason: "Competitor renocraft.sg ranks #3. Create dedicated content to capture this traffic.", priority: "high", status: "pending", created_at: new Date().toISOString() },
        { id: "cs2", cluster_name: "renovation singapore", keyword: "hdb renovation package", suggested_slug: "/hdb-renovation-package", reason: "Competitor buildmate.sg ranks #5. Create dedicated content to capture this traffic.", priority: "high", status: "pending", created_at: new Date().toISOString() },
        { id: "cs3", cluster_name: "renovation singapore", keyword: "renovation timeline singapore", suggested_slug: "/renovation-timeline-singapore", reason: 'Supporting content for the "renovation singapore" topic cluster. Builds topical authority.', priority: "low", status: "pending", created_at: new Date().toISOString() },
      ],
    },
    {
      cluster_name: "kitchen renovation",
      high_priority_count: 1,
      suggestions: [
        { id: "cs4", cluster_name: "kitchen renovation", keyword: "kitchen cabinet design singapore", suggested_slug: "/kitchen-cabinet-design-singapore", reason: "Keyword ranks #22 but has no dedicated target page. Create optimized content.", priority: "medium", status: "pending", created_at: new Date().toISOString() },
        { id: "cs5", cluster_name: "kitchen renovation", keyword: "small kitchen renovation ideas", suggested_slug: "/small-kitchen-renovation-ideas", reason: "Competitor renocraft.sg ranks #7. Create dedicated content to capture this traffic.", priority: "high", status: "pending", created_at: new Date().toISOString() },
      ],
    },
  ];
}

function buildDummyBriefs(): SeoBrief[] {
  return [
    {
      id: "b1", keyword: "renovation singapore", title: "Renovation Singapore: Complete Guide (2026)",
      meta_description: "Learn everything about renovation singapore. Our comprehensive 2026 guide covers costs, tips, and expert advice.",
      headings: [
        { level: "H1", text: "Renovation Singapore: Complete Guide (2026)" },
        { level: "H2", text: "What Is Renovation Singapore?" },
        { level: "H2", text: "Why Renovation Singapore Matters" },
        { level: "H3", text: "Key Benefits" },
        { level: "H2", text: "How to Choose the Best Renovation Singapore" },
        { level: "H2", text: "Frequently Asked Questions" },
      ],
      faq: [
        { question: "How much does renovation singapore cost?", answer: "Costs vary depending on scope, materials, and provider." },
        { question: "How long does renovation singapore take?", answer: "Typical timelines range from a few weeks to several months." },
      ],
      entities: ["renovation", "singapore", "cost", "guide", "tips"],
      internal_links: [
        { from: "https://renovo.sg/services", to: "https://renovo.sg/kitchen", anchor: "kitchen renovation singapore" },
      ],
      status: "draft", created_at: new Date().toISOString(),
    },
  ];
}

function buildDummyArticles(): SeoArticle[] {
  return [
    {
      id: "a1",
      brief_id: "b1",
      title: "Renovation Singapore: Complete Guide (2026)",
      meta_description: "Learn everything about renovation singapore. Our comprehensive 2026 guide covers costs, tips, and expert advice.",
      content: `# Renovation Singapore: Complete Guide (2026)

Looking for comprehensive information about **renovation singapore**? You've come to the right place.

## What Is Renovation Singapore?

When it comes to renovation in Singapore, there are several important aspects to consider.

## Why Renovation Singapore Matters

Understanding the importance of renovation helps you make informed decisions.

## Frequently Asked Questions

### How much does renovation singapore cost?

Costs vary depending on scope, materials, and provider.

## Conclusion

We hope this comprehensive guide to **renovation singapore** has been helpful.`,
      status: "draft",
      target_keyword: "renovation singapore",
      slug: "/renovation-singapore",
      publish_date: null,
      cms_post_id: null,
      cms_post_url: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];
}

export default function ClientDetail() {
  const { id } = useParams<{ id: string }>();
  const [expandedBrief, setExpandedBrief] = useState<string | null>(null);
  const [editingArticle, setEditingArticle] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ title: string; meta_description: string; content: string; slug: string }>({ title: "", meta_description: "", content: "", slug: "" });
  const [cmsForm, setCmsForm] = useState<{ site_url: string; username: string; application_password: string }>({ site_url: "", username: "", application_password: "" });
  const [selectedArticleForSocial, setSelectedArticleForSocial] = useState<string | null>(null);
  const [editingSocialPost, setEditingSocialPost] = useState<string | null>(null);
  const [socialEditContent, setSocialEditContent] = useState("");
  const [editingVideo, setEditingVideo] = useState<string | null>(null);
  const [videoEditForm, setVideoEditForm] = useState<{ video_script: string; caption_text: string; avatar_type: string; voice_type: string }>({ video_script: "", caption_text: "", avatar_type: "professional", voice_type: "friendly" });
  const [videoGenForm, setVideoGenForm] = useState<{ source: "article" | "social"; sourceId: string; platform: string; avatar_type: string; voice_type: string }>({ source: "article", sourceId: "", platform: "tiktok", avatar_type: "professional", voice_type: "friendly" });
  const [scheduleDateTime, setScheduleDateTime] = useState("");

  const { data: apiClient } = useClient(id!);
  const { data: apiKeywords } = useKeywords(id!);
  const { data: apiCompetitors } = useCompetitors(id!);
  const { data: apiAuditIssues } = useAuditIssues(id!);
  const { data: apiInternalLinks } = useInternalLinks(id!);
  const { data: apiContentPlan } = useContentPlan(id!);
  const { data: apiBriefs } = useBriefs(id!);
  const { data: apiArticles } = useArticles(id!);
  const { data: apiCmsConnection } = useCmsConnection(id!);
  const generateBrief = useGenerateBrief(id!);
  const generateArticle = useGenerateArticle(id!);
  const updateArticle = useUpdateArticle(id!);
  const approveArticle = useApproveArticle(id!);
  const publishArticle = usePublishArticle(id!);
  const saveCmsConnection = useSaveCmsConnection(id!);
  const testCmsConnection = useTestCmsConnection(id!);
  const generateSocialPosts = useGenerateSocialPosts(id!);
  const { data: apiSocialPosts } = useSocialPosts(selectedArticleForSocial || "");
  const updateSocialPost = useUpdateSocialPost(selectedArticleForSocial || "");
  const approveSocialPost = useApproveSocialPost(selectedArticleForSocial || "");

  const socialPosts: SocialPost[] = apiSocialPosts ?? [];
  const { data: apiVideos } = useVideos(id!);
  const generateVideo = useGenerateVideo(id!);
  const updateVideoMut = useUpdateVideo(id!);
  const approveVideo = useApproveVideo(id!);
  const videos: VideoAsset[] = apiVideos ?? [];
  const { data: apiJobs } = usePublishingJobs(id!);
  const scheduleJob = useScheduleJob(id!);
  const retryJob = useRetryJob(id!);
  const cancelJob = useCancelJob(id!);
  const jobs: PublishingJob[] = apiJobs ?? [];

  const cmsConnection: CmsConnection | null = apiCmsConnection ?? null;

  const dummyClient = dummyClients.find((c) => c.id === id);
  const client = apiClient ?? dummyClient;

  const kws = apiKeywords ?? getClientRankings(id!).map(r => ({
    ...r, current_position: r.current_position, last_position: r.last_position, change: r.change, ranking_url: r.ranking_url, tracked_date: r.tracked_date
  }));

  const comps = apiCompetitors ?? getClientCompetitors(id!).map(c => ({
    id: c.id, domain: c.domain, label: null, source: "manual", confirmed: true
  }));

  const issues = apiAuditIssues ?? getClientAuditIssues(id!).map(i => ({
    id: i.id, issue_type: i.type, severity: i.severity, affected_url: i.affected_url,
    description: i.description, fix_instruction: i.fix_instruction, status: i.status
  }));

  const internalLinks: InternalLinkSuggestion[] = apiInternalLinks ?? buildDummyInternalLinks();
  const contentClusters: ContentPlanCluster[] = apiContentPlan?.clusters ?? buildDummyContentPlan();
  const contentTotal = apiContentPlan?.total ?? contentClusters.reduce((acc, c) => acc + c.suggestions.length, 0);

  const briefs: SeoBrief[] = apiBriefs ?? buildDummyBriefs();
  const articles: SeoArticle[] = apiArticles ?? buildDummyArticles();

  const handleGenerateBrief = (keyword: string) => {
    generateBrief.mutate(keyword, {
      onSuccess: () => toast.success(`Brief generated for "${keyword}"`),
      onError: () => toast.error("Failed to generate brief"),
    });
  };

  const handleGenerateArticle = (briefId: string) => {
    generateArticle.mutate(briefId, {
      onSuccess: () => toast.success("Article generated!"),
      onError: () => toast.error("Failed to generate article"),
    });
  };

  const startEditing = (article: SeoArticle) => {
    setEditingArticle(article.id);
    setEditForm({
      title: article.title,
      meta_description: article.meta_description,
      content: article.content,
      slug: article.slug || "",
    });
  };

  const saveArticle = (articleId: string) => {
    updateArticle.mutate({ articleId, data: editForm }, {
      onSuccess: () => {
        toast.success("Article saved");
        setEditingArticle(null);
      },
      onError: () => toast.error("Failed to save article"),
    });
  };

  const handleApprove = (articleId: string) => {
    approveArticle.mutate(articleId, {
      onSuccess: () => toast.success("Article approved!"),
      onError: () => toast.error("Failed to approve article"),
    });
  };

  const handlePublish = (articleId: string) => {
    if (!cmsConnection) {
      toast.error("Please configure WordPress connection first in Settings tab");
      return;
    }
    publishArticle.mutate({ articleId }, {
      onSuccess: (data) => {
        toast.success(`Published to WordPress! View at ${data.wordpress.url}`);
      },
      onError: (err: any) => toast.error(err.message || "Failed to publish"),
    });
  };

  const handleSaveCms = () => {
    if (!cmsForm.site_url || !cmsForm.username || !cmsForm.application_password) {
      toast.error("All fields are required");
      return;
    }
    saveCmsConnection.mutate(cmsForm, {
      onSuccess: () => {
        toast.success("WordPress connection saved!");
        setCmsForm({ site_url: "", username: "", application_password: "" });
      },
      onError: () => toast.error("Failed to save connection"),
    });
  };

  const handleTestCms = () => {
    testCmsConnection.mutate(undefined, {
      onSuccess: () => toast.success("Connection successful!"),
      onError: (err: any) => toast.error(err.message || "Connection failed"),
    });
  };

  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="p-4 rounded-full bg-muted mb-4">
          <Globe className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground font-medium">Client not found.</p>
        <Link to="/clients"><Button variant="ghost" className="mt-3">← Back to Clients</Button></Link>
      </div>
    );
  }

  const gainers = [...kws].filter((r) => (r.change ?? 0) > 0).sort((a, b) => (b.change ?? 0) - (a.change ?? 0)).slice(0, 5);
  const losers = [...kws].filter((r) => (r.change ?? 0) < 0).sort((a, b) => (a.change ?? 0) - (b.change ?? 0)).slice(0, 5);
  const nearWins = kws.filter((r) => (r.current_position ?? 100) >= 11 && (r.current_position ?? 100) <= 20);
  const openIssues = issues.filter((i) => i.status !== "done");
  const pendingLinks = internalLinks.filter((l) => l.status === "pending");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/clients">
          <Button variant="outline" size="icon" className="shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">{client.name}</h1>
          <p className="text-sm text-muted-foreground font-mono flex items-center gap-1.5 mt-0.5">
            <Globe className="h-3 w-3" />{client.domain}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-lg border">
            <Activity className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Health</span>
            <Badge variant={client.health_score >= 80 ? "default" : client.health_score >= 60 ? "secondary" : "destructive"} className="text-xs font-mono">
              {client.health_score}%
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-6">
        {[
          { label: "Keywords", value: kws.length, icon: Key, color: "border-l-blue-500", iconColor: "text-blue-500", bg: "bg-blue-500/10" },
          { label: "Competitors", value: comps.length, icon: Users2, color: "border-l-violet-500", iconColor: "text-violet-500", bg: "bg-violet-500/10" },
          { label: "Open Issues", value: openIssues.length, icon: AlertTriangle, color: "border-l-destructive", iconColor: "text-destructive", bg: "bg-destructive/10" },
          { label: "Link Suggestions", value: pendingLinks.length, icon: Link2, color: "border-l-primary", iconColor: "text-primary", bg: "bg-primary/10" },
          { label: "Content Ideas", value: contentTotal, icon: FileText, color: "border-l-green-500", iconColor: "text-green-500", bg: "bg-green-500/10" },
          { label: "Health Score", value: `${client.health_score}%`, icon: Activity, color: "border-l-amber-500", iconColor: "text-amber-500", bg: "bg-amber-500/10" },
        ].map((s) => (
          <Card key={s.label} className={`${s.color} border-l-4 hover-lift`}>
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <div className={`p-1 rounded ${s.bg}`}>
                  <s.icon className={`h-3 w-3 ${s.iconColor}`} />
                </div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
              </div>
              <p className="text-lg font-bold">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="rankings" className="space-y-4">
        <TabsList className="flex-wrap h-auto gap-1 bg-muted/50 border p-1">
          <TabsTrigger value="rankings" className="gap-1.5 text-xs"><BarChart3 className="h-3 w-3" />Rankings</TabsTrigger>
          <TabsTrigger value="movers" className="gap-1.5 text-xs"><TrendingUp className="h-3 w-3" />Movers</TabsTrigger>
          <TabsTrigger value="competitors" className="gap-1.5 text-xs"><Users2 className="h-3 w-3" />Competitors</TabsTrigger>
          <TabsTrigger value="internal-links" className="gap-1.5 text-xs"><Link2 className="h-3 w-3" />Links ({pendingLinks.length})</TabsTrigger>
          <TabsTrigger value="content-plan" className="gap-1.5 text-xs"><FolderTree className="h-3 w-3" />Content ({contentTotal})</TabsTrigger>
          <TabsTrigger value="briefs" className="gap-1.5 text-xs"><BookOpen className="h-3 w-3" />Briefs ({briefs.length})</TabsTrigger>
          <TabsTrigger value="articles" className="gap-1.5 text-xs"><FileEdit className="h-3 w-3" />Articles ({articles.length})</TabsTrigger>
          <TabsTrigger value="social" className="gap-1.5 text-xs"><Share2 className="h-3 w-3" />Social</TabsTrigger>
          <TabsTrigger value="videos" className="gap-1.5 text-xs"><Video className="h-3 w-3" />Videos ({videos.length})</TabsTrigger>
          <TabsTrigger value="jobs" className="gap-1.5 text-xs"><ListTodo className="h-3 w-3" />Jobs ({jobs.filter(j => j.publish_status !== "published" && j.publish_status !== "cancelled").length})</TabsTrigger>
          <TabsTrigger value="issues" className="gap-1.5 text-xs"><AlertTriangle className="h-3 w-3" />Issues ({openIssues.length})</TabsTrigger>
          <TabsTrigger value="settings" className="gap-1.5 text-xs"><Settings className="h-3 w-3" />Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="rankings">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="p-3 font-medium text-muted-foreground text-left">Keyword</th>
                      <th className="p-3 font-medium text-muted-foreground text-center">Position</th>
                      <th className="p-3 font-medium text-muted-foreground text-center">Previous</th>
                      <th className="p-3 font-medium text-muted-foreground text-center">Change</th>
                      <th className="p-3 font-medium text-muted-foreground text-left">URL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {kws.map((r) => (
                      <tr key={r.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="p-3 font-medium">{r.keyword}</td>
                        <td className="p-3 text-center">
                          <span className={`font-mono px-2 py-0.5 rounded text-xs font-semibold ${
                            (r.current_position ?? 100) <= 3 ? 'bg-green-100 text-green-700' :
                            (r.current_position ?? 100) <= 10 ? 'bg-blue-100 text-blue-700' :
                            (r.current_position ?? 100) <= 20 ? 'bg-amber-100 text-amber-700' :
                            'bg-muted text-muted-foreground'
                          }`}>
                            {r.current_position ?? "–"}
                          </span>
                        </td>
                        <td className="p-3 text-center font-mono text-muted-foreground">{r.last_position ?? "–"}</td>
                        <td className="p-3 text-center"><RankChangeIndicator change={r.change ?? 0} /></td>
                        <td className="p-3 text-xs font-mono text-muted-foreground truncate max-w-[200px]">{r.ranking_url ?? "–"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="movers">
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-green-500/10"><TrendingUp className="h-4 w-4 text-green-500" /></div>
                  Gainers
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {gainers.length === 0 && <p className="text-sm text-muted-foreground">No gainers this week.</p>}
                {gainers.map((r) => (
                  <div key={r.id} className="flex justify-between py-2.5 px-2 border-b last:border-0 hover:bg-muted/20 rounded transition-colors">
                    <span className="text-sm">{r.keyword}</span>
                    <RankChangeIndicator change={r.change ?? 0} />
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-destructive">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-destructive/10"><TrendingDown className="h-4 w-4 text-destructive" /></div>
                  Losers
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {losers.length === 0 && <p className="text-sm text-muted-foreground">No losers this week.</p>}
                {losers.map((r) => (
                  <div key={r.id} className="flex justify-between py-2.5 px-2 border-b last:border-0 hover:bg-muted/20 rounded transition-colors">
                    <span className="text-sm">{r.keyword}</span>
                    <RankChangeIndicator change={r.change ?? 0} />
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-amber-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-amber-500/10"><Target className="h-4 w-4 text-amber-500" /></div>
                  Near Wins (11–20)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {nearWins.length === 0 && <p className="text-sm text-muted-foreground">No near wins.</p>}
                {nearWins.map((r) => (
                  <div key={r.id} className="flex justify-between py-2.5 px-2 border-b last:border-0 hover:bg-muted/20 rounded transition-colors">
                    <span className="text-sm">{r.keyword}</span>
                    <span className="font-mono text-sm font-semibold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded text-xs">#{r.current_position}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="competitors">
          <div className="grid gap-4 sm:grid-cols-2">
            {comps.map((c) => (
              <Card key={c.id} className="hover-lift border-l-4 border-l-violet-500">
                <CardContent className="p-5 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-violet-500/10">
                    <Globe className="h-4 w-4 text-violet-500" />
                  </div>
                  <div>
                    <p className="font-mono font-medium">{c.domain}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{c.label || "Competitor"}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
            {comps.length === 0 && <p className="text-sm text-muted-foreground">No competitors added yet.</p>}
          </div>
        </TabsContent>

        <TabsContent value="internal-links">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-primary/10"><Link2 className="h-4 w-4 text-primary" /></div>
                Internal Link Suggestions
                <Badge variant="outline" className="text-xs ml-auto">{pendingLinks.length} pending</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {pendingLinks.length === 0 && <p className="text-sm text-muted-foreground">No internal link suggestions at the moment.</p>}
              {pendingLinks.map((link) => (
                <div key={link.id} className="p-4 rounded-lg border border-l-4 border-l-primary bg-muted/10 hover-lift space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={PRIORITY_BADGE[link.priority]} className="text-xs">{link.priority}</Badge>
                    <span className="text-sm font-medium">"{link.anchor_text}"</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-mono truncate max-w-[280px]">{link.from_url}</span>
                    <span className="text-primary">→</span>
                    <span className="font-mono truncate max-w-[280px]">{link.to_url}</span>
                    <a href={link.to_url} target="_blank" rel="noopener noreferrer" className="ml-1 hover:text-primary transition-colors">
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{link.reason}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content-plan">
          <div className="space-y-6">
            {contentClusters.length === 0 && <p className="text-sm text-muted-foreground">No content suggestions at the moment.</p>}
            {contentClusters.map((cluster) => (
              <Card key={cluster.cluster_name} className="border-l-4 border-l-green-500">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-green-500/10"><FolderTree className="h-4 w-4 text-green-500" /></div>
                    <span className="capitalize">{cluster.cluster_name}</span>
                    {cluster.high_priority_count > 0 && (
                      <Badge variant="destructive" className="text-xs ml-2">{cluster.high_priority_count} high priority</Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {cluster.suggestions.map((s) => (
                    <div key={s.id} className="p-4 rounded-lg border bg-muted/10 hover-lift space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant={PRIORITY_BADGE[s.priority]} className="text-xs">{s.priority}</Badge>
                        <span className="text-sm font-medium">{s.keyword}</span>
                      </div>
                      {s.suggested_slug && (
                        <div className="flex items-center gap-2 text-xs">
                          <FileText className="h-3 w-3 text-muted-foreground" />
                          <span className="font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{s.suggested_slug}</span>
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground leading-relaxed">{s.reason}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="briefs">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <BookOpen className="h-4 w-4" /> SEO Content Briefs
              </h3>
              <Button
                size="sm"
                variant="outline"
                disabled={generateBrief.isPending}
                onClick={() => {
                  const keyword = prompt("Enter keyword to generate a brief for:");
                  if (keyword) handleGenerateBrief(keyword);
                }}
                className="gap-1.5"
              >
                <Sparkles className="h-3.5 w-3.5" />
                {generateBrief.isPending ? "Generating…" : "Generate Brief"}
              </Button>
            </div>

            {briefs.length === 0 && (
              <Card className="border-dashed">
                <CardContent className="py-8 text-center text-muted-foreground">
                  <p className="text-sm">No briefs generated yet. Click "Generate Brief" to create one.</p>
                </CardContent>
              </Card>
            )}

            {briefs.map((brief) => {
              const isExpanded = expandedBrief === brief.id;
              return (
                <Card key={brief.id} className="hover-lift">
                  <CardContent className="p-0">
                    <button
                      className="w-full p-4 flex items-center justify-between text-left hover:bg-muted/20 transition-colors rounded-t-lg"
                      onClick={() => setExpandedBrief(isExpanded ? null : brief.id)}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-1.5 rounded-md bg-primary/10">
                          <BookOpen className="h-4 w-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{brief.title}</p>
                          <p className="text-xs text-muted-foreground">Keyword: {brief.keyword}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="outline" className="text-xs">{brief.status}</Badge>
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="px-4 pb-4 space-y-4 border-t pt-4">
                        <div>
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Meta Description</p>
                          <p className="text-sm bg-muted/30 p-3 rounded-lg border border-border/50">{brief.meta_description}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Content Structure</p>
                          <div className="space-y-1">
                            {brief.headings.map((h, i) => (
                              <div key={i} className="text-sm flex items-center gap-2" style={{ paddingLeft: h.level === "H1" ? 0 : h.level === "H2" ? 12 : 24 }}>
                                <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0">{h.level}</Badge>
                                <span>{h.text}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">FAQ Questions</p>
                          <div className="space-y-2">
                            {brief.faq.map((f, i) => (
                              <div key={i} className="bg-muted/30 p-3 rounded-lg border border-border/50">
                                <p className="text-sm font-medium">{f.question}</p>
                                <p className="text-xs text-muted-foreground mt-1">{f.answer}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Target Entities</p>
                          <div className="flex flex-wrap gap-1.5">
                            {brief.entities.map((e, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">{e}</Badge>
                            ))}
                          </div>
                        </div>
                        {brief.internal_links.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Suggested Internal Links</p>
                            <div className="space-y-1">
                              {brief.internal_links.map((l, i) => (
                                <div key={i} className="text-xs flex items-center gap-2 text-muted-foreground">
                                  <span className="font-mono truncate max-w-[200px]">{l.from}</span>
                                  <span className="text-primary">→</span>
                                  <span className="font-mono truncate max-w-[200px]">{l.to}</span>
                                  <span className="text-primary font-medium">"{l.anchor}"</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="articles">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <FileEdit className="h-4 w-4" /> SEO Article Drafts
              </h3>
              {briefs.length > 0 && (
                <select
                  className="text-sm border rounded-md px-2 py-1.5 bg-card"
                  defaultValue=""
                  onChange={(e) => {
                    if (e.target.value) handleGenerateArticle(e.target.value);
                    e.target.value = "";
                  }}
                  disabled={generateArticle.isPending}
                >
                  <option value="" disabled>{generateArticle.isPending ? "Generating…" : "Generate from brief…"}</option>
                  {briefs.map((b) => (
                    <option key={b.id} value={b.id}>{b.keyword}</option>
                  ))}
                </select>
              )}
            </div>

            {articles.length === 0 && (
              <Card className="border-dashed">
                <CardContent className="py-8 text-center text-muted-foreground">
                  <p className="text-sm">No articles generated yet. Select a brief above to generate an article.</p>
                </CardContent>
              </Card>
            )}

            {articles.map((article) => {
              const isEditing = editingArticle === article.id;
              return (
                <Card key={article.id} className="hover-lift">
                  <CardContent className="p-4 space-y-4">
                    {isEditing ? (
                      <>
                        <div className="space-y-3">
                          <div>
                            <label className="text-xs font-medium text-muted-foreground">Title</label>
                            <Input value={editForm.title} onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))} className="mt-1" />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-muted-foreground">Meta Description</label>
                            <Input value={editForm.meta_description} onChange={(e) => setEditForm((f) => ({ ...f, meta_description: e.target.value }))} className="mt-1" />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-muted-foreground">Slug</label>
                            <Input value={editForm.slug} onChange={(e) => setEditForm((f) => ({ ...f, slug: e.target.value }))} className="mt-1 font-mono text-sm" />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-muted-foreground">Content (Markdown)</label>
                            <Textarea value={editForm.content} onChange={(e) => setEditForm((f) => ({ ...f, content: e.target.value }))} className="mt-1 font-mono text-sm min-h-[300px]" />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => saveArticle(article.id)} disabled={updateArticle.isPending} className="gap-1.5">
                            <Check className="h-3.5 w-3.5" />{updateArticle.isPending ? "Saving…" : "Save"}
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingArticle(null)} className="gap-1.5">
                            <X className="h-3.5 w-3.5" />Cancel
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="p-1 rounded bg-primary/10"><FileEdit className="h-3.5 w-3.5 text-primary" /></div>
                              <h4 className="font-medium text-sm truncate">{article.title}</h4>
                            </div>
                            <p className="text-xs text-muted-foreground mb-2">{article.meta_description}</p>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              {article.slug && <span className="font-mono bg-muted px-1.5 py-0.5 rounded">{article.slug}</span>}
                              {article.target_keyword && <Badge variant="secondary" className="text-[10px]">{article.target_keyword}</Badge>}
                            </div>
                          </div>
                          <Badge variant={article.status === "published" ? "default" : article.status === "approved" ? "secondary" : "outline"} className="text-xs shrink-0">
                            {article.status}
                          </Badge>
                        </div>

                        <details className="text-sm">
                          <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground transition-colors">
                            Preview content ({article.content.length} characters)
                          </summary>
                          <pre className="mt-2 p-3 bg-muted/30 rounded-lg border border-border/50 text-xs whitespace-pre-wrap font-mono max-h-[300px] overflow-auto">
                            {article.content}
                          </pre>
                        </details>

                        {article.cms_post_url && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>Published:</span>
                            <a href={article.cms_post_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                              {article.cms_post_url} <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        )}

                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => startEditing(article)} className="gap-1.5">
                            <Pencil className="h-3.5 w-3.5" />Edit
                          </Button>
                          {article.status !== "approved" && article.status !== "published" && (
                            <Button size="sm" onClick={() => handleApprove(article.id)} disabled={approveArticle.isPending} className="gap-1.5">
                              <Check className="h-3.5 w-3.5" />{approveArticle.isPending ? "Approving…" : "Approve"}
                            </Button>
                          )}
                          {article.status === "approved" && (
                            <>
                              <Button size="sm" onClick={() => handlePublish(article.id)} disabled={publishArticle.isPending} className="gap-1.5">
                                <Upload className="h-3.5 w-3.5" />{publishArticle.isPending ? "Publishing…" : "Publish Now"}
                              </Button>
                              <Button size="sm" variant="secondary" onClick={() => {
                                if (!scheduleDateTime) { toast.error("Set a schedule date/time first"); return; }
                                scheduleJob.mutate({
                                  asset_type: "article", asset_id: article.id, platform: "wordpress",
                                  job_type: "publish", scheduled_time: new Date(scheduleDateTime).toISOString(),
                                }, {
                                  onSuccess: () => toast.success("Article scheduled for publishing!"),
                                  onError: () => toast.error("Failed to schedule"),
                                });
                              }} disabled={scheduleJob.isPending} className="gap-1.5">
                                <Clock className="h-3.5 w-3.5" />Schedule
                              </Button>
                            </>
                          )}
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="social">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Share2 className="h-4 w-4" /> Social Media Posts
              </h3>
              {articles.filter(a => a.status === "published" || a.status === "approved").length > 0 && (
                <select
                  className="text-sm border rounded-md px-2 py-1.5 bg-card"
                  defaultValue=""
                  onChange={(e) => {
                    if (e.target.value) {
                      generateSocialPosts.mutate(e.target.value, {
                        onSuccess: () => { setSelectedArticleForSocial(e.target.value); toast.success("Social posts generated!"); },
                        onError: () => toast.error("Failed to generate social posts"),
                      });
                    }
                    e.target.value = "";
                  }}
                  disabled={generateSocialPosts.isPending}
                >
                  <option value="" disabled>{generateSocialPosts.isPending ? "Generating…" : "Generate from article…"}</option>
                  {articles.filter(a => a.status === "published" || a.status === "approved").map((a) => (
                    <option key={a.id} value={a.id}>{a.title}</option>
                  ))}
                </select>
              )}
            </div>

            {articles.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">View posts for:</span>
                <select className="text-sm border rounded-md px-2 py-1.5 bg-card" value={selectedArticleForSocial || ""} onChange={(e) => setSelectedArticleForSocial(e.target.value || null)}>
                  <option value="">Select article…</option>
                  {articles.map((a) => (<option key={a.id} value={a.id}>{a.title}</option>))}
                </select>
              </div>
            )}

            {!selectedArticleForSocial && (
              <Card className="border-dashed"><CardContent className="py-8 text-center text-muted-foreground"><p className="text-sm">Select an article above to view or generate social posts.</p></CardContent></Card>
            )}

            {selectedArticleForSocial && socialPosts.length === 0 && (
              <Card className="border-dashed"><CardContent className="py-8 text-center text-muted-foreground"><p className="text-sm">No social posts for this article yet.</p></CardContent></Card>
            )}

            {socialPosts.map((post) => {
              const isEditing = editingSocialPost === post.id;
              const platformIcons: Record<string, string> = { facebook: "📘", instagram: "📸", linkedin: "💼", twitter: "🐦", tiktok: "🎵" };
              return (
                <Card key={post.id} className="hover-lift">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{platformIcons[post.platform] || "📱"}</span>
                        <span className="text-sm font-medium capitalize">{post.platform}</span>
                      </div>
                      <Badge variant={post.status === "approved" ? "default" : post.status === "scheduled" ? "secondary" : "outline"} className="text-xs">{post.status}</Badge>
                    </div>
                    {isEditing ? (
                      <div className="space-y-2">
                        <Textarea value={socialEditContent} onChange={(e) => setSocialEditContent(e.target.value)} className="text-sm min-h-[120px]" />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => {
                            updateSocialPost.mutate({ postId: post.id, data: { content: socialEditContent } }, {
                              onSuccess: () => { toast.success("Post updated"); setEditingSocialPost(null); },
                              onError: () => toast.error("Failed to update"),
                            });
                          }} disabled={updateSocialPost.isPending} className="gap-1.5"><Check className="h-3.5 w-3.5" />Save</Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingSocialPost(null)} className="gap-1.5"><X className="h-3.5 w-3.5" />Cancel</Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <pre className="text-sm whitespace-pre-wrap bg-muted/30 p-3 rounded-lg border border-border/50">{post.content}</pre>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => { setEditingSocialPost(post.id); setSocialEditContent(post.content); }} className="gap-1.5"><Pencil className="h-3.5 w-3.5" />Edit</Button>
                          {post.status === "draft" && (
                            <Button size="sm" onClick={() => { approveSocialPost.mutate(post.id, { onSuccess: () => toast.success("Post approved!"), onError: () => toast.error("Failed to approve") }); }} disabled={approveSocialPost.isPending} className="gap-1.5"><Check className="h-3.5 w-3.5" />Approve</Button>
                          )}
                          {post.status === "approved" && (
                            <Button size="sm" variant="secondary" onClick={() => {
                              scheduleJob.mutate({ asset_type: "social_post", asset_id: post.id, platform: post.platform, job_type: "publish", scheduled_time: scheduleDateTime ? new Date(scheduleDateTime).toISOString() : undefined }, {
                                onSuccess: () => toast.success(scheduleDateTime ? "Social post scheduled!" : "Social post queued for publishing!"),
                                onError: () => toast.error("Failed to schedule"),
                              });
                            }} disabled={scheduleJob.isPending} className="gap-1.5"><Clock className="h-3.5 w-3.5" />{scheduleDateTime ? "Schedule" : "Queue Publish"}</Button>
                          )}
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="videos">
          <div className="space-y-6">
            <Card className="border-l-4 border-l-destructive">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-destructive/10"><Video className="h-4 w-4 text-destructive" /></div>
                  Generate Video Script
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label className="text-xs">Source Type</Label>
                    <select className="w-full text-sm border rounded-md px-2 py-1.5 bg-card mt-1" value={videoGenForm.source} onChange={(e) => setVideoGenForm(f => ({ ...f, source: e.target.value as "article" | "social", sourceId: "" }))}>
                      <option value="article">Article</option>
                      <option value="social">Social Post</option>
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs">Source</Label>
                    <select className="w-full text-sm border rounded-md px-2 py-1.5 bg-card mt-1" value={videoGenForm.sourceId} onChange={(e) => setVideoGenForm(f => ({ ...f, sourceId: e.target.value }))}>
                      <option value="">Select…</option>
                      {videoGenForm.source === "article"
                        ? articles.map(a => <option key={a.id} value={a.id}>{a.title}</option>)
                        : socialPosts.map(sp => <option key={sp.id} value={sp.id}>{sp.platform}: {sp.content.slice(0, 50)}…</option>)
                      }
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs">Platform</Label>
                    <select className="w-full text-sm border rounded-md px-2 py-1.5 bg-card mt-1" value={videoGenForm.platform} onChange={(e) => setVideoGenForm(f => ({ ...f, platform: e.target.value }))}>
                      <option value="tiktok">TikTok</option>
                      <option value="instagram_reels">Instagram Reels</option>
                      <option value="facebook_reels">Facebook Reels</option>
                      <option value="youtube_shorts">YouTube Shorts</option>
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs">Avatar Style</Label>
                    <select className="w-full text-sm border rounded-md px-2 py-1.5 bg-card mt-1" value={videoGenForm.avatar_type} onChange={(e) => setVideoGenForm(f => ({ ...f, avatar_type: e.target.value }))}>
                      <option value="professional">Professional</option>
                      <option value="casual">Casual</option>
                      <option value="corporate">Corporate</option>
                      <option value="creative">Creative</option>
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs">Voice Style</Label>
                    <select className="w-full text-sm border rounded-md px-2 py-1.5 bg-card mt-1" value={videoGenForm.voice_type} onChange={(e) => setVideoGenForm(f => ({ ...f, voice_type: e.target.value }))}>
                      <option value="friendly">Friendly</option>
                      <option value="authoritative">Authoritative</option>
                      <option value="energetic">Energetic</option>
                      <option value="calm">Calm</option>
                    </select>
                  </div>
                </div>
                <Button onClick={() => {
                  if (!videoGenForm.sourceId) { toast.error("Please select a source"); return; }
                  generateVideo.mutate({
                    ...(videoGenForm.source === "article" ? { article_id: videoGenForm.sourceId } : { social_post_id: videoGenForm.sourceId }),
                    platform: videoGenForm.platform, avatar_type: videoGenForm.avatar_type, voice_type: videoGenForm.voice_type,
                  }, {
                    onSuccess: () => toast.success("Video script generated!"),
                    onError: () => toast.error("Failed to generate video"),
                  });
                }} disabled={generateVideo.isPending} className="gap-1.5">
                  {generateVideo.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  Generate Video Script
                </Button>
              </CardContent>
            </Card>

            {videos.length === 0 && (
              <Card className="border-dashed"><CardContent className="py-8 text-center text-muted-foreground"><p className="text-sm">No videos generated yet. Use the form above to create one.</p></CardContent></Card>
            )}

            {videos.map((video) => {
              const isEditing = editingVideo === video.id;
              const platformLabels: Record<string, string> = { tiktok: "🎵 TikTok", instagram_reels: "📸 Instagram Reels", facebook_reels: "📘 Facebook Reels", youtube_shorts: "▶️ YouTube Shorts" };
              return (
                <Card key={video.id} className="hover-lift">
                  <CardContent className="p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium">{platformLabels[video.platform] || video.platform}</span>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <User className="h-3 w-3" />{video.avatar_type}
                          <span className="mx-1">·</span>
                          🎤 {video.voice_type}
                        </div>
                      </div>
                      <Badge variant={video.status === "approved" ? "default" : video.status === "rendering" ? "secondary" : "outline"} className="text-xs">{video.status}</Badge>
                    </div>

                    {isEditing ? (
                      <div className="space-y-3">
                        <div>
                          <Label className="text-xs">Video Script</Label>
                          <Textarea value={videoEditForm.video_script} onChange={(e) => setVideoEditForm(f => ({ ...f, video_script: e.target.value }))} className="mt-1 font-mono text-sm min-h-[200px]" />
                        </div>
                        <div>
                          <Label className="text-xs">Caption</Label>
                          <Textarea value={videoEditForm.caption_text} onChange={(e) => setVideoEditForm(f => ({ ...f, caption_text: e.target.value }))} className="mt-1 text-sm min-h-[80px]" />
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div>
                            <Label className="text-xs">Avatar Style</Label>
                            <select className="w-full text-sm border rounded-md px-2 py-1.5 bg-card mt-1" value={videoEditForm.avatar_type} onChange={(e) => setVideoEditForm(f => ({ ...f, avatar_type: e.target.value }))}>
                              <option value="professional">Professional</option><option value="casual">Casual</option><option value="corporate">Corporate</option><option value="creative">Creative</option>
                            </select>
                          </div>
                          <div>
                            <Label className="text-xs">Voice Style</Label>
                            <select className="w-full text-sm border rounded-md px-2 py-1.5 bg-card mt-1" value={videoEditForm.voice_type} onChange={(e) => setVideoEditForm(f => ({ ...f, voice_type: e.target.value }))}>
                              <option value="friendly">Friendly</option><option value="authoritative">Authoritative</option><option value="energetic">Energetic</option><option value="calm">Calm</option>
                            </select>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => {
                            updateVideoMut.mutate({ videoId: video.id, data: videoEditForm }, {
                              onSuccess: () => { toast.success("Video updated"); setEditingVideo(null); },
                              onError: () => toast.error("Failed to update video"),
                            });
                          }} disabled={updateVideoMut.isPending} className="gap-1.5"><Check className="h-3.5 w-3.5" />{updateVideoMut.isPending ? "Saving…" : "Save"}</Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingVideo(null)} className="gap-1.5"><X className="h-3.5 w-3.5" />Cancel</Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div>
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Video Script</p>
                          <pre className="text-sm whitespace-pre-wrap bg-muted/30 p-3 rounded-lg border border-border/50">{video.video_script}</pre>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Scene Breakdown</p>
                          <div className="space-y-2">
                            {(video.scene_breakdown || []).map((scene, i) => (
                              <div key={i} className="bg-muted/20 p-3 rounded-lg border border-border/50 text-xs">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0">Scene {scene.scene_number}</Badge>
                                  <span className="text-muted-foreground">{scene.duration}</span>
                                </div>
                                <p className="text-muted-foreground">🎬 {scene.visual}</p>
                                <p className="mt-1">🎤 "{scene.voiceover}"</p>
                              </div>
                            ))}
                          </div>
                        </div>
                        <details className="text-sm">
                          <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground transition-colors">Caption text ({video.caption_text.length} chars)</summary>
                          <pre className="mt-2 p-3 bg-muted/30 rounded-lg border border-border/50 text-xs whitespace-pre-wrap">{video.caption_text}</pre>
                        </details>
                        {video.video_url && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Play className="h-3 w-3" />
                            <a href={video.video_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">View rendered video <ExternalLink className="h-3 w-3" /></a>
                          </div>
                        )}
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => { setEditingVideo(video.id); setVideoEditForm({ video_script: video.video_script, caption_text: video.caption_text, avatar_type: video.avatar_type, voice_type: video.voice_type }); }} className="gap-1.5"><Pencil className="h-3.5 w-3.5" />Edit</Button>
                          {video.status === "draft" && (
                            <Button size="sm" onClick={() => { approveVideo.mutate(video.id, { onSuccess: () => toast.success("Video approved!"), onError: () => toast.error("Failed to approve") }); }} disabled={approveVideo.isPending} className="gap-1.5"><Check className="h-3.5 w-3.5" />Approve</Button>
                          )}
                          {video.status === "approved" && (
                            <Button size="sm" variant="secondary" onClick={() => {
                              scheduleJob.mutate({ asset_type: "video_asset", asset_id: video.id, platform: video.platform, job_type: "render", scheduled_time: scheduleDateTime ? new Date(scheduleDateTime).toISOString() : undefined }, {
                                onSuccess: () => toast.success("Video render job queued!"),
                                onError: () => toast.error("Failed to queue render"),
                              });
                            }} disabled={scheduleJob.isPending} className="gap-1.5"><Play className="h-3.5 w-3.5" />Queue Render</Button>
                          )}
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="jobs">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <ListTodo className="h-4 w-4" />Publishing Queue & Scheduled Jobs
              </h3>
              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground">Schedule for:</Label>
                <Input type="datetime-local" value={scheduleDateTime} onChange={(e) => setScheduleDateTime(e.target.value)} className="w-auto text-xs h-8" />
              </div>
            </div>

            {jobs.length === 0 && (
              <Card className="border-dashed"><CardContent className="py-8 text-center text-muted-foreground"><p className="text-sm">No publishing jobs yet. Schedule from their respective tabs.</p></CardContent></Card>
            )}

            {jobs.map((job) => {
              const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = { queued: "outline", scheduled: "secondary", processing: "secondary", published: "default", failed: "destructive", cancelled: "outline" };
              const statusIcons: Record<string, string> = { queued: "⏳", scheduled: "📅", processing: "⚙️", published: "✅", failed: "❌", cancelled: "🚫" };
              return (
                <Card key={job.id} className="hover-lift">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span>{statusIcons[job.publish_status] || "📋"}</span>
                          <span className="text-sm font-medium capitalize">{job.asset_type.replace("_", " ")}</span>
                          <span className="text-xs text-primary">→</span>
                          <span className="text-sm capitalize">{job.platform}</span>
                          <Badge variant="outline" className="text-[10px]">{job.job_type}</Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          {job.scheduled_time && (<span className="flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(job.scheduled_time).toLocaleString()}</span>)}
                          {job.provider && <span>Provider: {job.provider}</span>}
                          {job.retry_count > 0 && <span>Retries: {job.retry_count}</span>}
                          <span className="font-mono bg-muted px-1 py-0.5 rounded">{job.id.slice(0, 8)}</span>
                        </div>
                        {job.error_message && <p className="text-xs text-destructive mt-1">{job.error_message}</p>}
                        {job.published_url && (
                          <a href={job.published_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1 mt-1">
                            {job.published_url} <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={statusColors[job.publish_status] || "outline"} className="text-xs">{job.publish_status}</Badge>
                        {job.publish_status === "failed" && (
                          <Button size="sm" variant="outline" onClick={() => { retryJob.mutate(job.id, { onSuccess: () => toast.success("Job retried!"), onError: () => toast.error("Failed to retry") }); }} disabled={retryJob.isPending} className="gap-1.5"><RotateCcw className="h-3.5 w-3.5" />Retry</Button>
                        )}
                        {(job.publish_status === "queued" || job.publish_status === "scheduled") && (
                          <Button size="sm" variant="outline" onClick={() => { cancelJob.mutate(job.id, { onSuccess: () => toast.success("Job cancelled"), onError: () => toast.error("Failed to cancel") }); }} disabled={cancelJob.isPending} className="gap-1.5"><Ban className="h-3.5 w-3.5" />Cancel</Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="issues">
          <div className="space-y-3">
            {openIssues.length === 0 && (
              <Card className="border-dashed"><CardContent className="py-8 text-center text-muted-foreground"><div className="p-3 rounded-full bg-green-500/10 mx-auto w-fit mb-2"><Check className="h-6 w-6 text-green-500" /></div><p className="text-sm font-medium">No open issues</p></CardContent></Card>
            )}
            {openIssues.map((issue) => (
              <Card key={issue.id} className={`hover-lift border-l-4 ${issue.severity === "critical" ? "border-l-destructive" : issue.severity === "warning" ? "border-l-amber-500" : "border-l-primary"}`}>
                <CardContent className="p-4 flex items-start gap-4">
                  <div className={`p-1.5 rounded-md shrink-0 ${issue.severity === "critical" ? "bg-destructive/10" : issue.severity === "warning" ? "bg-amber-500/10" : "bg-primary/10"}`}>
                    {issue.severity === "critical" ? <AlertCircle className="h-4 w-4 text-destructive" /> : issue.severity === "warning" ? <AlertTriangle className="h-4 w-4 text-amber-500" /> : <Info className="h-4 w-4 text-primary" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-sm">{issue.issue_type}</p>
                      <Badge variant={issue.severity === "critical" ? "destructive" : issue.severity === "warning" ? "secondary" : "outline"} className="text-xs">{issue.severity}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{issue.description}</p>
                    <p className="text-xs font-mono text-muted-foreground/70 mt-1 truncate">{issue.affected_url}</p>
                  </div>
                  <Badge variant="outline" className="text-xs shrink-0">{issue.status.replace("_", " ")}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="settings">
          <div className="space-y-6 max-w-xl">
            <Card className="border-l-4 border-l-primary">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-primary/10"><Settings className="h-4 w-4 text-primary" /></div>
                  WordPress Connection
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cmsConnection ? (
                  <div className="space-y-3">
                    <div className="p-4 bg-muted/30 rounded-lg border border-border/50">
                      <p className="text-sm font-medium">{cmsConnection.site_url}</p>
                      <p className="text-xs text-muted-foreground mt-1">User: {cmsConnection.username}</p>
                      <p className="text-xs text-muted-foreground">Connected: {new Date(cmsConnection.created_at).toLocaleDateString()}</p>
                    </div>
                    <Button size="sm" variant="outline" onClick={handleTestCms} disabled={testCmsConnection.isPending} className="gap-1.5">
                      {testCmsConnection.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                      Test Connection
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">Connect your WordPress site to enable automatic article publishing.</p>
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="wp-url" className="text-xs">Site URL</Label>
                        <Input id="wp-url" placeholder="https://yoursite.com" value={cmsForm.site_url} onChange={(e) => setCmsForm((f) => ({ ...f, site_url: e.target.value }))} className="mt-1" />
                      </div>
                      <div>
                        <Label htmlFor="wp-user" className="text-xs">Username</Label>
                        <Input id="wp-user" placeholder="admin" value={cmsForm.username} onChange={(e) => setCmsForm((f) => ({ ...f, username: e.target.value }))} className="mt-1" />
                      </div>
                      <div>
                        <Label htmlFor="wp-pass" className="text-xs">Application Password</Label>
                        <Input id="wp-pass" type="password" placeholder="xxxx xxxx xxxx xxxx xxxx xxxx" value={cmsForm.application_password} onChange={(e) => setCmsForm((f) => ({ ...f, application_password: e.target.value }))} className="mt-1" />
                        <p className="text-xs text-muted-foreground mt-1">Generate at WordPress Dashboard → Users → Profile → Application Passwords</p>
                      </div>
                    </div>
                    <Button onClick={handleSaveCms} disabled={saveCmsConnection.isPending} className="gap-1.5">
                      {saveCmsConnection.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                      Save Connection
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
