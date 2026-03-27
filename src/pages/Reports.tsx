import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useClients, useReportTemplates, useReportRuns, useGenerateReport, useScheduledReports, useCreateScheduledReport } from "@/hooks/use-api";
import { useAuth } from "@/contexts/AuthContext";
import {
  FileText, Plus, Calendar, Download, Share2, Clock, Sparkles,
  BarChart3, TrendingUp, Shield, Megaphone, MapPin, Users, Target,
  CheckCircle2, Send, Eye, Loader2, ExternalLink
} from "lucide-react";
import { toast } from "sonner";
import { format, subDays, startOfMonth, endOfMonth, subMonths } from "date-fns";

const SECTION_ICONS: Record<string, any> = {
  keyword_movement: TrendingUp,
  top_gainers_losers: BarChart3,
  technical_fixes: Shield,
  content_published: FileText,
  gbp_activity: MapPin,
  analytics_performance: BarChart3,
  leads_attribution: Users,
  ads_summary: Megaphone,
  next_priorities: Target,
};

const SECTION_COLORS: Record<string, string> = {
  keyword_movement: "text-seo-primary",
  top_gainers_losers: "text-seo-primary",
  technical_fixes: "text-seo-primary",
  content_published: "text-content-primary",
  gbp_activity: "text-gbp-primary",
  analytics_performance: "text-analytics-primary",
  leads_attribution: "text-analytics-primary",
  ads_summary: "text-ads-primary",
  next_priorities: "text-primary",
};

// Demo data for preview mode
const DEMO_TEMPLATES = [
  { id: "t1", name: "Monthly SEO Report", template_type: "monthly_seo", description: "Comprehensive monthly SEO performance report.", sections: [
    { key: "keyword_movement", title: "Keyword Rankings", enabled: true, order: 1 },
    { key: "top_gainers_losers", title: "Top Gainers & Losers", enabled: true, order: 2 },
    { key: "technical_fixes", title: "Technical Fixes Completed", enabled: true, order: 3 },
    { key: "content_published", title: "Content Published", enabled: true, order: 4 },
    { key: "next_priorities", title: "Next Month Priorities", enabled: true, order: 5 },
  ], is_default: true },
  { id: "t2", name: "Local SEO / GBP Report", template_type: "local_seo", description: "Local SEO with GBP activity and reviews.", sections: [
    { key: "keyword_movement", title: "Local Keyword Rankings", enabled: true, order: 1 },
    { key: "gbp_activity", title: "GBP Activity & Reviews", enabled: true, order: 2 },
    { key: "analytics_performance", title: "Local Traffic Performance", enabled: true, order: 3 },
    { key: "content_published", title: "Content & Posts Published", enabled: true, order: 4 },
    { key: "next_priorities", title: "Next Priorities", enabled: true, order: 5 },
  ], is_default: true },
  { id: "t3", name: "Full Marketing Performance Report", template_type: "full_marketing", description: "Complete report covering SEO, content, GBP, analytics, attribution, and ads.", sections: [
    { key: "keyword_movement", title: "Keyword Rankings", enabled: true, order: 1 },
    { key: "top_gainers_losers", title: "Top Gainers & Losers", enabled: true, order: 2 },
    { key: "technical_fixes", title: "Technical Fixes", enabled: true, order: 3 },
    { key: "content_published", title: "Content Published", enabled: true, order: 4 },
    { key: "gbp_activity", title: "GBP Activity", enabled: true, order: 5 },
    { key: "analytics_performance", title: "Analytics Performance", enabled: true, order: 6 },
    { key: "leads_crm_summary", title: "Leads & CRM Summary", enabled: true, order: 7 },
    { key: "ads_summary", title: "Ads Performance", enabled: true, order: 8 },
    { key: "next_priorities", title: "Next Priorities", enabled: true, order: 9 },
  ], is_default: true },
];

