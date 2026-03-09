import { useState } from "react";
import { PageTransition } from "@/components/motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Users, Handshake, Activity, Lightbulb, BarChart3, Target,
  Plus, Phone, Mail, Building2, Search, CheckCircle2, Clock,
  AlertTriangle, TrendingUp, ArrowRight, DollarSign, Calendar
} from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

// Dummy data for preview
const dummyContacts = [
  { id: "ct1", full_name: "Sarah Chen", email: "sarah@techcorp.sg", phone: "+65 9123 4567", company_name: "TechCorp SG", status: "qualified", lead_source: "google_ads", created_at: "2026-02-15" },
  { id: "ct2", full_name: "James Tan", email: "james@homefix.sg", phone: "+65 8234 5678", company_name: "HomeFix Services", status: "new", lead_source: "seo", created_at: "2026-03-01" },
  { id: "ct3", full_name: "Michelle Lee", email: "michelle@greenco.sg", phone: "+65 9345 6789", company_name: "GreenCo", status: "proposal", lead_source: "gbp", created_at: "2026-02-20" },
  { id: "ct4", full_name: "David Wong", email: "david@startupx.io", phone: "+65 8456 7890", company_name: "StartupX", status: "won", lead_source: "referral", created_at: "2026-01-10" },
  { id: "ct5", full_name: "Rachel Ng", email: "rachel@retailplus.sg", phone: "+65 9567 8901", company_name: "RetailPlus", status: "contacted", lead_source: "website_form", created_at: "2026-03-05" },
  { id: "ct6", full_name: "Kevin Lim", email: "kevin@buildpro.sg", phone: "+65 8678 9012", company_name: "BuildPro", status: "lost", lead_source: "linkedin", created_at: "2026-01-28" },
];

const dummyDeals = [
  { id: "d1", deal_name: "TechCorp SEO Package", deal_value: 12000, deal_stage: "proposal_sent", contact_name: "Sarah Chen", expected_close_date: "2026-04-15", pipeline_name: "default" },
  { id: "d2", deal_name: "HomeFix Content Strategy", deal_value: 4500, deal_stage: "lead", contact_name: "James Tan", expected_close_date: "2026-05-01", pipeline_name: "default" },
  { id: "d3", deal_name: "GreenCo Full Service", deal_value: 24000, deal_stage: "negotiation", contact_name: "Michelle Lee", expected_close_date: "2026-03-30", pipeline_name: "default" },
  { id: "d4", deal_name: "StartupX Growth Plan", deal_value: 8000, deal_stage: "won", contact_name: "David Wong", won_date: "2026-02-28", pipeline_name: "default" },
  { id: "d5", deal_name: "RetailPlus Local SEO", deal_value: 3200, deal_stage: "qualified", contact_name: "Rachel Ng", expected_close_date: "2026-04-20", pipeline_name: "default" },
  { id: "d6", deal_name: "BuildPro Ads Campaign", deal_value: 6500, deal_stage: "lost", contact_name: "Kevin Lim", pipeline_name: "default", lost_reason: "Budget constraints" },
];

const dummyActivities = [
  { id: "a1", activity_type: "call", title: "Follow up call with Sarah", contact_name: "Sarah Chen", due_date: "2026-03-10", completed_at: null },
  { id: "a2", activity_type: "email", title: "Send proposal to Michelle", contact_name: "Michelle Lee", due_date: "2026-03-08", completed_at: null },
  { id: "a3", activity_type: "meeting", title: "Strategy session with David", contact_name: "David Wong", due_date: "2026-03-05", completed_at: "2026-03-05" },
  { id: "a4", activity_type: "follow_up", title: "Check in with Rachel", contact_name: "Rachel Ng", due_date: "2026-03-12", completed_at: null },
  { id: "a5", activity_type: "task", title: "Prepare content audit for James", contact_name: "James Tan", due_date: "2026-03-07", completed_at: null },
];

