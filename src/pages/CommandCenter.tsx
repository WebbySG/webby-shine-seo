import { useState } from "react";
import { PageTransition } from "@/components/motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  useClients, useCommandCenterSummary, useMarketingPriorities,
  useCrossChannelRecommendations, useWeeklyActionPlans, useMarketingGoals,
  useQuickWins, useRecomputePriorities, useGenerateCrossChannelRecs,
  useGenerateWeeklyPlan, useUpdatePriorityStatus, useUpdateRecommendationStatus,
  useUpdateWeeklyItemStatus,
} from "@/hooks/use-api";
import {
  Target, Zap, TrendingUp, Calendar, ArrowRight, RefreshCw, CheckCircle,
  Clock, AlertTriangle, Lightbulb, BarChart3, Layers, Play, MoreHorizontal, Command,
} from "lucide-react";
import { toast } from "sonner";

const MODULE_COLORS: Record<string, string> = {
  seo: "bg-seo-background text-seo-primary border-seo-border",
  content: "bg-content-background text-content-primary border-content-border",
  technical: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
  internal_linking: "bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-400",
  gbp: "bg-gbp-background text-gbp-primary border-gbp-border",
  paid_ads: "bg-ads-background text-ads-primary border-ads-border",
  analytics: "bg-analytics-background text-analytics-primary border-analytics-border",
  social: "bg-social-background text-social-primary border-social-border",
  
};

