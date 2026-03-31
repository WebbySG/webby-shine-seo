import { useState, useMemo, useEffect } from "react";
import { usePageRestore } from "@/hooks/use-workspace-restore";
import { MascotSectionHeader } from "@/components/MascotCast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { request } from "@/lib/api";
import { useActiveClient } from "@/contexts/ClientContext";
import { PageTransition, StaggerContainer, StaggerItem } from "@/components/motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  Search, Sparkles, Target, FileText, BarChart3, Layers, Network, Map,
  ChevronRight, ArrowUpDown, Filter, Plus, Zap, Globe, BookOpen,
  HelpCircle, MapPin, TrendingUp, ArrowRight, CheckCircle, Clock,
  Shield, AlertTriangle, ArrowLeftRight, Info,
} from "lucide-react";

// ─── Types ───
interface KWResearchJob {
  id: string; client_id: string; domain: string; seed_topics: string[];
  target_count: number; target_location: string; target_language: string;
  business_priority: string; provider: string; status: string;
  total_keywords: number; clusters_count: number; pages_mapped: number;
  created_at: string; completed_at: string | null;
  results?: KWResult[]; clusters?: KWCluster[]; mappings?: KWPageMapping[];
}

interface KWResult {
  id: string; keyword: string; relevance_score: number; intent_score: number;
  volume_score: number; difficulty_score: number; serp_score: number;
  authority_gap_score: number; overall_score: number;
  search_volume: number; keyword_difficulty: number; cpc: number;
  search_intent: string; serp_features: string[];
  cluster_id: string | null; recommended_page_type: string;
  existing_url: string | null; mapping_status: string;
  mapping_notes: string | null; brief_queued: boolean;
}

interface KWCluster {
  id: string; cluster_name: string; cluster_theme: string | null;
  primary_keyword: string; keyword_count: number; avg_volume: number;
  avg_difficulty: number; recommended_content_type: string; priority: string;
}

interface KWPageMapping {
  id: string; page_url: string | null; page_title: string; page_type: string;
  is_existing: boolean; keyword_count: number; primary_keyword: string;
  secondary_keywords: string[]; recommended_word_count: number;
  priority: string; status: string; parent_mapping_id: string | null;
}

// ─── Style maps ───
const intentColors: Record<string, string> = {
  informational: "bg-seo-background text-seo-primary border-seo-border",
  commercial: "bg-content-background text-content-primary border-content-border",
  transactional: "bg-status-success-bg text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300",
  navigational: "bg-status-warning-bg text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300",
  local: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300",
};
const priorityColors: Record<string, string> = {
  high: "bg-destructive/10 text-destructive border-destructive/30",
  medium: "bg-status-warning-bg text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300",
  low: "bg-muted text-muted-foreground border-border",
};
const pageTypeIcons: Record<string, typeof FileText> = {
  core_service: Target, sub_service: Globe, service_page: Globe,
  location_page: MapPin, blog_post: FileText,
  comparison_page: BarChart3, faq_page: HelpCircle, pillar_page: Layers,
  category_page: Network,
};
const pageTypeLabels: Record<string, string> = {
  core_service: "Core Service", sub_service: "Sub-Service", service_page: "Service Page",
  location_page: "Location Page", blog_post: "Blog Post",
  comparison_page: "Comparison", faq_page: "FAQ Page", pillar_page: "Pillar Page",
  category_page: "Category Page",
};
const mappingStatusColors: Record<string, string> = {
  unmapped: "bg-muted text-muted-foreground",
  existing_page: "bg-seo-background text-seo-primary border-seo-border",
  new_page: "bg-content-background text-content-primary border-content-border",
  article: "bg-status-success-bg text-green-700 border-green-200",
};

function scoreColor(score: number): string {
  if (score >= 80) return "text-green-600 dark:text-green-400";
  if (score >= 60) return "text-amber-600 dark:text-amber-400";
  return "text-destructive";
}

function scoreBg(score: number): string {
  if (score >= 80) return "bg-green-500";
  if (score >= 60) return "bg-amber-500";
  return "bg-destructive";
}

