import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
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

const priorityColor = (p: string) =>
  p === "high" ? "destructive" : p === "medium" ? "default" : "secondary";

const statusColor = (s: string) => {
  const map: Record<string, string> = {
    draft: "secondary", review: "default", approved: "default",
    scheduled: "outline", published: "default", failed: "destructive",
    unreviewed: "secondary", drafted: "default", responded: "default",
    open: "secondary", reviewed: "default", done: "default",
  };
  return (map[s] || "secondary") as any;
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

  const completeness = profile?.completeness;
  const score = completeness?.score ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Local SEO</h1>
          <p className="text-muted-foreground">Google Business Profile management & local SEO optimization</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={clientId} onValueChange={setSelectedClient}>
            <SelectTrigger className="w-[200px]"><SelectValue placeholder="Select client" /></SelectTrigger>
            <SelectContent>
              {clients?.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => syncMutation.mutate(clientId)} disabled={syncMutation.isPending}>
            <RefreshCw className={`h-4 w-4 mr-1 ${syncMutation.isPending ? "animate-spin" : ""}`} /> Sync
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview"><MapPin className="h-4 w-4 mr-1" /> Overview</TabsTrigger>
          <TabsTrigger value="profile"><Eye className="h-4 w-4 mr-1" /> Profile</TabsTrigger>
          <TabsTrigger value="posts"><FileText className="h-4 w-4 mr-1" /> Posts</TabsTrigger>
          <TabsTrigger value="reviews"><Star className="h-4 w-4 mr-1" /> Reviews</TabsTrigger>
          <TabsTrigger value="qna"><HelpCircle className="h-4 w-4 mr-1" /> Q&A</TabsTrigger>
          <TabsTrigger value="insights"><TrendingUp className="h-4 w-4 mr-1" /> Insights</TabsTrigger>
          <TabsTrigger value="settings"><Settings className="h-4 w-4 mr-1" /> Settings</TabsTrigger>
        </TabsList>

        {/* OVERVIEW */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2"><CardDescription>Completeness</CardDescription></CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{score}%</div>
                <Progress value={score} className="mt-2" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardDescription>Reviews</CardDescription></CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{profile?.reviews_count ?? 0}</div>
                <p className="text-xs text-muted-foreground">Avg {profile?.average_rating ?? 0} ★</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardDescription>Unanswered Reviews</CardDescription></CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {reviews?.filter((r: any) => r.response_status === "unreviewed").length ?? 0}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardDescription>Open Q&A</CardDescription></CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {qna?.filter((q: any) => q.status === "unreviewed").length ?? 0}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Top Priorities</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {insights?.filter((i: any) => i.priority === "high").slice(0, 5).map((i: any) => (
                  <div key={i.id} className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{i.title}</p>
                      <p className="text-xs text-muted-foreground">{i.recommended_action}</p>
                    </div>
                  </div>
                )) || <p className="text-sm text-muted-foreground">No insights yet. Sync your GBP profile first.</p>}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Profile Summary</CardTitle></CardHeader>
              <CardContent className="space-y-1 text-sm">
                <p><span className="text-muted-foreground">Business:</span> <span className="text-foreground">{profile?.business_name || "—"}</span></p>
                <p><span className="text-muted-foreground">Category:</span> <span className="text-foreground">{profile?.primary_category || "—"}</span></p>
                <p><span className="text-muted-foreground">Photos:</span> <span className="text-foreground">{profile?.photos_count ?? 0}</span></p>
                <p><span className="text-muted-foreground">Posts:</span> <span className="text-foreground">{profile?.posts_count ?? 0}</span></p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* PROFILE COMPLETENESS */}
        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile Completeness</CardTitle>
              <CardDescription>Score: {score}% — {completeness?.missingItems?.length ?? 0} items missing</CardDescription>
            </CardHeader>
            <CardContent>
              <Progress value={score} className="mb-4" />
              {completeness?.missingItems?.length ? (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-foreground">Missing Items</h4>
                  {completeness.missingItems.map((item: string, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <AlertTriangle className="h-3 w-3 text-destructive" />
                      <span className="text-foreground">{item}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="h-4 w-4 text-primary" /> Profile is complete!
                </div>
              )}
              {completeness?.priorityActions?.length ? (
                <div className="mt-4 space-y-2">
                  <h4 className="text-sm font-medium text-foreground">Priority Actions</h4>
                  {completeness.priorityActions.map((a: string, i: number) => (
                    <p key={i} className="text-sm text-muted-foreground">• {a}</p>
                  ))}
                </div>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>

        {/* POSTS */}
        <TabsContent value="posts" className="space-y-4">
          {posts?.length ? posts.map((p: any) => (
            <Card key={p.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{p.title || "Untitled Post"}</CardTitle>
                  <Badge variant={statusColor(p.status)}>{p.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-foreground whitespace-pre-wrap">{p.content?.substring(0, 300)}</p>
                {p.cta_type && <p className="text-xs text-muted-foreground">CTA: {p.cta_type} → {p.cta_url}</p>}
                <div className="flex gap-2 pt-2">
                  {p.status === "draft" && (
                    <Button size="sm" onClick={() => approvePost.mutate(p.id)}>
                      <ThumbsUp className="h-3 w-3 mr-1" /> Approve
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )) : (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No GBP post drafts yet.</CardContent></Card>
          )}
        </TabsContent>

        {/* REVIEWS */}
        <TabsContent value="reviews" className="space-y-4">
          {reviews?.length ? reviews.map((r: any) => (
            <Card key={r.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">{r.reviewer_name || "Anonymous"}</CardTitle>
                    <CardDescription>{r.rating} ★ — {r.review_date ? new Date(r.review_date).toLocaleDateString() : ""}</CardDescription>
                  </div>
                  <Badge variant={statusColor(r.response_status)}>{r.response_status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-foreground">{r.review_text}</p>
                {r.response_draft && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Response Draft:</p>
                      <p className="text-sm text-foreground">{r.response_draft}</p>
                    </div>
                  </>
                )}
                <div className="flex gap-2 pt-1">
                  {r.response_status === "unreviewed" && (
                    <Button size="sm" variant="outline" onClick={() => genResponse.mutate(r.id)}>
                      <MessageSquare className="h-3 w-3 mr-1" /> Generate Response
                    </Button>
                  )}
                  {r.response_status === "drafted" && (
                    <Button size="sm" onClick={() => approveResponse.mutate(r.id)}>
                      <ThumbsUp className="h-3 w-3 mr-1" /> Approve
                    </Button>
                  )}
                  {r.response_status === "approved" && (
                    <Button size="sm" variant="outline"><Send className="h-3 w-3 mr-1" /> Send Response</Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )) : (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No reviews synced yet. Click Sync to import.</CardContent></Card>
          )}
        </TabsContent>

        {/* Q&A */}
        <TabsContent value="qna" className="space-y-4">
          {qna?.length ? qna.map((q: any) => (
            <Card key={q.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{q.question_text}</CardTitle>
                  <Badge variant={statusColor(q.status)}>{q.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {q.answer_draft && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Answer Draft:</p>
                    <p className="text-sm text-foreground">{q.answer_draft}</p>
                  </div>
                )}
                <div className="flex gap-2">
                  {q.status === "unreviewed" && (
                    <Button size="sm" variant="outline" onClick={() => genAnswer.mutate(q.id)}>
                      <MessageSquare className="h-3 w-3 mr-1" /> Generate Answer
                    </Button>
                  )}
                  {q.status === "drafted" && (
                    <Button size="sm" onClick={() => approveAnswer.mutate(q.id)}>
                      <ThumbsUp className="h-3 w-3 mr-1" /> Approve
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )) : (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No Q&A items synced yet.</CardContent></Card>
          )}
        </TabsContent>

        {/* INSIGHTS */}
        <TabsContent value="insights" className="space-y-4">
          {insights?.length ? insights.map((i: any) => (
            <Card key={i.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant={priorityColor(i.priority)}>{i.priority}</Badge>
                    <CardTitle className="text-base">{i.title}</CardTitle>
                  </div>
                  {i.status === "open" && (
                    <Button size="sm" variant="ghost" onClick={() => updateInsight.mutate({ insightId: i.id, status: "reviewed" })}>
                      Mark Reviewed
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{i.description}</p>
                {i.recommended_action && <p className="text-sm text-foreground mt-1">→ {i.recommended_action}</p>}
              </CardContent>
            </Card>
          )) : (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No local SEO insights yet. Sync your GBP profile to generate.</CardContent></Card>
          )}
        </TabsContent>

        {/* SETTINGS */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>GBP Connection</CardTitle>
              <CardDescription>
                {connection ? `Connected: ${connection.business_name || connection.location_id} (${connection.status})` : "Not connected"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                To connect Google Business Profile, configure OAuth credentials and location ID in your backend environment variables.
                The connection uses the Google My Business API with provider-ready architecture.
              </p>
              {connection && (
                <div className="mt-3 space-y-1 text-sm">
                  <p><span className="text-muted-foreground">Location ID:</span> <span className="text-foreground">{connection.location_id}</span></p>
                  <p><span className="text-muted-foreground">Account ID:</span> <span className="text-foreground">{connection.account_id}</span></p>
                  <p><span className="text-muted-foreground">Status:</span> <Badge variant={connection.status === "connected" ? "default" : "destructive"}>{connection.status}</Badge></p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
