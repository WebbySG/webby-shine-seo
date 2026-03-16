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
import { RankChangeIndicator } from "@/components/RankChangeIndicator";
import {
  Users, TrendingUp, TrendingDown, AlertTriangle, ArrowRight,
  BarChart3, Zap, Target, Activity, Plus, Calendar, RefreshCw, Loader2
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
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
        <Button size="sm"><Plus className="h-4 w-4 mr-1.5" /> Add Client</Button>
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

// Generate mock trend data from client health scores for visualization
function generateGrowthTrend(clients: any[]) {
  const weeks = ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5", "Week 6"];
  const baseHealth = clients.length > 0
    ? clients.reduce((s, c) => s + c.health_score, 0) / clients.length
    : 50;
  return weeks.map((w, i) => ({
    name: w,
    visibility: Math.round(baseHealth + (i * 2) + (Math.random() * 5 - 2)),
    keywords: Math.round(clients.reduce((s, c) => s + c.keywords_count, 0) * (0.85 + i * 0.03)),
  }));
}

function generateChannelData(clients: any[]) {
  const totalKw = clients.reduce((s, c) => s + c.keywords_count, 0);
  return [
    { name: "Organic SEO", value: Math.round(totalKw * 0.45), fill: "hsl(217, 91%, 60%)" },
    { name: "Content", value: Math.round(totalKw * 0.25), fill: "hsl(263, 70%, 66%)" },
    { name: "Local SEO", value: Math.round(totalKw * 0.15), fill: "hsl(142, 71%, 45%)" },
    { name: "Paid Ads", value: Math.round(totalKw * 0.15), fill: "hsl(38, 92%, 50%)" },
  ];
}

function generateHealthDistribution(clients: any[]) {
  return [
    { name: "Excellent (80+)", value: clients.filter(c => c.health_score >= 80).length, fill: "hsl(142, 71%, 45%)" },
    { name: "Good (60-79)", value: clients.filter(c => c.health_score >= 60 && c.health_score < 80).length, fill: "hsl(38, 92%, 50%)" },
    { name: "Needs Work (<60)", value: clients.filter(c => c.health_score < 60).length, fill: "hsl(0, 84%, 60%)" },
  ].filter(d => d.value > 0);
}

export default function Dashboard() {
  const { data: clients, isLoading, isError } = useClients();
  const navigate = useNavigate();
  const allClients = clients ?? [];

  const avgHealth = allClients.length > 0
    ? Math.round(allClients.reduce((s, c) => s + c.health_score, 0) / allClients.length)
    : 0;
  const totalKeywords = allClients.reduce((s, c) => s + c.keywords_count, 0);

  const growthData = generateGrowthTrend(allClients);
  const channelData = generateChannelData(allClients);
  const healthData = generateHealthDistribution(allClients);

  const stats = [
    { label: "Active Clients", value: allClients.length, icon: Users, color: "from-primary/10 to-primary/5", iconColor: "text-primary", border: "border-l-primary" },
    { label: "Total Keywords", value: totalKeywords, icon: Target, color: "from-seo-background to-seo-background/50", iconColor: "text-seo-primary", border: "border-l-seo-primary" },
    { label: "Avg Health", value: `${avgHealth}%`, icon: TrendingUp, color: "from-emerald-500/10 to-emerald-500/5", iconColor: "text-emerald-500", border: "border-l-emerald-500" },
    { label: "Channels Active", value: 4, icon: BarChart3, color: "from-amber-500/10 to-amber-500/5", iconColor: "text-amber-500", border: "border-l-amber-500" },
  ];

  return (
    <PageTransition className="space-y-8">
      {/* Header with CTAs */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1.5">
            Overview of all SEO operations
            {isError && <span className="text-amber-500 ml-2 text-xs">(offline mode)</span>}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <AddClientDialog />
          <Button size="sm" variant="outline" onClick={() => navigate("/command-center")}>
            <Calendar className="h-4 w-4 mr-1.5" /> Weekly Plan
          </Button>
          <Button size="sm" variant="outline" disabled title="Sync requires connected backend">
            <RefreshCw className="h-4 w-4 mr-1.5" /> Sync Data
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-24 rounded-lg" />)}
        </div>
      ) : (
        <StaggerContainer className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <StaggerItem key={s.label}>
              <Card className={`hover-lift border-l-4 ${s.border} overflow-hidden`}>
                <CardContent className="p-5 relative">
                  <div className={`absolute inset-0 bg-gradient-to-br ${s.color} pointer-events-none`} />
                  <div className="relative flex items-start justify-between">
                    <div>
                      <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">{s.label}</p>
                      <p className="text-3xl font-bold mt-2 text-foreground">{s.value}</p>
                    </div>
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${s.iconColor} bg-background/80 shadow-sm`}>
                      <s.icon className="h-5 w-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </StaggerItem>
          ))}
        </StaggerContainer>
      )}

      {/* Charts Row */}
      {isLoading ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-80 rounded-lg" />
          <Skeleton className="h-80 rounded-lg" />
        </div>
      ) : allClients.length === 0 ? (
        <Card className="hover-lift">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <BarChart3 className="h-8 w-8 text-primary" />
            </div>
            <p className="text-muted-foreground font-medium mb-2">No clients yet</p>
            <p className="text-xs text-muted-foreground mb-4">Add your first client to see performance data</p>
            <AddClientDialog />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Growth Trend Chart */}
          <Card className="hover-lift">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-primary" />
                </div>
                Visibility Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={growthData}>
                  <defs>
                    <linearGradient id="visGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(239, 84%, 67%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(239, 84%, 67%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                  <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" />
                  <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="visibility" stroke="hsl(239, 84%, 67%)" fill="url(#visGrad)" name="Visibility Score" />
                  <Area type="monotone" dataKey="keywords" stroke="hsl(217, 91%, 60%)" fill="transparent" strokeDasharray="5 5" name="Keyword Coverage" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Channel Distribution */}
          <Card className="hover-lift">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <BarChart3 className="h-4 w-4 text-amber-500" />
                </div>
                Channel Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-4">
              <ResponsiveContainer width="50%" height={200}>
                <PieChart>
                  <Pie data={channelData} dataKey="value" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3}>
                    {channelData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2.5 flex-1">
                {channelData.map((ch) => (
                  <div key={ch.name} className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: ch.fill }} />
                    <span className="text-xs text-muted-foreground flex-1">{ch.name}</span>
                    <span className="text-xs font-mono font-semibold text-foreground">{ch.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Health Distribution + Quick Actions */}
      {allClients.length > 0 && (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="hover-lift">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <Activity className="h-4 w-4 text-emerald-500" />
                </div>
                Client Health
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={healthData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={110} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
                  <Bar dataKey="value" name="Clients" radius={[0, 4, 4, 0]}>
                    {healthData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="hover-lift lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Zap className="h-4 w-4 text-primary" />
                </div>
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {[
                  { label: "Command Center", icon: Target, path: "/command-center", desc: "View priorities" },
                  { label: "Rankings", icon: BarChart3, path: "/rankings", desc: "Track positions" },
                  { label: "CRM", icon: Users, path: "/crm", desc: "Manage contacts" },
                  { label: "Analytics", icon: TrendingUp, path: "/analytics", desc: "View performance" },
                  { label: "Google Ads", icon: Zap, path: "/google-ads", desc: "Ad management" },
                  { label: "Creative Assets", icon: Activity, path: "/creative-assets", desc: "AI visuals" },
                ].map((action) => (
                  <Link key={action.path} to={action.path}>
                    <div className="p-3 rounded-lg border hover:bg-muted/40 transition-all hover:shadow-sm group cursor-pointer">
                      <div className="flex items-center gap-2 mb-1">
                        <action.icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        <span className="text-sm font-medium text-foreground">{action.label}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">{action.desc}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Client Overview */}
      <Card className="hover-lift">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="h-4 w-4 text-primary" />
              </div>
              Client Overview
            </CardTitle>
            <Link to="/clients" className="text-xs text-primary font-medium flex items-center gap-1 hover:underline">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}</div>
          ) : allClients.length === 0 ? (
            <div className="flex flex-col items-center py-8">
              <p className="text-sm text-muted-foreground mb-3">No clients added yet</p>
              <AddClientDialog />
            </div>
          ) : (
            <div className="space-y-1">
              {allClients.map((c) => (
                <Link
                  key={c.id}
                  to={`/clients/${c.id}`}
                  className="flex items-center justify-between py-3 px-4 rounded-lg hover:bg-muted/40 transition-all duration-150 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                      {c.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-sm text-foreground group-hover:text-primary transition-colors">{c.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{c.domain}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant="outline" className="text-xs font-mono bg-seo-background text-seo-primary border-seo-border">
                      {c.keywords_count} kw
                    </Badge>
                    <div className="hidden sm:flex items-center gap-2">
                      <div className="h-2 w-20 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            c.health_score >= 80 ? "bg-emerald-500" : c.health_score >= 60 ? "bg-amber-500" : "bg-destructive"
                          }`}
                          style={{ width: `${c.health_score}%` }}
                        />
                      </div>
                      <span className={`text-xs font-bold w-10 text-right ${
                        c.health_score >= 80 ? "text-emerald-600" : c.health_score >= 60 ? "text-amber-600" : "text-destructive"
                      }`}>
                        {c.health_score}%
                      </span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
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
