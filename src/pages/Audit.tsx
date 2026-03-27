import { useState, useMemo } from "react";
import { MascotSectionHeader } from "@/components/MascotCast";
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
import {
  useAuditRuns, useAuditRunDetail, useAuditIssues, useAuditIssueDetail,
  useStartAudit, useUpdateAuditIssueStatus, useRecheckIssue, useRecheckRun,
  useInternalLinks,
} from "@/hooks/use-api";
import {
  AlertTriangle, AlertCircle, Info, CheckCircle2, Shield, Bug, Wrench,
  Link2, ArrowRight, Play, RefreshCw, Eye, ChevronRight, Search,
  Globe, Zap, FileWarning, Clock, ExternalLink, X, ArrowLeftRight,
  Loader2, Filter, BarChart3,
} from "lucide-react";
import { toast } from "sonner";

/* ---------- Config maps ---------- */
const severityConfig = {
  critical: { icon: AlertCircle, color: "text-destructive", bg: "bg-destructive/10", badge: "destructive" as const, border: "border-l-destructive" },
  warning: { icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-500/10", badge: "secondary" as const, border: "border-l-amber-500" },
  info: { icon: Info, color: "text-primary", bg: "bg-primary/10", badge: "outline" as const, border: "border-l-primary" },
};

const statusConfig: Record<string, { color: string; label: string }> = {
  open: { color: "bg-amber-500/10 text-amber-600", label: "Open" },
  in_progress: { color: "bg-primary/10 text-primary", label: "In Progress" },
  fixed: { color: "bg-emerald-500/10 text-emerald-600", label: "Fixed" },
  ignored: { color: "bg-muted text-muted-foreground", label: "Ignored" },
  regressed: { color: "bg-destructive/10 text-destructive", label: "Regressed" },
};

const linkStatusConfig: Record<string, { color: string; label: string }> = {
  pending: { color: "bg-amber-500/10 text-amber-600", label: "Pending" },
  approved: { color: "bg-primary/10 text-primary", label: "Approved" },
  implemented: { color: "bg-emerald-500/10 text-emerald-600", label: "Implemented" },
  rejected: { color: "bg-destructive/10 text-destructive", label: "Rejected" },
};

export default function Audit() {
  const { activeClientId } = useActiveClient();
  const { data: runs = [] } = useAuditRuns(activeClientId);
  const { data: allIssues = [] } = useAuditIssues(activeClientId);
  const { data: apiLinks } = useInternalLinks(activeClientId);
  const internalLinks = (apiLinks as any[]) ?? [];

  const [mainTab, setMainTab] = useState("runs");
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [showNewAudit, setShowNewAudit] = useState(false);
  const [issueFilter, setIssueFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // New audit form
  const [newDomain, setNewDomain] = useState("");
  const [newScope, setNewScope] = useState("full_crawl");
  const [newProvider, setNewProvider] = useState("mock");

  const startAudit = useStartAudit(activeClientId);
  const updateStatus = useUpdateAuditIssueStatus(activeClientId);
  const recheckIssue = useRecheckIssue(activeClientId);
  const recheckRun = useRecheckRun(activeClientId);

  // Run detail
  const { data: runDetail } = useAuditRunDetail(selectedRunId || "");
  // Issue detail
  const { data: issueDetail } = useAuditIssueDetail(selectedIssueId || "");

  /* ---------- Computed stats ---------- */
  const critCount = allIssues.filter((i: any) => i.severity === "critical" && i.status !== "fixed").length;
  const warnCount = allIssues.filter((i: any) => i.severity === "warning" && i.status !== "fixed").length;
  const fixedCount = allIssues.filter((i: any) => i.status === "fixed").length;

  // Issues for the selected run or all
  const displayIssues = useMemo(() => {
    let issues = selectedRunId && runDetail?.issues ? runDetail.issues : allIssues;
    if (issueFilter !== "all") {
      issues = issues.filter((i: any) => i.severity === issueFilter || i.status === issueFilter);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      issues = issues.filter((i: any) =>
        i.issue_type?.toLowerCase().includes(q) ||
        i.description?.toLowerCase().includes(q) ||
        i.affected_url?.toLowerCase().includes(q)
      );
    }
    return issues;
  }, [selectedRunId, runDetail, allIssues, issueFilter, searchQuery]);

  const handleStartAudit = () => {
    if (!newDomain) { toast.error("Enter a domain"); return; }
    startAudit.mutate(
      { domain: newDomain, scope: newScope, provider: newProvider },
      {
        onSuccess: () => { toast.success("Audit started!"); setShowNewAudit(false); setNewDomain(""); },
        onError: () => toast.error("Failed to start audit"),
      }
    );
  };

  const handleStatusChange = (issueId: string, status: string) => {
    updateStatus.mutate(
      { issueId, status },
      { onSuccess: () => toast.success(`Status updated to ${status}`) }
    );
  };

  const handleRecheckIssue = (issueId: string) => {
    recheckIssue.mutate(issueId, {
      onSuccess: () => toast.success("Recheck initiated"),
    });
  };

  const handleRecheckRun = (runId: string) => {
    recheckRun.mutate(runId, {
      onSuccess: (data: any) => toast.success(`Rechecked ${data.rechecked} issues`),
    });
  };

  const pendingLinks = internalLinks.filter((l: any) => l.status === "pending").length;
  const implementedLinks = internalLinks.filter((l: any) => l.status === "implemented").length;

  return (
    <PageTransition className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Technical SEO Audit</h1>
          <p className="text-muted-foreground text-sm mt-1">Run audits, track issues, verify fixes with rechecks</p>
        </div>
        <Button onClick={() => setShowNewAudit(true)} className="gap-1.5">
          <Play className="h-3.5 w-3.5" /> New Audit
        </Button>
      </div>

      {/* KPI Cards */}
      <StaggerContainer className="grid gap-4 sm:grid-cols-5">
        <StaggerItem><Card className="border-l-4 border-l-primary">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10"><Shield className="h-5 w-5 text-primary" /></div>
            <div><p className="text-xs text-muted-foreground uppercase tracking-wide">Audit Runs</p><p className="text-2xl font-bold mt-0.5">{runs.length}</p></div>
          </CardContent>
        </Card></StaggerItem>
        <StaggerItem><Card className="border-l-4 border-l-destructive">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-destructive/10"><AlertCircle className="h-5 w-5 text-destructive" /></div>
            <div><p className="text-xs text-destructive uppercase tracking-wide">Critical</p><p className="text-2xl font-bold mt-0.5">{critCount}</p></div>
          </CardContent>
        </Card></StaggerItem>
        <StaggerItem><Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10"><AlertTriangle className="h-5 w-5 text-amber-500" /></div>
            <div><p className="text-xs text-amber-600 uppercase tracking-wide">Warnings</p><p className="text-2xl font-bold mt-0.5">{warnCount}</p></div>
          </CardContent>
        </Card></StaggerItem>
        <StaggerItem><Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10"><CheckCircle2 className="h-5 w-5 text-green-500" /></div>
            <div><p className="text-xs text-green-600 uppercase tracking-wide">Fixed</p><p className="text-2xl font-bold mt-0.5">{fixedCount}</p></div>
          </CardContent>
        </Card></StaggerItem>
        <StaggerItem><Card className="border-l-4 border-l-primary">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10"><Link2 className="h-5 w-5 text-primary" /></div>
            <div><p className="text-xs text-muted-foreground uppercase tracking-wide">Link Suggestions</p><p className="text-2xl font-bold mt-0.5">{internalLinks.length}</p></div>
          </CardContent>
        </Card></StaggerItem>
      </StaggerContainer>

      {/* Main Tabs */}
      <Tabs value={mainTab} onValueChange={setMainTab}>
        <TabsList className="bg-muted/50 border">
          <TabsTrigger value="runs" className="gap-1.5"><Shield className="h-3.5 w-3.5" />Audit Runs</TabsTrigger>
          <TabsTrigger value="issues" className="gap-1.5"><Bug className="h-3.5 w-3.5" />All Issues ({allIssues.length})</TabsTrigger>
          <TabsTrigger value="internal_links" className="gap-1.5"><Link2 className="h-3.5 w-3.5" />Internal Links ({internalLinks.length})</TabsTrigger>
        </TabsList>

        {/* ─── Audit Runs Tab ─── */}
        <TabsContent value="runs" className="space-y-3 mt-4">
          {runs.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <Shield className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-sm font-medium text-muted-foreground">No audit runs yet</p>
                <p className="text-xs text-muted-foreground mt-1 mb-4">Start your first audit to identify SEO issues</p>
                <Button size="sm" onClick={() => setShowNewAudit(true)} className="gap-1.5"><Play className="h-3.5 w-3.5" /> Start First Audit</Button>
              </CardContent>
            </Card>
          ) : (
            runs.map((run: any) => (
              <Card key={run.id} className="border-l-4 border-l-primary/60 hover:shadow-md transition-shadow cursor-pointer" onClick={() => { setSelectedRunId(run.id); setMainTab("issues"); }}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Globe className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm">{run.domain || "Domain audit"}</p>
                          <Badge variant="outline" className="text-[10px]">{run.provider}</Badge>
                          <Badge variant="outline" className="text-[10px] capitalize">{run.scope?.replace("_", " ")}</Badge>
                          <Badge className={`text-[10px] ${run.status === "completed" ? "bg-emerald-500/10 text-emerald-600" : run.status === "running" ? "bg-primary/10 text-primary" : run.status === "failed" ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"}`}>
                            {run.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                          <span>{run.pages_crawled} pages crawled</span>
                          {run.score != null && <span>Score: <span className="font-semibold text-foreground">{run.score}/100</span></span>}
                          <span>Issues: <span className="font-semibold">{run.total_issues}</span></span>
                          <span className="text-destructive">{run.critical_count} critical</span>
                          <span className="text-amber-500">{run.warning_count} warnings</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="ghost" className="gap-1" onClick={(e) => { e.stopPropagation(); handleRecheckRun(run.id); }}>
                        <RefreshCw className="h-3.5 w-3.5" /> Recheck
                      </Button>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                  {run.status === "running" && (
                    <Progress value={Math.round((run.pages_crawled / (run.pages_limit || 500)) * 100)} className="mt-3 h-1.5" />
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* ─── Issues Tab ─── */}
        <TabsContent value="issues" className="space-y-3 mt-4">
          {/* Filters */}
          <div className="flex items-center gap-3 flex-wrap">
            {selectedRunId && (
              <Button size="sm" variant="outline" onClick={() => setSelectedRunId(null)} className="gap-1 text-xs">
                <X className="h-3 w-3" /> Viewing run — show all
              </Button>
            )}
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input placeholder="Search issues..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-8 h-8 text-xs" />
            </div>
            <Select value={issueFilter} onValueChange={setIssueFilter}>
              <SelectTrigger className="w-[140px] h-8 text-xs"><Filter className="h-3 w-3 mr-1" /><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Issues</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="fixed">Fixed</SelectItem>
                <SelectItem value="regressed">Regressed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {displayIssues.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-3" />
                <p className="text-sm font-medium text-muted-foreground">No issues found</p>
              </CardContent>
            </Card>
          ) : (
            displayIssues.map((issue: any) => {
              const cfg = severityConfig[issue.severity as keyof typeof severityConfig] || severityConfig.info;
              const Icon = cfg.icon;
              const sc = statusConfig[issue.status] || statusConfig.open;
              return (
                <Card key={issue.id} className={`${cfg.border} border-l-4 hover:shadow-md transition-shadow cursor-pointer`} onClick={() => setSelectedIssueId(issue.id)}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`p-1.5 rounded-md ${cfg.bg}`}>
                        <Icon className={`h-4 w-4 ${cfg.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-sm">{issue.issue_type?.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}</p>
                          <Badge variant={cfg.badge} className="text-[10px]">{issue.severity}</Badge>
                          <Badge className={`text-[10px] ${sc.color}`}>{sc.label}</Badge>
                          {issue.provider && issue.provider !== "mock" && (
                            <Badge variant="outline" className="text-[10px]">{issue.provider}</Badge>
                          )}
                          {issue.provider === "mock" && (
                            <Badge variant="outline" className="text-[10px] border-dashed">mock</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1.5">{issue.description}</p>
                        <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground">
                          <span className="font-mono truncate max-w-[250px]">{issue.affected_url}</span>
                          {issue.first_seen_at && <span>First seen: {new Date(issue.first_seen_at).toLocaleDateString()}</span>}
                          {issue.recheck_count > 0 && <span>Rechecked {issue.recheck_count}x</span>}
                        </div>
                        {issue.fix_instruction && (
                          <div className="mt-2 p-2.5 rounded-lg bg-muted/50 border border-border/50">
                            <p className="text-xs"><span className="font-semibold text-foreground">Fix:</span> {issue.fix_instruction}</p>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={(e) => { e.stopPropagation(); handleRecheckIssue(issue.id); }} title="Recheck">
                          <RefreshCw className="h-3.5 w-3.5" />
                        </Button>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        {/* ─── Internal Links Tab ─── */}
        <TabsContent value="internal_links" className="space-y-3 mt-4">
          {internalLinks.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <Link2 className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-sm font-medium text-muted-foreground">No internal link suggestions yet</p>
                <p className="text-xs text-muted-foreground mt-1">Run an audit to generate internal linking opportunities</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>{pendingLinks} pending</span><span>·</span><span>{implementedLinks} implemented</span>
              </div>
              {internalLinks.map((link: any) => {
                const sc = linkStatusConfig[link.status] || linkStatusConfig.pending;
                return (
                  <Card key={link.id} className="border-l-4 border-l-primary/40">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="p-1.5 rounded-md bg-primary/10"><Link2 className="h-4 w-4 text-primary" /></div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-2">
                            <Badge variant="outline" className="text-[10px] capitalize">{link.priority} priority</Badge>
                            <Badge className={`text-[10px] ${sc.color}`}>{sc.label}</Badge>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <span className="font-mono text-muted-foreground truncate max-w-[200px]">{link.from_url}</span>
                            <ArrowRight className="h-3 w-3 text-primary shrink-0" />
                            <span className="font-mono text-foreground truncate max-w-[200px]">{link.to_url}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1.5">
                            Anchor: <span className="font-medium text-foreground">"{link.anchor_text}"</span>
                            {link.reason && <> · {link.reason}</>}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* ─── New Audit Dialog ─── */}
      <Dialog open={showNewAudit} onOpenChange={setShowNewAudit}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Shield className="h-5 w-5 text-primary" /> Start New Audit</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label>Domain</Label>
              <Input placeholder="example.com" value={newDomain} onChange={(e) => setNewDomain(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Scope</Label>
              <Select value={newScope} onValueChange={setNewScope}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="homepage_only">Homepage Only</SelectItem>
                  <SelectItem value="top_pages">Top Pages (up to 50)</SelectItem>
                  <SelectItem value="full_crawl">Full Crawl (up to 500)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Provider</Label>
              <Select value={newProvider} onValueChange={setNewProvider}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="mock">Mock (Demo Data)</SelectItem>
                  <SelectItem value="dataforseo_onpage">DataForSEO On-Page</SelectItem>
                  <SelectItem value="pagespeed_insights">PageSpeed Insights</SelectItem>
                  <SelectItem value="gsc_url_inspection">GSC URL Inspection</SelectItem>
                  <SelectItem value="screaming_frog_import">Screaming Frog Import</SelectItem>
                </SelectContent>
              </Select>
              {newProvider === "mock" && (
                <p className="text-[10px] text-muted-foreground mt-1 italic">Mock mode generates realistic demo issues instantly.</p>
              )}
            </div>
            <Button onClick={handleStartAudit} className="w-full gap-1.5" disabled={startAudit.isPending}>
              {startAudit.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
              Start Audit
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Issue Detail Sheet ─── */}
      <Sheet open={!!selectedIssueId} onOpenChange={(open) => !open && setSelectedIssueId(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-base">Issue Detail</SheetTitle>
          </SheetHeader>
          {issueDetail ? (
            <div className="space-y-5 mt-4">
              {/* Issue header */}
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <Badge variant={severityConfig[issueDetail.severity as keyof typeof severityConfig]?.badge || "outline"}>
                    {issueDetail.severity}
                  </Badge>
                  <Badge className={statusConfig[issueDetail.status]?.color || ""}>
                    {statusConfig[issueDetail.status]?.label || issueDetail.status}
                  </Badge>
                  {issueDetail.provider && <Badge variant="outline" className="text-[10px]">{issueDetail.provider}</Badge>}
                  {issueDetail.category && <Badge variant="outline" className="text-[10px] capitalize">{issueDetail.category}</Badge>}
                </div>
                <h3 className="font-semibold">{issueDetail.issue_type?.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}</h3>
                <p className="text-sm text-muted-foreground mt-1">{issueDetail.description}</p>
              </div>

              <Separator />

              {/* Affected URL */}
              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">Affected URL</p>
                <p className="text-sm font-mono break-all">{issueDetail.affected_url}</p>
              </div>

              {/* Why it matters */}
              {issueDetail.why_it_matters && (
                <div>
                  <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">Why It Matters</p>
                  <p className="text-sm">{issueDetail.why_it_matters}</p>
                </div>
              )}

              {/* Evidence */}
              {issueDetail.evidence && issueDetail.evidence.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">Evidence</p>
                  <div className="space-y-2">
                    {issueDetail.evidence.map((ev: any, i: number) => (
                      <div key={i} className="p-2.5 rounded-lg bg-muted/50 border text-xs">
                        <div className="flex justify-between">
                          <span className="font-medium">{ev.key}</span>
                          <span className="text-muted-foreground">{ev.evidence_type}</span>
                        </div>
                        <div className="mt-1 flex gap-4">
                          <span>Found: <span className="font-mono text-destructive">{ev.value || "—"}</span></span>
                          {ev.expected_value && <span>Expected: <span className="font-mono text-emerald-600">{ev.expected_value}</span></span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Fix guidance */}
              {issueDetail.fix_instruction && (
                <div>
                  <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">Fix Guidance</p>
                  <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                    <p className="text-sm">{issueDetail.fix_instruction}</p>
                  </div>
                </div>
              )}

              {/* Timeline */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div><span className="text-muted-foreground">First Seen</span><p className="font-medium mt-0.5">{issueDetail.first_seen_at ? new Date(issueDetail.first_seen_at).toLocaleDateString() : "—"}</p></div>
                <div><span className="text-muted-foreground">Last Checked</span><p className="font-medium mt-0.5">{issueDetail.last_checked_at ? new Date(issueDetail.last_checked_at).toLocaleDateString() : "—"}</p></div>
                <div><span className="text-muted-foreground">Rechecks</span><p className="font-medium mt-0.5">{issueDetail.recheck_count || 0}</p></div>
                <div><span className="text-muted-foreground">Source</span><p className="font-medium mt-0.5 capitalize">{issueDetail.provider || "mock"}</p></div>
              </div>

              {/* Recheck history */}
              {issueDetail.rechecks && issueDetail.rechecks.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">Recheck History</p>
                  <div className="space-y-2">
                    {issueDetail.rechecks.map((rc: any, i: number) => (
                      <div key={i} className="p-2.5 rounded-lg border text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-muted-foreground">{new Date(rc.checked_at).toLocaleString()}</span>
                          <div className="flex items-center gap-1.5">
                            <Badge className={statusConfig[rc.previous_status]?.color || ""} variant="outline">
                              {rc.previous_status}
                            </Badge>
                            <ArrowRight className="h-3 w-3" />
                            <Badge className={statusConfig[rc.new_status]?.color || ""}>
                              {rc.new_status}
                            </Badge>
                          </div>
                        </div>
                        {rc.diff_summary && <p className="text-muted-foreground">{rc.diff_summary}</p>}
                        {/* Before/After evidence diff */}
                        {(rc.previous_evidence || rc.new_evidence) && (
                          <div className="mt-2 grid grid-cols-2 gap-2">
                            <div className="p-2 rounded bg-destructive/5 border border-destructive/10">
                              <p className="font-semibold text-destructive mb-0.5">Before</p>
                              <pre className="text-[10px] whitespace-pre-wrap">{JSON.stringify(rc.previous_evidence, null, 2) || "—"}</pre>
                            </div>
                            <div className="p-2 rounded bg-emerald-500/5 border border-emerald-500/10">
                              <p className="font-semibold text-emerald-600 mb-0.5">After</p>
                              <pre className="text-[10px] whitespace-pre-wrap">{JSON.stringify(rc.new_evidence, null, 2) || "—"}</pre>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => handleRecheckIssue(issueDetail.id)} className="gap-1">
                  <RefreshCw className="h-3.5 w-3.5" /> Recheck
                </Button>
                {issueDetail.status !== "fixed" && (
                  <Button size="sm" variant="outline" onClick={() => handleStatusChange(issueDetail.id, "fixed")} className="gap-1 text-emerald-600">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Mark Fixed
                  </Button>
                )}
                {issueDetail.status !== "in_progress" && issueDetail.status !== "fixed" && (
                  <Button size="sm" variant="outline" onClick={() => handleStatusChange(issueDetail.id, "in_progress")} className="gap-1">
                    <Wrench className="h-3.5 w-3.5" /> In Progress
                  </Button>
                )}
                {issueDetail.status !== "ignored" && (
                  <Button size="sm" variant="ghost" onClick={() => handleStatusChange(issueDetail.id, "ignored")} className="gap-1 text-muted-foreground">
                    <X className="h-3.5 w-3.5" /> Ignore
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
        </SheetContent>
      </Sheet>
    </PageTransition>
  );
}
