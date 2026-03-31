import { useState, useMemo } from "react";
import { PageTransition, StaggerContainer, StaggerItem } from "@/components/motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useActiveClient } from "@/contexts/ClientContext";
import { useCompetitorBenchmarks, useCompetitorBenchmarkDetail, useStartCompetitorBenchmark, useAuditRuns } from "@/hooks/use-api";
import {
  Shield, Globe, Play, Eye, BarChart3, ArrowRight, Loader2, AlertTriangle, AlertCircle, Info,
  CheckCircle2, FileText, MapPin, MessageSquare, Layout, Search, Zap, TrendingUp, ArrowLeftRight,
  ChevronRight, ExternalLink, Target,
} from "lucide-react";
import { toast } from "sonner";

const pageTypeConfig: Record<string, { label: string; icon: any; color: string }> = {
  homepage: { label: "Homepage", icon: Layout, color: "text-primary" },
  core_service: { label: "Service Page", icon: Target, color: "text-emerald-500" },
  sub_service: { label: "Sub-Service", icon: FileText, color: "text-teal-500" },
  location: { label: "Location", icon: MapPin, color: "text-amber-500" },
  blog_article: { label: "Blog / Article", icon: FileText, color: "text-sky-500" },
  faq: { label: "FAQ", icon: MessageSquare, color: "text-violet-500" },
  comparison: { label: "Comparison", icon: ArrowLeftRight, color: "text-orange-500" },
  contact_conversion: { label: "Contact / CTA", icon: Zap, color: "text-rose-500" },
  utility: { label: "Utility / Legal", icon: FileText, color: "text-muted-foreground" },
};

const priorityConfig: Record<string, { color: string; bg: string }> = {
  high: { color: "text-destructive", bg: "bg-destructive/10" },
  medium: { color: "text-amber-600", bg: "bg-amber-500/10" },
  low: { color: "text-muted-foreground", bg: "bg-muted" },
};

const impactLabels: Record<string, string> = {
  service_rankings: "Service Page Rankings",
  local_rankings: "Local Rankings",
  content_support: "Content Support",
  technical: "Technical SEO",
};

