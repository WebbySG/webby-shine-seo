import { useState } from "react";
import { PageTransition, StaggerContainer, StaggerItem } from "@/components/motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  useClients, useAiVisPromptSets, useCreateAiVisPromptSet, useDeleteAiVisPromptSet,
  useAiVisRuns, useStartAiVisRun, useAiVisOverview, useAiVisPrompts, useCreateAiVisPromptsBulk,
  useAiVisObservations, useUpdateAiVisObservation
} from "@/hooks/use-api";
import {
  Eye, Plus, Play, Target, TrendingUp, BarChart3, Loader2, Trash2, Brain,
  CheckCircle2, XCircle, Link2, Minus, ChevronDown, ChevronUp
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from "recharts";
import { toast } from "sonner";

function CreatePromptSetDialog({ clientId }: { clientId: string }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [cluster, setCluster] = useState("");
  const [intent, setIntent] = useState("informational");
  const [prompts, setPrompts] = useState("");
  const [entities, setEntities] = useState("");
  const createSet = useCreateAiVisPromptSet();
  const createPromptsBulk = useCreateAiVisPromptsBulk("");

  const handleSubmit = async () => {
    if (!name) { toast.error("Name is required"); return; }
    const promptLines = prompts.split("\n").map(l => l.trim()).filter(Boolean);
    if (promptLines.length === 0) { toast.error("Add at least one prompt"); return; }

    try {
      const set = await createSet.mutateAsync({ client_id: clientId, name, description: desc, topic_cluster: cluster, intent_type: intent });
      const targetEntities = entities.split(",").map(e => e.trim()).filter(Boolean);
      await createPromptsBulk.mutateAsync({
        prompt_set_id: set.id,
        prompts: promptLines.map(p => ({ prompt_text: p, target_entities: targetEntities }))
      });
      toast.success(`Created "${name}" with ${promptLines.length} prompts`);
      setOpen(false); setName(""); setDesc(""); setCluster(""); setPrompts(""); setEntities("");
    } catch { toast.error("Failed to create prompt set"); }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1.5" />New Prompt Set</Button></DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Create Prompt Set</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div><Label>Name</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="SEO Services Prompts" /></div>
          <div><Label>Topic Cluster</Label><Input value={cluster} onChange={e => setCluster(e.target.value)} placeholder="seo agency" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Intent</Label>
              <Select value={intent} onValueChange={setIntent}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="informational">Informational</SelectItem>
                  <SelectItem value="commercial">Commercial</SelectItem>
                  <SelectItem value="local">Local</SelectItem>
                  <SelectItem value="navigational">Navigational</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Target Entities (comma-sep)</Label><Input value={entities} onChange={e => setEntities(e.target.value)} placeholder="webby.sg, Webby" /></div>
          </div>
          <div><Label>Description</Label><Input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Optional description" /></div>
          <div>
            <Label>Prompts (one per line)</Label>
            <Textarea rows={6} value={prompts} onChange={e => setPrompts(e.target.value)}
              placeholder={"What is the best SEO agency in Singapore?\nWhich company offers affordable SEO services?\nRecommend a digital marketing agency for small businesses"} />
            <p className="text-xs text-muted-foreground mt-1">{prompts.split("\n").filter(l => l.trim()).length} prompts</p>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={createSet.isPending}>
            {createSet.isPending ? <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" />Creating...</> : "Create Prompt Set"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RunDialog({ clientId, promptSets }: { clientId: string; promptSets: any[] }) {
  const [open, setOpen] = useState(false);
  const [setId, setSetId] = useState("");
  const startRun = useStartAiVisRun(clientId);

  const handleStart = async () => {
    if (!setId) { toast.error("Select a prompt set"); return; }
    try {
      await startRun.mutateAsync({ client_id: clientId, prompt_set_id: setId, provider: "manual" });
      toast.success("Visibility run started");
      setOpen(false);
    } catch { toast.error("Failed to start run"); }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm" variant="outline"><Play className="h-4 w-4 mr-1.5" />Run Check</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Start Visibility Check</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Prompt Set</Label>
            <Select value={setId} onValueChange={setSetId}>
              <SelectTrigger><SelectValue placeholder="Select prompt set..." /></SelectTrigger>
              <SelectContent>
                {promptSets.map(s => <SelectItem key={s.id} value={s.id}>{s.name} ({s.prompt_count} prompts)</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <p className="text-xs text-muted-foreground">Manual mode: observations will be created for you to fill in after running the prompts on AI platforms.</p>
        </div>
        <DialogFooter>
          <Button onClick={handleStart} disabled={startRun.isPending}>
            {startRun.isPending ? <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" />Starting...</> : "Start Run"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ObservationRow({ obs, runId }: { obs: any; runId: string }) {
  const [expanded, setExpanded] = useState(false);
  const update = useUpdateAiVisObservation(runId);

  const toggle = (field: string, value: boolean) => {
    update.mutate({ id: obs.id, data: { [field]: value } });
  };

  return (
    <>
      <TableRow className="cursor-pointer hover:bg-muted/30" onClick={() => setExpanded(!expanded)}>
        <TableCell className="text-xs max-w-[300px] truncate">{obs.prompt_text}</TableCell>
        <TableCell>
          {obs.brand_mentioned ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <XCircle className="h-4 w-4 text-muted-foreground/40" />}
        </TableCell>
        <TableCell>
          {obs.citation_present ? <Link2 className="h-4 w-4 text-primary" /> : <Minus className="h-4 w-4 text-muted-foreground/40" />}
        </TableCell>
        <TableCell>
          <Badge variant="outline" className="text-[10px]">{obs.prominence}</Badge>
        </TableCell>
        <TableCell>
          {obs.competitor_mentioned ? <span className="text-xs text-amber-600">{obs.competitor_names?.join(", ") || "Yes"}</span> : <Minus className="h-4 w-4 text-muted-foreground/40" />}
        </TableCell>
        <TableCell>{expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</TableCell>
      </TableRow>
      {expanded && (
        <TableRow>
          <TableCell colSpan={6} className="bg-muted/20">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-2">
              <div className="flex items-center gap-2">
                <Switch checked={obs.brand_mentioned} onCheckedChange={(v) => toggle("brand_mentioned", v)} />
                <Label className="text-xs">Brand Mentioned</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={obs.citation_present} onCheckedChange={(v) => toggle("citation_present", v)} />
                <Label className="text-xs">Citation Present</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={obs.competitor_mentioned} onCheckedChange={(v) => toggle("competitor_mentioned", v)} />
                <Label className="text-xs">Competitor Mentioned</Label>
              </div>
              <Select value={obs.prominence} onValueChange={(v) => update.mutate({ id: obs.id, data: { prominence: v } })}>
                <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="featured">Featured</SelectItem>
                  <SelectItem value="mentioned">Mentioned</SelectItem>
                  <SelectItem value="passing">Passing</SelectItem>
                  <SelectItem value="absent">Absent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

export default function AiVisibility() {
  const { data: clients } = useClients();
  const allClients = clients ?? [];
  const [clientId, setClientId] = useState(allClients[0]?.id ?? "");
  const activeClientId = clientId || allClients[0]?.id || "";

  const { data: promptSets, isLoading: setsLoading } = useAiVisPromptSets(activeClientId);
  const { data: runs } = useAiVisRuns(activeClientId);
  const { data: overview, isLoading: overviewLoading } = useAiVisOverview(activeClientId);
  const [selectedRunId, setSelectedRunId] = useState("");
  const { data: observations } = useAiVisObservations(selectedRunId);
  const deleteSet = useDeleteAiVisPromptSet(activeClientId);
  const [tab, setTab] = useState("overview");

  // Update clientId when clients load
  if (allClients.length > 0 && !clientId) {
    setClientId(allClients[0].id);
  }

  const trendData = overview?.trend?.map(r => ({
    name: new Date(r.created_at).toLocaleDateString("en-SG", { month: "short", day: "numeric" }),
    visibility: r.total_prompts > 0 ? Math.round((r.prompts_with_mention / r.total_prompts) * 100) : 0,
    citation: r.total_prompts > 0 ? Math.round((r.prompts_with_citation / r.total_prompts) * 100) : 0,
  })) || [];

  return (
    <PageTransition className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" /> AI Visibility
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Track brand mentions and citations across AI platforms</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={activeClientId} onValueChange={setClientId}>
            <SelectTrigger className="w-[200px]"><SelectValue placeholder="Select client..." /></SelectTrigger>
            <SelectContent>{allClients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
          </Select>
          {activeClientId && <CreatePromptSetDialog clientId={activeClientId} />}
          {activeClientId && promptSets && promptSets.length > 0 && <RunDialog clientId={activeClientId} promptSets={promptSets} />}
        </div>
      </div>

      {!activeClientId ? (
        <Card><CardContent className="flex flex-col items-center py-16">
          <Eye className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">Select a client to view AI visibility data</p>
        </CardContent></Card>
      ) : (
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList><TabsTrigger value="overview">Overview</TabsTrigger><TabsTrigger value="prompts">Prompt Sets</TabsTrigger><TabsTrigger value="runs">Runs & Observations</TabsTrigger></TabsList>

          {/* OVERVIEW TAB */}
          <TabsContent value="overview" className="space-y-6 mt-4">
            {overviewLoading ? (
              <div className="grid gap-4 sm:grid-cols-4">{[1,2,3,4].map(i => <Skeleton key={i} className="h-24" />)}</div>
            ) : overview ? (
              <>
                <StaggerContainer className="grid gap-4 sm:grid-cols-4">
                  {[
                    { label: "Visibility Rate", value: `${overview.summary.visibility_rate}%`, icon: Eye, color: "text-primary" },
                    { label: "Citation Rate", value: `${overview.summary.citation_rate}%`, icon: Link2, color: "text-emerald-500" },
                    { label: "Total Runs", value: overview.summary.total_runs, icon: Play, color: "text-amber-500" },
                    { label: "Prompts Checked", value: overview.summary.total_prompts_checked, icon: Target, color: "text-violet-500" },
                  ].map(s => (
                    <StaggerItem key={s.label}>
                      <Card className="hover-lift">
                        <CardContent className="p-5 flex items-start justify-between">
                          <div>
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{s.label}</p>
                            <p className="text-2xl font-bold mt-1">{s.value}</p>
                          </div>
                          <s.icon className={`h-5 w-5 ${s.color}`} />
                        </CardContent>
                      </Card>
                    </StaggerItem>
                  ))}
                </StaggerContainer>

                {trendData.length > 1 && (
                  <Card className="hover-lift">
                    <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-primary" /> Visibility Trend
                    </CardTitle></CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={220}>
                        <AreaChart data={trendData}>
                          <defs>
                            <linearGradient id="visGradAi" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(239, 84%, 67%)" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="hsl(239, 84%, 67%)" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} unit="%" />
                          <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
                          <Legend wrapperStyle={{ fontSize: 11 }} />
                          <Area type="monotone" dataKey="visibility" stroke="hsl(239, 84%, 67%)" fill="url(#visGradAi)" name="Visibility %" />
                          <Area type="monotone" dataKey="citation" stroke="hsl(142, 71%, 45%)" fill="transparent" strokeDasharray="5 5" name="Citation %" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}

                {overview.byPromptSet.length > 0 && (
                  <Card className="hover-lift">
                    <CardHeader className="pb-2"><CardTitle className="text-base">Visibility by Topic</CardTitle></CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={Math.max(150, overview.byPromptSet.length * 40)}>
                        <BarChart data={overview.byPromptSet} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" className="opacity-30" horizontal={false} />
                          <XAxis type="number" unit="%" tick={{ fontSize: 11 }} domain={[0, 100]} />
                          <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={140} />
                          <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
                          <Bar dataKey="avg_visibility_rate" name="Visibility %" fill="hsl(239, 84%, 67%)" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}

                {overview.competitorMentions.length > 0 && (
                  <Card className="hover-lift">
                    <CardHeader className="pb-2"><CardTitle className="text-base">Competitor Mentions</CardTitle></CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {overview.competitorMentions.map(c => (
                          <div key={c.competitor} className="flex items-center justify-between py-1.5 px-3 rounded bg-muted/30">
                            <span className="text-sm font-medium">{c.competitor}</span>
                            <Badge variant="secondary">{c.mention_count} mentions</Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card><CardContent className="flex flex-col items-center py-16">
                <Eye className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground font-medium mb-2">No visibility data yet</p>
                <p className="text-xs text-muted-foreground mb-4">Create a prompt set and run your first visibility check</p>
                <CreatePromptSetDialog clientId={activeClientId} />
              </CardContent></Card>
            )}
          </TabsContent>

          {/* PROMPT SETS TAB */}
          <TabsContent value="prompts" className="space-y-4 mt-4">
            {setsLoading ? (
              <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-20" />)}</div>
            ) : !promptSets || promptSets.length === 0 ? (
              <Card><CardContent className="flex flex-col items-center py-16">
                <Target className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground font-medium mb-2">No prompt sets yet</p>
                <p className="text-xs text-muted-foreground mb-4">Create your first set of prompts to track AI visibility</p>
                <CreatePromptSetDialog clientId={activeClientId} />
              </CardContent></Card>
            ) : (
              <StaggerContainer className="space-y-3">
                {promptSets.map(s => (
                  <StaggerItem key={s.id}>
                    <Card className="hover-lift">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{s.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {s.topic_cluster && <Badge variant="outline" className="text-[10px]">{s.topic_cluster}</Badge>}
                            <Badge variant="secondary" className="text-[10px]">{s.intent_type}</Badge>
                            <span className="text-xs text-muted-foreground">{s.prompt_count} prompts · {s.run_count} runs</span>
                          </div>
                          {s.description && <p className="text-xs text-muted-foreground mt-1">{s.description}</p>}
                        </div>
                        <Button variant="ghost" size="icon" className="text-destructive/60 hover:text-destructive"
                          onClick={() => { if (confirm("Delete this prompt set?")) deleteSet.mutate(s.id); }}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </CardContent>
                    </Card>
                  </StaggerItem>
                ))}
              </StaggerContainer>
            )}
          </TabsContent>

          {/* RUNS TAB */}
          <TabsContent value="runs" className="space-y-4 mt-4">
            {!runs || runs.length === 0 ? (
              <Card><CardContent className="flex flex-col items-center py-16">
                <Play className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground font-medium mb-2">No runs yet</p>
                <p className="text-xs text-muted-foreground mb-4">Start a visibility check to see results here</p>
                {promptSets && promptSets.length > 0 && <RunDialog clientId={activeClientId} promptSets={promptSets} />}
              </CardContent></Card>
            ) : (
              <div className="grid gap-4 lg:grid-cols-3">
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Recent Runs</p>
                  {runs.map(r => {
                    const visRate = r.total_prompts > 0 ? Math.round((r.prompts_with_mention / r.total_prompts) * 100) : 0;
                    return (
                      <Card key={r.id} className={`cursor-pointer transition-all ${selectedRunId === r.id ? "ring-2 ring-primary" : "hover:bg-muted/30"}`}
                        onClick={() => setSelectedRunId(r.id)}>
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium">{r.prompt_set_name || "Unknown Set"}</span>
                            <Badge variant={r.status === "completed" ? "secondary" : "outline"} className="text-[10px]">{r.status}</Badge>
                          </div>
                          <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                            <span>{new Date(r.created_at).toLocaleDateString("en-SG")}</span>
                            <span>{r.total_prompts} prompts</span>
                            <span className="font-semibold text-primary">{visRate}% visible</span>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
                <div className="lg:col-span-2">
                  {selectedRunId && observations ? (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Observations ({observations.length})</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-xs">Prompt</TableHead>
                              <TableHead className="text-xs w-16">Brand</TableHead>
                              <TableHead className="text-xs w-16">Citation</TableHead>
                              <TableHead className="text-xs w-20">Prominence</TableHead>
                              <TableHead className="text-xs w-24">Competitor</TableHead>
                              <TableHead className="w-8" />
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {observations.map(obs => <ObservationRow key={obs.id} obs={obs} runId={selectedRunId} />)}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card><CardContent className="flex items-center justify-center py-16 text-muted-foreground text-sm">
                      Select a run to view observations
                    </CardContent></Card>
                  )}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </PageTransition>
  );
}
