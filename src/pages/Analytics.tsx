import { useState } from "react";
import { PageTransition, StaggerContainer, StaggerItem } from "@/components/motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useActiveClient } from "@/contexts/ClientContext";
import { usePerformanceSummary, usePagePerformance, useKeywordPerformance, useAssetPerformance, usePerformanceInsights, useUpdateInsightStatus, useAnalyticsConnections, useSyncAnalytics } from "@/hooks/use-api";
import { BarChart3, TrendingUp, MousePointerClick, Eye, Target, Lightbulb, RefreshCw, Loader2, Check, ArrowUpRight, ArrowDownRight, Minus, Link2, Layers } from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from "recharts";
import { toast } from "sonner";

const INSIGHT_ICONS: Record<string, typeof Lightbulb> = {
  winning_content: TrendingUp,
  declining_content: ArrowDownRight,
  low_ctr: MousePointerClick,
  refresh_candidate: RefreshCw,
  repurpose_opportunity: Layers,
  content_expansion: Lightbulb,
};

const PRIORITY_COLORS: Record<string, string> = {
  high: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
  medium: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",
  low: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
};

// Generate trend data from page performance for charts
function generateTrendFromPages(pages: any[]) {
  if (!pages.length) return [];
  // Group by source or create synthetic weekly data
  const sorted = [...pages].sort((a, b) => Number(b.clicks) - Number(a.clicks)).slice(0, 10);
  return sorted.map((p, i) => ({
    name: (p.page_url || "").replace(/https?:\/\/[^/]+/, "").slice(0, 30) || `Page ${i + 1}`,
    clicks: Number(p.clicks) || 0,
    impressions: Number(p.impressions) || 0,
    ctr: Number((Number(p.ctr) * 100).toFixed(1)) || 0,
    position: Number(Number(p.average_position).toFixed(1)) || 0,
  }));
}

function generateKwChart(keywords: any[]) {
  if (!keywords.length) return [];
  return [...keywords]
    .sort((a, b) => Number(b.clicks) - Number(a.clicks))
    .slice(0, 8)
    .map((k) => ({
      name: (k.keyword || "").slice(0, 25),
      clicks: Number(k.clicks) || 0,
      impressions: Number(k.impressions) || 0,
      position: Number(Number(k.average_position).toFixed(1)) || 0,
    }));
}

