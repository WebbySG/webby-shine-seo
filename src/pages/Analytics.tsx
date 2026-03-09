import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useClients } from "@/hooks/use-api";
import { usePerformanceSummary, usePagePerformance, useKeywordPerformance, useAssetPerformance, usePerformanceInsights, useUpdateInsightStatus, useAnalyticsConnections, useSyncAnalytics } from "@/hooks/use-api";
import { BarChart3, TrendingUp, MousePointerClick, Eye, Target, Lightbulb, RefreshCw, Loader2, Check, ArrowUpRight, ArrowDownRight, Minus, Link2, Layers } from "lucide-react";
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

export default function Analytics() {
  const [selectedClient, setSelectedClient] = useState<string>("");
  const [days, setDays] = useState(14);
  const { data: clients } = useClients();
  const { data: summary } = usePerformanceSummary(selectedClient, days);
  const { data: pagePerf } = usePagePerformance(selectedClient, days);
  const { data: kwPerf } = useKeywordPerformance(selectedClient, days);
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

  const kpiCards = [
    { label: "Organic Clicks", value: Number(s.total_clicks || 0).toLocaleString(), icon: MousePointerClick, color: "border-l-analytics-primary" },
    { label: "Impressions", value: Number(s.total_impressions || 0).toLocaleString(), icon: Eye, color: "border-l-analytics-primary" },
    { label: "Avg CTR", value: `${(Number(s.avg_ctr || 0) * 100).toFixed(1)}%`, icon: Target, color: "border-l-emerald-500" },
    { label: "Avg Position", value: Number(s.avg_position || 0).toFixed(1), icon: BarChart3, color: "border-l-amber-500" },
    { label: "Sessions", value: Number(s.total_sessions || 0).toLocaleString(), icon: TrendingUp, color: "border-l-primary" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Analytics & Performance</h1>
          <p className="text-sm text-muted-foreground mt-1.5">Track content performance and get optimization insights</p>
        </div>
        <div className="flex items-center gap-3">
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
            <Button size="sm" variant="outline" disabled={syncAnalytics.isPending} onClick={() => {
              syncAnalytics.mutate(selectedClient, {
                onSuccess: (data) => toast.success(`Generated ${data.insights_generated} insights`),
                onError: () => toast.error("Sync failed"),
              });
            }}>
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
            <p className="text-muted-foreground font-medium">Select a client to view performance analytics</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid gap-4 sm:grid-cols-5">
            {kpiCards.map((m) => (
              <Card key={m.label} className={`hover-lift border-l-4 ${m.color}`}>
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
            ))}
          </div>

          <Tabs defaultValue="insights" className="space-y-6">
            <TabsList className="bg-muted/50 border">
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
                      <p className="text-muted-foreground">No insights yet. Click "Sync & Analyze" to generate.</p>
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
                              <div className="flex items-center gap-2 mb-1">
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
                          {ins.status === "open" && (
                            <Button size="sm" variant="outline" className="shrink-0" onClick={() => {
                              updateInsight.mutate({ insightId: ins.id, status: "reviewed" }, {
                                onSuccess: () => toast.success("Marked as reviewed"),
                              });
                            }}>
                              <Check className="h-3.5 w-3.5 mr-1" />Reviewed
                            </Button>
                          )}
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
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead>Page URL</TableHead>
                        <TableHead className="text-center">Clicks</TableHead>
                        <TableHead className="text-center">Impressions</TableHead>
                        <TableHead className="text-center">CTR</TableHead>
                        <TableHead className="text-center">Avg Position</TableHead>
                        <TableHead className="text-center">Sessions</TableHead>
                        <TableHead>Source</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pages.length === 0 && (
                        <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No page performance data yet.</TableCell></TableRow>
                      )}
                      {pages.map((p: any, i: number) => (
                        <TableRow key={i}>
                          <TableCell className="font-mono text-xs truncate max-w-[300px]">{p.page_url}</TableCell>
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
                </CardContent>
              </Card>
            </TabsContent>

            {/* Keywords */}
            <TabsContent value="keywords">
              <Card className="hover-lift">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead>Keyword</TableHead>
                        <TableHead className="text-center">Clicks</TableHead>
                        <TableHead className="text-center">Impressions</TableHead>
                        <TableHead className="text-center">CTR</TableHead>
                        <TableHead className="text-center">Avg Position</TableHead>
                        <TableHead className="text-center">Change</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {keywords.length === 0 && (
                        <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No keyword performance data yet.</TableCell></TableRow>
                      )}
                      {keywords.map((k: any, i: number) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium">{k.keyword || "–"}</TableCell>
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
                </CardContent>
              </Card>
            </TabsContent>

            {/* Assets */}
            <TabsContent value="assets">
              <Card className="hover-lift">
                <CardContent className="p-0">
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
                      {assets.length === 0 && (
                        <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No asset performance data yet.</TableCell></TableRow>
                      )}
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
                </CardContent>
              </Card>
            </TabsContent>

            {/* Connections */}
            <TabsContent value="connections">
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  { provider: "gsc", label: "Google Search Console", desc: "Page clicks, impressions, CTR, and average position", icon: BarChart3 },
                  { provider: "ga4", label: "Google Analytics 4", desc: "Sessions, users, engagement rate", icon: TrendingUp },
                ].map((p) => {
                  const conn = conns.find((c: any) => c.provider === p.provider);
                  return (
                    <Card key={p.provider} className="hover-lift">
                      <CardContent className="p-5">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="h-10 w-10 rounded-xl bg-analytics-background flex items-center justify-center">
                            <p.icon className="h-5 w-5 text-analytics-primary" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-sm text-foreground">{p.label}</h4>
                            <Badge variant={conn?.status === "active" ? "default" : "outline"} className="text-[10px] mt-0.5">
                              {conn?.status || "not connected"}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mb-3">{p.desc}</p>
                        {conn?.site_url && (
                          <p className="text-xs font-mono text-muted-foreground mb-2">{conn.site_url || conn.property_id}</p>
                        )}
                        <p className="text-[11px] text-muted-foreground/60 italic">Configure OAuth credentials in backend environment.</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