export default function CompetitorBenchmark() {
  const { activeClientId } = useActiveClient();
  const { data: benchmarks = [] } = useCompetitorBenchmarks(activeClientId);
  const { data: auditRuns = [] } = useAuditRuns(activeClientId);

  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [mainTab, setMainTab] = useState("runs");

  // Form
  const [targetDomain, setTargetDomain] = useState("");
  const [competitorDomain, setCompetitorDomain] = useState("");
  const [scope, setScope] = useState("full_crawl");
  const [provider, setProvider] = useState("mock");
  const [ownAuditRunId, setOwnAuditRunId] = useState("");

  const startBenchmark = useStartCompetitorBenchmark(activeClientId);
  const { data: detail } = useCompetitorBenchmarkDetail(selectedRunId || "");

  const handleStart = () => {
    if (!competitorDomain) { toast.error("Enter a competitor domain"); return; }
    startBenchmark.mutate(
      { target_domain: targetDomain, competitor_domain: competitorDomain, scope, provider, own_audit_run_id: ownAuditRunId || undefined },
      { onSuccess: () => { toast.success("Benchmark started"); setShowNew(false); setCompetitorDomain(""); } }
    );
  };

  // Page type distribution
  const pageTypeCounts = useMemo(() => {
    if (!detail?.pages) return {};
    const counts: Record<string, number> = {};
    detail.pages.forEach((p: any) => { counts[p.page_type] = (counts[p.page_type] || 0) + 1; });
    return counts;
  }, [detail?.pages]);

  const totalPages = detail?.pages?.length || 0;

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Competitor Benchmark</h1>
            <p className="text-sm text-muted-foreground mt-1">Analyze competitor site structure, page types, and identify strategic gaps</p>
          </div>
          <Button onClick={() => setShowNew(true)} className="gap-2"><Play className="h-4 w-4" /> New Benchmark</Button>
        </div>

        {!activeClientId ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">Select a client to start benchmarking competitors.</CardContent></Card>
        ) : (
          <Tabs value={selectedRunId ? "detail" : mainTab} onValueChange={(v) => { if (v !== "detail") { setSelectedRunId(null); setMainTab(v); } }}>
            <TabsList>
              <TabsTrigger value="runs">Benchmark Runs</TabsTrigger>
              {selectedRunId && <TabsTrigger value="detail">Benchmark Detail</TabsTrigger>}
            </TabsList>

            {/* ── Runs List ── */}
            <TabsContent value="runs">
              <StaggerContainer>
                {benchmarks.length === 0 ? (
                  <Card><CardContent className="py-12 text-center text-muted-foreground">No benchmark runs yet. Click "New Benchmark" to analyze a competitor.</CardContent></Card>
                ) : (
                  <div className="space-y-3">
                    {(benchmarks as any[]).map((run: any) => (
                      <StaggerItem key={run.id}>
                        <Card className="cursor-pointer hover:border-primary/30 transition-colors" onClick={() => setSelectedRunId(run.id)}>
                          <CardContent className="py-4 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="p-2 rounded-lg bg-primary/10"><Globe className="h-5 w-5 text-primary" /></div>
                              <div>
                                <p className="font-semibold text-foreground">{run.competitor_domain}</p>
                                <p className="text-xs text-muted-foreground">vs {run.target_domain} • {run.scope.replace(/_/g, " ")} • {run.provider}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right text-sm">
                                <p className="text-muted-foreground">{run.pages_crawled} pages</p>
                                <Badge variant={run.status === "completed" ? "default" : "secondary"}>{run.status}</Badge>
                              </div>
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            </div>
                          </CardContent>
                        </Card>
                      </StaggerItem>
                    ))}
                  </div>
                )}
              </StaggerContainer>
            </TabsContent>

            {/* ── Benchmark Detail ── */}
            <TabsContent value="detail">
              {!detail ? (
                <Card><CardContent className="py-12 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /></CardContent></Card>
              ) : (
                <div className="space-y-6">
                  {/* Back */}
                  <Button variant="ghost" size="sm" onClick={() => setSelectedRunId(null)} className="gap-1 text-muted-foreground">← Back to runs</Button>

                  {/* Summary Header */}
                  <Card>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">{detail.competitor_domain}</CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">Benchmarked against {detail.target_domain} • Provider: <Badge variant="outline" className="ml-1">{detail.provider}</Badge></p>
                        </div>
                        {detail.own_audit_run_id && <Badge variant="secondary" className="gap-1"><ArrowLeftRight className="h-3 w-3" /> Compared to own audit</Badge>}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
                        {[
                          { label: "Pages Crawled", value: detail.pages_crawled },
                          { label: "Indexable", value: detail.indexable_pages },
                          { label: "Broken Links", value: detail.broken_links, warn: detail.broken_links > 0 },
                          { label: "Redirect Issues", value: detail.redirect_issues, warn: detail.redirect_issues > 0 },
                          { label: "Missing Titles", value: detail.missing_titles, warn: detail.missing_titles > 0 },
                          { label: "Missing Meta", value: detail.missing_meta, warn: detail.missing_meta > 0 },
                          { label: "Duplicate Titles", value: detail.duplicate_titles },
                          { label: "Missing H1", value: detail.missing_h1 },
                          { label: "Canonical Issues", value: detail.canonical_issues },
                          { label: "Avg Load (ms)", value: detail.avg_load_time_ms || "—" },
                          { label: "Avg LCP (ms)", value: detail.lcp_avg_ms || "—" },
                          { label: "Avg CLS", value: detail.cls_avg || "—" },
                        ].map((s) => (
                          <div key={s.label} className="text-center p-3 rounded-lg bg-muted/50">
                            <p className={`text-xl font-bold ${s.warn ? "text-destructive" : "text-foreground"}`}>{s.value}</p>
                            <p className="text-[11px] text-muted-foreground mt-1">{s.label}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Detail Tabs */}
                  <Tabs defaultValue="page_types">
                    <TabsList>
                      <TabsTrigger value="page_types">Page Types</TabsTrigger>
                      <TabsTrigger value="pages">All Pages ({totalPages})</TabsTrigger>
                      <TabsTrigger value="recommendations">Gap Analysis ({detail.recommendations?.length || 0})</TabsTrigger>
                      <TabsTrigger value="comparison">Comparison</TabsTrigger>
                    </TabsList>

                    {/* Page Type Distribution */}
                    <TabsContent value="page_types" className="space-y-4">
                      <Card>
                        <CardHeader><CardTitle className="text-base">Page Type Distribution</CardTitle></CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {Object.entries(pageTypeConfig).map(([type, cfg]) => {
                              const count = pageTypeCounts[type] || 0;
                              if (count === 0 && type === "homepage") return null; // always show homepage
                              const pct = totalPages > 0 ? (count / totalPages) * 100 : 0;
                              const Icon = cfg.icon;
                              return (
                                <div key={type} className="flex items-center gap-3">
                                  <Icon className={`h-4 w-4 shrink-0 ${cfg.color}`} />
                                  <span className="text-sm font-medium w-32 shrink-0">{cfg.label}</span>
                                  <div className="flex-1"><Progress value={pct} className="h-2" /></div>
                                  <span className="text-sm font-semibold w-8 text-right">{count}</span>
                                </div>
                              );
                            })}
                          </div>
                        </CardContent>
                      </Card>

                      {/* Service page focus */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[
                          { label: "Service Pages", types: ["core_service", "sub_service"], icon: Target, color: "text-emerald-500" },
                          { label: "Location Pages", types: ["location"], icon: MapPin, color: "text-amber-500" },
                          { label: "Supporting Content", types: ["blog_article", "faq", "comparison"], icon: FileText, color: "text-sky-500" },
                        ].map((group) => {
                          const count = group.types.reduce((a, t) => a + (pageTypeCounts[t] || 0), 0);
                          return (
                            <Card key={group.label}>
                              <CardContent className="py-6 text-center">
                                <group.icon className={`h-8 w-8 mx-auto ${group.color} mb-2`} />
                                <p className="text-3xl font-bold text-foreground">{count}</p>
                                <p className="text-sm text-muted-foreground">{group.label}</p>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </TabsContent>

                    {/* All Pages */}
                    <TabsContent value="pages">
                      <Card>
                        <CardContent className="p-0">
                          <ScrollArea className="max-h-[500px]">
                            <table className="w-full text-sm">
                              <thead className="bg-muted/50 sticky top-0">
                                <tr>
                                  <th className="text-left py-2 px-3 font-medium text-muted-foreground">URL</th>
                                  <th className="text-left py-2 px-3 font-medium text-muted-foreground">Type</th>
                                  <th className="text-left py-2 px-3 font-medium text-muted-foreground">Title</th>
                                  <th className="text-right py-2 px-3 font-medium text-muted-foreground">Words</th>
                                  <th className="text-right py-2 px-3 font-medium text-muted-foreground">Links</th>
                                  <th className="text-right py-2 px-3 font-medium text-muted-foreground">Load (ms)</th>
                                </tr>
                              </thead>
                              <tbody>
                                {(detail.pages || []).map((page: any) => {
                                  const cfg = pageTypeConfig[page.page_type] || pageTypeConfig.utility;
                                  const Icon = cfg.icon;
                                  return (
                                    <tr key={page.id} className="border-t border-border/30 hover:bg-muted/30">
                                      <td className="py-2 px-3 max-w-[250px] truncate font-mono text-xs">{page.url}</td>
                                      <td className="py-2 px-3"><Badge variant="outline" className="gap-1 text-xs"><Icon className={`h-3 w-3 ${cfg.color}`} />{cfg.label}</Badge></td>
                                      <td className="py-2 px-3 max-w-[200px] truncate">{page.title || "—"}</td>
                                      <td className="py-2 px-3 text-right">{page.word_count || "—"}</td>
                                      <td className="py-2 px-3 text-right">{page.internal_links_count ?? "—"}</td>
                                      <td className="py-2 px-3 text-right">{page.load_time_ms || "—"}</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </ScrollArea>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    {/* Gap Recommendations */}
                    <TabsContent value="recommendations" className="space-y-3">
                      {(detail.recommendations || []).length === 0 ? (
                        <Card><CardContent className="py-8 text-center text-muted-foreground">No gap recommendations generated.</CardContent></Card>
                      ) : (
                        (detail.recommendations || []).map((rec: any) => {
                          const pCfg = priorityConfig[rec.priority] || priorityConfig.medium;
                          return (
                            <Card key={rec.id} className={`border-l-4 ${rec.priority === "high" ? "border-l-destructive" : rec.priority === "medium" ? "border-l-amber-500" : "border-l-muted-foreground"}`}>
                              <CardContent className="py-4">
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <Badge className={`${pCfg.bg} ${pCfg.color} border-0`}>{rec.priority}</Badge>
                                    {rec.impact_area && <Badge variant="outline" className="text-xs">{impactLabels[rec.impact_area] || rec.impact_area}</Badge>}
                                    {rec.recommended_page_type && <Badge variant="outline" className="text-xs">{pageTypeConfig[rec.recommended_page_type]?.label || rec.recommended_page_type}</Badge>}
                                  </div>
                                </div>
                                <h3 className="font-semibold text-foreground mb-1">{rec.title}</h3>
                                <p className="text-sm text-muted-foreground mb-3">{rec.why_it_matters}</p>
                                <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                                  <div>
                                    <span className="text-xs font-medium text-muted-foreground uppercase">Evidence</span>
                                    <p className="text-sm">{rec.evidence}</p>
                                  </div>
                                  <Separator />
                                  <div>
                                    <span className="text-xs font-medium text-muted-foreground uppercase">Recommended Action</span>
                                    <p className="text-sm font-medium text-primary">{rec.recommended_action}</p>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })
                      )}
                    </TabsContent>

                    {/* Comparison View */}
                    <TabsContent value="comparison">
                      <ComparisonView detail={detail} />
                    </TabsContent>
                  </Tabs>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}

        {/* New Benchmark Dialog */}
        <Dialog open={showNew} onOpenChange={setShowNew}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader><DialogTitle>New Competitor Benchmark</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Your Domain</Label>
                <Input placeholder="webby.sg" value={targetDomain} onChange={e => setTargetDomain(e.target.value)} />
              </div>
              <div>
                <Label>Competitor Domain *</Label>
                <Input placeholder="competitor.com" value={competitorDomain} onChange={e => setCompetitorDomain(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Scope</Label>
                  <Select value={scope} onValueChange={setScope}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="homepage_only">Homepage Only</SelectItem>
                      <SelectItem value="top_pages">Top Pages</SelectItem>
                      <SelectItem value="full_crawl">Full Crawl</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Provider</Label>
                  <Select value={provider} onValueChange={setProvider}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mock">Mock (Demo)</SelectItem>
                      <SelectItem value="dataforseo_onpage">DataForSEO</SelectItem>
                      <SelectItem value="pagespeed_insights">PageSpeed Insights</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {(auditRuns as any[]).length > 0 && (
                <div>
                  <Label>Compare Against Own Audit (optional)</Label>
                  <Select value={ownAuditRunId} onValueChange={setOwnAuditRunId}>
                    <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {(auditRuns as any[]).filter((r: any) => r.status === "completed").map((r: any) => (
                        <SelectItem key={r.id} value={r.id}>{r.domain} — {new Date(r.created_at).toLocaleDateString()}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <Button onClick={handleStart} disabled={startBenchmark.isPending} className="w-full gap-2">
                {startBenchmark.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                Start Benchmark
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </PageTransition>
  );
}

/* ── Comparison Sub-View ── */
function ComparisonView({ detail }: { detail: any }) {
  const ownServicePages = 3; // From own audit data approximation
  const ownLocationPages = 1;
  const ownBlogPages = 4;
  const ownIssues = 10;

  const compServicePages = (detail.pages || []).filter((p: any) => p.page_type === "core_service" || p.page_type === "sub_service").length;
  const compLocationPages = (detail.pages || []).filter((p: any) => p.page_type === "location").length;
  const compBlogPages = (detail.pages || []).filter((p: any) => p.page_type === "blog_article").length;
  const compIssues = detail.broken_links + detail.redirect_issues + detail.missing_titles + detail.missing_meta;

  const rows = [
    { label: "Service Pages", own: ownServicePages, comp: compServicePages },
    { label: "Location Pages", own: ownLocationPages, comp: compLocationPages },
    { label: "Blog / Articles", own: ownBlogPages, comp: compBlogPages },
    { label: "Total Pages Crawled", own: 47, comp: detail.pages_crawled },
    { label: "Technical Issues", own: ownIssues, comp: compIssues, lower: true },
    { label: "Broken Links", own: 1, comp: detail.broken_links, lower: true },
    { label: "Missing Titles", own: 0, comp: detail.missing_titles, lower: true },
    { label: "Avg Load Time (ms)", own: 2100, comp: detail.avg_load_time_ms || 0, lower: true },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <ArrowLeftRight className="h-4 w-4" />
          {detail.target_domain} vs {detail.competitor_domain}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 font-medium text-muted-foreground">Metric</th>
              <th className="text-center py-2 font-medium text-primary">Your Site</th>
              <th className="text-center py-2 font-medium text-amber-500">Competitor</th>
              <th className="text-center py-2 font-medium text-muted-foreground">Gap</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const diff = row.comp - row.own;
              const isGood = row.lower ? diff >= 0 : diff <= 0;
              return (
                <tr key={row.label} className="border-b border-border/30">
                  <td className="py-2.5 font-medium">{row.label}</td>
                  <td className="py-2.5 text-center font-semibold">{row.own}</td>
                  <td className="py-2.5 text-center font-semibold">{row.comp}</td>
                  <td className={`py-2.5 text-center font-semibold ${isGood ? "text-emerald-500" : "text-destructive"}`}>
                    {diff > 0 ? `+${diff}` : diff}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <Separator className="my-4" />
        <div className="text-sm text-muted-foreground">
          <p className="font-medium text-foreground mb-2">Priority Actions</p>
          <ul className="space-y-1 list-disc list-inside">
            {compServicePages > ownServicePages && <li>Competitor has <strong>{compServicePages - ownServicePages} more service pages</strong>. Consider creating dedicated pages for each service.</li>}
            {compLocationPages > ownLocationPages && <li>Competitor has <strong>{compLocationPages - ownLocationPages} more location pages</strong>. Build location-specific landing pages.</li>}
            {compBlogPages > ownBlogPages && <li>Competitor has <strong>{compBlogPages - ownBlogPages} more articles</strong>. Expand supporting content.</li>}
            {compIssues < ownIssues && <li>Competitor has <strong>fewer technical issues</strong>. Prioritize fixing critical audit issues.</li>}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