export default function Analytics() {
  const [selectedClient, setSelectedClient] = useState<string>("");
  const [days, setDays] = useState(14);
  const { data: clients } = useClients();
  const { data: summary, isLoading: summaryLoading } = usePerformanceSummary(selectedClient, days);
  const { data: pagePerf, isLoading: pagesLoading } = usePagePerformance(selectedClient, days);
  const { data: kwPerf, isLoading: kwLoading } = useKeywordPerformance(selectedClient, days);
  const { data: assetPerf } = useAssetPerformance(selectedClient, days);
  const { data: insights } = usePerformanceInsights(selectedClient);
  const { data: connections } = useAnalyticsConnections(selectedClient);
  const syncAnalytics = useSyncAnalytics();
  const updateInsight = useUpdateInsightStatus(selectedClient);

  const pages = pagePerf ?? [];
  const keywords = kwPerf ?? [];
  const assets = assetPerf ?? [];
  const allInsights = insights ?? [];
  const conns = connections ?? [];
  const s = summary?.summary ?? { total_clicks: 0, total_impressions: 0, avg_ctr: 0, avg_position: 0, total_sessions: 0 };

  const trendData = generateTrendFromPages(pages);
  const kwChartData = generateKwChart(keywords);

  const kpiCards = [
    { label: "Organic Clicks", value: Number(s.total_clicks || 0).toLocaleString(), icon: MousePointerClick, color: "border-l-analytics-primary" },
    { label: "Impressions", value: Number(s.total_impressions || 0).toLocaleString(), icon: Eye, color: "border-l-analytics-primary" },
    { label: "Avg CTR", value: `${(Number(s.avg_ctr || 0) * 100).toFixed(1)}%`, icon: Target, color: "border-l-emerald-500" },
    { label: "Avg Position", value: Number(s.avg_position || 0).toFixed(1), icon: BarChart3, color: "border-l-amber-500" },
    { label: "Sessions", value: Number(s.total_sessions || 0).toLocaleString(), icon: TrendingUp, color: "border-l-primary" },
  ];

  return (
    <PageTransition className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Analytics & Performance</h1>
          <p className="text-sm text-muted-foreground mt-1.5">Track content performance and get optimization insights</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="14">Last 14 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedClient} onValueChange={setSelectedClient}>
            <SelectTrigger className="w-[200px]"><SelectValue placeholder="Select client" /></SelectTrigger>
            <SelectContent>
              {(clients ?? []).map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedClient && (
            <Button size="sm" onClick={() => {
              syncAnalytics.mutate(selectedClient, {
                onSuccess: (data) => toast.success(`Generated ${data.insights_generated} insights`),
                onError: () => toast.error("Sync failed"),
              });
            }} disabled={syncAnalytics.isPending}>
              {syncAnalytics.isPending ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5 mr-1.5" />}
              Sync & Analyze
            </Button>
          )}
        </div>
      </div>

      {!selectedClient ? (
        <Card className="hover-lift">
          <CardContent className="flex flex-col items-center justify-center py-20">
            <div className="h-16 w-16 rounded-2xl bg-analytics-background flex items-center justify-center mb-4">
              <BarChart3 className="h-8 w-8 text-analytics-primary" />
            </div>
            <p className="text-muted-foreground font-medium mb-2">Select a client to view performance analytics</p>
            <p className="text-xs text-muted-foreground">Choose a client above, then click "Sync & Analyze" to fetch data</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* KPI Cards */}
          {summaryLoading ? (
            <div className="grid gap-4 sm:grid-cols-5">
              {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-20 rounded-lg" />)}
            </div>
          ) : (
            <StaggerContainer className="grid gap-4 grid-cols-2 sm:grid-cols-5">
              {kpiCards.map((m) => (
                <StaggerItem key={m.label}>
                  <Card className={`hover-lift border-l-4 ${m.color}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-7 w-7 rounded-lg bg-muted/50 flex items-center justify-center">
                          <m.icon className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                        <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">{m.label}</p>
                      </div>
                      <p className="text-2xl font-bold text-foreground">{m.value}</p>
                    </CardContent>
                  </Card>
                </StaggerItem>
              ))}
            </StaggerContainer>
          )}

          {/* Charts Row */}
          {pagesLoading ? (
            <div className="grid gap-6 lg:grid-cols-2">
              <Skeleton className="h-72 rounded-lg" />
              <Skeleton className="h-72 rounded-lg" />
            </div>
          ) : trendData.length > 0 ? (
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Clicks & Impressions by Page */}
              <Card className="hover-lift">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <div className="h-7 w-7 rounded-lg bg-analytics-background flex items-center justify-center">
                      <MousePointerClick className="h-4 w-4 text-analytics-primary" />
                    </div>
                    Top Pages — Clicks & Impressions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={trendData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 10 }} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} width={120} />
                      <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", fontSize: 12 }} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="clicks" fill="hsl(235, 82%, 76%)" name="Clicks" radius={[0, 4, 4, 0]} />
                      <Bar dataKey="impressions" fill="hsl(235, 82%, 76%, 0.3)" name="Impressions" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* CTR & Position by Page */}
              <Card className="hover-lift">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <div className="h-7 w-7 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                      <Target className="h-4 w-4 text-emerald-500" />
                    </div>
                    CTR & Avg Position
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={trendData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 10 }} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} width={120} />
                      <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", fontSize: 12 }} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="ctr" fill="hsl(142, 71%, 45%)" name="CTR %" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          ) : null}

          {/* Top Keywords Chart */}
          {kwChartData.length > 0 && (
            <Card className="hover-lift">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-seo-background flex items-center justify-center">
                    <Target className="h-4 w-4 text-seo-primary" />
                  </div>
                  Top Keywords Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={kwChartData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-20} textAnchor="end" height={60} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="clicks" fill="hsl(217, 91%, 60%)" name="Clicks" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="impressions" fill="hsl(217, 91%, 60%, 0.25)" name="Impressions" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          <Tabs defaultValue="insights" className="space-y-6">
            <TabsList className="bg-muted/50 border flex-wrap h-auto gap-1">
              <TabsTrigger value="insights" className="gap-1.5"><Lightbulb className="h-3.5 w-3.5" /> Insights ({allInsights.length})</TabsTrigger>
              <TabsTrigger value="pages" className="gap-1.5"><Link2 className="h-3.5 w-3.5" /> Pages</TabsTrigger>
              <TabsTrigger value="keywords" className="gap-1.5"><Target className="h-3.5 w-3.5" /> Keywords</TabsTrigger>
              <TabsTrigger value="assets" className="gap-1.5"><Layers className="h-3.5 w-3.5" /> Assets</TabsTrigger>
              <TabsTrigger value="connections" className="gap-1.5"><BarChart3 className="h-3.5 w-3.5" /> Connections</TabsTrigger>
            </TabsList>

            {/* Insights */}
            <TabsContent value="insights">
              <div className="space-y-3">
                {allInsights.length === 0 && (
                  <Card className="hover-lift">
                    <CardContent className="flex flex-col items-center py-12">
                      <div className="h-12 w-12 rounded-xl bg-analytics-background flex items-center justify-center mb-3">
                        <Lightbulb className="h-6 w-6 text-analytics-primary" />
                      </div>
                      <p className="text-muted-foreground font-medium mb-1">No insights yet</p>
                      <p className="text-xs text-muted-foreground mb-3">Click "Sync & Analyze" to generate performance insights</p>
                      <Button size="sm" onClick={() => {
                        syncAnalytics.mutate(selectedClient, {
                          onSuccess: (data) => toast.success(`Generated ${data.insights_generated} insights`),
                          onError: () => toast.error("Sync failed"),
                        });
                      }} disabled={syncAnalytics.isPending}>
                        {syncAnalytics.isPending ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5 mr-1.5" />}
                        Sync & Analyze
                      </Button>
                    </CardContent>
                  </Card>
                )}
                {allInsights.map((ins: any) => {
                  const Icon = INSIGHT_ICONS[ins.insight_type] || Lightbulb;
                  return (
                    <Card key={ins.id} className={`hover-lift border-l-4 ${ins.priority === "high" ? "border-l-red-500" : ins.priority === "medium" ? "border-l-amber-500" : "border-l-blue-500"}`}>
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3 min-w-0">
                            <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${ins.priority === "high" ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" : ins.priority === "medium" ? "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" : "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"}`}>
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <Badge className={`${PRIORITY_COLORS[ins.priority]} border text-xs`}>{ins.priority}</Badge>
                                <Badge variant="outline" className="text-xs">{ins.insight_type.replace(/_/g, " ")}</Badge>
                              </div>
                              <h4 className="text-sm font-semibold text-foreground">{ins.title}</h4>
                              <p className="text-xs text-muted-foreground mt-1">{ins.description}</p>
                              {ins.recommended_action && (
                                <p className="text-xs text-primary mt-1.5 font-medium">→ {ins.recommended_action}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-1.5 shrink-0">
                            {ins.status === "open" && (
                              <Button size="sm" variant="outline" onClick={() => {
                                updateInsight.mutate({ insightId: ins.id, status: "reviewed" }, {
                                  onSuccess: () => toast.success("Marked as reviewed"),
                                });
                              }}>
                                <Check className="h-3.5 w-3.5 mr-1" />Reviewed
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            {/* Pages */}
            <TabsContent value="pages">
              <Card className="hover-lift">
                <CardContent className="p-0">
                  {pagesLoading ? (
                    <div className="p-6 space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-10 w-full rounded-lg" />)}</div>
                  ) : pages.length === 0 ? (
                    <div className="flex flex-col items-center py-12">
                      <div className="h-12 w-12 rounded-xl bg-analytics-background flex items-center justify-center mb-3">
                        <Link2 className="h-6 w-6 text-analytics-primary" />
                      </div>
                      <p className="text-muted-foreground text-sm">No page data yet. Sync analytics to import.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="hover:bg-transparent">
                            <TableHead className="sticky left-0 bg-card z-10">Page URL</TableHead>
                            <TableHead className="text-center">Clicks</TableHead>
                            <TableHead className="text-center">Impressions</TableHead>
                            <TableHead className="text-center">CTR</TableHead>
                            <TableHead className="text-center">Avg Position</TableHead>
                            <TableHead className="text-center">Sessions</TableHead>
                            <TableHead>Source</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {pages.map((p: any, i: number) => (
                            <TableRow key={i}>
                              <TableCell className="font-mono text-xs truncate max-w-[300px] sticky left-0 bg-card">{p.page_url}</TableCell>
                              <TableCell className="text-center font-mono text-sm">{Number(p.clicks).toLocaleString()}</TableCell>
                              <TableCell className="text-center font-mono text-sm">{Number(p.impressions).toLocaleString()}</TableCell>
                              <TableCell className="text-center font-mono text-sm">{(Number(p.ctr) * 100).toFixed(1)}%</TableCell>
                              <TableCell className="text-center font-mono text-sm">{Number(p.average_position).toFixed(1)}</TableCell>
                              <TableCell className="text-center font-mono text-sm">{Number(p.sessions).toLocaleString()}</TableCell>
                              <TableCell><Badge variant="outline" className="text-xs">{p.source}</Badge></TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Keywords */}
            <TabsContent value="keywords">
              <Card className="hover-lift">
                <CardContent className="p-0">
                  {kwLoading ? (
                    <div className="p-6 space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-10 w-full rounded-lg" />)}</div>
                  ) : keywords.length === 0 ? (
                    <div className="flex flex-col items-center py-12">
                      <div className="h-12 w-12 rounded-xl bg-seo-background flex items-center justify-center mb-3">
                        <Target className="h-6 w-6 text-seo-primary" />
                      </div>
                      <p className="text-muted-foreground text-sm">No keyword data yet. Sync analytics to import.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="hover:bg-transparent">
                            <TableHead className="sticky left-0 bg-card z-10">Keyword</TableHead>
                            <TableHead className="text-center">Clicks</TableHead>
                            <TableHead className="text-center">Impressions</TableHead>
                            <TableHead className="text-center">CTR</TableHead>
                            <TableHead className="text-center">Avg Position</TableHead>
                            <TableHead className="text-center">Change</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {keywords.map((k: any, i: number) => (
                            <TableRow key={i}>
                              <TableCell className="font-medium sticky left-0 bg-card">{k.keyword || "–"}</TableCell>
                              <TableCell className="text-center font-mono text-sm">{Number(k.clicks).toLocaleString()}</TableCell>
                              <TableCell className="text-center font-mono text-sm">{Number(k.impressions).toLocaleString()}</TableCell>
                              <TableCell className="text-center font-mono text-sm">{(Number(k.ctr) * 100).toFixed(1)}%</TableCell>
                              <TableCell className="text-center font-mono text-sm">{Number(k.average_position).toFixed(1)}</TableCell>
                              <TableCell className="text-center">
                                {Number(k.rank_change) > 0 ? (
                                  <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 border gap-1"><ArrowUpRight className="h-3 w-3" />+{k.rank_change}</Badge>
                                ) : Number(k.rank_change) < 0 ? (
                                  <Badge className="bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 border gap-1"><ArrowDownRight className="h-3 w-3" />{k.rank_change}</Badge>
                                ) : (
                                  <Badge variant="outline" className="gap-1"><Minus className="h-3 w-3" />0</Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Assets */}
            <TabsContent value="assets">
              <Card className="hover-lift">
                <CardContent className="p-0">
                  {assets.length === 0 ? (
                    <div className="flex flex-col items-center py-12">
                      <div className="h-12 w-12 rounded-xl bg-content-background flex items-center justify-center mb-3">
                        <Layers className="h-6 w-6 text-content-primary" />
                      </div>
                      <p className="text-muted-foreground text-sm">No asset performance data yet.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="hover:bg-transparent">
                            <TableHead>Asset Type</TableHead>
                            <TableHead>Platform</TableHead>
                            <TableHead className="text-center">Views</TableHead>
                            <TableHead className="text-center">Clicks</TableHead>
                            <TableHead className="text-center">Engagements</TableHead>
                            <TableHead className="text-center">Shares</TableHead>
                            <TableHead className="text-center">Likes</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {assets.map((a: any, i: number) => (
                            <TableRow key={i}>
                              <TableCell><Badge variant="outline" className="text-xs">{a.asset_type.replace(/_/g, " ")}</Badge></TableCell>
                              <TableCell className="text-sm capitalize">{a.platform || "–"}</TableCell>
                              <TableCell className="text-center font-mono text-sm">{Number(a.views).toLocaleString()}</TableCell>
                              <TableCell className="text-center font-mono text-sm">{Number(a.clicks).toLocaleString()}</TableCell>
                              <TableCell className="text-center font-mono text-sm">{Number(a.engagements).toLocaleString()}</TableCell>
                              <TableCell className="text-center font-mono text-sm">{Number(a.shares).toLocaleString()}</TableCell>
                              <TableCell className="text-center font-mono text-sm">{Number(a.likes).toLocaleString()}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Connections */}
            <TabsContent value="connections">
              <Card className="hover-lift">
                <CardHeader>
                  <CardTitle className="text-base">Analytics Connections</CardTitle>
                </CardHeader>
                <CardContent>
                  {conns.length === 0 ? (
                    <div className="flex flex-col items-center py-8">
                      <div className="h-12 w-12 rounded-xl bg-analytics-background flex items-center justify-center mb-3">
                        <BarChart3 className="h-6 w-6 text-analytics-primary" />
                      </div>
                      <p className="text-muted-foreground text-sm mb-1">No connections configured</p>
                      <p className="text-xs text-muted-foreground">Configure GA4 and Search Console via backend settings</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {conns.map((c: any) => (
                        <div key={c.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="text-sm font-medium text-foreground capitalize">{c.platform}</p>
                            <p className="text-xs text-muted-foreground">{c.property_id || c.account_id}</p>
                          </div>
                          <Badge variant={c.status === "active" ? "default" : "secondary"} className="text-xs">{c.status}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </PageTransition>
  );
}
