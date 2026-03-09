import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useClients } from "@/hooks/use-api";
import { usePerformanceSummary, usePagePerformance, useKeywordPerformance, useAssetPerformance, usePerformanceInsights, useUpdateInsightStatus, useAnalyticsConnections, useSyncAnalytics } from "@/hooks/use-api";
import { BarChart3, TrendingUp, TrendingDown, MousePointerClick, Eye, Target, Lightbulb, RefreshCw, Loader2, Check, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { toast } from "sonner";

const INSIGHT_ICONS: Record<string, string> = {
  winning_content: "🏆",
  declining_content: "📉",
  low_ctr: "👆",
  refresh_candidate: "🔄",
  repurpose_opportunity: "♻️",
  content_expansion: "📝",
};

const PRIORITY_BADGE: Record<string, "destructive" | "secondary" | "outline"> = {
  high: "destructive",
  medium: "secondary",
  low: "outline",
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics & Performance</h1>
          <p className="text-sm text-muted-foreground">Track content performance and get optimization insights.</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            className="text-sm border rounded px-2 py-1.5 bg-background"
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
          >
            <option value={7}>Last 7 days</option>
            <option value={14}>Last 14 days</option>
            <option value={30}>Last 30 days</option>
          </select>
          <select
            className="text-sm border rounded px-2 py-1.5 bg-background"
            value={selectedClient}
            onChange={(e) => setSelectedClient(e.target.value)}
          >
            <option value="">Select client…</option>
            {(clients ?? []).map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          {selectedClient && (
            <Button
              size="sm"
              variant="outline"
              disabled={syncAnalytics.isPending}
              onClick={() => {
                syncAnalytics.mutate(selectedClient, {
                  onSuccess: (data) => toast.success(`Generated ${data.insights_generated} insights`),
                  onError: () => toast.error("Sync failed"),
                });
              }}
            >
              {syncAnalytics.isPending ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5 mr-1" />}
              Sync & Analyze
            </Button>
          )}
        </div>
      </div>

      {!selectedClient ? (
        <Card>
          <CardContent className="p-12 text-center">
            <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground">Select a client to view performance analytics.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid gap-4 sm:grid-cols-5">
            {[
              { label: "Organic Clicks", value: Number(s.total_clicks || 0).toLocaleString(), icon: MousePointerClick },
              { label: "Impressions", value: Number(s.total_impressions || 0).toLocaleString(), icon: Eye },
              { label: "Avg CTR", value: `${(Number(s.avg_ctr || 0) * 100).toFixed(1)}%`, icon: Target },
              { label: "Avg Position", value: Number(s.avg_position || 0).toFixed(1), icon: BarChart3 },
              { label: "Sessions", value: Number(s.total_sessions || 0).toLocaleString(), icon: TrendingUp },
            ].map((m) => (
              <Card key={m.label}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <m.icon className="h-3.5 w-3.5 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">{m.label}</p>
                  </div>
                  <p className="text-xl font-bold">{m.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Tabs defaultValue="insights" className="space-y-4">
            <TabsList className="flex-wrap h-auto gap-1">
              <TabsTrigger value="insights">Insights ({allInsights.length})</TabsTrigger>
              <TabsTrigger value="pages">Page Performance</TabsTrigger>
              <TabsTrigger value="keywords">Keyword Performance</TabsTrigger>
              <TabsTrigger value="assets">Asset Performance</TabsTrigger>
              <TabsTrigger value="connections">Connections ({conns.length})</TabsTrigger>
            </TabsList>

            {/* Insights Tab */}
            <TabsContent value="insights">
              <div className="space-y-3">
                {allInsights.length === 0 && (
                  <Card>
                    <CardContent className="p-8 text-center text-muted-foreground">
                      <Lightbulb className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
                      No insights yet. Click "Sync & Analyze" to generate performance insights.
                    </CardContent>
                  </Card>
                )}
                {allInsights.map((ins: any) => (
                  <Card key={ins.id}>
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 min-w-0">
                          <span className="text-lg mt-0.5">{INSIGHT_ICONS[ins.insight_type] || "💡"}</span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <Badge variant={PRIORITY_BADGE[ins.priority]} className="text-xs">{ins.priority}</Badge>
                              <Badge variant="outline" className="text-xs">{ins.insight_type.replace(/_/g, " ")}</Badge>
                            </div>
                            <h4 className="text-sm font-medium">{ins.title}</h4>
                            <p className="text-xs text-muted-foreground mt-1">{ins.description}</p>
                            {ins.recommended_action && (
                              <p className="text-xs text-primary mt-1">→ {ins.recommended_action}</p>
                            )}
                          </div>
                        </div>
                        {ins.status === "open" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              updateInsight.mutate({ insightId: ins.id, status: "reviewed" }, {
                                onSuccess: () => toast.success("Marked as reviewed"),
                              });
                            }}
                          >
                            <Check className="h-3.5 w-3.5 mr-1" />Reviewed
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Page Performance Tab */}
            <TabsContent value="pages">
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left">
                          <th className="p-3 font-medium text-muted-foreground">Page URL</th>
                          <th className="p-3 font-medium text-muted-foreground text-center">Clicks</th>
                          <th className="p-3 font-medium text-muted-foreground text-center">Impressions</th>
                          <th className="p-3 font-medium text-muted-foreground text-center">CTR</th>
                          <th className="p-3 font-medium text-muted-foreground text-center">Avg Position</th>
                          <th className="p-3 font-medium text-muted-foreground text-center">Sessions</th>
                          <th className="p-3 font-medium text-muted-foreground">Source</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pages.length === 0 && (
                          <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">No page performance data yet.</td></tr>
                        )}
                        {pages.map((p: any, i: number) => (
                          <tr key={i} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                            <td className="p-3 font-mono text-xs truncate max-w-[300px]">{p.page_url}</td>
                            <td className="p-3 text-center font-mono">{Number(p.clicks).toLocaleString()}</td>
                            <td className="p-3 text-center font-mono">{Number(p.impressions).toLocaleString()}</td>
                            <td className="p-3 text-center font-mono">{(Number(p.ctr) * 100).toFixed(1)}%</td>
                            <td className="p-3 text-center font-mono">{Number(p.average_position).toFixed(1)}</td>
                            <td className="p-3 text-center font-mono">{Number(p.sessions).toLocaleString()}</td>
                            <td className="p-3"><Badge variant="outline" className="text-xs">{p.source}</Badge></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Keyword Performance Tab */}
            <TabsContent value="keywords">
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left">
                          <th className="p-3 font-medium text-muted-foreground">Keyword</th>
                          <th className="p-3 font-medium text-muted-foreground text-center">Clicks</th>
                          <th className="p-3 font-medium text-muted-foreground text-center">Impressions</th>
                          <th className="p-3 font-medium text-muted-foreground text-center">CTR</th>
                          <th className="p-3 font-medium text-muted-foreground text-center">Avg Position</th>
                          <th className="p-3 font-medium text-muted-foreground text-center">Rank Change</th>
                        </tr>
                      </thead>
                      <tbody>
                        {keywords.length === 0 && (
                          <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">No keyword performance data yet.</td></tr>
                        )}
                        {keywords.map((k: any, i: number) => (
                          <tr key={i} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                            <td className="p-3 font-medium">{k.keyword || "–"}</td>
                            <td className="p-3 text-center font-mono">{Number(k.clicks).toLocaleString()}</td>
                            <td className="p-3 text-center font-mono">{Number(k.impressions).toLocaleString()}</td>
                            <td className="p-3 text-center font-mono">{(Number(k.ctr) * 100).toFixed(1)}%</td>
                            <td className="p-3 text-center font-mono">{Number(k.average_position).toFixed(1)}</td>
                            <td className="p-3 text-center">
                              {Number(k.rank_change) > 0 ? (
                                <span className="text-success flex items-center justify-center gap-1"><ArrowUpRight className="h-3 w-3" />+{k.rank_change}</span>
                              ) : Number(k.rank_change) < 0 ? (
                                <span className="text-destructive flex items-center justify-center gap-1"><ArrowDownRight className="h-3 w-3" />{k.rank_change}</span>
                              ) : (
                                <span className="text-muted-foreground flex items-center justify-center gap-1"><Minus className="h-3 w-3" />0</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Asset Performance Tab */}
            <TabsContent value="assets">
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left">
                          <th className="p-3 font-medium text-muted-foreground">Asset Type</th>
                          <th className="p-3 font-medium text-muted-foreground">Platform</th>
                          <th className="p-3 font-medium text-muted-foreground text-center">Views</th>
                          <th className="p-3 font-medium text-muted-foreground text-center">Clicks</th>
                          <th className="p-3 font-medium text-muted-foreground text-center">Engagements</th>
                          <th className="p-3 font-medium text-muted-foreground text-center">Shares</th>
                          <th className="p-3 font-medium text-muted-foreground text-center">Likes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {assets.length === 0 && (
                          <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">No asset performance data yet.</td></tr>
                        )}
                        {assets.map((a: any, i: number) => (
                          <tr key={i} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                            <td className="p-3"><Badge variant="outline" className="text-xs">{a.asset_type.replace(/_/g, " ")}</Badge></td>
                            <td className="p-3 text-sm capitalize">{a.platform || "–"}</td>
                            <td className="p-3 text-center font-mono">{Number(a.views).toLocaleString()}</td>
                            <td className="p-3 text-center font-mono">{Number(a.clicks).toLocaleString()}</td>
                            <td className="p-3 text-center font-mono">{Number(a.engagements).toLocaleString()}</td>
                            <td className="p-3 text-center font-mono">{Number(a.shares).toLocaleString()}</td>
                            <td className="p-3 text-center font-mono">{Number(a.likes).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Connections Tab */}
            <TabsContent value="connections">
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  { provider: "gsc", label: "Google Search Console", desc: "Page clicks, impressions, CTR, and average position" },
                  { provider: "ga4", label: "Google Analytics 4", desc: "Sessions, users, engagement rate" },
                ].map((p) => {
                  const conn = conns.find((c: any) => c.provider === p.provider);
                  return (
                    <Card key={p.provider}>
                      <CardContent className="p-5">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-sm">{p.label}</h4>
                          <Badge variant={conn?.status === "active" ? "default" : "outline"} className="text-xs">
                            {conn?.status || "not connected"}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mb-3">{p.desc}</p>
                        {conn?.site_url && (
                          <p className="text-xs font-mono text-muted-foreground mb-2">{conn.site_url || conn.property_id}</p>
                        )}
                        <p className="text-xs text-muted-foreground italic">OAuth integration ready — configure credentials in backend environment.</p>
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
