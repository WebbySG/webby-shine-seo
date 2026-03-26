import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { request } from "@/lib/api";
import { useClients } from "@/hooks/use-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  Layers, Plus, Sparkles, FileText, ChevronRight, CheckCircle2,
  XCircle, Clock, AlertCircle, Zap, BarChart3, Rocket, Network,
} from "lucide-react";

interface BulkJob {
  id: string; name: string; status: string; total_articles: number;
  completed_articles: number; failed_articles: number; topical_map_id: string | null;
  started_at: string | null; completed_at: string | null; created_at: string;
  items?: BulkItem[];
}
interface BulkItem {
  id: string; target_keyword: string; title: string | null; status: string;
  content_score: number | null; error_message: string | null; completed_at: string | null;
}

const statusConfig: Record<string, { icon: typeof Clock; color: string; label: string }> = {
  queued: { icon: Clock, color: "text-muted-foreground", label: "Queued" },
  running: { icon: Zap, color: "text-amber-500", label: "Running" },
  completed: { icon: CheckCircle2, color: "text-green-500", label: "Completed" },
  failed: { icon: XCircle, color: "text-destructive", label: "Failed" },
  cancelled: { icon: AlertCircle, color: "text-muted-foreground", label: "Cancelled" },
  pending: { icon: Clock, color: "text-muted-foreground", label: "Pending" },
  generating: { icon: Sparkles, color: "text-primary", label: "Generating" },
};