const DEMO_REPORTS = [
  { id: "r1", template_name: "Full Marketing Performance Report", client_name: "Webby Digital", date_from: "2026-02-01", date_to: "2026-02-28", status: "completed", summary: "50 keywords tracked: 18 improved, 5 declined. 4 articles published. 12 new contacts", share_token: "abc123", generated_at: "2026-03-01T09:00:00Z", created_at: "2026-03-01T09:00:00Z" },
  { id: "r2", template_name: "Monthly SEO Report", client_name: "Webby Digital", date_from: "2026-01-01", date_to: "2026-01-31", status: "completed", summary: "50 keywords tracked: 14 improved, 8 declined. 3 articles published", share_token: "def456", generated_at: "2026-02-01T09:00:00Z", created_at: "2026-02-01T09:00:00Z" },
];

const DEMO_CLIENTS = [
  { id: "c1", name: "Webby Digital" },
  { id: "c2", name: "ABC Renovation" },
];

export default function Reports() {
  const [tab, setTab] = useState("builder");
  const { isDemoMode, workspace } = useAuth();

  const clientsQuery = useClients();
  const templatesQuery = useReportTemplates();

  const clients = isDemoMode ? DEMO_CLIENTS : (clientsQuery.data || []);
  const templates = isDemoMode ? DEMO_TEMPLATES : (templatesQuery.data || []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
          <p className="text-sm text-muted-foreground mt-1">Build, schedule, and share client performance reports.</p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="builder" className="gap-1.5"><Sparkles className="h-3.5 w-3.5" /> Report Builder</TabsTrigger>
          <TabsTrigger value="history" className="gap-1.5"><FileText className="h-3.5 w-3.5" /> Generated Reports</TabsTrigger>
          <TabsTrigger value="schedules" className="gap-1.5"><Clock className="h-3.5 w-3.5" /> Scheduled</TabsTrigger>
        </TabsList>

        <TabsContent value="builder" className="mt-6">
          <ReportBuilder clients={clients} templates={templates} isDemoMode={isDemoMode} workspaceId={workspace?.id} />
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <ReportHistory clients={clients} isDemoMode={isDemoMode} />
        </TabsContent>

        <TabsContent value="schedules" className="mt-6">
          <ScheduledReportsTab clients={clients} templates={templates} isDemoMode={isDemoMode} workspaceId={workspace?.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ReportBuilder({ clients, templates, isDemoMode, workspaceId }: { clients: any[]; templates: any[]; isDemoMode: boolean; workspaceId?: string }) {
  const [clientId, setClientId] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [dateRange, setDateRange] = useState("last_month");
  const [sections, setSections] = useState<any[]>([]);
  const [generating, setGenerating] = useState(false);
  const generateReport = useGenerateReport();

  const selectedTemplate = templates.find((t: any) => t.id === templateId);

  const handleTemplateSelect = (id: string) => {
    setTemplateId(id);
    const tmpl = templates.find((t: any) => t.id === id);
    if (tmpl?.sections) {
      setSections(tmpl.sections.map((s: any) => ({ ...s })));
    }
  };

  const toggleSection = (key: string) => {
    setSections(prev => prev.map(s => s.key === key ? { ...s, enabled: !s.enabled } : s));
  };

  const getDateRange = () => {
    const now = new Date();
    if (dateRange === "last_month") {
      const prev = subMonths(now, 1);
      return { from: format(startOfMonth(prev), "yyyy-MM-dd"), to: format(endOfMonth(prev), "yyyy-MM-dd") };
    }
    if (dateRange === "last_30") return { from: format(subDays(now, 30), "yyyy-MM-dd"), to: format(now, "yyyy-MM-dd") };
    if (dateRange === "last_90") return { from: format(subDays(now, 90), "yyyy-MM-dd"), to: format(now, "yyyy-MM-dd") };
    return { from: format(subDays(now, 30), "yyyy-MM-dd"), to: format(now, "yyyy-MM-dd") };
  };

  const handleGenerate = async () => {
    if (!clientId || !templateId) { toast.error("Select a client and template"); return; }
    setGenerating(true);
    try {
      const { from, to } = getDateRange();
      if (isDemoMode) {
        await new Promise(r => setTimeout(r, 1500));
        toast.success("Report generated! Check Generated Reports tab.");
      } else {
        await generateReport.mutateAsync({ workspace_id: workspaceId || "", client_id: clientId, template_id: templateId, date_from: from, date_to: to });
        toast.success("Report generated successfully!");
      }
    } catch (e: any) {
      toast.error(e.message || "Generation failed");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Left: Config */}
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Configure Report</CardTitle>
            <CardDescription>Select a client, template, and date range to build a report.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-sm">Client</Label>
                <Select value={clientId} onValueChange={setClientId}>
                  <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                  <SelectContent>{clients.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Date Range</Label>
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="last_month">Last Month</SelectItem>
                    <SelectItem value="last_30">Last 30 Days</SelectItem>
                    <SelectItem value="last_90">Last 90 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            <div className="space-y-1.5">
              <Label className="text-sm">Report Template</Label>
              <div className="grid gap-3 sm:grid-cols-3">
                {templates.map((t: any) => (
                  <button
                    key={t.id}
                    onClick={() => handleTemplateSelect(t.id)}
                    className={`text-left p-4 rounded-xl border-2 transition-all ${
                      templateId === t.id ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:border-primary/30"
                    }`}
                  >
                    <p className="font-semibold text-sm">{t.name}</p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{t.description}</p>
                    <Badge variant="secondary" className="text-xs mt-2">{t.sections?.length || 0} sections</Badge>
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section Toggles */}
        {sections.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Report Sections</CardTitle>
              <CardDescription>Toggle sections to include or exclude from the report.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {sections.sort((a, b) => a.order - b.order).map((section) => {
                  const Icon = SECTION_ICONS[section.key] || FileText;
                  const color = SECTION_COLORS[section.key] || "text-foreground";
                  return (
                    <div key={section.key} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <Icon className={`h-4 w-4 ${color}`} />
                        <div>
                          <p className="text-sm font-medium">{section.title}</p>
                          <p className="text-xs text-muted-foreground capitalize">{section.key.replace(/_/g, " ")}</p>
                        </div>
                      </div>
                      <Switch checked={section.enabled} onCheckedChange={() => toggleSection(section.key)} />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Right: Preview & Generate */}
      <div className="space-y-6">
        <Card className="sticky top-6">
          <CardHeader>
            <CardTitle className="text-lg">Report Preview</CardTitle>
          </CardHeader>
          <CardContent>
            {!templateId ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm">Select a template to preview</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
                  <p className="font-bold text-sm">{selectedTemplate?.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {clients.find((c: any) => c.id === clientId)?.name || "No client selected"}
                  </p>
                  <p className="text-xs text-muted-foreground">{dateRange === "last_month" ? "Last month" : dateRange === "last_30" ? "Last 30 days" : "Last 90 days"}</p>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Included Sections</p>
                  {sections.filter(s => s.enabled).map((s) => {
                    const Icon = SECTION_ICONS[s.key] || FileText;
                    return (
                      <div key={s.key} className="flex items-center gap-2 text-xs">
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                        <span>{s.title}</span>
                      </div>
                    );
                  })}
                </div>

                <Separator />

                <Button className="w-full" onClick={handleGenerate} disabled={generating || !clientId}>
                  {generating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
                  {generating ? "Generating..." : "Generate Report"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ReportHistory({ clients, isDemoMode }: { clients: any[]; isDemoMode: boolean }) {
  const [selectedClient, setSelectedClient] = useState(clients[0]?.id || "");
  const reportsQuery = useReportRuns(selectedClient);
  const reports = isDemoMode ? DEMO_REPORTS : (reportsQuery.data || []);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Select value={selectedClient} onValueChange={setSelectedClient}>
          <SelectTrigger className="w-64"><SelectValue placeholder="Select client" /></SelectTrigger>
          <SelectContent>{clients.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      {reports.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No reports generated yet</p>
            <p className="text-sm mt-1">Use the Report Builder to create your first report.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {reports.map((report: any) => (
            <Card key={report.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{report.template_name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {format(new Date(report.date_from), "MMM d")} — {format(new Date(report.date_to), "MMM d, yyyy")}
                      </p>
                      {report.summary && <p className="text-xs text-muted-foreground mt-1">{report.summary}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={report.status === "completed" ? "default" : report.status === "generating" ? "secondary" : "destructive"} className="text-xs">
                      {report.status}
                    </Badge>
                    {report.status === "completed" && (
                      <>
                        <Button variant="ghost" size="icon" className="h-8 w-8" title="Share">
                          <Share2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" title="View">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" title="Download PDF">
                          <Download className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function ScheduledReportsTab({ clients, templates, isDemoMode, workspaceId }: { clients: any[]; templates: any[]; isDemoMode: boolean; workspaceId?: string }) {
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState({ client_id: "", template_id: "", schedule_type: "monthly", day_of_month: "1", recipients: "" });
  const scheduledQuery = useScheduledReports(workspaceId || "");
  const createSchedule = useCreateScheduledReport();

  const schedules = isDemoMode ? [
    { id: "s1", client_name: "Webby Digital", template_name: "Full Marketing Performance Report", schedule_type: "monthly", day_of_month: 1, status: "active", next_run_at: "2026-04-01T09:00:00Z", recipients: ["client@webby.com"] },
  ] : (scheduledQuery.data || []);

  const handleCreate = async () => {
    if (!formData.client_id || !formData.template_id) { toast.error("Select client and template"); return; }
    try {
      if (isDemoMode) {
        toast.success("Schedule created!");
        setShowCreate(false);
        return;
      }
      await createSchedule.mutateAsync({
        workspace_id: workspaceId,
        client_id: formData.client_id,
        template_id: formData.template_id,
        schedule_type: formData.schedule_type,
        day_of_month: parseInt(formData.day_of_month),
        recipients: formData.recipients.split(",").map(e => e.trim()).filter(Boolean),
      });
      toast.success("Schedule created!");
      setShowCreate(false);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Automatically generate and send reports on a schedule.</p>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1.5" /> New Schedule</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Scheduled Report</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="space-y-1.5">
                <Label>Client</Label>
                <Select value={formData.client_id} onValueChange={v => setFormData(p => ({ ...p, client_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                  <SelectContent>{clients.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Report Template</Label>
                <Select value={formData.template_id} onValueChange={v => setFormData(p => ({ ...p, template_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select template" /></SelectTrigger>
                  <SelectContent>{templates.map((t: any) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid gap-4 grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Frequency</Label>
                  <Select value={formData.schedule_type} onValueChange={v => setFormData(p => ({ ...p, schedule_type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Day of Month</Label>
                  <Input type="number" min={1} max={28} value={formData.day_of_month} onChange={e => setFormData(p => ({ ...p, day_of_month: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Recipients (comma-separated emails)</Label>
                <Input placeholder="client@example.com" value={formData.recipients} onChange={e => setFormData(p => ({ ...p, recipients: e.target.value }))} />
              </div>
              <Button className="w-full" onClick={handleCreate}>
                <Calendar className="h-4 w-4 mr-2" /> Create Schedule
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {schedules.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No scheduled reports</p>
            <p className="text-sm mt-1">Create a schedule to automatically generate reports.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {schedules.map((s: any) => (
            <Card key={s.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Clock className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{s.template_name}</p>
                      <p className="text-xs text-muted-foreground">{s.client_name} • {s.schedule_type} on day {s.day_of_month}</p>
                      {s.next_run_at && <p className="text-xs text-muted-foreground">Next: {format(new Date(s.next_run_at), "MMM d, yyyy")}</p>}
                    </div>
                  </div>
                  <Badge variant={s.status === "active" ? "default" : "secondary"}>{s.status}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
