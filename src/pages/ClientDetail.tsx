import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useClient, useKeywords, useCompetitors, useAuditIssues, useInternalLinks, useContentPlan, useBriefs, useGenerateBrief, useArticles, useGenerateArticle, useUpdateArticle, useApproveArticle, usePublishArticle, useCmsConnection, useSaveCmsConnection, useTestCmsConnection, useSocialPosts, useGenerateSocialPosts, useUpdateSocialPost, useApproveSocialPost, useVideos, useGenerateVideo, useUpdateVideo, useApproveVideo } from "@/hooks/use-api";
import { clients as dummyClients, getClientRankings, getClientCompetitors, getClientAuditIssues } from "@/data/dummy";
import { RankChangeIndicator } from "@/components/RankChangeIndicator";
import { ArrowLeft, Globe, TrendingUp, TrendingDown, Target, Link2, ExternalLink, FileText, FolderTree, BookOpen, Sparkles, ChevronDown, ChevronUp, Pencil, Check, X, FileEdit, Settings, Upload, Loader2, Share2, MessageSquare } from "lucide-react";
import type { InternalLinkSuggestion, ContentSuggestion, ContentPlanCluster, SeoBrief, SeoArticle, CmsConnection, SocialPost } from "@/lib/api";
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

Looking for comprehensive information about **renovation singapore**? You've come to the right place. In this 2026 guide, we cover everything you need to know.

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
        <p className="text-muted-foreground">Client not found.</p>
        <Link to="/clients"><Button variant="ghost" className="mt-2">Back to Clients</Button></Link>
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
      <div className="flex items-center gap-3">
        <Link to="/clients"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{client.name}</h1>
          <p className="text-sm text-muted-foreground font-mono flex items-center gap-1"><Globe className="h-3 w-3" />{client.domain}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-6">
        {[
          { label: "Keywords", value: kws.length },
          { label: "Competitors", value: comps.length },
          { label: "Open Issues", value: openIssues.length },
          { label: "Link Suggestions", value: pendingLinks.length },
          { label: "Content Ideas", value: contentTotal },
          { label: "Health Score", value: `${client.health_score}%` },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">{s.label}</p>
              <p className="text-xl font-bold mt-1">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="rankings" className="space-y-4">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="rankings">Rankings</TabsTrigger>
          <TabsTrigger value="movers">Movers</TabsTrigger>
          <TabsTrigger value="competitors">Competitors</TabsTrigger>
          <TabsTrigger value="internal-links">Internal Links ({pendingLinks.length})</TabsTrigger>
          <TabsTrigger value="content-plan">Content Plan ({contentTotal})</TabsTrigger>
          <TabsTrigger value="briefs">Briefs ({briefs.length})</TabsTrigger>
          <TabsTrigger value="articles">Articles ({articles.length})</TabsTrigger>
          <TabsTrigger value="social">Social Posts</TabsTrigger>
          <TabsTrigger value="issues">Issues ({openIssues.length})</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="rankings">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="p-3 font-medium text-muted-foreground">Keyword</th>
                      <th className="p-3 font-medium text-muted-foreground text-center">Position</th>
                      <th className="p-3 font-medium text-muted-foreground text-center">Previous</th>
                      <th className="p-3 font-medium text-muted-foreground text-center">Change</th>
                      <th className="p-3 font-medium text-muted-foreground">URL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {kws.map((r) => (
                      <tr key={r.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="p-3 font-medium">{r.keyword}</td>
                        <td className="p-3 text-center font-mono">{r.current_position ?? "–"}</td>
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
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-4 w-4 text-success" />Gainers</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {gainers.length === 0 && <p className="text-sm text-muted-foreground">No gainers this week.</p>}
                {gainers.map((r) => (
                  <div key={r.id} className="flex justify-between py-2 border-b last:border-0">
                    <span className="text-sm">{r.keyword}</span>
                    <RankChangeIndicator change={r.change ?? 0} />
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><TrendingDown className="h-4 w-4 text-destructive" />Losers</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {losers.length === 0 && <p className="text-sm text-muted-foreground">No losers this week.</p>}
                {losers.map((r) => (
                  <div key={r.id} className="flex justify-between py-2 border-b last:border-0">
                    <span className="text-sm">{r.keyword}</span>
                    <RankChangeIndicator change={r.change ?? 0} />
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Target className="h-4 w-4 text-warning" />Near Wins (11–20)</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {nearWins.length === 0 && <p className="text-sm text-muted-foreground">No near wins.</p>}
                {nearWins.map((r) => (
                  <div key={r.id} className="flex justify-between py-2 border-b last:border-0">
                    <span className="text-sm">{r.keyword}</span>
                    <span className="font-mono text-sm text-muted-foreground">#{r.current_position}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="competitors">
          <div className="grid gap-4 sm:grid-cols-2">
            {comps.map((c) => (
              <Card key={c.id}>
                <CardContent className="p-5">
                  <p className="font-mono font-medium">{c.domain}</p>
                  <p className="text-xs text-muted-foreground mt-1">{c.label || "Competitor"}</p>
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
                <Link2 className="h-4 w-4 text-primary" />Internal Link Suggestions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {pendingLinks.length === 0 && <p className="text-sm text-muted-foreground">No internal link suggestions at the moment.</p>}
              {pendingLinks.map((link) => (
                <div key={link.id} className="p-4 rounded-md border bg-muted/20 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={PRIORITY_BADGE[link.priority]} className="text-xs">{link.priority}</Badge>
                    <span className="text-sm font-medium">"{link.anchor_text}"</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-mono truncate max-w-[280px]">{link.from_url}</span>
                    <span>→</span>
                    <span className="font-mono truncate max-w-[280px]">{link.to_url}</span>
                    <a href={link.to_url} target="_blank" rel="noopener noreferrer" className="ml-1 hover:text-primary">
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                  <p className="text-xs text-muted-foreground">{link.reason}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content-plan">
          <div className="space-y-6">
            {contentClusters.length === 0 && <p className="text-sm text-muted-foreground">No content suggestions at the moment.</p>}
            {contentClusters.map((cluster) => (
              <Card key={cluster.cluster_name}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FolderTree className="h-4 w-4 text-primary" />
                    <span className="capitalize">{cluster.cluster_name}</span>
                    {cluster.high_priority_count > 0 && (
                      <Badge variant="destructive" className="text-xs ml-2">{cluster.high_priority_count} high priority</Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {cluster.suggestions.map((s) => (
                    <div key={s.id} className="p-4 rounded-md border bg-muted/20 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant={PRIORITY_BADGE[s.priority]} className="text-xs">{s.priority}</Badge>
                        <span className="text-sm font-medium">{s.keyword}</span>
                      </div>
                      {s.suggested_slug && (
                        <div className="flex items-center gap-2 text-xs">
                          <FileText className="h-3 w-3 text-muted-foreground" />
                          <span className="font-mono text-muted-foreground">{s.suggested_slug}</span>
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">{s.reason}</p>
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
              <h3 className="text-sm font-medium text-muted-foreground">SEO Content Briefs</h3>
              <Button
                size="sm"
                variant="outline"
                disabled={generateBrief.isPending}
                onClick={() => {
                  const keyword = prompt("Enter keyword to generate a brief for:");
                  if (keyword) handleGenerateBrief(keyword);
                }}
              >
                <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                {generateBrief.isPending ? "Generating…" : "Generate Brief"}
              </Button>
            </div>

            {briefs.length === 0 && <p className="text-sm text-muted-foreground">No briefs generated yet. Click "Generate Brief" to create one.</p>}

            {briefs.map((brief) => {
              const isExpanded = expandedBrief === brief.id;
              return (
                <Card key={brief.id}>
                  <CardContent className="p-0">
                    <button
                      className="w-full p-4 flex items-center justify-between text-left hover:bg-muted/30 transition-colors"
                      onClick={() => setExpandedBrief(isExpanded ? null : brief.id)}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <BookOpen className="h-4 w-4 text-primary shrink-0" />
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
                        {/* Meta */}
                        <div>
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Meta Description</p>
                          <p className="text-sm bg-muted/30 p-2 rounded">{brief.meta_description}</p>
                        </div>

                        {/* Headings */}
                        <div>
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Content Structure</p>
                          <div className="space-y-1">
                            {brief.headings.map((h, i) => (
                              <div
                                key={i}
                                className="text-sm flex items-center gap-2"
                                style={{ paddingLeft: h.level === "H1" ? 0 : h.level === "H2" ? 12 : 24 }}
                              >
                                <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0">{h.level}</Badge>
                                <span>{h.text}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* FAQ */}
                        <div>
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">FAQ Questions</p>
                          <div className="space-y-2">
                            {brief.faq.map((f, i) => (
                              <div key={i} className="bg-muted/30 p-2 rounded">
                                <p className="text-sm font-medium">{f.question}</p>
                                <p className="text-xs text-muted-foreground mt-1">{f.answer}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Entities */}
                        <div>
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Target Entities</p>
                          <div className="flex flex-wrap gap-1">
                            {brief.entities.map((e, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">{e}</Badge>
                            ))}
                          </div>
                        </div>

                        {/* Internal Links */}
                        {brief.internal_links.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Suggested Internal Links</p>
                            <div className="space-y-1">
                              {brief.internal_links.map((l, i) => (
                                <div key={i} className="text-xs flex items-center gap-2 text-muted-foreground">
                                  <span className="font-mono truncate max-w-[200px]">{l.from}</span>
                                  <span>→</span>
                                  <span className="font-mono truncate max-w-[200px]">{l.to}</span>
                                  <span className="text-primary">"{l.anchor}"</span>
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
              <h3 className="text-sm font-medium text-muted-foreground">SEO Article Drafts</h3>
              {briefs.length > 0 && (
                <div className="flex items-center gap-2">
                  <select
                    id="brief-select"
                    className="text-sm border rounded px-2 py-1 bg-background"
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
                </div>
              )}
            </div>

            {articles.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No articles generated yet. Select a brief above to generate an article.
              </p>
            )}

            {articles.map((article) => {
              const isEditing = editingArticle === article.id;
              return (
                <Card key={article.id}>
                  <CardContent className="p-4 space-y-4">
                    {isEditing ? (
                      <>
                        <div className="space-y-3">
                          <div>
                            <label className="text-xs font-medium text-muted-foreground">Title</label>
                            <Input
                              value={editForm.title}
                              onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-muted-foreground">Meta Description</label>
                            <Input
                              value={editForm.meta_description}
                              onChange={(e) => setEditForm((f) => ({ ...f, meta_description: e.target.value }))}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-muted-foreground">Slug</label>
                            <Input
                              value={editForm.slug}
                              onChange={(e) => setEditForm((f) => ({ ...f, slug: e.target.value }))}
                              className="mt-1 font-mono text-sm"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-muted-foreground">Content (Markdown)</label>
                            <Textarea
                              value={editForm.content}
                              onChange={(e) => setEditForm((f) => ({ ...f, content: e.target.value }))}
                              className="mt-1 font-mono text-sm min-h-[300px]"
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => saveArticle(article.id)} disabled={updateArticle.isPending}>
                            <Check className="h-3.5 w-3.5 mr-1" />
                            {updateArticle.isPending ? "Saving…" : "Save"}
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingArticle(null)}>
                            <X className="h-3.5 w-3.5 mr-1" />Cancel
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <FileEdit className="h-4 w-4 text-primary shrink-0" />
                              <h4 className="font-medium text-sm truncate">{article.title}</h4>
                            </div>
                            <p className="text-xs text-muted-foreground mb-2">{article.meta_description}</p>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span>Keyword: <strong>{article.target_keyword}</strong></span>
                              {article.slug && <span className="font-mono">{article.slug}</span>}
                            </div>
                          </div>
                          <Badge
                            variant={
                              article.status === "approved"
                                ? "default"
                                : article.status === "review"
                                ? "secondary"
                                : "outline"
                            }
                            className="text-xs shrink-0"
                          >
                            {article.status}
                          </Badge>
                        </div>

                        <details className="text-sm">
                          <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                            Preview content ({article.content.length} characters)
                          </summary>
                          <pre className="mt-2 p-3 bg-muted/30 rounded text-xs whitespace-pre-wrap font-mono max-h-[300px] overflow-auto">
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
                          <Button size="sm" variant="outline" onClick={() => startEditing(article)}>
                            <Pencil className="h-3.5 w-3.5 mr-1" />Edit
                          </Button>
                          {article.status !== "approved" && article.status !== "published" && (
                            <Button size="sm" onClick={() => handleApprove(article.id)} disabled={approveArticle.isPending}>
                              <Check className="h-3.5 w-3.5 mr-1" />
                              {approveArticle.isPending ? "Approving…" : "Approve"}
                            </Button>
                          )}
                          {article.status === "approved" && (
                            <Button size="sm" onClick={() => handlePublish(article.id)} disabled={publishArticle.isPending}>
                              <Upload className="h-3.5 w-3.5 mr-1" />
                              {publishArticle.isPending ? "Publishing…" : "Publish to WordPress"}
                            </Button>
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
              <h3 className="text-sm font-medium text-muted-foreground">Social Media Posts</h3>
              {articles.filter(a => a.status === "published" || a.status === "approved").length > 0 && (
                <select
                  className="text-sm border rounded px-2 py-1 bg-background"
                  defaultValue=""
                  onChange={(e) => {
                    if (e.target.value) {
                      generateSocialPosts.mutate(e.target.value, {
                        onSuccess: () => {
                          setSelectedArticleForSocial(e.target.value);
                          toast.success("Social posts generated!");
                        },
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

            {/* Article selector to view existing social posts */}
            {articles.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">View posts for:</span>
                <select
                  className="text-sm border rounded px-2 py-1 bg-background"
                  value={selectedArticleForSocial || ""}
                  onChange={(e) => setSelectedArticleForSocial(e.target.value || null)}
                >
                  <option value="">Select article…</option>
                  {articles.map((a) => (
                    <option key={a.id} value={a.id}>{a.title}</option>
                  ))}
                </select>
              </div>
            )}

            {!selectedArticleForSocial && (
              <p className="text-sm text-muted-foreground">Select an article above to view or generate social posts.</p>
            )}

            {selectedArticleForSocial && socialPosts.length === 0 && (
              <p className="text-sm text-muted-foreground">No social posts for this article yet. Generate them using the dropdown above.</p>
            )}

            {socialPosts.map((post) => {
              const isEditing = editingSocialPost === post.id;
              const platformIcons: Record<string, string> = {
                facebook: "📘", instagram: "📸", linkedin: "💼", twitter: "🐦", tiktok: "🎵",
              };
              return (
                <Card key={post.id}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{platformIcons[post.platform] || "📱"}</span>
                        <span className="text-sm font-medium capitalize">{post.platform}</span>
                      </div>
                      <Badge
                        variant={post.status === "approved" ? "default" : post.status === "scheduled" ? "secondary" : "outline"}
                        className="text-xs"
                      >
                        {post.status}
                      </Badge>
                    </div>

                    {isEditing ? (
                      <div className="space-y-2">
                        <Textarea
                          value={socialEditContent}
                          onChange={(e) => setSocialEditContent(e.target.value)}
                          className="text-sm min-h-[120px]"
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => {
                            updateSocialPost.mutate({ postId: post.id, data: { content: socialEditContent } }, {
                              onSuccess: () => { toast.success("Post updated"); setEditingSocialPost(null); },
                              onError: () => toast.error("Failed to update"),
                            });
                          }} disabled={updateSocialPost.isPending}>
                            <Check className="h-3.5 w-3.5 mr-1" />Save
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingSocialPost(null)}>
                            <X className="h-3.5 w-3.5 mr-1" />Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <pre className="text-sm whitespace-pre-wrap bg-muted/30 p-3 rounded">{post.content}</pre>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => {
                            setEditingSocialPost(post.id);
                            setSocialEditContent(post.content);
                          }}>
                            <Pencil className="h-3.5 w-3.5 mr-1" />Edit
                          </Button>
                          {post.status === "draft" && (
                            <Button size="sm" onClick={() => {
                              approveSocialPost.mutate(post.id, {
                                onSuccess: () => toast.success("Post approved!"),
                                onError: () => toast.error("Failed to approve"),
                              });
                            }} disabled={approveSocialPost.isPending}>
                              <Check className="h-3.5 w-3.5 mr-1" />Approve
                            </Button>
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


        <TabsContent value="issues">
          <div className="space-y-2">
            {openIssues.length === 0 && <p className="text-sm text-muted-foreground">No open issues.</p>}
            {openIssues.map((issue) => (
              <Card key={issue.id}>
                <CardContent className="p-4 flex items-start gap-4">
                  <Badge variant={issue.severity === "critical" ? "destructive" : issue.severity === "warning" ? "secondary" : "outline"} className="text-xs shrink-0 mt-0.5">
                    {issue.severity}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{issue.issue_type}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{issue.description}</p>
                    <p className="text-xs font-mono text-muted-foreground mt-1 truncate">{issue.affected_url}</p>
                  </div>
                  <Badge variant="outline" className="text-xs shrink-0">{issue.status.replace("_", " ")}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="settings">
          <div className="space-y-6 max-w-xl">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Settings className="h-4 w-4" />WordPress Connection
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cmsConnection ? (
                  <div className="space-y-3">
                    <div className="p-3 bg-muted/30 rounded-md">
                      <p className="text-sm font-medium">{cmsConnection.site_url}</p>
                      <p className="text-xs text-muted-foreground">User: {cmsConnection.username}</p>
                      <p className="text-xs text-muted-foreground">Connected: {new Date(cmsConnection.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={handleTestCms} disabled={testCmsConnection.isPending}>
                        {testCmsConnection.isPending ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : null}
                        Test Connection
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Connect your WordPress site to enable automatic article publishing. You'll need an Application Password.
                    </p>
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="wp-url" className="text-xs">Site URL</Label>
                        <Input
                          id="wp-url"
                          placeholder="https://yoursite.com"
                          value={cmsForm.site_url}
                          onChange={(e) => setCmsForm((f) => ({ ...f, site_url: e.target.value }))}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="wp-user" className="text-xs">Username</Label>
                        <Input
                          id="wp-user"
                          placeholder="admin"
                          value={cmsForm.username}
                          onChange={(e) => setCmsForm((f) => ({ ...f, username: e.target.value }))}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="wp-pass" className="text-xs">Application Password</Label>
                        <Input
                          id="wp-pass"
                          type="password"
                          placeholder="xxxx xxxx xxxx xxxx xxxx xxxx"
                          value={cmsForm.application_password}
                          onChange={(e) => setCmsForm((f) => ({ ...f, application_password: e.target.value }))}
                          className="mt-1"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Generate at WordPress Dashboard → Users → Profile → Application Passwords
                        </p>
                      </div>
                    </div>
                    <Button onClick={handleSaveCms} disabled={saveCmsConnection.isPending}>
                      {saveCmsConnection.isPending ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : null}
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