export default function CommandCenter() {
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const { data: clients } = useClients();
  const { data: summary, isLoading: summaryLoading } = useCommandCenterSummary(selectedClientId);
  const { data: priorities, isLoading: prioritiesLoading } = useMarketingPriorities(selectedClientId);
  const { data: recommendations } = useCrossChannelRecommendations(selectedClientId);
  const { data: weeklyPlans } = useWeeklyActionPlans(selectedClientId);
  const { data: goals } = useMarketingGoals(selectedClientId);
  const { data: quickWins } = useQuickWins(selectedClientId);

  const recomputeMutation = useRecomputePriorities();
  const generateRecsMutation = useGenerateCrossChannelRecs();
  const generatePlanMutation = useGenerateWeeklyPlan();
  const updatePriorityMutation = useUpdatePriorityStatus(selectedClientId);
  const updateRecMutation = useUpdateRecommendationStatus(selectedClientId);

  const handleRecompute = () => {
    if (!selectedClientId) return;
    recomputeMutation.mutate(selectedClientId, {
      onSuccess: (data) => toast.success(`Generated ${data.priorities_generated} priorities`),
      onError: () => toast.error("Failed to recompute"),
    });
  };

  return (
    <PageTransition className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Command Center</h1>
          <p className="text-muted-foreground mt-1.5">Unified marketing priorities across all channels</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Select value={selectedClientId} onValueChange={setSelectedClientId}>
            <SelectTrigger className="w-[200px]"><SelectValue placeholder="Select client" /></SelectTrigger>
            <SelectContent>
              {clients?.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button size="sm" onClick={() => { if (!selectedClientId) return; generatePlanMutation.mutate(selectedClientId, { onSuccess: () => toast.success("Plan generated"), onError: () => toast.error("Failed") }); }} disabled={!selectedClientId || generatePlanMutation.isPending}>
            <Calendar className="h-4 w-4 mr-1.5" /> Generate Plan
          </Button>
          <Button variant="outline" size="sm" onClick={handleRecompute} disabled={!selectedClientId || recomputeMutation.isPending}>
            <RefreshCw className={`mr-2 h-4 w-4 ${recomputeMutation.isPending ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>
      </div>

      {!selectedClientId ? (
        <Card className="hover-lift">
          <CardContent className="flex flex-col items-center justify-center py-20">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <Command className="h-8 w-8 text-primary" />
            </div>
            <p className="text-muted-foreground font-medium mb-2">Select a client to view the command center</p>
            <p className="text-xs text-muted-foreground">Choose a client above, then generate a weekly plan to get started</p>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-muted/50 border flex-wrap h-auto gap-1">
            <TabsTrigger value="overview" className="gap-1.5"><BarChart3 className="h-3.5 w-3.5" /> Overview</TabsTrigger>
            <TabsTrigger value="priorities" className="gap-1.5"><Target className="h-3.5 w-3.5" /> Priorities</TabsTrigger>
            <TabsTrigger value="weekly" className="gap-1.5"><Calendar className="h-3.5 w-3.5" /> Weekly</TabsTrigger>
            <TabsTrigger value="quickwins" className="gap-1.5"><Zap className="h-3.5 w-3.5" /> Quick Wins</TabsTrigger>
            <TabsTrigger value="crosschannel" className="gap-1.5"><Layers className="h-3.5 w-3.5" /> Cross-Channel</TabsTrigger>
            <TabsTrigger value="goals" className="gap-1.5"><TrendingUp className="h-3.5 w-3.5" /> Goals</TabsTrigger>
            <TabsTrigger value="execution" className="gap-1.5"><Play className="h-3.5 w-3.5" /> Execution</TabsTrigger>
          </TabsList>

          {/* Overview */}
          <TabsContent value="overview" className="space-y-6">
            {summaryLoading ? (
              <div className="grid gap-4 md:grid-cols-4">{[1,2,3,4].map(i => <Skeleton key={i} className="h-24 rounded-lg" />)}</div>
            ) : (
              <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
                {[
                  { label: "Total Priorities", value: summary?.totalPriorities || 0, sub: `${summary?.highPriorityCount || 0} high priority`, icon: Target, color: "border-l-primary" },
                  { label: "Quick Wins", value: summary?.quickWinsCount || 0, sub: "Low effort, high impact", icon: Zap, color: "border-l-amber-500" },
                  { label: "Near Page 1", value: summary?.nearPage1Count || 0, sub: "Positions 11-20", icon: TrendingUp, color: "border-l-emerald-500" },
                  { label: "Weekly Progress", value: `${summary?.weeklyTasksCompleted || 0}/${summary?.weeklyTasksDue || 0}`, sub: "", icon: Calendar, color: "border-l-analytics-primary", progress: summary?.weeklyTasksDue ? (summary.weeklyTasksCompleted / summary.weeklyTasksDue) * 100 : 0 },
                ].map((kpi) => (
                  <Card key={kpi.label} className={`hover-lift border-l-4 ${kpi.color}`}>
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-2">
                        <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">{kpi.label}</p>
                        <div className="h-8 w-8 rounded-lg bg-muted/50 flex items-center justify-center">
                          <kpi.icon className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                      <p className="text-3xl font-bold text-foreground">{kpi.value}</p>
                      {kpi.sub && <p className="text-xs text-muted-foreground mt-1">{kpi.sub}</p>}
                      {kpi.progress !== undefined && <Progress value={kpi.progress} className="mt-2 h-1.5" />}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
              {[
                { label: "Content to Repurpose", value: summary?.repurposeCount || 0 },
                { label: "Declining Assets", value: summary?.decliningAssetsCount || 0, destructive: true },
                { label: "GBP Issues", value: summary?.gbpIssuesCount || 0 },
                { label: "Ads Opportunities", value: summary?.adsOpportunitiesCount || 0 },
              ].map((m) => (
                <Card key={m.label} className="hover-lift">
                  <CardContent className="p-4">
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">{m.label}</p>
                    <p className={`text-2xl font-bold mt-1 ${m.destructive ? "text-destructive" : "text-foreground"}`}>{m.value}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Top Priorities */}
            <Card className="hover-lift">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Target className="h-4 w-4 text-primary" />
                  </div>
                  Top Priorities This Week
                </CardTitle>
                <CardDescription>Highest-scored actions across all channels</CardDescription>
              </CardHeader>
              <CardContent>
                {prioritiesLoading ? (
                  <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-16 rounded-lg" />)}</div>
                ) : (
                  <div className="space-y-2">
                    {priorities?.slice(0, 5).map((p: any) => (
                      <div key={p.id} className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-3 min-w-0">
                          <Badge variant="outline" className={`text-xs border shrink-0 ${MODULE_COLORS[p.priority_type] || ""}`}>{p.priority_type}</Badge>
                          <div className="min-w-0">
                            <p className="font-medium text-sm text-foreground truncate">{p.title}</p>
                            <p className="text-xs text-muted-foreground truncate">{p.recommended_action?.slice(0, 80)}...</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right hidden sm:block">
                            <p className="text-sm font-bold text-foreground">{p.priority_score}</p>
                            <p className="text-[10px] text-muted-foreground">Impact {p.impact_score} · Effort {p.effort_score}</p>
                          </div>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => updatePriorityMutation.mutate({ priorityId: p.id, status: "done" })}>
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {(!priorities || priorities.length === 0) && (
                      <div className="flex flex-col items-center py-8">
                        <p className="text-muted-foreground text-sm mb-3">No priorities yet</p>
                        <Button size="sm" onClick={handleRecompute} disabled={recomputeMutation.isPending}>
                          <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${recomputeMutation.isPending ? "animate-spin" : ""}`} /> Generate Priorities
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Priorities */}
          <TabsContent value="priorities" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-foreground">All Marketing Priorities</h2>
              <Button onClick={handleRecompute} disabled={recomputeMutation.isPending}>
                <RefreshCw className={`mr-2 h-4 w-4 ${recomputeMutation.isPending ? "animate-spin" : ""}`} /> Recompute All
              </Button>
            </div>
            {prioritiesLoading ? (
              <div className="space-y-2">{[1,2,3,4].map(i => <Skeleton key={i} className="h-20 rounded-lg" />)}</div>
            ) : (
              <div className="space-y-2">
                {priorities?.map((p: any) => (
                  <Card key={p.id} className="hover-lift">
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="flex flex-col items-center min-w-[50px] shrink-0">
                          <span className="text-2xl font-bold text-foreground">{p.priority_score}</span>
                          <span className="text-[10px] text-muted-foreground font-medium">score</span>
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <Badge variant="outline" className={`text-xs border ${MODULE_COLORS[p.priority_type] || ""}`}>{p.priority_type}</Badge>
                            <Badge variant="secondary" className="text-xs">{p.source_module}</Badge>
                          </div>
                          <p className="font-medium text-sm text-foreground truncate">{p.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">{p.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={() => updatePriorityMutation.mutate({ priorityId: p.id, status: "in_progress" })}><Play className="h-3.5 w-3.5" /></Button>
                        <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={() => updatePriorityMutation.mutate({ priorityId: p.id, status: "done" })}><CheckCircle className="h-3.5 w-3.5" /></Button>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => updatePriorityMutation.mutate({ priorityId: p.id, status: "dismissed" })}><MoreHorizontal className="h-3.5 w-3.5" /></Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {(!priorities || priorities.length === 0) && (
                  <Card className="hover-lift"><CardContent className="flex flex-col items-center py-12">
                    <p className="text-muted-foreground mb-3">No priorities yet</p>
                    <Button onClick={handleRecompute}><RefreshCw className="h-4 w-4 mr-1.5" /> Generate Priorities</Button>
                  </CardContent></Card>
                )}
              </div>
            )}
          </TabsContent>

          {/* Weekly */}
          <TabsContent value="weekly" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-foreground">Weekly Action Plan</h2>
              <Button onClick={() => { if (!selectedClientId) return; generatePlanMutation.mutate(selectedClientId, { onSuccess: () => toast.success("Plan generated"), onError: () => toast.error("Failed") }); }} disabled={generatePlanMutation.isPending}>
                <Calendar className="mr-2 h-4 w-4" /> Generate Plan
              </Button>
            </div>
            {weeklyPlans?.map((plan: any) => (
              <Card key={plan.id} className="hover-lift">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">Week of {plan.week_start}</CardTitle>
                      <CardDescription>{plan.summary}</CardDescription>
                    </div>
                    <Badge variant="outline">{plan.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground"><strong className="text-foreground">Top Goal:</strong> {plan.top_goal || "Complete priority tasks"}</p>
                </CardContent>
              </Card>
            ))}
            {(!weeklyPlans || weeklyPlans.length === 0) && (
              <Card className="hover-lift"><CardContent className="flex flex-col items-center py-12">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <p className="text-muted-foreground mb-3">No weekly plans yet</p>
                <Button onClick={() => { if (!selectedClientId) return; generatePlanMutation.mutate(selectedClientId, { onSuccess: () => toast.success("Plan generated") }); }} disabled={generatePlanMutation.isPending}>
                  <Calendar className="mr-2 h-4 w-4" /> Generate Plan
                </Button>
              </CardContent></Card>
            )}
          </TabsContent>

          {/* Quick Wins */}
          <TabsContent value="quickwins" className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-7 w-7 rounded-lg bg-amber-100 flex items-center justify-center dark:bg-amber-900/30">
                <Zap className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
              <h2 className="text-xl font-semibold text-foreground">Quick Wins</h2>
              <span className="text-sm text-muted-foreground">— Low effort, high impact</span>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {quickWins?.map((win: any) => (
                <Card key={win.id} className="hover-lift border-l-4 border-l-amber-500">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0">
                        <Badge variant="outline" className={`text-xs border ${MODULE_COLORS[win.priority_type] || ""}`}>{win.priority_type}</Badge>
                        <p className="mt-2 font-medium text-sm text-foreground">{win.title}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{win.recommended_action}</p>
                      </div>
                      <div className="text-right shrink-0 ml-3">
                        <p className="text-xl font-bold text-foreground">{win.priority_score}</p>
                        <p className="text-[10px] text-muted-foreground">Effort: {win.effort_score}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex justify-end">
                      <Button size="sm" onClick={() => updatePriorityMutation.mutate({ priorityId: win.id, status: "done" })}>Mark Done</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {(!quickWins || quickWins.length === 0) && (
                <Card className="col-span-2 hover-lift"><CardContent className="flex flex-col items-center py-12">
                  <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center mb-3">
                    <Zap className="h-6 w-6 text-amber-500" />
                  </div>
                  <p className="text-muted-foreground mb-3">No quick wins available</p>
                  <Button variant="outline" onClick={handleRecompute}><RefreshCw className="h-4 w-4 mr-1.5" /> Recompute Priorities</Button>
                </CardContent></Card>
              )}
            </div>
          </TabsContent>

          {/* Cross-Channel */}
          <TabsContent value="crosschannel" className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Layers className="h-4 w-4 text-primary" />
                </div>
                <h2 className="text-xl font-semibold text-foreground">Cross-Channel Recommendations</h2>
              </div>
              <Button onClick={() => { if (!selectedClientId) return; generateRecsMutation.mutate(selectedClientId, { onSuccess: (data) => toast.success(`${data.recommendations_generated} generated`), onError: () => toast.error("Failed") }); }} disabled={generateRecsMutation.isPending}>
                <Lightbulb className="mr-2 h-4 w-4" /> Generate
              </Button>
            </div>
            <div className="space-y-2">
              {recommendations?.map((rec: any) => (
                <Card key={rec.id} className="hover-lift">
                  <CardContent className="p-4 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Badge variant="outline" className={`text-xs border ${MODULE_COLORS[rec.source_module] || ""}`}>{rec.source_module}</Badge>
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        <Badge variant="outline" className={`text-xs border ${MODULE_COLORS[rec.target_module] || ""}`}>{rec.target_module}</Badge>
                      </div>
                      <p className="text-sm font-medium text-foreground">{rec.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{rec.description}</p>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <Button size="sm" variant="outline" onClick={() => updateRecMutation.mutate({ recId: rec.id, status: "approved" })}>Approve</Button>
                      <Button size="sm" variant="ghost" onClick={() => updateRecMutation.mutate({ recId: rec.id, status: "dismissed" })}>Dismiss</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {(!recommendations || recommendations.length === 0) && (
                <Card className="hover-lift"><CardContent className="flex flex-col items-center py-12">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                    <Layers className="h-6 w-6 text-primary" />
                  </div>
                  <p className="text-muted-foreground mb-3">No cross-channel recommendations yet</p>
                  <Button onClick={() => generateRecsMutation.mutate(selectedClientId)} disabled={generateRecsMutation.isPending}>
                    <Lightbulb className="mr-2 h-4 w-4" /> Generate Recommendations
                  </Button>
                </CardContent></Card>
              )}
            </div>
          </TabsContent>

          {/* Goals */}
          <TabsContent value="goals" className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
              </div>
              Marketing Goals
            </h2>
            {goals?.length ? goals.map((g: any) => (
              <Card key={g.id} className="hover-lift">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold text-sm text-foreground">{g.title}</p>
                    <Badge variant="outline" className="text-xs">{g.status}</Badge>
                  </div>
                  {g.target_value && (
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Current: {g.current_value ?? 0}</span>
                        <span>Target: {g.target_value}</span>
                      </div>
                      <Progress value={g.target_value ? ((g.current_value ?? 0) / g.target_value) * 100 : 0} className="h-1.5" />
                    </div>
                  )}
                </CardContent>
              </Card>
            )) : (
              <Card className="hover-lift"><CardContent className="flex flex-col items-center py-12">
                <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-3">
                  <TrendingUp className="h-6 w-6 text-emerald-500" />
                </div>
                <p className="text-muted-foreground">No marketing goals configured yet</p>
              </CardContent></Card>
            )}
          </TabsContent>

          {/* Execution */}
          <TabsContent value="execution" className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <Play className="h-4 w-4 text-primary" />
              </div>
              Execution Tracking
            </h2>
            <Card className="hover-lift">
              <CardContent className="flex flex-col items-center py-12">
                <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center mb-3">
                  <Play className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground text-sm mb-1">Execution tracking coming soon</p>
                <p className="text-xs text-muted-foreground">Track task completion rates and team performance</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </PageTransition>
  );
}
