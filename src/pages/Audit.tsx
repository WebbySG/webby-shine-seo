import { useState } from "react";
import { PageTransition, StaggerContainer, StaggerItem } from "@/components/motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useActiveClient } from "@/contexts/ClientContext";
import { useAuditIssues, useInternalLinks } from "@/hooks/use-api";
import { AlertTriangle, AlertCircle, Info, CheckCircle2, Shield, Bug, Wrench, Link2, ArrowRight, ExternalLink } from "lucide-react";

const severityConfig = {
  critical: { icon: AlertCircle, color: "text-destructive", badge: "destructive" as const, borderColor: "border-l-destructive" },
  warning: { icon: AlertTriangle, color: "text-amber-500", badge: "secondary" as const, borderColor: "border-l-amber-500" },
  info: { icon: Info, color: "text-primary", badge: "outline" as const, borderColor: "border-l-primary" },
};

const linkStatusConfig: Record<string, { color: string; label: string }> = {
  pending: { color: "bg-amber-500/10 text-amber-600", label: "Pending" },
  approved: { color: "bg-primary/10 text-primary", label: "Approved" },
  implemented: { color: "bg-emerald-500/10 text-emerald-600", label: "Implemented" },
  rejected: { color: "bg-destructive/10 text-destructive", label: "Rejected" },
};

export default function Audit() {
  const { activeClientId } = useActiveClient();
  const { data: apiIssues } = useAuditIssues(activeClientId);
  const { data: apiLinks } = useInternalLinks(activeClientId);

  const issues = apiIssues ?? [];
  const internalLinks = (apiLinks as any[]) ?? [];

  const statusGroups = {
    open: issues.filter((i) => i.status === "open"),
    in_progress: issues.filter((i) => i.status === "in_progress"),
    done: issues.filter((i) => i.status === "done"),
  };

  const critCount = issues.filter((i) => i.severity === "critical" && i.status !== "done").length;
  const warnCount = issues.filter((i) => i.severity === "warning" && i.status !== "done").length;

  const pendingLinks = internalLinks.filter(l => l.status === "pending").length;
  const implementedLinks = internalLinks.filter(l => l.status === "implemented").length;

  return (
    <PageTransition className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Technical Audit</h1>
          <p className="text-muted-foreground text-sm mt-1">SEO issues, internal link suggestions & resolution board</p>
        </div>
        <Button size="sm" variant="outline" disabled title="Run audit from Client Detail page">
          <Shield className="h-3.5 w-3.5 mr-1" /> Run Audit
        </Button>
      </div>

      {/* KPI Cards */}
      <StaggerContainer className="grid gap-4 sm:grid-cols-5">
        <StaggerItem><Card className="border-l-4 border-l-primary">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10"><Shield className="h-5 w-5 text-primary" /></div>
            <div><p className="text-xs text-muted-foreground uppercase tracking-wide">Total Issues</p><p className="text-2xl font-bold mt-0.5">{issues.length}</p></div>
          </CardContent>
        </Card></StaggerItem>
        <StaggerItem><Card className="border-l-4 border-l-destructive">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-destructive/10"><AlertCircle className="h-5 w-5 text-destructive" /></div>
            <div><p className="text-xs text-destructive uppercase tracking-wide">Critical</p><p className="text-2xl font-bold mt-0.5">{critCount}</p></div>
          </CardContent>
        </Card></StaggerItem>
        <StaggerItem><Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10"><AlertTriangle className="h-5 w-5 text-amber-500" /></div>
            <div><p className="text-xs text-amber-600 uppercase tracking-wide">Warnings</p><p className="text-2xl font-bold mt-0.5">{warnCount}</p></div>
          </CardContent>
        </Card></StaggerItem>
        <StaggerItem><Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10"><CheckCircle2 className="h-5 w-5 text-green-500" /></div>
            <div><p className="text-xs text-green-600 uppercase tracking-wide">Resolved</p><p className="text-2xl font-bold mt-0.5">{statusGroups.done.length}</p></div>
          </CardContent>
        </Card></StaggerItem>
        <StaggerItem><Card className="border-l-4 border-l-primary">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10"><Link2 className="h-5 w-5 text-primary" /></div>
            <div><p className="text-xs text-muted-foreground uppercase tracking-wide">Link Suggestions</p><p className="text-2xl font-bold mt-0.5">{internalLinks.length}</p></div>
          </CardContent>
        </Card></StaggerItem>
      </StaggerContainer>

      <Tabs defaultValue="open">
        <TabsList className="bg-muted/50 border">
          <TabsTrigger value="open" className="gap-1.5"><Bug className="h-3.5 w-3.5" />Open ({statusGroups.open.length})</TabsTrigger>
          <TabsTrigger value="in_progress" className="gap-1.5"><Wrench className="h-3.5 w-3.5" />In Progress ({statusGroups.in_progress.length})</TabsTrigger>
          <TabsTrigger value="done" className="gap-1.5"><CheckCircle2 className="h-3.5 w-3.5" />Done ({statusGroups.done.length})</TabsTrigger>
          <TabsTrigger value="internal_links" className="gap-1.5"><Link2 className="h-3.5 w-3.5" />Internal Links ({internalLinks.length})</TabsTrigger>
        </TabsList>

        {(["open", "in_progress", "done"] as const).map((status) => (
          <TabsContent key={status} value={status} className="space-y-3 mt-4">
            {statusGroups[status].length === 0 && (
              <Card className="border-dashed">
                <CardContent className="py-12">
                  <div className="text-center text-muted-foreground flex flex-col items-center gap-3">
                    <div className="p-3 rounded-full bg-green-500/10"><CheckCircle2 className="h-8 w-8 text-green-500" /></div>
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
                <Card key={issue.id} className={`${cfg.borderColor} border-l-4`}>
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

        {/* Internal Links Tab */}
        <TabsContent value="internal_links" className="space-y-3 mt-4">
          {internalLinks.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <Link2 className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-sm font-medium text-muted-foreground">No internal link suggestions yet</p>
                <p className="text-xs text-muted-foreground mt-1">Run an audit to generate internal linking opportunities</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>{pendingLinks} pending</span>
                <span>·</span>
                <span>{implementedLinks} implemented</span>
              </div>
              {internalLinks.map((link: any) => {
                const sc = linkStatusConfig[link.status] || linkStatusConfig.pending;
                return (
                  <Card key={link.id} className="border-l-4 border-l-primary/40">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="p-1.5 rounded-md bg-primary/10">
                          <Link2 className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-2">
                            <Badge variant="outline" className="text-[10px] capitalize">{link.priority} priority</Badge>
                            <Badge className={`text-[10px] ${sc.color}`}>{sc.label}</Badge>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <span className="font-mono text-muted-foreground truncate max-w-[200px]">{link.from_url}</span>
                            <ArrowRight className="h-3 w-3 text-primary shrink-0" />
                            <span className="font-mono text-foreground truncate max-w-[200px]">{link.to_url}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1.5">
                            Anchor: <span className="font-medium text-foreground">"{link.anchor_text}"</span>
                            {link.reason && <> · {link.reason}</>}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </>
          )}
        </TabsContent>
      </Tabs>
    </PageTransition>
  );
}
