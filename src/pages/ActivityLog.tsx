import { useState } from "react";
import { PageTransition, StaggerContainer, StaggerItem } from "@/components/motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useActivityLog, useClients } from "@/hooks/use-api";
import {
  ScrollText, FileText, Users, Target, BarChart3, MessageSquare,
  Video, Paintbrush, DollarSign, Eye, ShieldCheck
} from "lucide-react";

const ENTITY_ICONS: Record<string, typeof FileText> = {
  article: FileText,
  social_post: MessageSquare,
  video: Video,
  contact: Users,
  deal: DollarSign,
  keyword: Target,
  report: BarChart3,
  creative: Paintbrush,
  prompt_set: Eye,
  visibility_run: Eye,
  approval: ShieldCheck,
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

export default function ActivityLog() {
  const { data: clients } = useClients();
  const allClients = clients ?? [];
  const [clientFilter, setClientFilter] = useState<string>("");
  const [entityFilter, setEntityFilter] = useState<string>("");

  const { data: logs, isLoading } = useActivityLog({
    client_id: clientFilter || undefined,
    entity_type: entityFilter || undefined,
    limit: 100,
  });

  const allLogs = logs ?? [];

  return (
    <PageTransition className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <ScrollText className="h-6 w-6 text-primary" /> Activity Log
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Audit trail of all system and user actions</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={clientFilter} onValueChange={setClientFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="All clients" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All clients</SelectItem>
              {allClients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
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
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-16" />)}</div>
      ) : allLogs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16">
            <ScrollText className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground font-medium">No activity recorded yet</p>
            <p className="text-xs text-muted-foreground mt-1">Actions across the system will appear here</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="hover-lift">
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
    </PageTransition>
  );
}
