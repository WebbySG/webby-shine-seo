import { useState } from "react";
import { PageTransition, StaggerContainer, StaggerItem } from "@/components/motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  DollarSign, Target, FileText, Lightbulb, BarChart3, Settings, RefreshCw,
  ThumbsUp, Plus, TrendingUp, Zap, MousePointer
} from "lucide-react";
import {
  useClients, useAdsCampaigns, useAdsRecommendations, useAdsCopy, useAdsInsights,
  useAdsPerformance, useGenerateAdsRecommendations, useGenerateAdCopy,
  useApproveAdCopy, useUpdateAdsRecommendation, useSyncAds
} from "@/hooks/use-api";

const PRIORITY_COLORS: Record<string, string> = {
  high: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400",
  medium: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400",
  low: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400",
};
const STATUS_COLORS: Record<string, string> = {
  draft: "bg-muted text-muted-foreground", review: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  approved: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  paused: "bg-muted text-muted-foreground", failed: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  open: "bg-muted text-muted-foreground",
};

function AdCopyGenerateModal({ clientId }: { clientId: string }) {
  const [open, setOpen] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [finalUrl, setFinalUrl] = useState("");
  const gen = useGenerateAdCopy(clientId);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Generate Ad Copy</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Generate Ad Copy</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Target Keyword</Label><Input value={keyword} onChange={e => setKeyword(e.target.value)} placeholder="e.g. plumbing services singapore" /></div>
          <div><Label>Final URL (optional)</Label><Input value={finalUrl} onChange={e => setFinalUrl(e.target.value)} placeholder="https://..." /></div>
          <Button onClick={() => gen.mutate({ clientId, targetKeyword: keyword, finalUrl: finalUrl || undefined }, { onSuccess: () => setOpen(false) })} disabled={!keyword || gen.isPending} className="w-full">
            {gen.isPending ? "Generating..." : "Generate"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function GoogleAds() {
  const [selectedClient, setSelectedClient] = useState("");
  const { data: clients } = useClients();
  const clientId = selectedClient || clients?.[0]?.id || "";

  const { data: campaigns } = useAdsCampaigns(clientId);
  const { data: recommendations } = useAdsRecommendations(clientId);
  const { data: copyDrafts } = useAdsCopy(clientId);
  const { data: insights } = useAdsInsights(clientId);
  const { data: performance } = useAdsPerformance(clientId);

  const genRecs = useGenerateAdsRecommendations();
  const approveCopy = useApproveAdCopy(clientId);
  const updateRec = useUpdateAdsRecommendation(clientId);
  const syncAds = useSyncAds();

  const summary = performance?.summary;

  const kpiCards = [
    { label: "Impressions", value: (summary?.total_impressions ?? 0).toLocaleString(), color: "border-l-ads-primary" },
    { label: "Clicks", value: summary?.total_clicks ?? 0, color: "border-l-ads-primary" },
    { label: "CTR", value: `${((summary?.avg_ctr ?? 0) * 100).toFixed(1)}%`, color: "border-l-emerald-500" },
    { label: "Avg CPC", value: `$${(summary?.avg_cpc ?? 0).toFixed(2)}`, color: "border-l-amber-500" },
    { label: "Spend", value: `$${(summary?.total_cost ?? 0).toFixed(0)}`, color: "border-l-red-500" },
    { label: "Conversions", value: summary?.total_conversions ?? 0, color: "border-l-emerald-500" },
    { label: "Cost/Conv", value: `$${(summary?.cost_per_conversion ?? 0).toFixed(2)}`, color: "border-l-primary" },
  ];

  return (
    <PageTransition className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Google Ads</h1>
          <p className="text-muted-foreground mt-1.5">AI-assisted campaign recommendations and management</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={clientId} onValueChange={setSelectedClient}>
            <SelectTrigger className="w-[200px]"><SelectValue placeholder="Select client" /></SelectTrigger>
            <SelectContent>{clients?.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => syncAds.mutate(clientId)} disabled={syncAds.isPending}>
            <RefreshCw className={`h-4 w-4 mr-1.5 ${syncAds.isPending ? "animate-spin" : ""}`} /> Sync
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {kpiCards.map((kpi) => (
          <StaggerItem key={kpi.label}>
          <Card className={`hover-lift border-l-4 ${kpi.color}`}>
            <CardContent className="p-4">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">{kpi.label}</p>
              <p className="text-xl font-bold text-foreground mt-1">{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="recommendations" className="space-y-6">
        <TabsList className="bg-muted/50 border flex-wrap h-auto gap-1">
          <TabsTrigger value="recommendations" className="gap-1.5"><Lightbulb className="h-3.5 w-3.5" /> Recommendations</TabsTrigger>
          <TabsTrigger value="campaigns" className="gap-1.5"><Target className="h-3.5 w-3.5" /> Campaigns</TabsTrigger>
          <TabsTrigger value="copy" className="gap-1.5"><FileText className="h-3.5 w-3.5" /> Ad Copy</TabsTrigger>
          <TabsTrigger value="insights" className="gap-1.5"><Zap className="h-3.5 w-3.5" /> Insights</TabsTrigger>
          <TabsTrigger value="performance" className="gap-1.5"><BarChart3 className="h-3.5 w-3.5" /> Performance</TabsTrigger>
          <TabsTrigger value="settings" className="gap-1.5"><Settings className="h-3.5 w-3.5" /> Settings</TabsTrigger>
        </TabsList>

        {/* RECOMMENDATIONS */}
        <TabsContent value="recommendations" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-foreground">Campaign Recommendations</h3>
            <Button variant="outline" size="sm" onClick={() => genRecs.mutate(clientId)} disabled={genRecs.isPending}>
              <RefreshCw className={`h-4 w-4 mr-1.5 ${genRecs.isPending ? "animate-spin" : ""}`} /> Generate
            </Button>
          </div>
          {recommendations?.length ? (
            <div className="space-y-2">
              {recommendations.map((r: any) => (
                <Card key={r.id} className={`hover-lift border-l-4 ${r.priority === "high" ? "border-l-red-500" : r.priority === "medium" ? "border-l-amber-500" : "border-l-blue-500"}`}>
                  <CardContent className="p-4 flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1.5">
                        <Badge className={`${PRIORITY_COLORS[r.priority]} border-0 text-xs`}>{r.priority}</Badge>
                        <Badge variant="outline" className="text-xs">{r.recommendation_type}</Badge>
                        {r.campaign_name && <span className="text-xs text-muted-foreground">{r.campaign_name}</span>}
                      </div>
                      <p className="text-sm font-medium text-foreground">{r.recommended_action}</p>
                      {r.keyword_text && <p className="text-xs text-muted-foreground mt-1">Keyword: {r.keyword_text}</p>}
                      {r.recommended_budget && <p className="text-xs text-muted-foreground">Budget: ${r.recommended_budget}/day</p>}
                    </div>
                    <Button size="sm" variant="outline" className="shrink-0" onClick={() => updateRec.mutate({ recId: r.id, status: "approved" })}>
                      <ThumbsUp className="h-3 w-3 mr-1" /> Approve
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="hover-lift"><CardContent className="py-12 text-center text-muted-foreground">No recommendations yet. Click Generate.</CardContent></Card>
          )}
        </TabsContent>

        {/* CAMPAIGNS */}
        <TabsContent value="campaigns">
          {campaigns?.length ? (
            <Card className="hover-lift">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Name</TableHead><TableHead>Type</TableHead><TableHead>Status</TableHead>
                      <TableHead>Budget/Day</TableHead><TableHead>Locations</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {campaigns.map((c: any) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium text-foreground">{c.name}</TableCell>
                        <TableCell><Badge variant="outline" className="text-xs">{c.campaign_type}</Badge></TableCell>
                        <TableCell><Badge className={`${STATUS_COLORS[c.status] || "bg-muted text-muted-foreground"} border-0 text-xs`}>{c.status}</Badge></TableCell>
                        <TableCell className="font-mono text-sm">${c.budget_daily || "—"}</TableCell>
                        <TableCell className="text-muted-foreground text-xs">{Array.isArray(c.location_targets) ? c.location_targets.join(", ") : "Singapore"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <Card className="hover-lift"><CardContent className="py-12 text-center text-muted-foreground">No campaigns yet.</CardContent></Card>
          )}
        </TabsContent>

        {/* AD COPY */}
        <TabsContent value="copy" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-foreground">Ad Copy Drafts</h3>
            <AdCopyGenerateModal clientId={clientId} />
          </div>
          {copyDrafts?.length ? (
            <div className="space-y-3">
              {copyDrafts.map((d: any) => (
                <Card key={d.id} className="hover-lift">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs bg-ads-background text-ads-primary border-ads-border">{d.target_keyword}</Badge>
                        <Badge className={`${STATUS_COLORS[d.status] || "bg-muted text-muted-foreground"} border-0 text-xs`}>{d.status}</Badge>
                      </div>
                      {d.status === "draft" && (
                        <Button size="sm" onClick={() => approveCopy.mutate(d.id)}><ThumbsUp className="h-3 w-3 mr-1" /> Approve</Button>
                      )}
                    </div>
                    <div className="bg-muted/30 rounded-lg p-4 space-y-1.5 border border-border/30">
                      <p className="text-sm font-semibold text-primary">{d.headline_1} | {d.headline_2} | {d.headline_3}</p>
                      <p className="text-xs font-mono text-muted-foreground">{d.final_url}/{d.path_1}/{d.path_2}</p>
                      <p className="text-sm text-foreground">{d.description_1}</p>
                      <p className="text-sm text-foreground">{d.description_2}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="hover-lift"><CardContent className="py-12 text-center text-muted-foreground">No ad copy drafts yet.</CardContent></Card>
          )}
        </TabsContent>

        {/* INSIGHTS */}
        <TabsContent value="insights" className="space-y-3">
          {insights?.length ? insights.map((i: any) => (
            <Card key={i.id} className={`hover-lift border-l-4 ${i.priority === "high" ? "border-l-red-500" : i.priority === "medium" ? "border-l-amber-500" : "border-l-blue-500"}`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <Badge className={`${PRIORITY_COLORS[i.priority]} border-0 text-xs`}>{i.priority}</Badge>
                  <Badge variant="outline" className="text-xs">{i.insight_type.replace(/_/g, " ")}</Badge>
                </div>
                <p className="text-sm font-semibold text-foreground">{i.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{i.description}</p>
                {i.recommended_action && <p className="text-xs text-primary mt-1.5 font-medium">→ {i.recommended_action}</p>}
              </CardContent>
            </Card>
          )) : (
            <Card className="hover-lift"><CardContent className="py-12 text-center text-muted-foreground">No ads insights yet.</CardContent></Card>
          )}
        </TabsContent>

        {/* PERFORMANCE */}
        <TabsContent value="performance">
          {performance?.campaigns?.length ? (
            <Card className="hover-lift">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Campaign</TableHead><TableHead className="text-center">Impressions</TableHead><TableHead className="text-center">Clicks</TableHead>
                      <TableHead className="text-center">CTR</TableHead><TableHead className="text-center">CPC</TableHead><TableHead className="text-center">Cost</TableHead><TableHead className="text-center">Conv</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {performance.campaigns.map((c: any) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium text-foreground">{c.campaign_name}</TableCell>
                        <TableCell className="text-center font-mono text-sm">{c.impressions}</TableCell>
                        <TableCell className="text-center font-mono text-sm">{c.clicks}</TableCell>
                        <TableCell className="text-center font-mono text-sm">{(c.ctr * 100).toFixed(1)}%</TableCell>
                        <TableCell className="text-center font-mono text-sm">${Number(c.avg_cpc).toFixed(2)}</TableCell>
                        <TableCell className="text-center font-mono text-sm">${Number(c.cost).toFixed(2)}</TableCell>
                        <TableCell className="text-center font-mono text-sm">{c.conversions}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <Card className="hover-lift"><CardContent className="py-12 text-center text-muted-foreground">No performance data yet.</CardContent></Card>
          )}
        </TabsContent>

        {/* SETTINGS */}
        <TabsContent value="settings">
          <Card className="hover-lift">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-ads-background flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-ads-primary" />
                </div>
                <div>
                  <CardTitle>Google Ads Connection</CardTitle>
                  <CardDescription>Configure via backend environment variables</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Configure GOOGLE_ADS_CLIENT_ID and GOOGLE_ADS_CLIENT_SECRET in your backend .env file.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
