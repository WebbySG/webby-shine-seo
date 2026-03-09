import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  useClients,
  useCommandCenterSummary,
  useMarketingPriorities,
  useCrossChannelRecommendations,
  useWeeklyActionPlans,
  useMarketingGoals,
  useQuickWins,
  useRecomputePriorities,
  useGenerateCrossChannelRecs,
  useGenerateWeeklyPlan,
  useUpdatePriorityStatus,
  useUpdateRecommendationStatus,
  useUpdateWeeklyItemStatus,
} from "@/hooks/use-api";
import {
  Target,
  Zap,
  TrendingUp,
  Calendar,
  ArrowRight,
  RefreshCw,
  CheckCircle,
  Clock,
  AlertTriangle,
  Lightbulb,
  BarChart3,
  Layers,
  Play,
  Pause,
  MoreHorizontal,
} from "lucide-react";
import { toast } from "sonner";

export default function CommandCenter() {
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const { data: clients } = useClients();
  const { data: summary, isLoading: summaryLoading } = useCommandCenterSummary(selectedClientId);
  const { data: priorities } = useMarketingPriorities(selectedClientId);
  const { data: recommendations } = useCrossChannelRecommendations(selectedClientId);
  const { data: weeklyPlans } = useWeeklyActionPlans(selectedClientId);
  const { data: goals } = useMarketingGoals(selectedClientId);
  const { data: quickWins } = useQuickWins(selectedClientId);

  const recomputeMutation = useRecomputePriorities();
  const generateRecsMutation = useGenerateCrossChannelRecs();
  const generatePlanMutation = useGenerateWeeklyPlan();
  const updatePriorityMutation = useUpdatePriorityStatus(selectedClientId);
  const updateRecMutation = useUpdateRecommendationStatus(selectedClientId);
  const updateItemMutation = useUpdateWeeklyItemStatus(selectedClientId);

  const handleRecompute = () => {
    if (!selectedClientId) return;
    recomputeMutation.mutate(selectedClientId, {
      onSuccess: (data) => toast.success(`Generated ${data.priorities_generated} priorities`),
      onError: () => toast.error("Failed to recompute priorities"),
    });
  };

  const handleGenerateRecs = () => {
    if (!selectedClientId) return;
    generateRecsMutation.mutate(selectedClientId, {
      onSuccess: (data) => toast.success(`Generated ${data.recommendations_generated} recommendations`),
      onError: () => toast.error("Failed to generate recommendations"),
    });
  };

  const handleGeneratePlan = () => {
    if (!selectedClientId) return;
    generatePlanMutation.mutate(selectedClientId, {
      onSuccess: () => toast.success("Weekly plan generated"),
      onError: () => toast.error("Failed to generate plan"),
    });
  };

  const priorityTypeColors: Record<string, string> = {
    seo: "bg-blue-500/10 text-blue-700 border-blue-200",
    content: "bg-purple-500/10 text-purple-700 border-purple-200",
    technical: "bg-red-500/10 text-red-700 border-red-200",
    internal_linking: "bg-cyan-500/10 text-cyan-700 border-cyan-200",
    gbp: "bg-green-500/10 text-green-700 border-green-200",
    paid_ads: "bg-orange-500/10 text-orange-700 border-orange-200",
    analytics: "bg-indigo-500/10 text-indigo-700 border-indigo-200",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Command Center</h1>
          <p className="text-muted-foreground">
            Unified marketing priorities across all channels
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedClientId} onValueChange={setSelectedClientId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select client" />
            </SelectTrigger>
            <SelectContent>
              {clients?.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={handleRecompute} disabled={!selectedClientId}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {!selectedClientId ? (
        <Card>
          <CardContent className="flex h-64 items-center justify-center">
            <p className="text-muted-foreground">Select a client to view the command center</p>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="priorities">Priorities</TabsTrigger>
            <TabsTrigger value="weekly">Weekly Plan</TabsTrigger>
            <TabsTrigger value="quickwins">Quick Wins</TabsTrigger>
            <TabsTrigger value="crosschannel">Cross-Channel</TabsTrigger>
            <TabsTrigger value="goals">Goals</TabsTrigger>
            <TabsTrigger value="execution">Execution</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Priorities</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{summary?.totalPriorities || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {summary?.highPriorityCount || 0} high priority
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Quick Wins</CardTitle>
                  <Zap className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{summary?.quickWinsCount || 0}</div>
                  <p className="text-xs text-muted-foreground">Low effort, high impact</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Near Page 1</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{summary?.nearPage1Count || 0}</div>
                  <p className="text-xs text-muted-foreground">Keywords positions 11-20</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Weekly Progress</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {summary?.weeklyTasksCompleted || 0}/{summary?.weeklyTasksDue || 0}
                  </div>
                  <Progress
                    value={
                      summary?.weeklyTasksDue
                        ? (summary.weeklyTasksCompleted / summary.weeklyTasksDue) * 100
                        : 0
                    }
                    className="mt-2"
                  />
                </CardContent>
              </Card>
            </div>

            {/* Secondary Metrics */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card className="col-span-1">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Content to Repurpose</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{summary?.repurposeCount || 0}</div>
                </CardContent>
              </Card>
              <Card className="col-span-1">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Declining Assets</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-destructive">
                    {summary?.decliningAssetsCount || 0}
                  </div>
                </CardContent>
              </Card>
              <Card className="col-span-1">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">GBP Issues</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{summary?.gbpIssuesCount || 0}</div>
                </CardContent>
              </Card>
              <Card className="col-span-1">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Ads Opportunities</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{summary?.adsOpportunitiesCount || 0}</div>
                </CardContent>
              </Card>
            </div>

            {/* Top Priorities Preview */}
            <Card>
              <CardHeader>
                <CardTitle>Top Priorities This Week</CardTitle>
                <CardDescription>Highest-scored actions across all channels</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {priorities?.slice(0, 5).map((priority: any) => (
                    <div
                      key={priority.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex items-center gap-3">
                        <Badge
                          variant="outline"
                          className={priorityTypeColors[priority.priority_type] || ""}
                        >
                          {priority.priority_type}
                        </Badge>
                        <div>
                          <p className="font-medium">{priority.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {priority.recommended_action?.slice(0, 80)}...
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-medium">Score: {priority.priority_score}</p>
                          <p className="text-xs text-muted-foreground">
                            Impact: {priority.impact_score} | Effort: {priority.effort_score}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            updatePriorityMutation.mutate({ priorityId: priority.id, status: "done" })
                          }
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {(!priorities || priorities.length === 0) && (
                    <p className="text-center text-muted-foreground py-8">
                      No priorities yet. Click Refresh to generate.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Priorities Tab */}
          <TabsContent value="priorities" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">All Marketing Priorities</h2>
              <Button onClick={handleRecompute} disabled={recomputeMutation.isPending}>
                <RefreshCw className={`mr-2 h-4 w-4 ${recomputeMutation.isPending ? "animate-spin" : ""}`} />
                Recompute All
              </Button>
            </div>
            <div className="space-y-3">
              {priorities?.map((priority: any) => (
                <Card key={priority.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col items-center">
                        <span className="text-2xl font-bold">{priority.priority_score}</span>
                        <span className="text-xs text-muted-foreground">score</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={priorityTypeColors[priority.priority_type] || ""}
                          >
                            {priority.priority_type}
                          </Badge>
                          <Badge variant="secondary">{priority.source_module}</Badge>
                        </div>
                        <p className="mt-1 font-medium">{priority.title}</p>
                        <p className="text-sm text-muted-foreground">{priority.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          updatePriorityMutation.mutate({ priorityId: priority.id, status: "in_progress" })
                        }
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          updatePriorityMutation.mutate({ priorityId: priority.id, status: "done" })
                        }
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          updatePriorityMutation.mutate({ priorityId: priority.id, status: "dismissed" })
                        }
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Weekly Plan Tab */}
          <TabsContent value="weekly" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Weekly Action Plan</h2>
              <Button onClick={handleGeneratePlan} disabled={generatePlanMutation.isPending}>
                <Calendar className="mr-2 h-4 w-4" />
                Generate Plan
              </Button>
            </div>
            {weeklyPlans?.map((plan: any) => (
              <Card key={plan.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Week of {plan.week_start}</CardTitle>
                      <CardDescription>{plan.summary}</CardDescription>
                    </div>
                    <Badge>{plan.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    <strong>Top Goal:</strong> {plan.top_goal || "Complete priority tasks"}
                  </p>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Quick Wins Tab */}
          <TabsContent value="quickwins" className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="h-5 w-5 text-amber-500" />
              <h2 className="text-xl font-semibold">Quick Wins</h2>
              <span className="text-muted-foreground">— Low effort, high impact actions</span>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {quickWins?.map((win: any) => (
                <Card key={win.id} className="border-l-4 border-l-amber-500">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <Badge
                          variant="outline"
                          className={priorityTypeColors[win.priority_type] || ""}
                        >
                          {win.priority_type}
                        </Badge>
                        <p className="mt-2 font-medium">{win.title}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {win.recommended_action}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">{win.priority_score}</p>
                        <p className="text-xs text-muted-foreground">
                          Effort: {win.effort_score}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 flex justify-end">
                      <Button
                        size="sm"
                        onClick={() =>
                          updatePriorityMutation.mutate({ priorityId: win.id, status: "done" })
                        }
                      >
                        Mark Done
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {(!quickWins || quickWins.length === 0) && (
                <p className="col-span-2 text-center text-muted-foreground py-8">
                  No quick wins available. Generate priorities first.
                </p>
              )}
            </div>
          </TabsContent>

          {/* Cross-Channel Tab */}
          <TabsContent value="crosschannel" className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Layers className="h-5 w-5" />
                <h2 className="text-xl font-semibold">Cross-Channel Recommendations</h2>
              </div>
              <Button onClick={handleGenerateRecs} disabled={generateRecsMutation.isPending}>
                <Lightbulb className="mr-2 h-4 w-4" />
                Generate Recommendations
              </Button>
            </div>
            <div className="space-y-3">
              {recommendations?.map((rec: any) => (
                <Card key={rec.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-4">
                      <ArrowRight className="h-8 w-8 text-muted-foreground" />
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant={rec.priority === "high" ? "destructive" : "secondary"}>
                            {rec.priority}
                          </Badge>
                          <Badge variant="outline">{rec.target_channel}</Badge>
                        </div>
                        <p className="mt-1 font-medium">{rec.title}</p>
                        <p className="text-sm text-muted-foreground">{rec.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          updateRecMutation.mutate({ recId: rec.id, status: "approved" })
                        }
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        onClick={() =>
                          updateRecMutation.mutate({ recId: rec.id, status: "done" })
                        }
                      >
                        Execute
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {(!recommendations || recommendations.length === 0) && (
                <p className="text-center text-muted-foreground py-8">
                  No recommendations yet. Click Generate to analyze cross-channel opportunities.
                </p>
              )}
            </div>
          </TabsContent>

          {/* Goals Tab */}
          <TabsContent value="goals" className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Target className="h-5 w-5" />
              <h2 className="text-xl font-semibold">Marketing Goals</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {goals?.map((goal: any) => (
                <Card key={goal.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{goal.goal_name}</CardTitle>
                      <Badge variant={goal.status === "active" ? "default" : "secondary"}>
                        {goal.status}
                      </Badge>
                    </div>
                    <CardDescription>Type: {goal.goal_type}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Target:</span>
                        <span className="font-bold">{goal.target_value}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Timeframe:</span>
                        <span>{goal.timeframe || "Ongoing"}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {(!goals || goals.length === 0) && (
                <Card className="col-span-2">
                  <CardContent className="flex items-center justify-center py-12">
                    <p className="text-muted-foreground">No marketing goals set yet.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Execution Board Tab */}
          <TabsContent value="execution" className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="h-5 w-5" />
              <h2 className="text-xl font-semibold">Execution Board</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {/* To Do Column */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    To Do
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {priorities
                    ?.filter((p: any) => p.status === "open")
                    .slice(0, 5)
                    .map((p: any) => (
                      <div
                        key={p.id}
                        className="rounded-lg border p-2 text-sm cursor-pointer hover:bg-accent"
                        onClick={() =>
                          updatePriorityMutation.mutate({ priorityId: p.id, status: "in_progress" })
                        }
                      >
                        <Badge variant="outline" className="mb-1 text-xs">
                          {p.priority_type}
                        </Badge>
                        <p className="font-medium">{p.title}</p>
                      </div>
                    ))}
                </CardContent>
              </Card>

              {/* In Progress Column */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <Play className="h-4 w-4" />
                    In Progress
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {priorities
                    ?.filter((p: any) => p.status === "in_progress")
                    .map((p: any) => (
                      <div
                        key={p.id}
                        className="rounded-lg border border-primary/50 bg-primary/5 p-2 text-sm cursor-pointer hover:bg-primary/10"
                        onClick={() =>
                          updatePriorityMutation.mutate({ priorityId: p.id, status: "done" })
                        }
                      >
                        <Badge variant="outline" className="mb-1 text-xs">
                          {p.priority_type}
                        </Badge>
                        <p className="font-medium">{p.title}</p>
                      </div>
                    ))}
                </CardContent>
              </Card>

              {/* Done Column */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Done
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {priorities
                    ?.filter((p: any) => p.status === "done")
                    .slice(0, 5)
                    .map((p: any) => (
                      <div
                        key={p.id}
                        className="rounded-lg border bg-muted/50 p-2 text-sm opacity-60"
                      >
                        <Badge variant="outline" className="mb-1 text-xs">
                          {p.priority_type}
                        </Badge>
                        <p className="font-medium line-through">{p.title}</p>
                      </div>
                    ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