export default function KeywordResearch() {
  const { activeClientId: clientId, activeClient } = useActiveClient();
  const queryClient = useQueryClient();
  const { savedEntity, savedUI, savedFilters, trackEntity, trackUI, trackFilters } = usePageRestore("keywords");

  const [selectedJob, setSelectedJob] = useState<KWResearchJob | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedResult, setSelectedResult] = useState<KWResult | null>(null);
  const [activeTab, setActiveTab] = useState(savedUI.activeTab || "keywords");
  const [intentFilter, setIntentFilter] = useState((savedFilters.intent as string) || "all");
  const [sortKey, setSortKey] = useState<"overall_score" | "search_volume" | "keyword_difficulty">((savedFilters.sortKey as any) || "overall_score");
  const [sortDir, setSortDir] = useState<"asc" | "desc">((savedFilters.sortDir as any) || "desc");

  useEffect(() => { trackUI({ activeTab }); }, [activeTab, trackUI]);
  useEffect(() => { trackEntity("keyword_job", selectedJob?.id || null); }, [selectedJob, trackEntity]);
  useEffect(() => { trackFilters({ intent: intentFilter, sortKey, sortDir }); }, [intentFilter, sortKey, sortDir, trackFilters]);

  // Form state
  const [seedTopics, setSeedTopics] = useState("");
  const [competitorDomains, setCompetitorDomains] = useState("");
  const [targetCount, setTargetCount] = useState("20");
  const [customCount, setCustomCount] = useState("");
  const [targetLocation, setTargetLocation] = useState("Singapore");
  const [targetLanguage, setTargetLanguage] = useState("en");
  const [businessPriority, setBusinessPriority] = useState("leads");
  const [providerMode, setProviderMode] = useState("mock");

  // ─── Queries ───
  const { data: jobs = [], isLoading } = useQuery<KWResearchJob[]>({
    queryKey: ["keyword-research", clientId],
    queryFn: () => request(`/keyword-research/list?client_id=${clientId}`),
    enabled: !!clientId,
  });

  const loadJobDetail = useMutation({
    mutationFn: (jobId: string) => request<KWResearchJob>(`/keyword-research/${jobId}`),
    onSuccess: (data) => { setSelectedJob(data); setActiveTab("keywords"); },
  });

  const startResearch = useMutation({
    mutationFn: (data: any) => request<KWResearchJob>("/keyword-research/start", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["keyword-research", clientId] });
      setDialogOpen(false);
      setSeedTopics("");
      // Auto-load detail
      setTimeout(() => loadJobDetail.mutate(data.id), 500);
      toast.success(`Research started — analyzing ${data.target_count} keywords`);
    },
    onError: () => toast.error("Failed to start research"),
  });

  const updateResult = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      request(`/keyword-research/results/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    onSuccess: () => { if (selectedJob) loadJobDetail.mutate(selectedJob.id); },
  });

  const createBrief = useMutation({
    mutationFn: (mappingId: string) =>
      request(`/keyword-research/mappings/${mappingId}/create-brief`, { method: "POST" }),
    onSuccess: () => {
      toast.success("Brief queued for creation");
      if (selectedJob) loadJobDetail.mutate(selectedJob.id);
    },
  });

  // ─── Sorted/filtered results ───
  const filteredResults = useMemo(() => {
    if (!selectedJob?.results) return [];
    let items = [...selectedJob.results];
    if (intentFilter !== "all") items = items.filter(r => r.search_intent === intentFilter);
    items.sort((a, b) => {
      const mul = sortDir === "desc" ? -1 : 1;
      return mul * ((a[sortKey] ?? 0) - (b[sortKey] ?? 0));
    });
    return items;
  }, [selectedJob?.results, intentFilter, sortKey, sortDir]);

  const toggleSort = (key: typeof sortKey) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  };

  // ─── Detail View ───
  if (selectedJob?.results) {
    const clusters = selectedJob.clusters || [];
    const mappings = selectedJob.mappings || [];
    const results = selectedJob.results || [];

    const avgScore = results.length > 0 ? Math.round(results.reduce((s, r) => s + r.overall_score, 0) / results.length) : 0;
    const highValueCount = results.filter(r => r.overall_score >= 70).length;
    const existingPages = results.filter(r => r.existing_url).length;
    const briefQueueCount = results.filter(r => r.brief_queued).length;

    return (
      <PageTransition className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setSelectedJob(null)}>← Back</Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                {selectedJob.seed_topics.join(", ")}
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {selectedJob.domain} · {results.length} keywords · {clusters.length} clusters · {mappings.length} pages
                <Badge variant="outline" className="ml-2 text-[10px]">{selectedJob.provider}</Badge>
              </p>
            </div>
          </div>
        </div>

        {/* KPI Row */}
        <StaggerContainer className="grid gap-4 grid-cols-2 lg:grid-cols-5">
          {[
            { label: "Keywords Found", value: results.length, icon: Search, color: "text-seo-primary" },
            { label: "Avg Score", value: avgScore, icon: Target, color: scoreColor(avgScore) },
            { label: "High Value (70+)", value: highValueCount, icon: TrendingUp, color: "text-green-600 dark:text-green-400" },
            { label: "Existing Pages", value: existingPages, icon: Globe, color: "text-content-primary" },
            { label: "Brief Queue", value: briefQueueCount, icon: FileText, color: "text-primary" },
          ].map((kpi, i) => (
            <StaggerItem key={i}>
              <Card className="hover-lift">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
                    <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{kpi.label}</p>
                  </div>
                </CardContent>
              </Card>
            </StaggerItem>
          ))}
        </StaggerContainer>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6 max-w-[720px]">
            <TabsTrigger value="keywords" className="gap-1"><Search className="h-3.5 w-3.5" /> Keywords</TabsTrigger>
            <TabsTrigger value="clusters" className="gap-1"><Network className="h-3.5 w-3.5" /> Clusters</TabsTrigger>
            <TabsTrigger value="mapping" className="gap-1"><Map className="h-3.5 w-3.5" /> Page Map</TabsTrigger>
            <TabsTrigger value="structure" className="gap-1"><Layers className="h-3.5 w-3.5" /> Structure</TabsTrigger>
            <TabsTrigger value="context" className="gap-1"><Shield className="h-3.5 w-3.5" /> Context</TabsTrigger>
            <TabsTrigger value="briefs" className="gap-1"><FileText className="h-3.5 w-3.5" /> Briefs</TabsTrigger>
          </TabsList>

          {/* ─── Keywords Table ─── */}
          <TabsContent value="keywords">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Search className="h-4 w-4 text-seo-primary" /> All Keywords
                    <Badge variant="outline" className="ml-1 text-xs">{filteredResults.length}</Badge>
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Select value={intentFilter} onValueChange={setIntentFilter}>
                      <SelectTrigger className="w-[150px] h-8 text-xs"><Filter className="h-3 w-3 mr-1" /><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Intents</SelectItem>
                        <SelectItem value="informational">Informational</SelectItem>
                        <SelectItem value="commercial">Commercial</SelectItem>
                        <SelectItem value="transactional">Transactional</SelectItem>
                        <SelectItem value="navigational">Navigational</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-[250px]">Keyword</TableHead>
                      <TableHead onClick={() => toggleSort("overall_score")} className="cursor-pointer hover:text-foreground text-center">
                        <span className="inline-flex items-center gap-1">Score <ArrowUpDown className="h-3 w-3" /></span>
                      </TableHead>
                      <TableHead onClick={() => toggleSort("search_volume")} className="cursor-pointer hover:text-foreground text-center">
                        <span className="inline-flex items-center gap-1">Volume <ArrowUpDown className="h-3 w-3" /></span>
                      </TableHead>
                      <TableHead onClick={() => toggleSort("keyword_difficulty")} className="cursor-pointer hover:text-foreground text-center">
                        <span className="inline-flex items-center gap-1">KD <ArrowUpDown className="h-3 w-3" /></span>
                      </TableHead>
                      <TableHead className="text-center">Intent</TableHead>
                      <TableHead className="text-center">Page Type</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredResults.map(r => {
                      const Icon = pageTypeIcons[r.recommended_page_type] || FileText;
                      return (
                        <TableRow key={r.id} className="cursor-pointer hover:bg-muted/40" onClick={() => setSelectedResult(r)}>
                          <TableCell className="font-medium">{r.keyword}</TableCell>
                          <TableCell className="text-center">
                            <span className={`font-mono font-bold ${scoreColor(r.overall_score)}`}>{Math.round(r.overall_score)}</span>
                          </TableCell>
                          <TableCell className="text-center font-mono text-sm">{r.search_volume.toLocaleString()}</TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <div className="w-12 h-1.5 rounded-full bg-muted overflow-hidden">
                                <div className={`h-full rounded-full ${scoreBg(100 - r.keyword_difficulty)}`} style={{ width: `${r.keyword_difficulty}%` }} />
                              </div>
                              <span className="text-xs font-mono">{Math.round(r.keyword_difficulty)}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className={`text-[10px] ${intentColors[r.search_intent] || ""}`}>{r.search_intent}</Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className="text-[10px] gap-1">
                              <Icon className="h-3 w-3" />{pageTypeLabels[r.recommended_page_type] || r.recommended_page_type}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className={`text-[10px] ${mappingStatusColors[r.mapping_status] || ""}`}>
                              {r.mapping_status.replace("_", " ")}
                            </Badge>
                          </TableCell>
                          <TableCell><ChevronRight className="h-4 w-4 text-muted-foreground" /></TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── Clusters View ─── */}
          <TabsContent value="clusters">
            <div className="grid gap-4">
              {clusters.map((cluster, idx) => {
                const clusterResults = results.filter(r => r.cluster_id === cluster.id);
                return (
                  <motion.div key={cluster.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}>
                    <Card className="overflow-hidden">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-seo-primary/20 to-seo-primary/5 flex items-center justify-center">
                              <Network className="h-5 w-5 text-seo-primary" />
                            </div>
                            <div>
                              <CardTitle className="text-base">{cluster.cluster_name}</CardTitle>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                Primary: <span className="font-medium text-foreground">{cluster.primary_keyword}</span> · {cluster.keyword_count} keywords
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className={priorityColors[cluster.priority]}>{cluster.priority}</Badge>
                            <div className="text-right">
                              <p className="text-sm font-bold">{cluster.avg_volume.toLocaleString()}</p>
                              <p className="text-[10px] text-muted-foreground">avg volume</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold">{Math.round(cluster.avg_difficulty)}</p>
                              <p className="text-[10px] text-muted-foreground">avg KD</p>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="border rounded-lg divide-y divide-border">
                          {clusterResults.map(r => (
                            <div key={r.id} className="flex items-center justify-between px-4 py-2.5 hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => setSelectedResult(r)}>
                              <div className="flex items-center gap-2">
                                <span className={`font-mono text-xs font-bold ${scoreColor(r.overall_score)}`}>{Math.round(r.overall_score)}</span>
                                <span className="text-sm">{r.keyword}</span>
                              </div>
                              <div className="flex items-center gap-3 text-xs">
                                <span className="font-mono text-muted-foreground">{r.search_volume.toLocaleString()}</span>
                                <Badge variant="outline" className={`text-[10px] ${intentColors[r.search_intent] || ""}`}>{r.search_intent}</Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
              {clusters.length === 0 && (
                <Card className="border-dashed"><CardContent className="p-12 text-center text-muted-foreground">No clusters generated</CardContent></Card>
              )}
            </div>
          </TabsContent>

          {/* ─── Page Mapping ─── */}
          <TabsContent value="mapping">
            <div className="grid gap-4">
              {mappings.map((mapping, idx) => {
                const mappedKws = results.filter(r => r.recommended_page_type === mapping.page_type && mapping.secondary_keywords.includes(r.keyword));
                const Icon = pageTypeIcons[mapping.page_type] || FileText;
                return (
                  <motion.div key={mapping.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}>
                    <Card className={`overflow-hidden ${mapping.is_existing ? "border-l-4 border-l-seo-primary" : "border-l-4 border-l-content-primary"}`}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between flex-wrap gap-3">
                          <div className="flex items-center gap-3">
                            <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${mapping.is_existing ? "bg-seo-background" : "bg-content-background"}`}>
                              <Icon className={`h-5 w-5 ${mapping.is_existing ? "text-seo-primary" : "text-content-primary"}`} />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-foreground">{mapping.page_title}</p>
                              <p className="text-xs text-muted-foreground">
                                {mapping.is_existing ? "Existing" : "New"} · {pageTypeLabels[mapping.page_type]} · {mapping.keyword_count} keywords · ~{mapping.recommended_word_count}w
                              </p>
                              {mapping.page_url && <p className="text-xs font-mono text-muted-foreground/70 mt-0.5">{mapping.page_url}</p>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={priorityColors[mapping.priority]}>{mapping.priority}</Badge>
                            <Badge variant="outline" className="text-[10px]">{mapping.status}</Badge>
                            {mapping.status === "suggested" && (
                              <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => createBrief.mutate(mapping.id)} disabled={createBrief.isPending}>
                                <FileText className="h-3 w-3" /> Create Brief
                              </Button>
                            )}
                          </div>
                        </div>
                        {mapping.secondary_keywords.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-3">
                            <Badge variant="secondary" className="text-[10px] font-semibold">{mapping.primary_keyword}</Badge>
                            {mapping.secondary_keywords.slice(0, 5).map(kw => (
                              <Badge key={kw} variant="outline" className="text-[10px]">{kw}</Badge>
                            ))}
                            {mapping.secondary_keywords.length > 5 && (
                              <Badge variant="outline" className="text-[10px] text-muted-foreground">+{mapping.secondary_keywords.length - 5} more</Badge>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
              {mappings.length === 0 && (
                <Card className="border-dashed"><CardContent className="p-12 text-center text-muted-foreground">No page mappings generated</CardContent></Card>
              )}
            </div>
          </TabsContent>

          {/* ─── Site Structure ─── */}
          <TabsContent value="structure">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Layers className="h-4 w-4 text-primary" /> Recommended Site Structure
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const typeGroups = mappings.reduce<Record<string, KWPageMapping[]>>((acc, m) => {
                    const type = m.page_type;
                    if (!acc[type]) acc[type] = [];
                    acc[type].push(m);
                    return acc;
                  }, {});
                  const typeOrder = ["core_service", "sub_service", "pillar_page", "service_page", "location_page", "category_page", "comparison_page", "faq_page", "blog_post"];
                  const sorted = Object.entries(typeGroups).sort(([a], [b]) => typeOrder.indexOf(a) - typeOrder.indexOf(b));

                  return (
                    <div className="space-y-6">
                      {sorted.map(([type, pages]) => {
                        const Icon = pageTypeIcons[type] || FileText;
                        return (
                          <div key={type}>
                            <div className="flex items-center gap-2 mb-3">
                              <Icon className="h-4 w-4 text-primary" />
                              <h4 className="text-sm font-semibold text-foreground">{pageTypeLabels[type] || type} ({pages.length})</h4>
                            </div>
                            <div className="ml-6 space-y-1.5">
                              {pages.map(p => (
                                <div key={p.id} className="flex items-center gap-2 py-1.5 px-3 rounded-lg hover:bg-muted/40 transition-colors">
                                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-sm">{p.page_title}</span>
                                  {p.is_existing && <Badge variant="outline" className="text-[9px] bg-seo-background text-seo-primary">existing</Badge>}
                                  <Badge variant="outline" className={`text-[9px] ml-auto ${priorityColors[p.priority]}`}>{p.priority}</Badge>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                      {sorted.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-8">No structure recommendations yet</p>
                      )}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── Context Insights (Competitor + Audit) ─── */}
          <TabsContent value="context" className="space-y-4">
            {/* Competitor insights */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <ArrowLeftRight className="h-4 w-4 text-primary" /> Competitor Context
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(selectedJob as any)?.competitor_insights?.length > 0 ? (
                  <div className="space-y-3">
                    {((selectedJob as any).competitor_insights as Array<{ domain: string; finding: string; impact: string; priority: string }>).map((ins, i) => (
                      <div key={i} className={`p-3 rounded-lg border-l-4 ${ins.priority === "high" ? "border-l-destructive bg-destructive/5" : ins.priority === "medium" ? "border-l-amber-500 bg-amber-500/5" : "border-l-muted-foreground bg-muted/30"}`}>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-medium text-foreground">{ins.finding}</p>
                            <p className="text-xs text-muted-foreground mt-1">{ins.impact}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Badge variant="outline" className="text-[10px]">{ins.domain}</Badge>
                            <Badge variant="outline" className={priorityColors[ins.priority]}>{ins.priority}</Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Shield className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No competitor context available. Add competitor domains when starting research to get gap insights.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Own-site audit insights */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" /> Own-Site Audit Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(selectedJob as any)?.audit_insights?.length > 0 ? (
                  <div className="space-y-3">
                    {((selectedJob as any).audit_insights as Array<{ page: string; issue: string; recommendation: string; severity: string }>).map((ins, i) => (
                      <div key={i} className="p-3 rounded-lg border hover:bg-muted/30 transition-colors">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-medium text-foreground">{ins.issue}</p>
                            <p className="text-xs text-muted-foreground mt-1">{ins.recommendation}</p>
                            <p className="text-xs font-mono text-muted-foreground/70 mt-1">{ins.page}</p>
                          </div>
                          <Badge variant="outline" className={ins.severity === "critical" ? "text-destructive border-destructive/30" : ins.severity === "warning" ? "text-amber-600 border-amber-300" : ""}>{ins.severity}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Info className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No audit insights available. Run a technical audit for this domain to surface page-level issues.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Service page priority summary */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" /> Service Page Priority Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const serviceTypes = ["core_service", "sub_service", "service_page"];
                  const serviceMappings = mappings.filter(m => serviceTypes.includes(m.page_type));
                  const locationMappings = mappings.filter(m => m.page_type === "location_page");
                  const supportMappings = mappings.filter(m => !serviceTypes.includes(m.page_type) && m.page_type !== "location_page");
                  return (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 text-center">
                        <Target className="h-6 w-6 mx-auto text-primary mb-2" />
                        <p className="text-2xl font-bold text-foreground">{serviceMappings.length}</p>
                        <p className="text-xs text-muted-foreground">Service Pages</p>
                        <p className="text-[10px] text-muted-foreground mt-1">{serviceMappings.filter(m => m.is_existing).length} existing · {serviceMappings.filter(m => !m.is_existing).length} new</p>
                      </div>
                      <div className="p-4 rounded-lg bg-amber-500/5 border border-amber-500/20 text-center">
                        <MapPin className="h-6 w-6 mx-auto text-amber-500 mb-2" />
                        <p className="text-2xl font-bold text-foreground">{locationMappings.length}</p>
                        <p className="text-xs text-muted-foreground">Location Pages</p>
                        <p className="text-[10px] text-muted-foreground mt-1">{locationMappings.filter(m => m.is_existing).length} existing · {locationMappings.filter(m => !m.is_existing).length} new</p>
                      </div>
                      <div className="p-4 rounded-lg bg-muted/50 border text-center">
                        <FileText className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
                        <p className="text-2xl font-bold text-foreground">{supportMappings.length}</p>
                        <p className="text-xs text-muted-foreground">Support Content</p>
                        <p className="text-[10px] text-muted-foreground mt-1">Blog, FAQ, Comparison</p>
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── Brief Queue ─── */}
          <TabsContent value="briefs">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" /> Content Brief Queue
                  <Badge variant="outline" className="text-xs ml-1">
                    {mappings.filter(m => m.status === "brief_created").length} created · {mappings.filter(m => m.status === "suggested").length} pending
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {mappings.map(m => {
                    const Icon = pageTypeIcons[m.page_type] || FileText;
                    return (
                      <div key={m.id} className="flex items-center justify-between py-3 px-4 rounded-lg border hover:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-3">
                          {m.status === "brief_created" ? (
                            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                          ) : (
                            <Clock className="h-4 w-4 text-muted-foreground" />
                          )}
                          <div>
                            <p className="text-sm font-medium">{m.page_title}</p>
                            <p className="text-xs text-muted-foreground">{m.primary_keyword} · {pageTypeLabels[m.page_type]} · ~{m.recommended_word_count}w</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={priorityColors[m.priority]}>{m.priority}</Badge>
                          {m.status === "suggested" ? (
                            <Button size="sm" variant="default" className="gap-1 text-xs" onClick={() => createBrief.mutate(m.id)} disabled={createBrief.isPending}>
                              <Sparkles className="h-3 w-3" /> Create Brief
                            </Button>
                          ) : (
                            <Badge variant="outline" className="bg-status-success-bg text-green-700 border-green-200">{m.status.replace("_", " ")}</Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {mappings.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-8">Run keyword research to populate the brief queue</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* ─── Keyword Detail Sheet ─── */}
        <Sheet open={!!selectedResult} onOpenChange={() => setSelectedResult(null)}>
          <SheetContent className="sm:max-w-lg overflow-y-auto">
            {selectedResult && (
              <>
                <SheetHeader>
                  <SheetTitle className="text-lg">{selectedResult.keyword}</SheetTitle>
                </SheetHeader>
                <div className="space-y-6 mt-6">
                  {/* Score breakdown */}
                  <div>
                    <h4 className="text-sm font-semibold mb-3">Score Breakdown</h4>
                    <div className="space-y-2.5">
                      {[
                        { label: "Overall", score: selectedResult.overall_score },
                        { label: "Relevance", score: selectedResult.relevance_score },
                        { label: "Intent", score: selectedResult.intent_score },
                        { label: "Volume", score: selectedResult.volume_score },
                        { label: "Difficulty", score: selectedResult.difficulty_score },
                        { label: "SERP Pattern", score: selectedResult.serp_score },
                        { label: "Authority Gap", score: selectedResult.authority_gap_score },
                      ].map(s => (
                        <div key={s.label} className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground w-24">{s.label}</span>
                          <Progress value={s.score} className="h-2 flex-1" />
                          <span className={`text-xs font-mono font-bold w-8 text-right ${scoreColor(s.score)}`}>{Math.round(s.score)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Metrics */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 rounded-lg bg-muted/50 text-center">
                      <p className="text-lg font-bold">{selectedResult.search_volume.toLocaleString()}</p>
                      <p className="text-[10px] text-muted-foreground uppercase">Volume</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50 text-center">
                      <p className="text-lg font-bold">{Math.round(selectedResult.keyword_difficulty)}</p>
                      <p className="text-[10px] text-muted-foreground uppercase">KD</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50 text-center">
                      <p className="text-lg font-bold">${selectedResult.cpc}</p>
                      <p className="text-[10px] text-muted-foreground uppercase">CPC</p>
                    </div>
                  </div>

                  {/* SERP Features */}
                  {selectedResult.serp_features.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2">SERP Features</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedResult.serp_features.map(f => (
                          <Badge key={f} variant="outline" className="text-[10px]">{f.replace(/_/g, " ")}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Mapping */}
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Mapping</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Page Type</span>
                        <Badge variant="outline">{pageTypeLabels[selectedResult.recommended_page_type] || selectedResult.recommended_page_type}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status</span>
                        <Badge variant="outline" className={mappingStatusColors[selectedResult.mapping_status]}>{selectedResult.mapping_status.replace("_", " ")}</Badge>
                      </div>
                      {selectedResult.existing_url && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Existing URL</span>
                          <span className="font-mono text-xs">{selectedResult.existing_url}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1 gap-1" onClick={() => {
                      updateResult.mutate({ id: selectedResult.id, data: { brief_queued: true } });
                      toast.success("Added to brief queue");
                    }}>
                      <FileText className="h-3.5 w-3.5" /> Queue Brief
                    </Button>
                  </div>
                </div>
              </>
            )}
          </SheetContent>
        </Sheet>
      </PageTransition>
    );
  }

  // ─── Jobs List ───
  const hasValidClient = !!activeClient && !!clientId && !clientId.startsWith("00000000");

  return (
    <PageTransition className="space-y-6">
      <MascotSectionHeader role="seo" title="Keyword Research" subtitle="Research, score, cluster, and map keywords to pages">
      </MascotSectionHeader>
      {!hasValidClient && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Target className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <h3 className="text-lg font-semibold text-foreground mb-1">No client selected</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              Create a client first from the Dashboard, then come back here to start keyword research.
            </p>
          </CardContent>
        </Card>
      )}
      {hasValidClient && (
      <div className="flex items-center justify-end flex-wrap gap-3">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> New Research</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" /> Start Keyword Research
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium block mb-1.5">Seed Services / Keywords *</label>
                <Input
                  placeholder="e.g., seo agency, web design, digital marketing"
                  value={seedTopics}
                  onChange={e => setSeedTopics(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">Comma-separated services or topics — service pages are prioritized first</p>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1.5">Competitor Domains (optional)</label>
                <Input
                  placeholder="e.g., competitor-one.com, rival-agency.sg"
                  value={competitorDomains}
                  onChange={e => setCompetitorDomains(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">Comma-separated — used for gap analysis and page structure comparison</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium block mb-1.5">Target Count</label>
                  <Select value={targetCount} onValueChange={v => { setTargetCount(v); if (v !== "custom") setCustomCount(""); }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10 keywords</SelectItem>
                      <SelectItem value="20">20 keywords</SelectItem>
                      <SelectItem value="40">40 keywords</SelectItem>
                      <SelectItem value="100">100 keywords</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                  {targetCount === "custom" && (
                    <Input type="number" min={5} max={500} placeholder="Enter count" value={customCount} onChange={e => setCustomCount(e.target.value)} className="mt-2" />
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1.5">Location</label>
                  <Input value={targetLocation} onChange={e => setTargetLocation(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-sm font-medium block mb-1.5">Language</label>
                  <Select value={targetLanguage} onValueChange={setTargetLanguage}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="zh">Chinese</SelectItem>
                      <SelectItem value="ms">Malay</SelectItem>
                      <SelectItem value="ta">Tamil</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1.5">Business Priority</label>
                  <Select value={businessPriority} onValueChange={setBusinessPriority}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="leads">Lead Generation</SelectItem>
                      <SelectItem value="local_seo">Local SEO</SelectItem>
                      <SelectItem value="authority">Authority Building</SelectItem>
                      <SelectItem value="content_growth">Content Growth</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1.5">Provider</label>
                  <Select value={providerMode} onValueChange={setProviderMode}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mock">Mock (Demo)</SelectItem>
                      <SelectItem value="dataforseo">DataForSEO (Live)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button
                onClick={() => startResearch.mutate({
                  client_id: clientId,
                  domain: activeClient?.domain || "",
                  seed_topics: seedTopics.split(",").map(s => s.trim()).filter(Boolean),
                  competitor_domains: competitorDomains ? competitorDomains.split(",").map(s => s.trim()).filter(Boolean) : [],
                  target_count: targetCount === "custom" ? Number(customCount) || 20 : Number(targetCount),
                  target_location: targetLocation,
                  target_language: targetLanguage,
                  business_priority: businessPriority,
                  provider: providerMode,
                })}
                disabled={!seedTopics.trim() || startResearch.isPending}
                className="gap-2"
              >
                {startResearch.isPending ? (
                  <><div className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" /> Analyzing...</>
                ) : (
                  <><Sparkles className="h-4 w-4" /> Start Research</>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <StaggerContainer className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Research Jobs", value: jobs.length, icon: Search, color: "text-seo-primary" },
          { label: "Total Keywords", value: jobs.reduce((s, j) => s + j.total_keywords, 0), icon: Target, color: "text-content-primary" },
          { label: "Pages Mapped", value: jobs.reduce((s, j) => s + j.pages_mapped, 0), icon: Map, color: "text-primary" },
        ].map((stat, i) => (
          <StaggerItem key={i}>
            <Card className="hover-lift">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          </StaggerItem>
        ))}
      </StaggerContainer>

      {/* Job List */}
      {isLoading ? (
        <div className="grid gap-4">{[1, 2].map(i => <Card key={i}><CardContent className="p-6"><Skeleton className="h-16 w-full" /></CardContent></Card>)}</div>
      ) : jobs.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-12 text-center">
            <Search className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Keyword Research Yet</h3>
            <p className="text-sm text-muted-foreground mb-4">Start researching keywords to build your content strategy</p>
            <Button onClick={() => setDialogOpen(true)} className="gap-2"><Plus className="h-4 w-4" /> Start Research</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {jobs.map((job, idx) => (
            <motion.div key={job.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
              <Card className="cursor-pointer hover:shadow-md transition-all duration-200 hover:border-primary/30" onClick={() => loadJobDetail.mutate(job.id)}>
                <CardContent className="p-5 flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-seo-primary/20 to-seo-primary/5 flex items-center justify-center">
                      <Search className="h-6 w-6 text-seo-primary" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold">{job.seed_topics.join(", ")}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {job.domain} · {job.target_location} · {new Date(job.created_at).toLocaleDateString()}
                        <Badge variant="outline" className="ml-2 text-[10px]">{job.provider}</Badge>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-center"><p className="text-lg font-bold">{job.total_keywords}</p><p className="text-[10px] text-muted-foreground uppercase">Keywords</p></div>
                    <div className="text-center"><p className="text-lg font-bold">{job.clusters_count}</p><p className="text-[10px] text-muted-foreground uppercase">Clusters</p></div>
                    <div className="text-center"><p className="text-lg font-bold">{job.pages_mapped}</p><p className="text-[10px] text-muted-foreground uppercase">Pages</p></div>
                    <Badge variant={job.status === "completed" ? "default" : "secondary"}>{job.status}</Badge>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </PageTransition>
  );
}