const dummyInsights = [
  { id: "i1", insight_type: "follow_up_overdue", priority: "high", title: "3 overdue follow-ups", description: "Activities past their due date need attention.", recommended_action: "Complete or reschedule overdue activities." },
  { id: "i2", insight_type: "high_value_opportunity", priority: "high", title: "GreenCo deal worth $24K in negotiation", description: "High-value deal approaching expected close date.", recommended_action: "Schedule final negotiation meeting." },
  { id: "i3", insight_type: "high_performing_source", priority: "medium", title: "Google Ads generating most qualified leads", description: "3 out of 5 qualified leads came from Google Ads.", recommended_action: "Consider increasing ads budget." },
  { id: "i4", insight_type: "stale_pipeline", priority: "medium", title: "2 contacts haven't been updated in 14+ days", description: "Some contacts may need attention or archiving.", recommended_action: "Review and follow up on stale contacts." },
];

const dummyAttribution = {
  byChannel: [
    { channel: "google_ads", total_credit: 3.5, contacts: 4 },
    { channel: "seo", total_credit: 2.0, contacts: 3 },
    { channel: "gbp", total_credit: 1.5, contacts: 2 },
    { channel: "referral", total_credit: 1.0, contacts: 1 },
    { channel: "direct", total_credit: 0.5, contacts: 1 },
  ],
  dealAttribution: [
    { channel: "google_ads", attributed_revenue: 18500, deals: 2 },
    { channel: "seo", attributed_revenue: 12000, deals: 2 },
    { channel: "gbp", attributed_revenue: 8000, deals: 1 },
    { channel: "referral", attributed_revenue: 4500, deals: 1 },
  ],
};

const DEAL_STAGES = ["lead", "qualified", "proposal_sent", "negotiation", "won", "lost"] as const;
const STAGE_COLORS: Record<string, string> = {
  lead: "bg-muted text-muted-foreground",
  qualified: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  proposal_sent: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  negotiation: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  won: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  lost: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};
const CONTACT_STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  contacted: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
  qualified: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  proposal: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  won: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  lost: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  archived: "bg-muted text-muted-foreground",
};
const CHANNEL_COLORS: Record<string, string> = {
  google_ads: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  seo: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  gbp: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  referral: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  direct: "bg-muted text-muted-foreground",
  website_form: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
  linkedin: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  facebook: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
};
const ACTIVITY_ICONS: Record<string, typeof Phone> = {
  call: Phone, email: Mail, meeting: Users, follow_up: Clock, task: CheckCircle2, note: Activity,
};
const INSIGHT_COLORS: Record<string, string> = {
  high: "border-l-red-500", medium: "border-l-amber-500", low: "border-l-blue-500",
};

function formatCurrency(val: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(val);
}