export default function BulkContent() {
  const { data: clients } = useClients();
  const [selectedClient, setSelectedClient] = useState("");
  const clientId = selectedClient || clients?.[0]?.id || "";
  const queryClient = useQueryClient();
  const [selectedJob, setSelectedJob] = useState<BulkJob | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [jobName, setJobName] = useState("");
  const [keywordInput, setKeywordInput] = useState("");

  const { data: jobs = [], isLoading } = useQuery<BulkJob[]>({
    queryKey: ["bulk-jobs", clientId],
    queryFn: () => request(`/clients/${clientId}/bulk-jobs`),
    enabled: !!clientId,
  });

  const { data: topicalMaps = [] } = useQuery<any[]>({
    queryKey: ["topical-maps", clientId],
    queryFn: () => request(`/clients/${clientId}/topical-maps`),
    enabled: !!clientId,
  });

  const generateMutation = useMutation({
    mutationFn: (data: { name: string; keywords?: { keyword: string }[]; topical_map_id?: string }) =>
      request<BulkJob>("/bulk-content/generate", { method: "POST", body: JSON.stringify({ client_id: clientId, ...data }) }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["bulk-jobs"] });
      setSelectedJob(data);
      setDialogOpen(false);
      setJobName("");
      setKeywordInput("");
      toast.success(`Bulk generation started: ${data.total_articles} articles`);
    },
    onError: () => toast.error("Failed to start bulk generation"),
  });

  const loadJobDetail = useMutation({
    mutationFn: (jobId: string) => request<BulkJob>(`/bulk-content/${jobId}`),
    onSuccess: setSelectedJob,
  });

  const cancelMutation = useMutation({
    mutationFn: (jobId: string) => request(`/bulk-content/${jobId}/cancel`, { method: "POST" }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["bulk-jobs"] }); toast.success("Job cancelled"); },
  });

  const handleGenerate = (mode: "keywords" | "map", mapId?: string) => {
    if (mode === "keywords") {
      const keywords = keywordInput.split("\n").map(k => k.trim()).filter(Boolean).map(k => ({ keyword: k }));
      if (keywords.length === 0) return toast.error("Add at least one keyword");
      generateMutation.mutate({ name: jobName || `Bulk — ${keywords.length} articles`, keywords });
    } else if (mapId) {
      generateMutation.mutate({ name: jobName || "From Topical Map", topical_map_id: mapId });
    }
  };

  // Detail view
  if (selectedJob?.items) {
    const job = selectedJob;
    const progressPct = job.total_articles > 0 ? (job.completed_articles / job.total_articles) * 100 : 0;
    const StatusIcon = statusConfig[job.status]?.icon || Clock;
    const statusColor = statusConfig[job.status]?.color || "text-muted-foreground";

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setSelectedJob(null)}>← Back</Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">{job.name}</h1>
              <div className="flex items-center gap-3 mt-1">
                <Badge variant="outline" className="gap-1"><StatusIcon className={`h-3 w-3 ${statusColor}`} />{statusConfig[job.status]?.label || job.status}</Badge>
                <span className="text-xs text-muted-foreground">{job.completed_articles}/{job.total_articles} completed</span>
                {job.failed_articles > 0 && <span className="text-xs text-destructive">{job.failed_articles} failed</span>}
              </div>
            </div>
          </div>
          {(job.status === "queued" || job.status === "running") && (
            <Button variant="outline" size="sm" onClick={() => cancelMutation.mutate(job.id)}>Cancel Job</Button>
          )}
        </div>

        <Progress value={progressPct} className="h-2" />

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total", value: job.total_articles, icon: FileText, color: "text-foreground" },
            { label: "Completed", value: job.completed_articles, icon: CheckCircle2, color: "text-green-500" },
            { label: "Failed", value: job.failed_articles, icon: XCircle, color: "text-destructive" },
            { label: "Avg Score", value: (() => { const scored = job.items!.filter(i => i.content_score); return scored.length > 0 ? Math.round(scored.reduce((s, i) => s + (i.content_score || 0), 0) / scored.length) : "—"; })(), icon: BarChart3, color: "text-primary" },
          ].map((stat, i) => (
            <Card key={i}><CardContent className="p-4 flex items-center gap-3"><stat.icon className={`h-5 w-5 ${stat.color}`} /><div><p className="text-xl font-bold">{stat.value}</p><p className="text-[10px] text-muted-foreground uppercase">{stat.label}</p></div></CardContent></Card>
          ))}
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-border">{job.items!.map((item, idx) => {
              const ItemIcon = statusConfig[item.status]?.icon || Clock;
              const itemColor = statusConfig[item.status]?.color || "text-muted-foreground";
              return (
                <div key={item.id} className="flex items-center justify-between px-5 py-3 hover:bg-muted/30 transition-colors flex-wrap gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs font-mono text-muted-foreground w-6">{idx + 1}</span>
                    <ItemIcon className={`h-4 w-4 ${itemColor}`} />
                    <div className="min-w-0"><p className="text-sm font-medium text-foreground truncate">{item.title || item.target_keyword}</p><p className="text-xs text-muted-foreground truncate">{item.target_keyword}</p></div>
                  </div>
                  <div className="flex items-center gap-4">
                    {item.content_score != null && (
                      <div className={`text-sm font-bold ${item.content_score >= 70 ? "text-green-600 dark:text-green-400" : item.content_score >= 50 ? "text-amber-600 dark:text-amber-400" : "text-destructive"}`}>{item.content_score}</div>
                    )}
                    <Badge variant="outline" className="text-xs">{statusConfig[item.status]?.label || item.status}</Badge>
                  </div>
                </div>
              );
            })}</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2"><Layers className="h-6 w-6 text-primary" /> Bulk Content Generator</h1>
          <p className="text-sm text-muted-foreground mt-1">Generate hundreds of SEO articles simultaneously from keyword lists or topical maps</p>
        </div>
        <div className="flex items-center gap-2">
          {clients && clients.length > 1 && (
            <Select value={selectedClient} onValueChange={setSelectedClient}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Select client" /></SelectTrigger>
              <SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          )}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild><Button className="gap-2"><Rocket className="h-4 w-4" /> New Bulk Job</Button></DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle className="flex items-center gap-2"><Layers className="h-5 w-5 text-primary" /> Bulk Content Generation</DialogTitle></DialogHeader>
              <Tabs defaultValue="keywords">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="keywords">From Keywords</TabsTrigger>
                  <TabsTrigger value="topical-map">From Topical Map</TabsTrigger>
                </TabsList>
                <TabsContent value="keywords" className="space-y-4 pt-4">
                  <div><label className="text-sm font-medium mb-1 block">Job Name</label><Input placeholder="Optional name" value={jobName} onChange={e => setJobName(e.target.value)} /></div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Keywords (one per line) *</label>
                    <Textarea placeholder={"seo agency singapore\nweb design services\ngoogle ads management"} rows={8} value={keywordInput} onChange={e => setKeywordInput(e.target.value)} />
                    <p className="text-xs text-muted-foreground mt-1">{keywordInput.split("\n").filter(k => k.trim()).length} keywords</p>
                  </div>
                  <Button onClick={() => handleGenerate("keywords")} disabled={generateMutation.isPending} className="w-full gap-2">
                    {generateMutation.isPending ? <><div className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" /> Generating...</> : <><Rocket className="h-4 w-4" /> Generate Articles</>}
                  </Button>
                </TabsContent>
                <TabsContent value="topical-map" className="space-y-4 pt-4">
                  {topicalMaps.length === 0 ? (
                    <div className="text-center py-8"><Network className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" /><p className="text-sm text-muted-foreground">No topical maps yet. Create one first.</p></div>
                  ) : (
                    <div className="space-y-2">{topicalMaps.map((map: any) => (
                      <Card key={map.id} className="cursor-pointer hover:border-primary/30 transition-colors" onClick={() => handleGenerate("map", map.id)}>
                        <CardContent className="p-4 flex items-center justify-between">
                          <div><p className="text-sm font-semibold">{map.name}</p><p className="text-xs text-muted-foreground">{map.article_count} articles · {map.cluster_count} clusters</p></div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </CardContent>
                      </Card>
                    ))}</div>
                  )}
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Jobs", value: jobs.length, icon: Layers, color: "text-primary" },
          { label: "Total Articles", value: jobs.reduce((s, j) => s + j.total_articles, 0), icon: FileText, color: "text-content-primary" },
          { label: "Completed", value: jobs.reduce((s, j) => s + j.completed_articles, 0), icon: CheckCircle2, color: "text-green-500" },
          { label: "Running", value: jobs.filter(j => j.status === "running").length, icon: Zap, color: "text-amber-500" },
        ].map((stat, i) => (
          <Card key={i}><CardContent className="p-4 flex items-center gap-3"><stat.icon className={`h-5 w-5 ${stat.color}`} /><div><p className="text-xl font-bold">{stat.value}</p><p className="text-[10px] text-muted-foreground uppercase">{stat.label}</p></div></CardContent></Card>
        ))}
      </div>

      {isLoading ? (
        <div className="grid gap-4">{[1, 2].map(i => <Card key={i}><CardContent className="p-6"><div className="h-16 bg-muted animate-pulse rounded-lg" /></CardContent></Card>)}</div>
      ) : jobs.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-12 text-center">
            <Layers className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No Bulk Jobs Yet</h3>
            <p className="text-sm text-muted-foreground mb-4">Generate hundreds of SEO articles at once from a keyword list or topical map</p>
            <Button onClick={() => setDialogOpen(true)} className="gap-2"><Rocket className="h-4 w-4" /> Start Your First Bulk Job</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">{jobs.map((job, idx) => {
          const StatusIcon = statusConfig[job.status]?.icon || Clock;
          const statusColor = statusConfig[job.status]?.color || "text-muted-foreground";
          const progressPct = job.total_articles > 0 ? (job.completed_articles / job.total_articles) * 100 : 0;
          return (
            <motion.div key={job.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
              <Card className="cursor-pointer hover:shadow-md transition-all hover:border-primary/30" onClick={() => loadJobDetail.mutate(job.id)}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3 flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center"><Layers className="h-5 w-5 text-primary" /></div>
                      <div><h3 className="text-sm font-semibold text-foreground">{job.name}</h3><p className="text-xs text-muted-foreground">{new Date(job.created_at).toLocaleDateString()}</p></div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right"><p className="text-lg font-bold">{job.completed_articles}/{job.total_articles}</p><p className="text-[10px] text-muted-foreground">articles</p></div>
                      <Badge variant="outline" className="gap-1"><StatusIcon className={`h-3 w-3 ${statusColor}`} />{statusConfig[job.status]?.label || job.status}</Badge>
                    </div>
                  </div>
                  <Progress value={progressPct} className="h-1.5" />
                </CardContent>
              </Card>
            </motion.div>
          );
        })}</div>
      )}
    </div>
  );
}
