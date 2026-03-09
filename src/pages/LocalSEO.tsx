import { useState } from "react";
import { PageTransition } from "@/components/motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  MapPin, Star, MessageSquare, HelpCircle, FileText, AlertTriangle,
  CheckCircle, RefreshCw, Send, ThumbsUp, Eye, Settings, TrendingUp
} from "lucide-react";
import {
  useClients, useGbpConnection, useGbpProfile, useGbpPosts, useGbpReviews,
  useGbpQna, useLocalSeoInsights, useSyncGbp, useApproveGbpPost,
  useGenerateReviewResponse, useApproveReviewResponse, useGenerateQnaAnswer,
  useApproveQnaAnswer, useUpdateLocalInsightStatus
} from "@/hooks/use-api";

const PRIORITY_COLORS: Record<string, string> = {
  high: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400",
  medium: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400",
  low: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400",
};

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-muted text-muted-foreground", review: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  approved: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  published: "bg-primary/10 text-primary", unreviewed: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  drafted: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  responded: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  open: "bg-muted text-muted-foreground", reviewed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
};

export default function LocalSEO() {
  const [selectedClient, setSelectedClient] = useState("");
  const { data: clients } = useClients();
  const clientId = selectedClient || clients?.[0]?.id || "";

  const { data: connection } = useGbpConnection(clientId);
  const { data: profile } = useGbpProfile(clientId);
  const { data: posts } = useGbpPosts(clientId);
  const { data: reviews } = useGbpReviews(clientId);
  const { data: qna } = useGbpQna(clientId);
  const { data: insights } = useLocalSeoInsights(clientId);

  const syncMutation = useSyncGbp();
  const approvePost = useApproveGbpPost(clientId);
  const genResponse = useGenerateReviewResponse(clientId);
  const approveResponse = useApproveReviewResponse(clientId);
  const genAnswer = useGenerateQnaAnswer(clientId);
  const approveAnswer = useApproveQnaAnswer(clientId);
  const updateInsight = useUpdateLocalInsightStatus(clientId);

  const score = profile?.completeness?.score ?? 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Local SEO</h1>
          <p className="text-muted-foreground mt-1.5">Google Business Profile management & local optimization</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={clientId} onValueChange={setSelectedClient}>
            <SelectTrigger className="w-[200px]"><SelectValue placeholder="Select client" /></SelectTrigger>
            <SelectContent>{clients?.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => syncMutation.mutate(clientId)} disabled={syncMutation.isPending}>
            <RefreshCw className={`h-4 w-4 mr-1.5 ${syncMutation.isPending ? "animate-spin" : ""}`} /> Sync
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-muted/50 border flex-wrap h-auto gap-1">
          <TabsTrigger value="overview" className="gap-1.5"><MapPin className="h-3.5 w-3.5" /> Overview</TabsTrigger>
          <TabsTrigger value="profile" className="gap-1.5"><Eye className="h-3.5 w-3.5" /> Profile</TabsTrigger>
          <TabsTrigger value="posts" className="gap-1.5"><FileText className="h-3.5 w-3.5" /> Posts</TabsTrigger>
          <TabsTrigger value="reviews" className="gap-1.5"><Star className="h-3.5 w-3.5" /> Reviews</TabsTrigger>
          <TabsTrigger value="qna" className="gap-1.5"><HelpCircle className="h-3.5 w-3.5" /> Q&A</TabsTrigger>
          <TabsTrigger value="insights" className="gap-1.5"><TrendingUp className="h-3.5 w-3.5" /> Insights</TabsTrigger>
          <TabsTrigger value="settings" className="gap-1.5"><Settings className="h-3.5 w-3.5" /> Settings</TabsTrigger>
        </TabsList>

        {/* OVERVIEW */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { label: "Completeness", value: `${score}%`, color: "border-l-gbp-primary", progress: score },
              { label: "Reviews", value: profile?.reviews_count ?? 0, sub: `Avg ${profile?.average_rating ?? 0} ★`, color: "border-l-amber-500" },
              { label: "Unanswered Reviews", value: reviews?.filter((r: any) => r.response_status === "unreviewed").length ?? 0, color: "border-l-red-500" },
              { label: "Open Q&A", value: qna?.filter((q: any) => q.status === "unreviewed").length ?? 0, color: "border-l-blue-500" },
            ].map((kpi) => (
              <Card key={kpi.label} className={`hover-lift border-l-4 ${kpi.color}`}>
                <CardContent className="p-5">
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">{kpi.label}</p>
                  <p className="text-3xl font-bold text-foreground mt-1">{kpi.value}</p>
                  {kpi.sub && <p className="text-xs text-muted-foreground mt-0.5">{kpi.sub}</p>}
                  {kpi.progress !== undefined && <Progress value={kpi.progress} className="mt-2 h-1.5" />}
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="hover-lift">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <div className="h-6 w-6 rounded-md bg-red-100 flex items-center justify-center dark:bg-red-900/30">
                    <AlertTriangle className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
                  </div>
                  Top Priorities
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {insights?.filter((i: any) => i.priority === "high").slice(0, 5).map((i: any) => (
                  <div key={i.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors">
                    <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{i.title}</p>
                      <p className="text-xs text-muted-foreground">{i.recommended_action}</p>
                    </div>
                  </div>
                )) || <p className="text-sm text-muted-foreground">No insights yet. Sync your GBP profile first.</p>}
              </CardContent>
            </Card>
            <Card className="hover-lift">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <div className="h-6 w-6 rounded-md bg-gbp-background flex items-center justify-center">
                    <MapPin className="h-3.5 w-3.5 text-gbp-primary" />
                  </div>
                  Profile Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {[
                  { label: "Business", value: profile?.business_name || "—" },
                  { label: "Category", value: profile?.primary_category || "—" },
                  { label: "Photos", value: profile?.photos_count ?? 0 },
                  { label: "Posts", value: profile?.posts_count ?? 0 },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between py-1.5 border-b border-border/30 last:border-0">
                    <span className="text-muted-foreground">{row.label}</span>
                    <span className="font-medium text-foreground">{row.value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* PROFILE */}
        <TabsContent value="profile" className="space-y-4">
          <Card className="hover-lift">
            <CardHeader>
              <CardTitle>Profile Completeness</CardTitle>
              <CardDescription>Score: {score}% — {profile?.completeness?.missingItems?.length ?? 0} items missing</CardDescription>
            </CardHeader>
            <CardContent>
              <Progress value={score} className="mb-4 h-2" />
              {profile?.completeness?.missingItems?.length ? (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-foreground">Missing Items</h4>
                  {profile.completeness.missingItems.map((item: string, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-sm p-2 rounded-lg bg-red-50 dark:bg-red-900/10">
                      <AlertTriangle className="h-3 w-3 text-destructive shrink-0" />
                      <span className="text-foreground">{item}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/10">
                  <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> <span className="text-foreground">Profile is complete!</span>
                </div>
              )}
              {profile?.completeness?.priorityActions?.length ? (
                <div className="mt-4 space-y-1">
                  <h4 className="text-sm font-semibold text-foreground">Priority Actions</h4>
                  {profile.completeness.priorityActions.map((a: string, i: number) => (
                    <p key={i} className="text-sm text-muted-foreground pl-3 border-l-2 border-gbp-primary">• {a}</p>
                  ))}
                </div>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>

        {/* POSTS */}
        <TabsContent value="posts" className="space-y-3">
          {posts?.length ? posts.map((p: any) => (
            <Card key={p.id} className="hover-lift">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{p.title || "Untitled Post"}</CardTitle>
                  <Badge className={`${STATUS_COLORS[p.status] || "bg-muted text-muted-foreground"} border-0 text-xs`}>{p.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-foreground whitespace-pre-wrap">{p.content?.substring(0, 300)}</p>
                {p.cta_type && <p className="text-xs text-muted-foreground">CTA: {p.cta_type} → {p.cta_url}</p>}
                {p.status === "draft" && (
                  <Button size="sm" onClick={() => approvePost.mutate(p.id)}><ThumbsUp className="h-3 w-3 mr-1" /> Approve</Button>
                )}
              </CardContent>
            </Card>
          )) : (
            <Card className="hover-lift"><CardContent className="py-12 text-center text-muted-foreground">No GBP post drafts yet.</CardContent></Card>
          )}
        </TabsContent>

        {/* REVIEWS */}
        <TabsContent value="reviews" className="space-y-3">
          {reviews?.length ? reviews.map((r: any) => (
            <Card key={r.id} className="hover-lift">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-gbp-background flex items-center justify-center text-gbp-primary font-semibold text-sm">
                      {(r.reviewer_name || "A").charAt(0)}
                    </div>
                    <div>
                      <CardTitle className="text-sm">{r.reviewer_name || "Anonymous"}</CardTitle>
                      <div className="flex items-center gap-1 mt-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`h-3 w-3 ${i < r.rating ? "text-amber-500 fill-amber-500" : "text-muted-foreground/30"}`} />
                        ))}
                        <span className="text-xs text-muted-foreground ml-1">{r.review_date ? new Date(r.review_date).toLocaleDateString() : ""}</span>
                      </div>
                    </div>
                  </div>
                  <Badge className={`${STATUS_COLORS[r.response_status] || "bg-muted text-muted-foreground"} border-0 text-xs`}>{r.response_status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-foreground">{r.review_text}</p>
                {r.response_draft && (
                  <>
                    <Separator />
                    <div className="bg-muted/30 rounded-lg p-3">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Response Draft</p>
                      <p className="text-sm text-foreground">{r.response_draft}</p>
                    </div>
                  </>
                )}
                <div className="flex gap-2">
                  {r.response_status === "unreviewed" && (
                    <Button size="sm" variant="outline" onClick={() => genResponse.mutate(r.id)}><MessageSquare className="h-3 w-3 mr-1" /> Generate Response</Button>
                  )}
                  {r.response_status === "drafted" && (
                    <Button size="sm" onClick={() => approveResponse.mutate(r.id)}><ThumbsUp className="h-3 w-3 mr-1" /> Approve</Button>
                  )}
                  {r.response_status === "approved" && (
                    <Button size="sm" variant="outline"><Send className="h-3 w-3 mr-1" /> Send</Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )) : (
            <Card className="hover-lift"><CardContent className="py-12 text-center text-muted-foreground">No reviews synced yet. Click Sync to import.</CardContent></Card>
          )}
        </TabsContent>

        {/* Q&A */}
        <TabsContent value="qna" className="space-y-3">
          {qna?.length ? qna.map((q: any) => (
            <Card key={q.id} className="hover-lift">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">{q.question_text}</CardTitle>
                  <Badge className={`${STATUS_COLORS[q.status] || "bg-muted text-muted-foreground"} border-0 text-xs`}>{q.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {q.answer_draft && (
                  <div className="bg-muted/30 rounded-lg p-3">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Answer Draft</p>
                    <p className="text-sm text-foreground">{q.answer_draft}</p>
                  </div>
                )}
                <div className="flex gap-2">
                  {q.status === "unreviewed" && (
                    <Button size="sm" variant="outline" onClick={() => genAnswer.mutate(q.id)}><MessageSquare className="h-3 w-3 mr-1" /> Generate Answer</Button>
                  )}
                  {q.status === "drafted" && (
                    <Button size="sm" onClick={() => approveAnswer.mutate(q.id)}><ThumbsUp className="h-3 w-3 mr-1" /> Approve</Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )) : (
            <Card className="hover-lift"><CardContent className="py-12 text-center text-muted-foreground">No Q&A items synced yet.</CardContent></Card>
          )}
        </TabsContent>

        {/* INSIGHTS */}
        <TabsContent value="insights" className="space-y-3">
          {insights?.length ? insights.map((i: any) => (
            <Card key={i.id} className={`hover-lift border-l-4 ${i.priority === "high" ? "border-l-red-500" : i.priority === "medium" ? "border-l-amber-500" : "border-l-blue-500"}`}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${i.priority === "high" ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" : "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"}`}>
                      <AlertTriangle className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={`${PRIORITY_COLORS[i.priority]} border-0 text-xs`}>{i.priority}</Badge>
                      </div>
                      <p className="text-sm font-semibold text-foreground">{i.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{i.description}</p>
                      {i.recommended_action && <p className="text-xs text-primary mt-1.5 font-medium">→ {i.recommended_action}</p>}
                    </div>
                  </div>
                  {i.status === "open" && (
                    <Button size="sm" variant="outline" className="shrink-0" onClick={() => updateInsight.mutate({ insightId: i.id, status: "reviewed" })}>
                      <CheckCircle className="h-3.5 w-3.5 mr-1" /> Reviewed
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )) : (
            <Card className="hover-lift"><CardContent className="py-12 text-center text-muted-foreground">No local SEO insights yet. Sync your GBP profile to generate.</CardContent></Card>
          )}
        </TabsContent>

        {/* SETTINGS */}
        <TabsContent value="settings" className="space-y-4">
          <Card className="hover-lift">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gbp-background flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-gbp-primary" />
                </div>
                <div>
                  <CardTitle>GBP Connection</CardTitle>
                  <CardDescription>
                    {connection ? `Connected: ${connection.business_name || connection.location_id}` : "Not connected"}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Configure OAuth credentials and location ID in your backend environment variables.
              </p>
              {connection && (
                <div className="mt-3 space-y-2 text-sm">
                  {[
                    { label: "Location ID", value: connection.location_id },
                    { label: "Account ID", value: connection.account_id },
                  ].map((row) => (
                    <div key={row.label} className="flex items-center justify-between py-1.5 border-b border-border/30">
                      <span className="text-muted-foreground">{row.label}</span>
                      <span className="font-mono text-xs text-foreground">{row.value}</span>
                    </div>
                  ))}
                  <Badge variant={connection.status === "connected" ? "default" : "destructive"} className="mt-2">{connection.status}</Badge>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
