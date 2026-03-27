import { useState } from "react";
import { PageTransition, StaggerContainer, StaggerItem } from "@/components/motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useClients, useAllPublishingJobs, useRetryJob, useCancelJob, useActivityLog } from "@/hooks/use-api";
import {
  Briefcase, RotateCcw, Ban, Clock, CheckCircle2, XCircle, Loader2, AlertCircle, Package,
  ScrollText, FileText, Users, Target, BarChart3, MessageSquare, Video, Paintbrush, DollarSign, Eye, ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

const STATUS_CONFIG: Record<string, { icon: typeof Clock; color: string; label: string }> = {
  queued: { icon: Clock, color: "text-amber-500", label: "Queued" },
  scheduled: { icon: Clock, color: "text-primary", label: "Scheduled" },
  processing: { icon: Loader2, color: "text-amber-500", label: "Processing" },
  published: { icon: CheckCircle2, color: "text-emerald-500", label: "Published" },
  failed: { icon: XCircle, color: "text-destructive", label: "Failed" },
  cancelled: { icon: Ban, color: "text-muted-foreground", label: "Cancelled" },
};

const ENTITY_ICONS: Record<string, typeof FileText> = {
  article: FileText, social_post: MessageSquare, video: Video, contact: Users,
  deal: DollarSign, keyword: Target, report: BarChart3, creative: Paintbrush,
  prompt_set: Eye, visibility_run: Eye, approval: ShieldCheck,
};

const ACTION_COLORS: Record<string, string> = {
  created: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  updated: "bg-primary/10 text-primary",
  deleted: "bg-destructive/10 text-destructive",
  published: "bg-emerald-500/10 text-emerald-600",
  approved: "bg-primary/10 text-primary",
  generated: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  started: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  failed: "bg-destructive/10 text-destructive",
  completed: "bg-emerald-500/10 text-emerald-600",
};

export default function Operations() {
  const { data: clients } = useClients();
  const allClients = clients ?? [];
  const [statusFilter, setStatusFilter] = useState("");
  const [clientFilter, setClientFilter] = useState("");
  const [entityFilter, setEntityFilter] = useState("");

  const { data: jobs, isLoading: jobsLoading } = useAllPublishingJobs({
    status: statusFilter || undefined,
    client_id: clientFilter || undefined,
  });

  const { data: logs, isLoading: logsLoading } = useActivityLog({
    client_id: clientFilter || undefined,
    entity_type: entityFilter || undefined,
    limit: 100,
  });

  const retryJob = useRetryJob("");
  const cancelJob = useCancelJob("");

  const handleRetry = async (jobId: string) => {
    try { await retryJob.mutateAsync(jobId); toast.success("Job queued for retry"); } catch { toast.error("Failed to retry job"); }
  };
  const handleCancel = async (jobId: string) => {
    try { await cancelJob.mutateAsync(jobId); toast.success("Job cancelled"); } catch { toast.error("Failed to cancel job"); }
  };

  const allJobs = jobs ?? [];
  const allLogs = logs ?? [];
  const stats = {
    queued: allJobs.filter(j => j.publish_status === "queued").length,
    processing: allJobs.filter(j => j.publish_status === "processing").length,
    published: allJobs.filter(j => j.publish_status === "published").length,
    failed: allJobs.filter(j => j.publish_status === "failed").length,
  };

  return (
    <PageTransition className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-primary" /> Operations
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Jobs, publishing queue, and activity audit trail</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={clientFilter} onValueChange={setClientFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="All clients" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All clients</SelectItem>
              {allClients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="jobs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="jobs" className="gap-1.5"><Briefcase className="h-3.5 w-3.5" /> Jobs ({allJobs.length})</TabsTrigger>
          <TabsTrigger value="activity" className="gap-1.5"><ScrollText className="h-3.5 w-3.5" /> Activity ({allLogs.length})</TabsTrigger>
        </TabsList>

        {/* ─── Jobs Tab ─── */}
        <TabsContent value="jobs" className="space-y-4">
          <StaggerContainer className="grid gap-4 sm:grid-cols-4">
            {[
              { label: "Queued", value: stats.queued, icon: Clock, color: "text-amber-500" },
              { label: "Processing", value: stats.processing, icon: Loader2, color: "text-primary" },
              { label: "Published", value: stats.published, icon: CheckCircle2, color: "text-emerald-500" },
              { label: "Failed", value: stats.failed, icon: AlertCircle, color: "text-destructive" },
            ].map(s => (
              <StaggerItem key={s.label}>
                <Card>
                  <CardContent className="p-4 flex items-center justify-between">
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

          <div className="flex justify-end">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="All statuses" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="queued">Queued</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardContent className="p-0">
              {jobsLoading ? (
                <div className="p-6 space-y-3">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-12" />)}</div>
              ) : allJobs.length === 0 ? (
                <div className="flex flex-col items-center py-16">
                  <Package className="h-12 w-12 text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground font-medium">No jobs found</p>
                  <p className="text-xs text-muted-foreground mt-1">Publishing, rendering, and sync jobs will appear here</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Client</TableHead>
                      <TableHead className="text-xs">Type</TableHead>
                      <TableHead className="text-xs">Platform</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs">Created</TableHead>
                      <TableHead className="text-xs w-24">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allJobs.map(job => {
                      const sc = STATUS_CONFIG[job.publish_status] || STATUS_CONFIG.queued;
                      return (
                        <TableRow key={job.id}>
                          <TableCell className="text-xs font-medium">{(job as any).client_name || "—"}</TableCell>
                          <TableCell><Badge variant="outline" className="text-[10px]">{job.asset_type}/{job.job_type}</Badge></TableCell>
                          <TableCell className="text-xs">{job.platform}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <sc.icon className={`h-3.5 w-3.5 ${sc.color} ${job.publish_status === "processing" ? "animate-spin" : ""}`} />
                              <span className={`text-xs font-medium ${sc.color}`}>{sc.label}</span>
                            </div>
                            {job.error_message && <p className="text-[10px] text-destructive mt-0.5 max-w-[200px] truncate">{job.error_message}</p>}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {new Date(job.created_at).toLocaleString("en-SG", { dateStyle: "short", timeStyle: "short" })}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {job.publish_status === "failed" && (
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleRetry(job.id)}><RotateCcw className="h-3.5 w-3.5" /></Button>
                              )}
                              {["queued", "scheduled"].includes(job.publish_status) && (
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive/60 hover:text-destructive" onClick={() => handleCancel(job.id)}><Ban className="h-3.5 w-3.5" /></Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Activity Tab ─── */}
        <TabsContent value="activity" className="space-y-4">
          <div className="flex justify-end">
            <Select value={entityFilter} onValueChange={setEntityFilter}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="All types" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="article">Articles</SelectItem>
                <SelectItem value="social_post">Social Posts</SelectItem>
                <SelectItem value="contact">Contacts</SelectItem>
                <SelectItem value="deal">Deals</SelectItem>
                <SelectItem value="report">Reports</SelectItem>
                <SelectItem value="prompt_set">AI Visibility</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {logsLoading ? (
            <div className="space-y-3">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-16" />)}</div>
          ) : allLogs.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center py-16">
                <ScrollText className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground font-medium">No activity recorded yet</p>
                <p className="text-xs text-muted-foreground mt-1">Actions across the system will appear here</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-4">
                <div className="space-y-1">
                  {allLogs.map((log) => {
                    const Icon = ENTITY_ICONS[log.entity_type] || FileText;
                    const actionColor = ACTION_COLORS[log.action] || "bg-muted text-foreground";
                    return (
                      <div key={log.id} className="flex items-start gap-3 py-2.5 px-3 rounded-lg hover:bg-muted/30 transition-colors">
                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${actionColor}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm">
                            <span className="font-medium">{log.actor_name || "System"}</span>
                            <span className="text-muted-foreground"> {log.action} </span>
                            <Badge variant="outline" className="text-[10px] mx-1">{log.entity_type}</Badge>
                            {log.summary && <span className="text-muted-foreground text-xs"> — {log.summary}</span>}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {new Date(log.created_at).toLocaleString("en-SG", { dateStyle: "medium", timeStyle: "short" })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </PageTransition>
  );
}
