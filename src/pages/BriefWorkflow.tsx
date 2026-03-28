import { useState, useMemo, useEffect } from "react";
import { usePageRestore } from "@/hooks/use-workspace-restore";
import { MascotSectionHeader } from "@/components/MascotCast";
import { PlanningMemoryTrail } from "@/components/PlanningMemoryTrail";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { request } from "@/lib/api";
import type { SeoBrief, SeoBriefDraft, DraftReviewCheck } from "@/lib/api";
import { useActiveClient } from "@/contexts/ClientContext";
import { PageTransition, StaggerContainer, StaggerItem } from "@/components/motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  FileText, Target, Shield, CheckCircle, XCircle, Clock, AlertTriangle,
  ChevronRight, Sparkles, Eye, Edit, Send, ArrowLeft, Link2,
  Globe, MapPin, HelpCircle, BookOpen, Zap, BarChart3, Info,
  CheckCircle2, AlertCircle, Minus,
} from "lucide-react";

// ─── Status Config ───
const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  draft: { label: "Draft", color: "bg-muted text-muted-foreground", icon: Edit },
  under_review: { label: "Under Review", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400", icon: Eye },
  changes_requested: { label: "Changes Requested", color: "bg-orange-500/10 text-orange-600 dark:text-orange-400", icon: AlertTriangle },
  approved: { label: "Approved", color: "bg-primary/10 text-primary", icon: CheckCircle },
  rejected: { label: "Rejected", color: "bg-destructive/10 text-destructive", icon: XCircle },
  ready_for_publishing: { label: "Ready for Publishing", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400", icon: Send },
  published: { label: "Published", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400", icon: CheckCircle2 },
};

const pageTypeConfig: Record<string, { label: string; icon: typeof Target }> = {
  core_service: { label: "Core Service", icon: Target },
  sub_service: { label: "Sub-Service", icon: Globe },
  location_page: { label: "Location Page", icon: MapPin },
  faq_page: { label: "FAQ Page", icon: HelpCircle },
  blog_post: { label: "Blog Post", icon: BookOpen },
  comparison_page: { label: "Comparison", icon: BarChart3 },
};

const priorityColors: Record<string, string> = {
  high: "bg-destructive/10 text-destructive border-destructive/30",
  medium: "bg-amber-500/10 text-amber-600 border-amber-200 dark:text-amber-400",
  low: "bg-muted text-muted-foreground border-border",
};

const checkStatusIcon: Record<string, { icon: typeof CheckCircle2; color: string }> = {
  pass: { icon: CheckCircle2, color: "text-green-600 dark:text-green-400" },
  fail: { icon: XCircle, color: "text-destructive" },
  warning: { icon: AlertCircle, color: "text-amber-600 dark:text-amber-400" },
  pending: { icon: Minus, color: "text-muted-foreground" },
};

export default function BriefWorkflow() {
  const { activeClientId: clientId } = useActiveClient();
  const queryClient = useQueryClient();
  const [selectedBriefId, setSelectedBriefId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("queue");
  const [statusFilter, setStatusFilter] = useState("all");
  const [pageTypeFilter, setPageTypeFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState<Partial<SeoBrief>>({});

  // ─── Queries ───
  const { data: briefs = [], isLoading } = useQuery<SeoBrief[]>({
    queryKey: ["briefs", clientId],
    queryFn: () => request(`/clients/${clientId}/briefs`),
    enabled: !!clientId,
  });

  const { data: selectedBrief } = useQuery<SeoBrief>({
    queryKey: ["brief", selectedBriefId],
    queryFn: () => request(`/briefs/${selectedBriefId}`),
    enabled: !!selectedBriefId,
  });

  const { data: drafts = [] } = useQuery<SeoBriefDraft[]>({
    queryKey: ["brief-drafts", selectedBriefId],
    queryFn: () => request(`/briefs/${selectedBriefId}/drafts`),
    enabled: !!selectedBriefId,
  });

  // ─── Mutations ───
  const updateBrief = useMutation({
    mutationFn: ({ briefId, data }: { briefId: string; data: Partial<SeoBrief> }) =>
      request(`/briefs/${briefId}`, { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["briefs", clientId] });
      queryClient.invalidateQueries({ queryKey: ["brief", selectedBriefId] });
      setEditMode(false);
      toast.success("Brief updated");
    },
  });

  const generateDraft = useMutation({
    mutationFn: (briefId: string) =>
      request(`/briefs/${briefId}/generate-draft`, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brief-drafts", selectedBriefId] });
      toast.success("Draft generated");
    },
  });

  const updateDraftStatus = useMutation({
    mutationFn: ({ draftId, status }: { draftId: string; status: string }) =>
      request(`/drafts/${draftId}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brief-drafts", selectedBriefId] });
      queryClient.invalidateQueries({ queryKey: ["briefs", clientId] });
      toast.success("Draft status updated");
    },
  });

  const updateBriefStatus = useMutation({
    mutationFn: ({ briefId, status }: { briefId: string; status: string }) =>
      request(`/clients/${clientId}/briefs/${briefId}`, { method: "PATCH", body: JSON.stringify({ status }) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["briefs", clientId] });
      queryClient.invalidateQueries({ queryKey: ["brief", selectedBriefId] });
      toast.success("Brief status updated");
    },
  });

  // ─── Filters ───
  const filteredBriefs = useMemo(() => {
    let items = [...briefs];
    if (statusFilter !== "all") items = items.filter(b => b.status === statusFilter);
    if (pageTypeFilter !== "all") items = items.filter(b => b.page_type === pageTypeFilter);
    if (priorityFilter !== "all") items = items.filter(b => b.priority === priorityFilter);
    return items;
  }, [briefs, statusFilter, pageTypeFilter, priorityFilter]);

  const stats = {
    total: briefs.length,
    draft: briefs.filter(b => b.status === "draft").length,
    under_review: briefs.filter(b => b.status === "under_review" || b.status === "changes_requested").length,
    approved: briefs.filter(b => b.status === "approved" || b.status === "ready_for_publishing").length,
  };

  // ─── Brief Detail View ───
  if (selectedBriefId && selectedBrief) {
    const brief = selectedBrief;
    const st = statusConfig[brief.status] || statusConfig.draft;
    const pt = pageTypeConfig[brief.page_type || ""] || { label: brief.page_type || "—", icon: FileText };
    const latestDraft = drafts[0];

    return (
      <PageTransition className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => { setSelectedBriefId(null); setEditMode(false); }}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground">{brief.title}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className={st.color}><st.icon className="h-3 w-3 mr-1" />{st.label}</Badge>
                <Badge variant="outline"><pt.icon className="h-3 w-3 mr-1" />{pt.label}</Badge>
                {brief.priority && <Badge variant="outline" className={priorityColors[brief.priority]}>{brief.priority}</Badge>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!editMode && (
              <Button variant="outline" size="sm" onClick={() => { setEditMode(true); setEditData(brief); }}>
                <Edit className="h-4 w-4 mr-1" /> Edit Brief
              </Button>
            )}
            {editMode && (
              <>
                <Button variant="ghost" size="sm" onClick={() => setEditMode(false)}>Cancel</Button>
                <Button size="sm" onClick={() => updateBrief.mutate({ briefId: brief.id, data: editData })} disabled={updateBrief.isPending}>
                  Save Changes
                </Button>
              </>
            )}
            {!latestDraft && (
              <Button size="sm" className="gap-1" onClick={() => generateDraft.mutate(brief.id)} disabled={generateDraft.isPending}>
                <Sparkles className="h-4 w-4" /> Generate Draft
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Panel */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs defaultValue={latestDraft ? "draft" : "brief"}>
              <TabsList>
                <TabsTrigger value="brief" className="gap-1"><FileText className="h-3.5 w-3.5" /> Brief</TabsTrigger>
                {latestDraft && <TabsTrigger value="draft" className="gap-1"><Edit className="h-3.5 w-3.5" /> Draft</TabsTrigger>}
                {latestDraft && <TabsTrigger value="review" className="gap-1"><Shield className="h-3.5 w-3.5" /> Review</TabsTrigger>}
              </TabsList>

              {/* Brief Tab */}
              <TabsContent value="brief" className="space-y-4">
                <Card>
                  <CardHeader><CardTitle className="text-base">Structured Brief</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    {editMode ? (
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium block mb-1">Title</label>
                          <Input value={editData.title || ""} onChange={e => setEditData(d => ({ ...d, title: e.target.value }))} />
                        </div>
                        <div>
                          <label className="text-sm font-medium block mb-1">Meta Description</label>
                          <Textarea value={editData.meta_description || ""} onChange={e => setEditData(d => ({ ...d, meta_description: e.target.value }))} rows={2} />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-sm font-medium block mb-1">Suggested H1</label>
                            <Input value={editData.suggested_h1 || ""} onChange={e => setEditData(d => ({ ...d, suggested_h1: e.target.value }))} />
                          </div>
                          <div>
                            <label className="text-sm font-medium block mb-1">Recommended Slug</label>
                            <Input value={editData.recommended_slug || ""} onChange={e => setEditData(d => ({ ...d, recommended_slug: e.target.value }))} />
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium block mb-1">Target Audience</label>
                          <Input value={editData.target_audience || ""} onChange={e => setEditData(d => ({ ...d, target_audience: e.target.value }))} />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-sm font-medium block mb-1">Page Goal</label>
                            <Input value={editData.page_goal || ""} onChange={e => setEditData(d => ({ ...d, page_goal: e.target.value }))} />
                          </div>
                          <div>
                            <label className="text-sm font-medium block mb-1">CTA Angle</label>
                            <Input value={editData.cta_angle || ""} onChange={e => setEditData(d => ({ ...d, cta_angle: e.target.value }))} />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <InfoRow label="Primary Keyword" value={brief.keyword} />
                          <InfoRow label="Search Intent" value={brief.search_intent || "—"} />
                          <InfoRow label="Suggested H1" value={brief.suggested_h1 || "—"} />
                          <InfoRow label="Recommended Slug" value={brief.recommended_slug || "—"} />
                          <InfoRow label="Target Audience" value={brief.target_audience || "—"} />
                          <InfoRow label="Page Goal" value={brief.page_goal || "—"} />
                          <InfoRow label="CTA Angle" value={brief.cta_angle || "—"} />
                          <InfoRow label="Meta Description" value={brief.meta_description} />
                        </div>
                        {brief.secondary_keywords && brief.secondary_keywords.length > 0 && (
                          <div>
                            <label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Secondary Keywords</label>
                            <div className="flex flex-wrap gap-1.5 mt-1">
                              {brief.secondary_keywords.map(k => <Badge key={k} variant="outline" className="text-xs">{k}</Badge>)}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Sections */}
                {brief.sections && brief.sections.length > 0 && (
                  <Card>
                    <CardHeader><CardTitle className="text-base">Recommended Sections</CardTitle></CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {brief.sections.map((s, i) => (
                          <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/40">
                            <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary mt-0.5">{i + 1}</div>
                            <div className="flex-1">
                              <p className="text-sm font-semibold">{s.title}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">{s.guidance}</p>
                              {s.word_count_target && <p className="text-xs text-muted-foreground mt-1">Target: ~{s.word_count_target} words</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* FAQ */}
                {brief.faq && brief.faq.length > 0 && (
                  <Card>
                    <CardHeader><CardTitle className="text-base">FAQ Suggestions</CardTitle></CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {brief.faq.map((f, i) => (
                          <div key={i} className="p-3 rounded-lg bg-muted/40">
                            <p className="text-sm font-semibold flex items-center gap-2"><HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />{f.question}</p>
                            <p className="text-xs text-muted-foreground mt-1 ml-5">{f.answer}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Draft Tab */}
              {latestDraft && (
                <TabsContent value="draft" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                          Draft v{latestDraft.version}
                          <Badge variant="outline" className={statusConfig[latestDraft.status]?.color || ""}>{statusConfig[latestDraft.status]?.label || latestDraft.status}</Badge>
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => generateDraft.mutate(brief.id)} disabled={generateDraft.isPending}>
                            <Sparkles className="h-3.5 w-3.5 mr-1" /> Regenerate
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="prose prose-sm max-w-none dark:prose-invert">
                        {latestDraft.content.split("\n").map((line, i) => {
                          if (line.startsWith("# ")) return <h1 key={i} className="text-xl font-bold mt-4 mb-2">{line.slice(2)}</h1>;
                          if (line.startsWith("## ")) return <h2 key={i} className="text-lg font-semibold mt-4 mb-2">{line.slice(3)}</h2>;
                          if (line.startsWith("### ")) return <h3 key={i} className="text-base font-semibold mt-3 mb-1">{line.slice(4)}</h3>;
                          if (line.startsWith("- ")) return <li key={i} className="text-sm text-muted-foreground ml-4">{line.slice(2)}</li>;
                          if (line.startsWith("|")) return <pre key={i} className="text-xs text-muted-foreground font-mono">{line}</pre>;
                          if (line === "---") return <Separator key={i} className="my-4" />;
                          if (line.trim() === "") return <br key={i} />;
                          return <p key={i} className="text-sm text-foreground leading-relaxed mb-2">{line.replace(/\*\*(.*?)\*\*/g, "$1")}</p>;
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              )}

              {/* Review Tab */}
              {latestDraft && (
                <TabsContent value="review" className="space-y-4">
                  {/* Review Checks */}
                  <Card>
                    <CardHeader><CardTitle className="text-base flex items-center gap-2"><Shield className="h-4 w-4 text-primary" /> Review Checklist</CardTitle></CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {(latestDraft.review_checks || []).map((check: DraftReviewCheck) => {
                          const cs = checkStatusIcon[check.status] || checkStatusIcon.pending;
                          return (
                            <div key={check.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                              <cs.icon className={`h-5 w-5 mt-0.5 ${cs.color}`} />
                              <div className="flex-1">
                                <p className="text-sm font-medium">{check.label}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">{check.detail}</p>
                              </div>
                              <Badge variant="outline" className={`text-[10px] ${check.status === "pass" ? "text-green-600 border-green-200" : check.status === "fail" ? "text-destructive border-destructive/30" : check.status === "warning" ? "text-amber-600 border-amber-200" : ""}`}>
                                {check.status}
                              </Badge>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Internal Link Suggestions */}
                  {latestDraft.internal_link_suggestions && latestDraft.internal_link_suggestions.length > 0 && (
                    <Card>
                      <CardHeader><CardTitle className="text-base flex items-center gap-2"><Link2 className="h-4 w-4 text-seo-primary" /> Internal Link Suggestions</CardTitle></CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {latestDraft.internal_link_suggestions.map((link: any, i: number) => (
                            <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                              <Link2 className="h-4 w-4 text-muted-foreground" />
                              <div className="flex-1 text-sm">
                                <span className="font-mono text-xs text-muted-foreground">{link.from}</span>
                                <span className="mx-2">→</span>
                                <span className="font-mono text-xs text-primary">{link.to}</span>
                                <span className="mx-2 text-muted-foreground">anchor:</span>
                                <span className="italic">"{link.anchor}"</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Approval Actions */}
                  <Card>
                    <CardHeader><CardTitle className="text-base">Approval Actions</CardTitle></CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {latestDraft.status !== "approved" && latestDraft.status !== "ready_for_publishing" && (
                          <Button size="sm" className="gap-1" onClick={() => updateDraftStatus.mutate({ draftId: latestDraft.id, status: "approved" })}>
                            <CheckCircle className="h-4 w-4" /> Approve
                          </Button>
                        )}
                        {latestDraft.status !== "changes_requested" && latestDraft.status !== "approved" && (
                          <Button size="sm" variant="outline" className="gap-1" onClick={() => updateDraftStatus.mutate({ draftId: latestDraft.id, status: "changes_requested" })}>
                            <AlertTriangle className="h-4 w-4" /> Request Changes
                          </Button>
                        )}
                        {latestDraft.status !== "rejected" && (
                          <Button size="sm" variant="outline" className="gap-1 text-destructive" onClick={() => updateDraftStatus.mutate({ draftId: latestDraft.id, status: "rejected" })}>
                            <XCircle className="h-4 w-4" /> Reject
                          </Button>
                        )}
                        {latestDraft.status === "approved" && (
                          <Button size="sm" variant="outline" className="gap-1 text-emerald-600" onClick={() => {
                            updateDraftStatus.mutate({ draftId: latestDraft.id, status: "ready_for_publishing" });
                            updateBriefStatus.mutate({ briefId: brief.id, status: "ready_for_publishing" });
                          }}>
                            <Send className="h-4 w-4" /> Mark Ready for Publishing
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              )}
            </Tabs>
          </div>

          {/* Evidence Side Panel */}
          <div className="space-y-4">
            {/* Brief Status Actions */}
            <Card>
              <CardHeader><CardTitle className="text-sm">Brief Status</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <st.icon className="h-4 w-4" />
                  <span className="text-sm font-medium">{st.label}</span>
                </div>
                <Separator />
                <div className="flex flex-wrap gap-1.5">
                  {brief.status === "draft" && (
                    <Button size="sm" variant="outline" className="text-xs" onClick={() => updateBriefStatus.mutate({ briefId: brief.id, status: "under_review" })}>
                      Submit for Review
                    </Button>
                  )}
                  {brief.status === "under_review" && (
                    <Button size="sm" variant="outline" className="text-xs" onClick={() => updateBriefStatus.mutate({ briefId: brief.id, status: "approved" })}>
                      Approve Brief
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Evidence */}
            {brief.evidence && brief.evidence.length > 0 && (
              <Card>
                <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Info className="h-4 w-4 text-primary" /> Supporting Evidence</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {brief.evidence.map((ev, i) => (
                      <div key={i} className="p-2.5 rounded-lg bg-muted/40 space-y-1">
                        <Badge variant="outline" className="text-[10px]">{ev.type === "keyword" ? "🔍 Keyword" : ev.type === "competitor" ? "🏢 Competitor" : "⚡ Audit"}</Badge>
                        <p className="text-xs font-medium">{ev.source}</p>
                        <p className="text-xs text-muted-foreground">{ev.detail}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Competitor Context */}
            {brief.competitor_context && brief.competitor_context.length > 0 && (
              <Card>
                <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Globe className="h-4 w-4 text-seo-primary" /> Competitor Context</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {brief.competitor_context.map((c, i) => (
                      <p key={i} className="text-xs text-muted-foreground bg-muted/40 p-2 rounded">• {c}</p>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Audit Context */}
            {brief.audit_context && brief.audit_context.length > 0 && (
              <Card>
                <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Shield className="h-4 w-4 text-amber-600" /> Audit Context</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {brief.audit_context.map((a, i) => (
                      <p key={i} className="text-xs text-muted-foreground bg-muted/40 p-2 rounded">⚠ {a}</p>
                    ))}
                  </div>
                </CardContent>
              </Card>
             )}

            {/* Planning Memory — Content Lifecycle Trail */}
            <Card>
              <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Clock className="h-4 w-4 text-muted-foreground" /> Content Lifecycle</CardTitle></CardHeader>
              <CardContent>
                <PlanningMemoryTrail lifecycle={[
                  { id: `lc-${brief.id}-1`, event_type: "created", entity_type: "keyword_research", entity_id: brief.source_mapping_id || null, summary: `Brief created from keyword: "${brief.keyword}"`, actor: "user", created_at: brief.created_at },
                  ...(brief.status !== "draft" ? [{ id: `lc-${brief.id}-2`, event_type: brief.status === "under_review" ? "brief_created" : "approved", entity_type: "seo_brief", entity_id: brief.id, summary: `Status: ${brief.status}`, actor: "user", created_at: brief.created_at }] : []),
                  ...(drafts.length > 0 ? [{ id: `lc-${brief.id}-3`, event_type: "draft_generated" as const, entity_type: "seo_brief_draft", entity_id: drafts[0].id, summary: `Draft v${drafts[0].version} generated (${drafts[0].status})`, actor: "system", created_at: drafts[0].created_at }] : []),
                  ...(drafts.length > 0 && drafts[0].status === "approved" ? [{ id: `lc-${brief.id}-4`, event_type: "approved" as const, entity_type: "seo_brief_draft", entity_id: drafts[0].id, summary: "Draft approved — ready for publishing", actor: "user", created_at: drafts[0].updated_at }] : []),
                  ...(brief.status === "ready_for_publishing" ? [{ id: `lc-${brief.id}-5`, event_type: "published" as const, entity_type: "seo_brief", entity_id: brief.id, summary: "Marked ready for publishing", actor: "user", created_at: brief.created_at }] : []),
                ]} />
              </CardContent>
            </Card>
          </div>
        </div>
      </PageTransition>
    );
  }

  // ─── Queue List View ───
  return (
    <PageTransition className="space-y-6">
      <MascotSectionHeader role="content" title="Brief Workflow" subtitle="Service page briefs → drafts → review → approval → publishing" />

      {/* Stats */}
      <StaggerContainer className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Briefs", value: stats.total, icon: FileText, color: "text-content-primary" },
          { label: "Drafts", value: stats.draft, icon: Edit, color: "text-muted-foreground" },
          { label: "In Review", value: stats.under_review, icon: Eye, color: "text-amber-500" },
          { label: "Approved / Ready", value: stats.approved, icon: CheckCircle, color: "text-emerald-500" },
        ].map((s, i) => (
          <StaggerItem key={i}>
            <Card className="hover-lift">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{s.label}</p>
                  <p className="text-2xl font-bold mt-1">{s.value}</p>
                </div>
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </CardContent>
            </Card>
          </StaggerItem>
        ))}
      </StaggerContainer>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px] h-8 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="under_review">Under Review</SelectItem>
            <SelectItem value="changes_requested">Changes Requested</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="ready_for_publishing">Ready for Publishing</SelectItem>
          </SelectContent>
        </Select>
        <Select value={pageTypeFilter} onValueChange={setPageTypeFilter}>
          <SelectTrigger className="w-[150px] h-8 text-xs"><SelectValue placeholder="Page Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="core_service">Core Service</SelectItem>
            <SelectItem value="sub_service">Sub-Service</SelectItem>
            <SelectItem value="location_page">Location Page</SelectItem>
            <SelectItem value="faq_page">FAQ Page</SelectItem>
            <SelectItem value="blog_post">Blog Post</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-[130px] h-8 text-xs"><SelectValue placeholder="Priority" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
        {(statusFilter !== "all" || pageTypeFilter !== "all" || priorityFilter !== "all") && (
          <Button variant="ghost" size="sm" className="text-xs" onClick={() => { setStatusFilter("all"); setPageTypeFilter("all"); setPriorityFilter("all"); }}>Clear filters</Button>
        )}
      </div>

      {/* Brief List */}
      {isLoading ? (
        <div className="grid gap-3">{[1, 2, 3].map(i => <Card key={i}><CardContent className="p-5"><Skeleton className="h-16 w-full" /></CardContent></Card>)}</div>
      ) : filteredBriefs.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Briefs Found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create briefs from keyword research page mappings to start the content workflow
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filteredBriefs.map((brief, idx) => {
            const st = statusConfig[brief.status] || statusConfig.draft;
            const pt = pageTypeConfig[brief.page_type || ""] || { label: brief.page_type || "—", icon: FileText };
            return (
              <motion.div key={brief.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}>
                <Card
                  className="cursor-pointer hover:shadow-md transition-all duration-200 hover:border-primary/30"
                  onClick={() => setSelectedBriefId(brief.id)}
                >
                  <CardContent className="p-4 flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-content-primary/20 to-content-primary/5 flex items-center justify-center shrink-0">
                        <pt.icon className="h-5 w-5 text-content-primary" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold truncate">{brief.title}</h3>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <Badge variant="outline" className="text-[10px]">{brief.keyword}</Badge>
                          <Badge variant="outline" className={`text-[10px] ${st.color}`}>{st.label}</Badge>
                          {brief.priority && <Badge variant="outline" className={`text-[10px] ${priorityColors[brief.priority]}`}>{brief.priority}</Badge>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">{new Date(brief.created_at).toLocaleDateString()}</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </PageTransition>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">{label}</label>
      <p className="text-sm text-foreground mt-0.5">{value}</p>
    </div>
  );
}
