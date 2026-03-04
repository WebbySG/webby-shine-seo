import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { clients, getClientAuditIssues } from "@/data/dummy";
import { AlertTriangle, AlertCircle, Info, CheckCircle2 } from "lucide-react";

const severityConfig = {
  critical: { icon: AlertCircle, color: "text-destructive", badge: "destructive" as const },
  warning: { icon: AlertTriangle, color: "text-warning", badge: "secondary" as const },
  info: { icon: Info, color: "text-primary", badge: "outline" as const },
};

export default function Audit() {
  const [clientId, setClientId] = useState(clients[0]?.id ?? "");
  const issues = getClientAuditIssues(clientId);

  const statusGroups = {
    open: issues.filter((i) => i.status === "open"),
    in_progress: issues.filter((i) => i.status === "in_progress"),
    done: issues.filter((i) => i.status === "done"),
  };

  const critCount = issues.filter((i) => i.severity === "critical" && i.status !== "done").length;
  const warnCount = issues.filter((i) => i.severity === "warning" && i.status !== "done").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Technical Audit</h1>
          <p className="text-muted-foreground text-sm mt-1">SEO issue tracker & resolution board</p>
        </div>
        <Select value={clientId} onValueChange={setClientId}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="Select client" /></SelectTrigger>
          <SelectContent>
            {clients.map((c) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground uppercase tracking-wide">Total Issues</p><p className="text-xl font-bold mt-1">{issues.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-destructive uppercase tracking-wide">Critical</p><p className="text-xl font-bold mt-1">{critCount}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-warning uppercase tracking-wide">Warnings</p><p className="text-xl font-bold mt-1">{warnCount}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-success uppercase tracking-wide">Resolved</p><p className="text-xl font-bold mt-1">{statusGroups.done.length}</p></CardContent></Card>
      </div>

      <Tabs defaultValue="open">
        <TabsList>
          <TabsTrigger value="open">Open ({statusGroups.open.length})</TabsTrigger>
          <TabsTrigger value="in_progress">In Progress ({statusGroups.in_progress.length})</TabsTrigger>
          <TabsTrigger value="done">Done ({statusGroups.done.length})</TabsTrigger>
        </TabsList>

        {(["open", "in_progress", "done"] as const).map((status) => (
          <TabsContent key={status} value={status} className="space-y-2 mt-4">
            {statusGroups[status].length === 0 && (
              <div className="text-center py-8 text-muted-foreground flex flex-col items-center gap-2">
                <CheckCircle2 className="h-8 w-8" />
                <p className="text-sm">No {status.replace("_", " ")} issues.</p>
              </div>
            )}
            {statusGroups[status].map((issue) => {
              const cfg = severityConfig[issue.severity];
              const Icon = cfg.icon;
              return (
                <Card key={issue.id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Icon className={`h-5 w-5 shrink-0 mt-0.5 ${cfg.color}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-sm">{issue.type}</p>
                          <Badge variant={cfg.badge} className="text-xs">{issue.severity}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{issue.description}</p>
                        <p className="text-xs font-mono text-muted-foreground mt-1 truncate">{issue.affected_url}</p>
                        <div className="mt-3 p-2 rounded bg-muted/50">
                          <p className="text-xs"><span className="font-medium">Fix:</span> {issue.fix_instruction}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
