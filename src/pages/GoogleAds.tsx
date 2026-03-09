import { useState } from "react";
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
  ThumbsUp, Plus, Search, TrendingUp, Zap, MousePointer
} from "lucide-react";
import {
  useClients, useAdsCampaigns, useAdsRecommendations, useAdsCopy, useAdsInsights,
  useAdsPerformance, useGenerateAdsRecommendations, useGenerateAdCopy,
  useApproveAdCopy, useUpdateAdsRecommendation, useSyncAds
} from "@/hooks/use-api";

const priorityColor = (p: string): any => p === "high" ? "destructive" : p === "medium" ? "default" : "secondary";
const statusColor = (s: string): any => {
  const m: Record<string, string> = { draft: "secondary", review: "default", approved: "default", active: "default", paused: "outline", failed: "destructive", open: "secondary" };
  return m[s] || "secondary";
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Google Ads</h1>
          <p className="text-muted-foreground">AI-assisted campaign recommendations and management</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={clientId} onValueChange={setSelectedClient}>
            <SelectTrigger className="w-[200px]"><SelectValue placeholder="Select client" /></SelectTrigger>
            <SelectContent>{clients?.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => syncAds.mutate(clientId)} disabled={syncAds.isPending}>
            <RefreshCw className={`h-4 w-4 mr-1 ${syncAds.isPending ? "animate-spin" : ""}`} /> Sync
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <Card><CardHeader className="pb-1"><CardDescription className="text-xs">Impressions</CardDescription></CardHeader><CardContent><div className="text-xl font-bold text-foreground">{summary?.total_impressions ?? 0}</div></CardContent></Card>
        <Card><CardHeader className="pb-1"><CardDescription className="text-xs">Clicks</CardDescription></CardHeader><CardContent><div className="text-xl font-bold text-foreground">{summary?.total_clicks ?? 0}</div></CardContent></Card>
        <Card><CardHeader className="pb-1"><CardDescription className="text-xs">CTR</CardDescription></CardHeader><CardContent><div className="text-xl font-bold text-foreground">{((summary?.avg_ctr ?? 0) * 100).toFixed(1)}%</div></CardContent></Card>
        <Card><CardHeader className="pb-1"><CardDescription className="text-xs">Avg CPC</CardDescription></CardHeader><CardContent><div className="text-xl font-bold text-foreground">${(summary?.avg_cpc ?? 0).toFixed(2)}</div></CardContent></Card>
        <Card><CardHeader className="pb-1"><CardDescription className="text-xs">Spend</CardDescription></CardHeader><CardContent><div className="text-xl font-bold text-foreground">${(summary?.total_cost ?? 0).toFixed(2)}</div></CardContent></Card>
        <Card><CardHeader className="pb-1"><CardDescription className="text-xs">Conversions</CardDescription></CardHeader><CardContent><div className="text-xl font-bold text-foreground">{summary?.total_conversions ?? 0}</div></CardContent></Card>
        <Card><CardHeader className="pb-1"><CardDescription className="text-xs">Cost/Conv</CardDescription></CardHeader><CardContent><div className="text-xl font-bold text-foreground">${(summary?.cost_per_conversion ?? 0).toFixed(2)}</div></CardContent></Card>
      </div>

      <Tabs defaultValue="recommendations" className="space-y-4">
        <TabsList className="flex-wrap">
          <TabsTrigger value="recommendations"><Lightbulb className="h-4 w-4 mr-1" /> Recommendations</TabsTrigger>
          <TabsTrigger value="campaigns"><Target className="h-4 w-4 mr-1" /> Campaigns</TabsTrigger>
          <TabsTrigger value="copy"><FileText className="h-4 w-4 mr-1" /> Ad Copy</TabsTrigger>
          <TabsTrigger value="insights"><Zap className="h-4 w-4 mr-1" /> Insights</TabsTrigger>
          <TabsTrigger value="performance"><BarChart3 className="h-4 w-4 mr-1" /> Performance</TabsTrigger>
          <TabsTrigger value="settings"><Settings className="h-4 w-4 mr-1" /> Settings</TabsTrigger>
        </TabsList>

        {/* RECOMMENDATIONS */}
        <TabsContent value="recommendations" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-foreground">Campaign Recommendations</h3>
            <Button variant="outline" size="sm" onClick={() => genRecs.mutate(clientId)} disabled={genRecs.isPending}>
              <RefreshCw className={`h-4 w-4 mr-1 ${genRecs.isPending ? "animate-spin" : ""}`} /> Generate
            </Button>
          </div>
          {recommendations?.length ? (
            <div className="space-y-3">
              {recommendations.map((r: any) => (
                <Card key={r.id}>
                  <CardContent className="py-3 flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={priorityColor(r.priority)}>{r.priority}</Badge>
                        <Badge variant="outline">{r.recommendation_type}</Badge>
                        {r.campaign_name && <span className="text-xs text-muted-foreground">{r.campaign_name}</span>}
                      </div>
                      <p className="text-sm text-foreground">{r.recommended_action}</p>
                      {r.keyword_text && <p className="text-xs text-muted-foreground mt-1">Keyword: {r.keyword_text}</p>}
                      {r.recommended_budget && <p className="text-xs text-muted-foreground">Budget: ${r.recommended_budget}/day</p>}
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => updateRec.mutate({ recId: r.id, status: "approved" })}>
                        <ThumbsUp className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No recommendations yet. Click Generate to create from your SEO data.</CardContent></Card>
          )}
        </TabsContent>

        {/* CAMPAIGNS */}
        <TabsContent value="campaigns" className="space-y-4">
          {campaigns?.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead><TableHead>Type</TableHead><TableHead>Status</TableHead>
                  <TableHead>Budget/Day</TableHead><TableHead>Locations</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((c: any) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium text-foreground">{c.name}</TableCell>
                    <TableCell><Badge variant="outline">{c.campaign_type}</Badge></TableCell>
                    <TableCell><Badge variant={statusColor(c.status)}>{c.status}</Badge></TableCell>
                    <TableCell>${c.budget_daily || "—"}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">{Array.isArray(c.location_targets) ? c.location_targets.join(", ") : "Singapore"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No campaigns yet. Approve recommendations to create campaigns.</CardContent></Card>
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
                <Card key={d.id}>
                  <CardContent className="py-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{d.target_keyword}</Badge>
                        <Badge variant={statusColor(d.status)}>{d.status}</Badge>
                      </div>
                      {d.status === "draft" && (
                        <Button size="sm" onClick={() => approveCopy.mutate(d.id)}><ThumbsUp className="h-3 w-3 mr-1" /> Approve</Button>
                      )}
                    </div>
                    <div className="bg-muted/50 rounded-md p-3 space-y-1">
                      <p className="text-sm font-medium text-primary">{d.headline_1} | {d.headline_2} | {d.headline_3}</p>
                      <p className="text-xs text-muted-foreground">{d.final_url}/{d.path_1}/{d.path_2}</p>
                      <p className="text-sm text-foreground">{d.description_1}</p>
                      <p className="text-sm text-foreground">{d.description_2}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No ad copy drafts yet.</CardContent></Card>
          )}
        </TabsContent>

        {/* INSIGHTS */}
        <TabsContent value="insights" className="space-y-4">
          {insights?.length ? insights.map((i: any) => (
            <Card key={i.id}>
              <CardContent className="py-3">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant={priorityColor(i.priority)}>{i.priority}</Badge>
                  <Badge variant="outline">{i.insight_type.replace(/_/g, " ")}</Badge>
                </div>
                <p className="text-sm font-medium text-foreground">{i.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{i.description}</p>
                {i.recommended_action && <p className="text-xs text-foreground mt-1">→ {i.recommended_action}</p>}
              </CardContent>
            </Card>
          )) : (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No ads insights yet. Sync your account to generate.</CardContent></Card>
          )}
        </TabsContent>

        {/* PERFORMANCE */}
        <TabsContent value="performance" className="space-y-4">
          {performance?.campaigns?.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign</TableHead><TableHead>Impressions</TableHead><TableHead>Clicks</TableHead>
                  <TableHead>CTR</TableHead><TableHead>CPC</TableHead><TableHead>Cost</TableHead><TableHead>Conv</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {performance.campaigns.map((c: any) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium text-foreground">{c.campaign_name}</TableCell>
                    <TableCell>{c.impressions}</TableCell>
                    <TableCell>{c.clicks}</TableCell>
                    <TableCell>{(c.ctr * 100).toFixed(1)}%</TableCell>
                    <TableCell>${Number(c.avg_cpc).toFixed(2)}</TableCell>
                    <TableCell>${Number(c.cost).toFixed(2)}</TableCell>
                    <TableCell>{c.conversions}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No performance data yet.</CardContent></Card>
          )}
        </TabsContent>

        {/* SETTINGS */}
        <TabsContent value="settings">
          <Card>
            <CardHeader><CardTitle>Google Ads Connection</CardTitle><CardDescription>Configure your Google Ads account connection via backend environment variables.</CardDescription></CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">The connection uses the Google Ads API with provider-ready OAuth architecture. Configure GOOGLE_ADS_CLIENT_ID and GOOGLE_ADS_CLIENT_SECRET in your backend .env file.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
