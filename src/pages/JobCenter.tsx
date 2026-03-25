import { useState } from "react";
import { PageTransition, StaggerContainer, StaggerItem } from "@/components/motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useClients, useAllPublishingJobs, useRetryJob, useCancelJob } from "@/hooks/use-api";
import {
  Briefcase, RotateCcw, Ban, Clock, CheckCircle2, XCircle, Loader2, AlertCircle, Package
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

export default function JobCenter() {
  const { data: clients } = useClients();
  const allClients = clients ?? [];
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [clientFilter, setClientFilter] = useState<string>("");

  const { data: jobs, isLoading } = useAllPublishingJobs({
    status: statusFilter || undefined,
    client_id: clientFilter || undefined,
  });

  // We need a dummy clientId for the retry/cancel hooks. The hooks invalidate by clientId but the API works by jobId.
  const retryJob = useRetryJob("");
  const cancelJob = useCancelJob("");

  const handleRetry = async (jobId: string) => {
    try {
      await retryJob.mutateAsync(jobId);
      toast.success("Job queued for retry");
    } catch { toast.error("Failed to retry job"); }
  };

  const handleCancel = async (jobId: string) => {
    try {
      await cancelJob.mutateAsync(jobId);
      toast.success("Job cancelled");
    } catch { toast.error("Failed to cancel job"); }
  };

  const allJobs = jobs ?? [];
  const stats = {
    total: allJobs.length,
    queued: allJobs.filter(j => j.publish_status === "queued").length,
    processing: allJobs.filter(j => j.publish_status === "processing").length,
    published: allJobs.filter(j => j.publish_status === "published").length,
    failed: allJobs.filter(j => j.publish_status === "failed").length,
  };

  return (
    <PageTransition className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-primary" /> Job Center
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Publishing, rendering, and sync jobs</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={clientFilter} onValueChange={setClientFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="All clients" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All clients</SelectItem>
              {allClients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
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
      </div>

      {/* Stats */}
      <StaggerContainer className="grid gap-4 sm:grid-cols-4">
        {[
          { label: "Queued", value: stats.queued, icon: Clock, color: "text-amber-500" },
          { label: "Processing", value: stats.processing, icon: Loader2, color: "text-primary" },
          { label: "Published", value: stats.published, icon: CheckCircle2, color: "text-emerald-500" },
          { label: "Failed", value: stats.failed, icon: AlertCircle, color: "text-destructive" },
        ].map(s => (
          <StaggerItem key={s.label}>
            <Card className="hover-lift">
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

      {/* Jobs Table */}
      <Card className="hover-lift">
        <CardContent className="p-0">
          {isLoading ? (
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
                  <TableHead className="text-xs">Scheduled</TableHead>
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
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">{job.asset_type}/{job.job_type}</Badge>
                      </TableCell>
                      <TableCell className="text-xs">{job.platform}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <sc.icon className={`h-3.5 w-3.5 ${sc.color} ${job.publish_status === "processing" ? "animate-spin" : ""}`} />
                          <span className={`text-xs font-medium ${sc.color}`}>{sc.label}</span>
                        </div>
                        {job.error_message && <p className="text-[10px] text-destructive mt-0.5 max-w-[200px] truncate">{job.error_message}</p>}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {job.scheduled_time ? new Date(job.scheduled_time).toLocaleString("en-SG", { dateStyle: "short", timeStyle: "short" }) : "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(job.created_at).toLocaleString("en-SG", { dateStyle: "short", timeStyle: "short" })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {job.publish_status === "failed" && (
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleRetry(job.id)}>
                              <RotateCcw className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          {["queued", "scheduled"].includes(job.publish_status) && (
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive/60 hover:text-destructive" onClick={() => handleCancel(job.id)}>
                              <Ban className="h-3.5 w-3.5" />
                            </Button>
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
    </PageTransition>
  );
}
