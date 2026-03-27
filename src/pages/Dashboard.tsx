import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PageTransition, StaggerContainer, StaggerItem } from "@/components/motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useClients, useCreateClient } from "@/hooks/use-api";
import { SourceBadge } from "@/components/SourceBadge";
import { FreshnessIndicator } from "@/components/FreshnessIndicator";
import {
  Users, TrendingUp, AlertTriangle, ArrowRight,
  BarChart3, Zap, Target, Activity, Plus, RefreshCw, Loader2,
  Shield, FileText, Search, Sparkles, Clock, CheckCircle, Eye
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from "recharts";
import { toast } from "sonner";

function AddClientDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const createClient = useCreateClient();

  const handleSubmit = () => {
    if (!name || !domain) { toast.error("Name and domain are required"); return; }
    createClient.mutate({ name, domain }, {
      onSuccess: () => { toast.success("Client added!"); setOpen(false); setName(""); setDomain(""); },
      onError: () => toast.error("Failed to add client"),
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5"><Plus className="h-3.5 w-3.5" /> Add Client</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Add New Client</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div><Label>Client Name</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="Acme Corp" /></div>
          <div><Label>Domain</Label><Input value={domain} onChange={e => setDomain(e.target.value)} placeholder="acme.com" /></div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={createClient.isPending}>
            {createClient.isPending ? <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Creating...</> : "Add Client"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function generateGrowthTrend(clients: any[]) {
  const weeks = ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5", "Week 6"];
  const baseHealth = clients.length > 0
    ? clients.reduce((s: number, c: any) => s + c.health_score, 0) / clients.length
    : 50;
  return weeks.map((w, i) => ({
    name: w,
    visibility: Math.round(baseHealth + i * 2),
  }));
}

// Mock "what changed" items
const CHANGES = [
  { id: "wc1", text: "3 keywords moved to page 1", source: "rankings", time: new Date(Date.now() - 3600000).toISOString(), type: "positive" as const },
  { id: "wc2", text: "2 critical audit issues detected", source: "audit", time: new Date(Date.now() - 7200000).toISOString(), type: "negative" as const },
  { id: "wc3", text: "Competitor added 3 new service pages", source: "competitor", time: new Date(Date.now() - 14400000).toISOString(), type: "neutral" as const },
  { id: "wc4", text: "Brief 'SEO Agency Singapore' approved", source: "content", time: new Date(Date.now() - 86400000).toISOString(), type: "positive" as const },
];

const PRIORITY_ACTIONS = [
  { id: "pa1", title: "Fix missing meta description on /services", source: "audit", priority: "critical", confidence: 95 },
  { id: "pa2", title: "Create service page for 'web design singapore'", source: "keywords", priority: "high", confidence: 87 },
  { id: "pa3", title: "Add FAQ schema to 3 service pages", source: "audit", priority: "high", confidence: 82 },
  { id: "pa4", title: "Review competitor's new pricing page", source: "competitor", priority: "medium", confidence: 74 },
];

const CHANGE_TYPE_STYLES = {
  positive: "text-emerald-600",
  negative: "text-destructive",
  neutral: "text-muted-foreground",
};

export default function Dashboard() {
  const { data: clients, isLoading, isError } = useClients();
  const navigate = useNavigate();
  const allClients = clients ?? [];

  const avgHealth = allClients.length > 0
    ? Math.round(allClients.reduce((s, c) => s + c.health_score, 0) / allClients.length)
    : 0;
  const totalKeywords = allClients.reduce((s, c) => s + c.keywords_count, 0);
  const growthData = generateGrowthTrend(allClients);

  const stats = [
    { label: "Active Clients", value: allClients.length, icon: Users, border: "border-l-primary" },
    { label: "Keywords Tracked", value: totalKeywords, icon: Search, border: "border-l-seo-primary" },
    { label: "Avg Health Score", value: `${avgHealth}%`, icon: Activity, border: "border-l-status-success" },
    { label: "Pending Actions", value: PRIORITY_ACTIONS.length, icon: Zap, border: "border-l-amber-500" },
  ];

  return (
    <PageTransition className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-md">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">AI Control Tower</h1>
          </div>
          <p className="text-muted-foreground text-sm">
            Your marketing operations at a glance
            {isError && <span className="text-amber-500 ml-2 text-xs">(offline mode)</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <AddClientDialog />
          <Button size="sm" variant="outline" disabled title="Sync requires connected backend">
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Sync
          </Button>
        </div>
      </div>

      {/* KPI Strip */}
      {isLoading ? (
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      ) : (
        <StaggerContainer className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <StaggerItem key={s.label}>
              <Card className={`border-l-4 ${s.border} hover-lift`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">{s.label}</p>
                      <p className="text-2xl font-bold mt-1 text-foreground">{s.value}</p>
                    </div>
                    <div className="h-9 w-9 rounded-xl bg-muted/50 flex items-center justify-center">
                      <s.icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </StaggerItem>
          ))}
        </StaggerContainer>
      )}

      {/* Two-column: What Changed + Priority Actions */}
      <div className="grid gap-4 lg:grid-cols-5">
        {/* What Changed — 2 cols */}
        <Card className="lg:col-span-2 hover-lift">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <div className="h-6 w-6 rounded-lg bg-primary/10 flex items-center justify-center">
                <Clock className="h-3.5 w-3.5 text-primary" />
              </div>
              What Changed
              <Badge variant="outline" className="text-[10px] ml-auto">Last 24h</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {CHANGES.map((c) => (
              <div key={c.id} className="flex items-start gap-2.5 py-2 border-b last:border-0">
                <div className={`h-1.5 w-1.5 rounded-full mt-1.5 shrink-0 ${
                  c.type === "positive" ? "bg-emerald-500" : c.type === "negative" ? "bg-destructive" : "bg-muted-foreground"
                }`} />
                <div className="min-w-0 flex-1">
                  <p className={`text-xs leading-relaxed ${CHANGE_TYPE_STYLES[c.type]}`}>{c.text}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <SourceBadge source={c.source} />
                    <FreshnessIndicator date={c.time} />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Priority Actions — 3 cols */}
        <Card className="lg:col-span-3 hover-lift">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <div className="h-6 w-6 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Target className="h-3.5 w-3.5 text-amber-600" />
              </div>
              Priority Actions
              <Badge variant="destructive" className="text-[10px] ml-auto">{PRIORITY_ACTIONS.filter(a => a.priority === "critical").length} critical</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {PRIORITY_ACTIONS.map((a) => (
              <div key={a.id} className="flex items-center gap-3 p-2.5 rounded-lg border hover:bg-muted/30 transition-colors group cursor-pointer">
                <div className={`h-2 w-2 rounded-full shrink-0 ${
                  a.priority === "critical" ? "bg-destructive" : a.priority === "high" ? "bg-amber-500" : "bg-muted-foreground"
                }`} />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-foreground truncate">{a.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <SourceBadge source={a.source} />
                    <span className="text-[10px] text-muted-foreground font-mono">{a.confidence}% conf</span>
                  </div>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Visibility Trend + Module Quick Links */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 hover-lift">
          <CardHeader className="pb-1">
            <CardTitle className="text-sm flex items-center gap-2">
              <div className="h-6 w-6 rounded-lg bg-primary/10 flex items-center justify-center">
                <TrendingUp className="h-3.5 w-3.5 text-primary" />
              </div>
              Visibility Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            {allClients.length === 0 ? (
              <div className="flex flex-col items-center py-12">
                <div className="h-12 w-12 rounded-2xl bg-muted/50 flex items-center justify-center mb-3">
                  <BarChart3 className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground mb-3">Add a client to see trends</p>
                <AddClientDialog />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={growthData}>
                  <defs>
                    <linearGradient id="visGrad2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(239, 84%, 67%)" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="hsl(239, 84%, 67%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} className="text-muted-foreground" />
                  <YAxis tick={{ fontSize: 10 }} className="text-muted-foreground" />
                  <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", fontSize: 12 }} />
                  <Area type="monotone" dataKey="visibility" stroke="hsl(239, 84%, 67%)" fill="url(#visGrad2)" strokeWidth={2} name="Visibility" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Module Quick Links */}
        <Card className="hover-lift">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <div className="h-6 w-6 rounded-lg bg-muted/50 flex items-center justify-center">
                <Zap className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              Quick Access
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {[
              { label: "Audit", desc: "2 critical issues", icon: Shield, path: "/audit", accent: "text-destructive" },
              { label: "Keywords", desc: "42 tracked", icon: Search, path: "/keyword-research", accent: "text-seo-primary" },
              { label: "Briefs", desc: "1 awaiting approval", icon: FileText, path: "/brief-workflow", accent: "text-content-primary" },
              { label: "Opportunities", desc: "4 new this week", icon: Target, path: "/opportunities", accent: "text-amber-600" },
              { label: "Analytics", desc: "View performance", icon: TrendingUp, path: "/analytics", accent: "text-analytics-primary" },
              { label: "AI Visibility", desc: "Monitor AI mentions", icon: Eye, path: "/ai-visibility", accent: "text-primary" },
            ].map((item) => (
              <Link key={item.path} to={item.path}>
                <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/40 transition-colors group">
                  <item.icon className={`h-4 w-4 ${item.accent} shrink-0`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-foreground">{item.label}</p>
                    <p className="text-[10px] text-muted-foreground">{item.desc}</p>
                  </div>
                  <ArrowRight className="h-3 w-3 text-muted-foreground/30 group-hover:text-primary transition-colors" />
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Client Overview */}
      <Card className="hover-lift">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <div className="h-6 w-6 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="h-3.5 w-3.5 text-primary" />
              </div>
              Client Overview
            </CardTitle>
            <Link to="/clients" className="text-[10px] text-primary font-medium flex items-center gap-1 hover:underline">
              View all <ArrowRight className="h-2.5 w-2.5" />
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}</div>
          ) : allClients.length === 0 ? (
            <div className="flex flex-col items-center py-8">
              <p className="text-xs text-muted-foreground mb-3">No clients yet</p>
              <AddClientDialog />
            </div>
          ) : (
            <div className="space-y-0.5">
              {allClients.map((c) => (
                <Link key={c.id} to={`/clients/${c.id}`}
                  className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-muted/30 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                      {c.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-xs text-foreground group-hover:text-primary transition-colors">{c.name}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">{c.domain}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-[10px] font-mono">{c.keywords_count} kw</Badge>
                    <div className="hidden sm:flex items-center gap-1.5">
                      <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
                        <div className={`h-full rounded-full ${
                          c.health_score >= 80 ? "bg-emerald-500" : c.health_score >= 60 ? "bg-amber-500" : "bg-destructive"
                        }`} style={{ width: `${c.health_score}%` }} />
                      </div>
                      <span className="text-[10px] font-bold text-muted-foreground">{c.health_score}%</span>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-primary transition-all" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </PageTransition>
  );
}
