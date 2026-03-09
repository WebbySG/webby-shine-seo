import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useClients, useAuditIssues } from "@/hooks/use-api";
import { clients as dummyClients, getClientAuditIssues } from "@/data/dummy";
import { AlertTriangle, AlertCircle, Info, CheckCircle2, Shield, Bug, Wrench, CircleDot } from "lucide-react";

const severityConfig = {
  critical: { icon: AlertCircle, color: "text-destructive", badge: "destructive" as const, borderColor: "border-l-destructive" },
  warning: { icon: AlertTriangle, color: "text-amber-500", badge: "secondary" as const, borderColor: "border-l-amber-500" },
  info: { icon: Info, color: "text-primary", badge: "outline" as const, borderColor: "border-l-primary" },
};

export default function Audit() {
  const { data: apiClients } = useClients();
  const clients = apiClients ?? dummyClients;
  const [clientId, setClientId] = useState(clients[0]?.id ?? "");
  const { data: apiIssues } = useAuditIssues(clientId);

  const issues = apiIssues ?? getClientAuditIssues(clientId).map(i => ({
    id: i.id, issue_type: i.type, severity: i.severity, affected_url: i.affected_url,
    description: i.description, fix_instruction: i.fix_instruction as string | null, status: i.status,
  }));

  const statusGroups = {
    open: issues.filter((i) => i.status === "open"),
    in_progress: issues.filter((i) => i.status === "in_progress"),
    done: issues.filter((i) => i.status === "done"),
  };

  const critCount = issues.filter((i) => i.severity === "critical" && i.status !== "done").length;
  const warnCount = issues.filter((i) => i.severity === "warning" && i.status !== "done").length;
  const infoCount = issues.filter((i) => i.severity === "info" && i.status !== "done").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Technical Audit</h1>
          <p className="text-muted-foreground text-sm mt-1">SEO issue tracker & resolution board</p>
        </div>
        <Select value={clientId} onValueChange={setClientId}>
          <SelectTrigger className="w-[200px] bg-card border"><SelectValue placeholder="Select client" /></SelectTrigger>
          <SelectContent>
            {clients.map((c) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards with accent borders */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card className="border-l-4 border-l-primary hover-lift">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Issues</p>
              <p className="text-2xl font-bold mt-0.5">{issues.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-destructive hover-lift">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-destructive/10">
              <AlertCircle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-xs text-destructive uppercase tracking-wide">Critical</p>
              <p className="text-2xl font-bold mt-0.5">{critCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500 hover-lift">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-xs text-amber-600 uppercase tracking-wide">Warnings</p>
              <p className="text-2xl font-bold mt-0.5">{warnCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500 hover-lift">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-xs text-green-600 uppercase tracking-wide">Resolved</p>
              <p className="text-2xl font-bold mt-0.5">{statusGroups.done.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="open">
        <TabsList className="bg-muted/50 border">
          <TabsTrigger value="open" className="gap-1.5">
            <Bug className="h-3.5 w-3.5" />Open ({statusGroups.open.length})
          </TabsTrigger>
          <TabsTrigger value="in_progress" className="gap-1.5">
            <Wrench className="h-3.5 w-3.5" />In Progress ({statusGroups.in_progress.length})
          </TabsTrigger>
          <TabsTrigger value="done" className="gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5" />Done ({statusGroups.done.length})
          </TabsTrigger>
        </TabsList>

        {(["open", "in_progress", "done"] as const).map((status) => (
          <TabsContent key={status} value={status} className="space-y-3 mt-4">
            {statusGroups[status].length === 0 && (
              <Card className="border-dashed">
                <CardContent className="py-12">
                  <div className="text-center text-muted-foreground flex flex-col items-center gap-3">
                    <div className="p-3 rounded-full bg-green-500/10">
                      <CheckCircle2 className="h-8 w-8 text-green-500" />
                    </div>
                    <p className="text-sm font-medium">No {status.replace("_", " ")} issues</p>
                    <p className="text-xs">All clear in this category.</p>
                  </div>
                </CardContent>
              </Card>
            )}
            {statusGroups[status].map((issue) => {
              const cfg = severityConfig[issue.severity];
              const Icon = cfg.icon;
              return (
                <Card key={issue.id} className={`${cfg.borderColor} border-l-4 hover-lift`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`p-1.5 rounded-md ${issue.severity === 'critical' ? 'bg-destructive/10' : issue.severity === 'warning' ? 'bg-amber-500/10' : 'bg-primary/10'}`}>
                        <Icon className={`h-4 w-4 ${cfg.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-sm">{issue.issue_type}</p>
                          <Badge variant={cfg.badge} className="text-xs">{issue.severity}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1.5">{issue.description}</p>
                        <p className="text-xs font-mono text-muted-foreground/70 mt-1 truncate">{issue.affected_url}</p>
                        {issue.fix_instruction && (
                          <div className="mt-3 p-3 rounded-lg bg-muted/50 border border-border/50">
                            <p className="text-xs"><span className="font-semibold text-foreground">Recommended Fix:</span> {issue.fix_instruction}</p>
                          </div>
                        )}
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