export default function CRM() {
  const [activeTab, setActiveTab] = useState("overview");
  const [contactSearch, setContactSearch] = useState("");

  const totalPipeline = dummyDeals
    .filter(d => !["won", "lost"].includes(d.deal_stage))
    .reduce((s, d) => s + d.deal_value, 0);
  const totalWon = dummyDeals
    .filter(d => d.deal_stage === "won")
    .reduce((s, d) => s + d.deal_value, 0);
  const overdueCount = dummyActivities.filter(a => !a.completed_at && new Date(a.due_date!) < new Date()).length;

  const filteredContacts = dummyContacts.filter(c =>
    c.full_name.toLowerCase().includes(contactSearch.toLowerCase()) ||
    c.email.toLowerCase().includes(contactSearch.toLowerCase()) ||
    c.company_name.toLowerCase().includes(contactSearch.toLowerCase())
  );

  return (
    <PageTransition className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">CRM</h1>
          <p className="text-muted-foreground mt-1">Manage contacts, deals, and track lead attribution</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Target className="mr-2 h-4 w-4" /> Capture Lead
          </Button>
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" /> New Contact
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted/50 border">
          <TabsTrigger value="overview" className="gap-1.5"><BarChart3 className="h-3.5 w-3.5" /> Overview</TabsTrigger>
          <TabsTrigger value="contacts" className="gap-1.5"><Users className="h-3.5 w-3.5" /> Contacts</TabsTrigger>
          <TabsTrigger value="deals" className="gap-1.5"><Handshake className="h-3.5 w-3.5" /> Deals</TabsTrigger>
          <TabsTrigger value="pipeline" className="gap-1.5"><Target className="h-3.5 w-3.5" /> Pipeline</TabsTrigger>
          <TabsTrigger value="activities" className="gap-1.5"><Activity className="h-3.5 w-3.5" /> Activities</TabsTrigger>
          <TabsTrigger value="insights" className="gap-1.5"><Lightbulb className="h-3.5 w-3.5" /> Insights</TabsTrigger>
          <TabsTrigger value="attribution" className="gap-1.5"><TrendingUp className="h-3.5 w-3.5" /> Attribution</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-l-4 border-l-[hsl(var(--crm-primary))]">
              <CardHeader className="pb-2">
                <CardDescription className="text-xs uppercase tracking-wider font-medium">Total Contacts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{dummyContacts.length}</div>
                <p className="text-xs text-muted-foreground mt-1">{dummyContacts.filter(c => c.status === "new").length} new this month</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-[hsl(var(--crm-primary))]">
              <CardHeader className="pb-2">
                <CardDescription className="text-xs uppercase tracking-wider font-medium">Pipeline Value</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{formatCurrency(totalPipeline)}</div>
                <p className="text-xs text-muted-foreground mt-1">{dummyDeals.filter(d => !["won","lost"].includes(d.deal_stage)).length} active deals</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-emerald-500">
              <CardHeader className="pb-2">
                <CardDescription className="text-xs uppercase tracking-wider font-medium">Won Revenue</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(totalWon)}</div>
                <p className="text-xs text-muted-foreground mt-1">{dummyDeals.filter(d => d.deal_stage === "won").length} deals closed</p>
              </CardContent>
            </Card>
            <Card className={`border-l-4 ${overdueCount > 0 ? "border-l-red-500" : "border-l-muted"}`}>
              <CardHeader className="pb-2">
                <CardDescription className="text-xs uppercase tracking-wider font-medium">Overdue Tasks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold ${overdueCount > 0 ? "text-red-600 dark:text-red-400" : "text-foreground"}`}>{overdueCount}</div>
                <p className="text-xs text-muted-foreground mt-1">{dummyActivities.filter(a => !a.completed_at).length} total pending</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent + Insights side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Contacts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {dummyContacts.slice(0, 4).map(c => (
                  <div key={c.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-[hsl(var(--crm-primary))]/10 flex items-center justify-center text-[hsl(var(--crm-primary))] font-semibold text-sm">
                        {c.full_name.split(" ").map(n => n[0]).join("")}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{c.full_name}</p>
                        <p className="text-xs text-muted-foreground">{c.company_name}</p>
                      </div>
                    </div>
                    <Badge className={`${CONTACT_STATUS_COLORS[c.status]} border-0 text-xs`}>{c.status}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Top Insights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {dummyInsights.slice(0, 4).map(ins => (
                  <div key={ins.id} className={`p-3 rounded-lg border-l-4 ${INSIGHT_COLORS[ins.priority]} bg-muted/20`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">{ins.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{ins.recommended_action}</p>
                      </div>
                      <Badge variant="outline" className="text-xs shrink-0">{ins.priority}</Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Source breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Lead Source Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {dummyAttribution.byChannel.map(ch => (
                  <div key={ch.channel} className="text-center p-4 rounded-lg bg-muted/30">
                    <Badge className={`${CHANNEL_COLORS[ch.channel] || "bg-muted text-muted-foreground"} border-0 mb-2`}>{ch.channel.replace("_", " ")}</Badge>
                    <p className="text-2xl font-bold text-foreground">{ch.contacts}</p>
                    <p className="text-xs text-muted-foreground">contacts</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contacts Tab */}
        <TabsContent value="contacts" className="space-y-4 mt-6">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search contacts..." className="pl-9" value={contactSearch} onChange={e => setContactSearch(e.target.value)} />
            </div>
            <Select defaultValue="all">
              <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="qualified">Qualified</SelectItem>
                <SelectItem value="won">Won</SelectItem>
                <SelectItem value="lost">Lost</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm"><Plus className="mr-2 h-4 w-4" /> Add Contact</Button>
          </div>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contact</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Added</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContacts.map(c => (
                  <TableRow key={c.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-[hsl(var(--crm-primary))]/10 flex items-center justify-center text-[hsl(var(--crm-primary))] font-semibold text-xs">
                          {c.full_name.split(" ").map(n => n[0]).join("")}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{c.full_name}</p>
                          <p className="text-xs text-muted-foreground">{c.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{c.company_name}</TableCell>
                    <TableCell><Badge className={`${CHANNEL_COLORS[c.lead_source] || "bg-muted text-muted-foreground"} border-0 text-xs`}>{c.lead_source.replace("_", " ")}</Badge></TableCell>
                    <TableCell><Badge className={`${CONTACT_STATUS_COLORS[c.status]} border-0 text-xs`}>{c.status}</Badge></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Deals Tab */}
        <TabsContent value="deals" className="space-y-4 mt-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{dummyDeals.length} deals · {formatCurrency(totalPipeline)} in pipeline</p>
            <Button size="sm"><Plus className="mr-2 h-4 w-4" /> New Deal</Button>
          </div>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Deal</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Expected Close</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dummyDeals.map(d => (
                  <TableRow key={d.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="font-medium text-sm">{d.deal_name}</TableCell>
                    <TableCell className="text-sm">{d.contact_name}</TableCell>
                    <TableCell className="font-semibold text-sm">{formatCurrency(d.deal_value)}</TableCell>
                    <TableCell><Badge className={`${STAGE_COLORS[d.deal_stage]} border-0 text-xs`}>{d.deal_stage.replace("_", " ")}</Badge></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{d.expected_close_date ? new Date(d.expected_close_date).toLocaleDateString() : "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Pipeline (Kanban) Tab */}
        <TabsContent value="pipeline" className="mt-6">
          <div className="flex gap-4 overflow-x-auto pb-4">
            {DEAL_STAGES.filter(s => s !== "lost").map(stage => {
              const stageDeals = dummyDeals.filter(d => d.deal_stage === stage);
              const stageTotal = stageDeals.reduce((s, d) => s + d.deal_value, 0);
              return (
                <div key={stage} className="min-w-[260px] flex-1">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Badge className={`${STAGE_COLORS[stage]} border-0 text-xs`}>{stage.replace("_", " ")}</Badge>
                      <span className="text-xs text-muted-foreground">({stageDeals.length})</span>
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">{formatCurrency(stageTotal)}</span>
                  </div>
                  <div className="space-y-2">
                    {stageDeals.length === 0 && (
                      <div className="p-6 rounded-lg border border-dashed border-muted-foreground/20 text-center">
                        <p className="text-xs text-muted-foreground">No deals</p>
                      </div>
                    )}
                    {stageDeals.map(deal => (
                      <Card key={deal.id} className="cursor-pointer hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <p className="font-medium text-sm text-foreground">{deal.deal_name}</p>
                          <p className="text-xs text-muted-foreground mt-1">{deal.contact_name}</p>
                          <div className="flex items-center justify-between mt-3">
                            <span className="text-sm font-bold text-foreground">{formatCurrency(deal.deal_value)}</span>
                            {deal.expected_close_date && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Calendar className="h-3 w-3" />{new Date(deal.expected_close_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                              </span>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

        {/* Activities Tab */}
        <TabsContent value="activities" className="space-y-4 mt-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{dummyActivities.filter(a => !a.completed_at).length} pending · {overdueCount} overdue</p>
            <Button size="sm"><Plus className="mr-2 h-4 w-4" /> Add Activity</Button>
          </div>
          <div className="space-y-2">
            {dummyActivities.map(a => {
              const Icon = ACTIVITY_ICONS[a.activity_type] || Activity;
              const isOverdue = !a.completed_at && a.due_date && new Date(a.due_date) < new Date();
              return (
                <Card key={a.id} className={`${isOverdue ? "border-red-200 dark:border-red-800/50" : ""}`}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${a.completed_at ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" : isOverdue ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" : "bg-muted text-muted-foreground"}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className={`text-sm font-medium ${a.completed_at ? "line-through text-muted-foreground" : "text-foreground"}`}>{a.title}</p>
                        <p className="text-xs text-muted-foreground">{a.contact_name} · {a.activity_type}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {isOverdue && <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-0 text-xs">Overdue</Badge>}
                      {a.due_date && <span className="text-xs text-muted-foreground">{new Date(a.due_date).toLocaleDateString()}</span>}
                      {!a.completed_at && (
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                          <CheckCircle2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-4 mt-6">
          <div className="grid gap-3">
            {dummyInsights.map(ins => (
              <Card key={ins.id} className={`border-l-4 ${INSIGHT_COLORS[ins.priority]}`}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${ins.priority === "high" ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" : ins.priority === "medium" ? "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" : "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"}`}>
                        {ins.priority === "high" ? <AlertTriangle className="h-4 w-4" /> : <Lightbulb className="h-4 w-4" />}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{ins.title}</p>
                        <p className="text-sm text-muted-foreground mt-0.5">{ins.description}</p>
                        {ins.recommended_action && (
                          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                            <ArrowRight className="h-3 w-3" /> {ins.recommended_action}
                          </p>
                        )}
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs shrink-0">{ins.priority}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Attribution Tab */}
        <TabsContent value="attribution" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Leads by Channel</CardTitle>
                <CardDescription>First-touch attribution</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {dummyAttribution.byChannel.map(ch => (
                  <div key={ch.channel} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-3">
                      <Badge className={`${CHANNEL_COLORS[ch.channel] || "bg-muted text-muted-foreground"} border-0 text-xs`}>{ch.channel.replace("_", " ")}</Badge>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-foreground">{ch.contacts} contacts</p>
                      <p className="text-xs text-muted-foreground">{ch.total_credit.toFixed(1)} credit</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Revenue Attribution</CardTitle>
                <CardDescription>Revenue attributed to each channel</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {dummyAttribution.dealAttribution.map(ch => (
                  <div key={ch.channel} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-3">
                      <Badge className={`${CHANNEL_COLORS[ch.channel] || "bg-muted text-muted-foreground"} border-0 text-xs`}>{ch.channel.replace("_", " ")}</Badge>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-foreground">{formatCurrency(ch.attributed_revenue)}</p>
                      <p className="text-xs text-muted-foreground">{ch.deals} deals</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Total Attribution Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Attribution Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 rounded-lg bg-muted/30">
                  <DollarSign className="h-6 w-6 mx-auto text-emerald-500 mb-2" />
                  <p className="text-2xl font-bold text-foreground">{formatCurrency(dummyAttribution.dealAttribution.reduce((s, d) => s + d.attributed_revenue, 0))}</p>
                  <p className="text-xs text-muted-foreground">Total Attributed Revenue</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/30">
                  <Users className="h-6 w-6 mx-auto text-[hsl(var(--crm-primary))] mb-2" />
                  <p className="text-2xl font-bold text-foreground">{dummyAttribution.byChannel.reduce((s, c) => s + c.contacts, 0)}</p>
                  <p className="text-xs text-muted-foreground">Total Attributed Contacts</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/30">
                  <TrendingUp className="h-6 w-6 mx-auto text-amber-500 mb-2" />
                  <p className="text-2xl font-bold text-foreground">{dummyAttribution.byChannel.length}</p>
                  <p className="text-xs text-muted-foreground">Active Channels</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
