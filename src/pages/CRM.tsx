import { useState } from "react";
import { PageTransition, StaggerContainer, StaggerItem } from "@/components/motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import {
  Users, Handshake, Activity, Lightbulb, BarChart3, Target,
  Plus, Phone, Mail, Building2, Search, CheckCircle2, Clock,
  AlertTriangle, TrendingUp, ArrowRight, DollarSign, Calendar,
  Trash2, Edit, Loader2, RefreshCw, Crosshair
} from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  useClients, useCrmContacts, useCreateCrmContact, useUpdateCrmContact,
  useCrmDeals, useCreateCrmDeal, useUpdateCrmDeal,
  useCrmActivities, useCreateCrmActivity, useCompleteCrmActivity,
  useCaptureLead, useCrmInsights, useRecomputeCrmInsights, useUpdateCrmInsightStatus,
  useAttributionOverview, useAttributionContacts, useAttributionDeals, useRecomputeAttribution,
} from "@/hooks/use-api";
import { useDeleteCrmContact, useDeleteCrmDeal, useDeleteCrmActivity } from "@/hooks/use-api";
import { toast } from "sonner";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

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
  manual: "bg-muted text-muted-foreground",
};
const ACTIVITY_ICONS: Record<string, typeof Phone> = {
  call: Phone, email: Mail, meeting: Users, follow_up: Clock, task: CheckCircle2, note: Activity,
};
const INSIGHT_COLORS: Record<string, string> = {
  high: "border-l-red-500", medium: "border-l-amber-500", low: "border-l-blue-500",
};
const PIE_COLORS = ["hsl(172, 66%, 50%)", "hsl(213, 93%, 67%)", "hsl(43, 96%, 56%)", "hsl(280, 65%, 60%)", "hsl(350, 80%, 60%)", "hsl(160, 60%, 45%)"];

function formatCurrency(val: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(val);
}

// ---- Form Components ----

function ContactFormDialog({ clientId, contact, trigger }: { clientId: string; contact?: any; trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    first_name: contact?.first_name || "", last_name: contact?.last_name || "",
    email: contact?.email || "", phone: contact?.phone || "",
    company_name: contact?.company_name || "", job_title: contact?.job_title || "",
    lead_source: contact?.lead_source || "manual", notes: contact?.notes || "",
  });
  const createContact = useCreateCrmContact(clientId);
  const updateContact = useUpdateCrmContact(clientId);

  const handleSubmit = () => {
    if (!form.first_name.trim() && !form.last_name.trim()) {
      toast.error("Name is required"); return;
    }
    if (contact) {
      updateContact.mutate({ id: contact.id, data: form }, {
        onSuccess: () => { toast.success("Contact updated"); setOpen(false); },
        onError: (e: any) => toast.error(e.message || "Failed"),
      });
    } else {
      createContact.mutate({ ...form, client_id: clientId }, {
        onSuccess: () => { toast.success("Contact created"); setOpen(false); setForm({ first_name: "", last_name: "", email: "", phone: "", company_name: "", job_title: "", lead_source: "manual", notes: "" }); },
        onError: (e: any) => toast.error(e.message || "Failed"),
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{contact ? "Edit Contact" : "New Contact"}</DialogTitle>
          <DialogDescription>Fill in the contact details below.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div><Label className="text-xs">First Name</Label><Input value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} /></div>
          <div><Label className="text-xs">Last Name</Label><Input value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} /></div>
          <div><Label className="text-xs">Email</Label><Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
          <div><Label className="text-xs">Phone</Label><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
          <div><Label className="text-xs">Company</Label><Input value={form.company_name} onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))} /></div>
          <div><Label className="text-xs">Job Title</Label><Input value={form.job_title} onChange={e => setForm(f => ({ ...f, job_title: e.target.value }))} /></div>
          <div className="col-span-2">
            <Label className="text-xs">Lead Source</Label>
            <Select value={form.lead_source} onValueChange={v => setForm(f => ({ ...f, lead_source: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["manual", "seo", "google_ads", "gbp", "referral", "website_form", "linkedin", "facebook", "direct"].map(s => (
                  <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2"><Label className="text-xs">Notes</Label><Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={createContact.isPending || updateContact.isPending}>
            {(createContact.isPending || updateContact.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {contact ? "Update" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DealFormDialog({ clientId, contacts, deal, trigger }: { clientId: string; contacts: any[]; deal?: any; trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    deal_name: deal?.deal_name || "", deal_value: deal?.deal_value || 0,
    deal_stage: deal?.deal_stage || "lead", contact_id: deal?.contact_id || "",
    expected_close_date: deal?.expected_close_date?.split("T")[0] || "",
    notes: deal?.notes || "",
  });
  const createDeal = useCreateCrmDeal(clientId);
  const updateDeal = useUpdateCrmDeal(clientId);

  const handleSubmit = () => {
    if (!form.deal_name.trim()) { toast.error("Deal name is required"); return; }
    const payload = { ...form, deal_value: Number(form.deal_value), client_id: clientId, contact_id: form.contact_id || null, expected_close_date: form.expected_close_date || null };
    if (deal) {
      updateDeal.mutate({ id: deal.id, data: payload }, {
        onSuccess: () => { toast.success("Deal updated"); setOpen(false); },
        onError: (e: any) => toast.error(e.message || "Failed"),
      });
    } else {
      createDeal.mutate(payload, {
        onSuccess: () => { toast.success("Deal created"); setOpen(false); setForm({ deal_name: "", deal_value: 0, deal_stage: "lead", contact_id: "", expected_close_date: "", notes: "" }); },
        onError: (e: any) => toast.error(e.message || "Failed"),
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{deal ? "Edit Deal" : "New Deal"}</DialogTitle>
          <DialogDescription>Enter the deal information.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2"><Label className="text-xs">Deal Name</Label><Input value={form.deal_name} onChange={e => setForm(f => ({ ...f, deal_name: e.target.value }))} /></div>
          <div><Label className="text-xs">Value ($)</Label><Input type="number" value={form.deal_value} onChange={e => setForm(f => ({ ...f, deal_value: e.target.value }))} /></div>
          <div>
            <Label className="text-xs">Stage</Label>
            <Select value={form.deal_stage} onValueChange={v => setForm(f => ({ ...f, deal_stage: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{DEAL_STAGES.map(s => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Contact</Label>
            <Select value={form.contact_id} onValueChange={v => setForm(f => ({ ...f, contact_id: v }))}>
              <SelectTrigger><SelectValue placeholder="Select contact" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {contacts.map(c => <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div><Label className="text-xs">Expected Close</Label><Input type="date" value={form.expected_close_date} onChange={e => setForm(f => ({ ...f, expected_close_date: e.target.value }))} /></div>
          <div className="col-span-2"><Label className="text-xs">Notes</Label><Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={createDeal.isPending || updateDeal.isPending}>
            {(createDeal.isPending || updateDeal.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {deal ? "Update" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ActivityFormDialog({ clientId, contacts, trigger }: { clientId: string; contacts: any[]; trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ activity_type: "task", title: "", description: "", contact_id: "", due_date: "" });
  const createActivity = useCreateCrmActivity(clientId);

  const handleSubmit = () => {
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    createActivity.mutate({ ...form, client_id: clientId, contact_id: form.contact_id || null, due_date: form.due_date || null }, {
      onSuccess: () => { toast.success("Activity created"); setOpen(false); setForm({ activity_type: "task", title: "", description: "", contact_id: "", due_date: "" }); },
      onError: (e: any) => toast.error(e.message || "Failed"),
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Activity</DialogTitle>
          <DialogDescription>Add a new task, call, or follow-up.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div><Label className="text-xs">Title</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Type</Label>
              <Select value={form.activity_type} onValueChange={v => setForm(f => ({ ...f, activity_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["call", "email", "meeting", "follow_up", "task", "note"].map(t => <SelectItem key={t} value={t}>{t.replace("_", " ")}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Due Date</Label><Input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} /></div>
          </div>
          <div>
            <Label className="text-xs">Contact</Label>
            <Select value={form.contact_id} onValueChange={v => setForm(f => ({ ...f, contact_id: v }))}>
              <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {contacts.map(c => <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div><Label className="text-xs">Description</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={createActivity.isPending}>
            {createActivity.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function LeadCaptureDialog({ clientId, trigger }: { clientId: string; trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    first_name: "", last_name: "", email: "", phone: "", company_name: "",
    channel: "website_form", utm_source: "", utm_medium: "", utm_campaign: "",
  });
  const captureLead = useCaptureLead(clientId);

  const handleSubmit = () => {
    if (!form.email && !form.phone) { toast.error("Email or phone is required"); return; }
    captureLead.mutate({ ...form, client_id: clientId, source_type: "manual", event_type: "form_submit" }, {
      onSuccess: () => { toast.success("Lead captured!"); setOpen(false); setForm({ first_name: "", last_name: "", email: "", phone: "", company_name: "", channel: "website_form", utm_source: "", utm_medium: "", utm_campaign: "" }); },
      onError: (e: any) => toast.error(e.message || "Failed"),
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Capture Lead</DialogTitle>
          <DialogDescription>Manually capture a new lead with UTM tracking.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div><Label className="text-xs">First Name</Label><Input value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} /></div>
          <div><Label className="text-xs">Last Name</Label><Input value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} /></div>
          <div><Label className="text-xs">Email</Label><Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
          <div><Label className="text-xs">Phone</Label><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
          <div><Label className="text-xs">Company</Label><Input value={form.company_name} onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))} /></div>
          <div>
            <Label className="text-xs">Channel</Label>
            <Select value={form.channel} onValueChange={v => setForm(f => ({ ...f, channel: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["website_form", "google_ads", "seo", "gbp", "referral", "linkedin", "facebook", "direct"].map(s => (
                  <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div><Label className="text-xs">UTM Source</Label><Input value={form.utm_source} onChange={e => setForm(f => ({ ...f, utm_source: e.target.value }))} placeholder="google" /></div>
          <div><Label className="text-xs">UTM Medium</Label><Input value={form.utm_medium} onChange={e => setForm(f => ({ ...f, utm_medium: e.target.value }))} placeholder="cpc" /></div>
          <div className="col-span-2"><Label className="text-xs">UTM Campaign</Label><Input value={form.utm_campaign} onChange={e => setForm(f => ({ ...f, utm_campaign: e.target.value }))} placeholder="spring_2026" /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={captureLead.isPending}>
            {captureLead.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Capture Lead
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---- Skeleton Loaders ----
function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return <div className="space-y-2 p-4">{Array.from({ length: rows }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}</div>;
}

function KPISkeleton() {
  return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)}</div>;
}

// ---- Main CRM Component ----
export default function CRM() {
  const [activeTab, setActiveTab] = useState("overview");
  const [contactSearch, setContactSearch] = useState("");
  const [selectedClientId, setSelectedClientId] = useState("");
  const { data: clients } = useClients();

  const clientId = selectedClientId || "1";
  const { data: contacts, isLoading: loadingContacts } = useCrmContacts(clientId);
  const { data: deals, isLoading: loadingDeals } = useCrmDeals(clientId);
  const { data: activities, isLoading: loadingActivities } = useCrmActivities(clientId);
  const { data: insights, isLoading: loadingInsights } = useCrmInsights(clientId);
  const { data: attrOverview, isLoading: loadingAttr } = useAttributionOverview(clientId);
  const { data: attrDeals } = useAttributionDeals(clientId);
  const completeActivity = useCompleteCrmActivity(clientId);
  const recomputeInsights = useRecomputeCrmInsights();
  const recomputeAttr = useRecomputeAttribution();
  const updateInsight = useUpdateCrmInsightStatus(clientId);
  const deleteContact = useDeleteCrmContact(clientId);
  const deleteDeal = useDeleteCrmDeal(clientId);
  const deleteActivity = useDeleteCrmActivity(clientId);

  const allContacts = contacts ?? [];
  const allDeals = deals ?? [];
  const allActivities = activities ?? [];
  const allInsights = insights ?? [];
  const attribution = attrOverview ?? { byChannel: [], dealAttribution: [] };

  const totalPipeline = allDeals.filter(d => !["won", "lost"].includes(d.deal_stage)).reduce((s, d) => s + Number(d.deal_value), 0);
  const totalWon = allDeals.filter(d => d.deal_stage === "won").reduce((s, d) => s + Number(d.deal_value), 0);
  const overdueCount = allActivities.filter(a => !a.completed_at && a.due_date && new Date(a.due_date) < new Date()).length;

  const filteredContacts = allContacts.filter(c =>
    (c.full_name || "").toLowerCase().includes(contactSearch.toLowerCase()) ||
    (c.email || "").toLowerCase().includes(contactSearch.toLowerCase()) ||
    (c.company_name || "").toLowerCase().includes(contactSearch.toLowerCase())
  );

  // Chart data
  const stageChartData = DEAL_STAGES.filter(s => s !== "lost").map(stage => ({
    name: stage.replace("_", " "), value: allDeals.filter(d => d.deal_stage === stage).length,
    amount: allDeals.filter(d => d.deal_stage === stage).reduce((s, d) => s + Number(d.deal_value), 0),
  }));

  const channelChartData = attribution.byChannel.map(ch => ({
    name: ch.channel.replace("_", " "), contacts: ch.contacts, credit: Number(ch.total_credit).toFixed(1),
  }));

  const revenueChartData = attribution.dealAttribution.map(ch => ({
    name: ch.channel.replace("_", " "), revenue: Number(ch.attributed_revenue),
  }));

  return (
    <PageTransition className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">CRM</h1>
          <p className="text-muted-foreground mt-1">Manage contacts, deals, and track lead attribution</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={selectedClientId} onValueChange={setSelectedClientId}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Select client" /></SelectTrigger>
            <SelectContent>
              {(clients ?? []).map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <LeadCaptureDialog clientId={clientId} trigger={
            <Button variant="outline" size="sm"><Crosshair className="mr-2 h-4 w-4" /> Capture Lead</Button>
          } />
          <ContactFormDialog clientId={clientId} trigger={
            <Button size="sm"><Plus className="mr-2 h-4 w-4" /> New Contact</Button>
          } />
          <DealFormDialog clientId={clientId} contacts={allContacts} trigger={
            <Button size="sm" variant="secondary"><Handshake className="mr-2 h-4 w-4" /> New Deal</Button>
          } />
          <ActivityFormDialog clientId={clientId} contacts={allContacts} trigger={
            <Button size="sm" variant="outline"><Activity className="mr-2 h-4 w-4" /> Add Activity</Button>
          } />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted/50 border flex-wrap h-auto gap-1">
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
          {loadingContacts ? <KPISkeleton /> : (
            <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StaggerItem><Card className="border-l-4 border-l-[hsl(var(--crm-primary))]">
                <CardHeader className="pb-2"><CardDescription className="text-xs uppercase tracking-wider font-medium">Total Contacts</CardDescription></CardHeader>
                <CardContent><div className="text-3xl font-bold text-foreground">{allContacts.length}</div><p className="text-xs text-muted-foreground mt-1">{allContacts.filter(c => c.status === "new").length} new</p></CardContent>
              </Card></StaggerItem>
              <StaggerItem><Card className="border-l-4 border-l-[hsl(var(--crm-primary))]">
                <CardHeader className="pb-2"><CardDescription className="text-xs uppercase tracking-wider font-medium">Pipeline Value</CardDescription></CardHeader>
                <CardContent><div className="text-3xl font-bold text-foreground">{formatCurrency(totalPipeline)}</div><p className="text-xs text-muted-foreground mt-1">{allDeals.filter(d => !["won","lost"].includes(d.deal_stage)).length} active deals</p></CardContent>
              </Card></StaggerItem>
              <StaggerItem><Card className="border-l-4 border-l-emerald-500">
                <CardHeader className="pb-2"><CardDescription className="text-xs uppercase tracking-wider font-medium">Won Revenue</CardDescription></CardHeader>
                <CardContent><div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(totalWon)}</div><p className="text-xs text-muted-foreground mt-1">{allDeals.filter(d => d.deal_stage === "won").length} deals closed</p></CardContent>
              </Card></StaggerItem>
              <StaggerItem><Card className={`border-l-4 ${overdueCount > 0 ? "border-l-red-500" : "border-l-muted"}`}>
                <CardHeader className="pb-2"><CardDescription className="text-xs uppercase tracking-wider font-medium">Overdue Tasks</CardDescription></CardHeader>
                <CardContent><div className={`text-3xl font-bold ${overdueCount > 0 ? "text-red-600 dark:text-red-400" : "text-foreground"}`}>{overdueCount}</div><p className="text-xs text-muted-foreground mt-1">{allActivities.filter(a => !a.completed_at).length} total pending</p></CardContent>
              </Card></StaggerItem>
            </StaggerContainer>
          )}

          {/* Deal Stage Distribution Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="hover-lift">
              <CardHeader><CardTitle className="text-lg">Deal Stage Distribution</CardTitle></CardHeader>
              <CardContent>
                {allDeals.length === 0 ? (
                  <div className="flex flex-col items-center py-8">
                    <Handshake className="h-8 w-8 text-muted-foreground/40 mb-2" />
                    <p className="text-sm text-muted-foreground">No deals yet.</p>
                    <DealFormDialog clientId={clientId} contacts={allContacts} trigger={<Button size="sm" className="mt-3"><Plus className="mr-2 h-4 w-4" /> Create Deal</Button>} />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={stageChartData}><CartesianGrid strokeDasharray="3 3" className="stroke-border" /><XAxis dataKey="name" tick={{ fontSize: 11 }} className="fill-muted-foreground" /><YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" /><Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} /><Bar dataKey="value" fill="hsl(var(--crm-primary))" radius={[4, 4, 0, 0]} /></BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card className="hover-lift">
              <CardHeader><CardTitle className="text-lg">Top Insights</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {loadingInsights ? <TableSkeleton rows={3} /> : allInsights.length === 0 ? (
                  <div className="flex flex-col items-center py-8">
                    <Lightbulb className="h-8 w-8 text-muted-foreground/40 mb-2" />
                    <p className="text-sm text-muted-foreground">No insights yet.</p>
                    <Button size="sm" className="mt-3" variant="outline" onClick={() => recomputeInsights.mutate(clientId, { onSuccess: () => toast.success("Insights generated") })} disabled={recomputeInsights.isPending}>
                      <RefreshCw className={`mr-2 h-4 w-4 ${recomputeInsights.isPending ? "animate-spin" : ""}`} /> Generate Insights
                    </Button>
                  </div>
                ) : allInsights.slice(0, 4).map(ins => (
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

          {/* Source Breakdown Chart */}
          <Card className="hover-lift">
            <CardHeader><CardTitle className="text-lg">Lead Source Breakdown</CardTitle></CardHeader>
            <CardContent>
              {channelChartData.length === 0 ? (
                <div className="flex flex-col items-center py-8">
                  <TrendingUp className="h-8 w-8 text-muted-foreground/40 mb-2" />
                  <p className="text-sm text-muted-foreground">No attribution data yet.</p>
                  <Button size="sm" className="mt-3" variant="outline" onClick={() => recomputeAttr.mutate(clientId, { onSuccess: () => toast.success("Attribution recomputed") })} disabled={recomputeAttr.isPending}>
                    <RefreshCw className={`mr-2 h-4 w-4 ${recomputeAttr.isPending ? "animate-spin" : ""}`} /> Compute Attribution
                  </Button>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={channelChartData}><CartesianGrid strokeDasharray="3 3" className="stroke-border" /><XAxis dataKey="name" tick={{ fontSize: 11 }} className="fill-muted-foreground" /><YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" /><Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} /><Bar dataKey="contacts" fill="hsl(172, 66%, 50%)" radius={[4, 4, 0, 0]} /></BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contacts Tab */}
        <TabsContent value="contacts" className="space-y-4 mt-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search contacts..." className="pl-9" value={contactSearch} onChange={e => setContactSearch(e.target.value)} />
            </div>
            <ContactFormDialog clientId={clientId} trigger={<Button size="sm"><Plus className="mr-2 h-4 w-4" /> Add Contact</Button>} />
          </div>
          <Card>
            {loadingContacts ? <TableSkeleton /> : filteredContacts.length === 0 ? (
              <div className="flex flex-col items-center py-12">
                <Users className="h-10 w-10 text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground font-medium">No contacts yet</p>
                <ContactFormDialog clientId={clientId} trigger={<Button size="sm" className="mt-3"><Plus className="mr-2 h-4 w-4" /> New Contact</Button>} />
              </div>
            ) : (
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Contact</TableHead><TableHead className="hidden md:table-cell">Company</TableHead><TableHead className="hidden sm:table-cell">Source</TableHead><TableHead>Status</TableHead><TableHead className="hidden lg:table-cell">Added</TableHead><TableHead className="w-16" />
                </TableRow></TableHeader>
                <TableBody>
                  {filteredContacts.map(c => (
                    <TableRow key={c.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-[hsl(var(--crm-primary))]/10 flex items-center justify-center text-[hsl(var(--crm-primary))] font-semibold text-xs shrink-0">
                            {(c.full_name || "?").split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">{c.full_name}</p>
                            <p className="text-xs text-muted-foreground truncate">{c.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm hidden md:table-cell">{c.company_name || "—"}</TableCell>
                      <TableCell className="hidden sm:table-cell"><Badge className={`${CHANNEL_COLORS[c.lead_source || ""] || "bg-muted text-muted-foreground"} border-0 text-xs`}>{(c.lead_source || "—").replace("_", " ")}</Badge></TableCell>
                      <TableCell><Badge className={`${CONTACT_STATUS_COLORS[c.status] || "bg-muted text-muted-foreground"} border-0 text-xs`}>{c.status}</Badge></TableCell>
                      <TableCell className="text-sm text-muted-foreground hidden lg:table-cell">{new Date(c.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <ContactFormDialog clientId={clientId} contact={c} trigger={<Button variant="ghost" size="sm" className="h-7 w-7 p-0"><Edit className="h-3.5 w-3.5" /></Button>} />
                          <AlertDialog>
                            <AlertDialogTrigger asChild><Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button></AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader><AlertDialogTitle>Delete contact?</AlertDialogTitle><AlertDialogDescription>This will permanently remove {c.full_name}.</AlertDialogDescription></AlertDialogHeader>
                              <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => deleteContact.mutate(c.id, { onSuccess: () => toast.success("Deleted"), onError: () => toast.error("Failed") })}>Delete</AlertDialogAction></AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>

        {/* Deals Tab */}
        <TabsContent value="deals" className="space-y-4 mt-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{allDeals.length} deals · {formatCurrency(totalPipeline)} in pipeline</p>
            <DealFormDialog clientId={clientId} contacts={allContacts} trigger={<Button size="sm"><Plus className="mr-2 h-4 w-4" /> New Deal</Button>} />
          </div>
          <Card>
            {loadingDeals ? <TableSkeleton /> : allDeals.length === 0 ? (
              <div className="flex flex-col items-center py-12">
                <Handshake className="h-10 w-10 text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground font-medium">No deals yet</p>
                <DealFormDialog clientId={clientId} contacts={allContacts} trigger={<Button size="sm" className="mt-3"><Plus className="mr-2 h-4 w-4" /> Create Deal</Button>} />
              </div>
            ) : (
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Deal</TableHead><TableHead className="hidden md:table-cell">Contact</TableHead><TableHead>Value</TableHead><TableHead>Stage</TableHead><TableHead className="hidden lg:table-cell">Expected Close</TableHead><TableHead className="w-16" />
                </TableRow></TableHeader>
                <TableBody>
                  {allDeals.map(d => (
                    <TableRow key={d.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium text-sm">{d.deal_name}</TableCell>
                      <TableCell className="text-sm hidden md:table-cell">{d.contact_name || "—"}</TableCell>
                      <TableCell className="font-semibold text-sm">{formatCurrency(Number(d.deal_value))}</TableCell>
                      <TableCell><Badge className={`${STAGE_COLORS[d.deal_stage]} border-0 text-xs`}>{d.deal_stage.replace("_", " ")}</Badge></TableCell>
                      <TableCell className="text-sm text-muted-foreground hidden lg:table-cell">{d.expected_close_date ? new Date(d.expected_close_date).toLocaleDateString() : "—"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <DealFormDialog clientId={clientId} contacts={allContacts} deal={d} trigger={<Button variant="ghost" size="sm" className="h-7 w-7 p-0"><Edit className="h-3.5 w-3.5" /></Button>} />
                          <AlertDialog>
                            <AlertDialogTrigger asChild><Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button></AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader><AlertDialogTitle>Delete deal?</AlertDialogTitle><AlertDialogDescription>This will permanently remove "{d.deal_name}".</AlertDialogDescription></AlertDialogHeader>
                              <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => deleteDeal.mutate(d.id, { onSuccess: () => toast.success("Deleted"), onError: () => toast.error("Failed") })}>Delete</AlertDialogAction></AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>

        {/* Pipeline (Kanban) Tab */}
        <TabsContent value="pipeline" className="mt-6">
          {loadingDeals ? <div className="flex gap-4">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-64 min-w-[260px] flex-1 rounded-lg" />)}</div> : (
            <div className="flex gap-4 overflow-x-auto pb-4">
              {DEAL_STAGES.filter(s => s !== "lost").map(stage => {
                const stageDeals = allDeals.filter(d => d.deal_stage === stage);
                const stageTotal = stageDeals.reduce((s, d) => s + Number(d.deal_value), 0);
                return (
                  <div key={stage} className="min-w-[240px] sm:min-w-[260px] flex-1">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Badge className={`${STAGE_COLORS[stage]} border-0 text-xs`}>{stage.replace("_", " ")}</Badge>
                        <span className="text-xs text-muted-foreground">({stageDeals.length})</span>
                      </div>
                      <span className="text-xs font-medium text-muted-foreground">{formatCurrency(stageTotal)}</span>
                    </div>
                    <div className="space-y-2 min-h-[100px]">
                      {stageDeals.length === 0 && (
                        <div className="p-6 rounded-lg border border-dashed border-muted-foreground/20 text-center">
                          <p className="text-xs text-muted-foreground">No deals</p>
                        </div>
                      )}
                      {stageDeals.map(deal => (
                        <Card key={deal.id} className="cursor-pointer hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <p className="font-medium text-sm text-foreground">{deal.deal_name}</p>
                            <p className="text-xs text-muted-foreground mt-1">{deal.contact_name || "No contact"}</p>
                            <div className="flex items-center justify-between mt-3">
                              <span className="text-sm font-bold text-foreground">{formatCurrency(Number(deal.deal_value))}</span>
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
          )}
        </TabsContent>

        {/* Activities Tab */}
        <TabsContent value="activities" className="space-y-4 mt-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">{allActivities.filter(a => !a.completed_at).length} pending · {overdueCount} overdue</p>
            <ActivityFormDialog clientId={clientId} contacts={allContacts} trigger={<Button size="sm"><Plus className="mr-2 h-4 w-4" /> Add Activity</Button>} />
          </div>
          {loadingActivities ? <TableSkeleton rows={4} /> : allActivities.length === 0 ? (
            <Card><CardContent className="flex flex-col items-center py-12">
              <Activity className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground font-medium">No activities yet</p>
              <ActivityFormDialog clientId={clientId} contacts={allContacts} trigger={<Button size="sm" className="mt-3"><Plus className="mr-2 h-4 w-4" /> Add Activity</Button>} />
            </CardContent></Card>
          ) : (
            <div className="space-y-2">
              {allActivities.map(a => {
                const Icon = ACTIVITY_ICONS[a.activity_type] || Activity;
                const isOverdue = !a.completed_at && a.due_date && new Date(a.due_date) < new Date();
                return (
                  <Card key={a.id} className={`${isOverdue ? "border-red-200 dark:border-red-800/50" : ""}`}>
                    <CardContent className="p-4 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${a.completed_at ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" : isOverdue ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" : "bg-muted text-muted-foreground"}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className={`text-sm font-medium truncate ${a.completed_at ? "line-through text-muted-foreground" : "text-foreground"}`}>{a.title}</p>
                          <p className="text-xs text-muted-foreground">{a.activity_type}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {isOverdue && <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-0 text-xs hidden sm:inline-flex">Overdue</Badge>}
                        {a.due_date && <span className="text-xs text-muted-foreground hidden sm:inline">{new Date(a.due_date).toLocaleDateString()}</span>}
                        {!a.completed_at && (
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => completeActivity.mutate(a.id, { onSuccess: () => toast.success("Completed!") })}>
                            <CheckCircle2 className="h-4 w-4" />
                          </Button>
                        )}
                        <AlertDialog>
                          <AlertDialogTrigger asChild><Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button></AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>Delete activity?</AlertDialogTitle><AlertDialogDescription>This will remove this activity permanently.</AlertDialogDescription></AlertDialogHeader>
                            <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => deleteActivity.mutate(a.id, { onSuccess: () => toast.success("Deleted") })}>Delete</AlertDialogAction></AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-4 mt-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{allInsights.length} insights</p>
            <Button size="sm" variant="outline" onClick={() => recomputeInsights.mutate(clientId, { onSuccess: (d: any) => toast.success(`${d.insights_generated} insights generated`), onError: () => toast.error("Failed") })} disabled={recomputeInsights.isPending}>
              <RefreshCw className={`mr-2 h-4 w-4 ${recomputeInsights.isPending ? "animate-spin" : ""}`} /> Refresh Insights
            </Button>
          </div>
          {loadingInsights ? <TableSkeleton rows={4} /> : allInsights.length === 0 ? (
            <Card><CardContent className="flex flex-col items-center py-12">
              <Lightbulb className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground font-medium">No insights yet</p>
              <Button size="sm" className="mt-3" onClick={() => recomputeInsights.mutate(clientId, { onSuccess: () => toast.success("Generated!") })} disabled={recomputeInsights.isPending}>
                <RefreshCw className="mr-2 h-4 w-4" /> Generate Insights
              </Button>
            </CardContent></Card>
          ) : (
            <div className="grid gap-3">
              {allInsights.map(ins => (
                <Card key={ins.id} className={`border-l-4 ${INSIGHT_COLORS[ins.priority]}`}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${ins.priority === "high" ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" : ins.priority === "medium" ? "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" : "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"}`}>
                          {ins.priority === "high" ? <AlertTriangle className="h-4 w-4" /> : <Lightbulb className="h-4 w-4" />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground">{ins.title}</p>
                          <p className="text-sm text-muted-foreground mt-0.5">{ins.description}</p>
                          {ins.recommended_action && <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1"><ArrowRight className="h-3 w-3" /> {ins.recommended_action}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="outline" className="text-xs">{ins.priority}</Badge>
                        {ins.status === "open" && (
                          <Button size="sm" variant="outline" onClick={() => updateInsight.mutate({ id: ins.id, status: "reviewed" }, { onSuccess: () => toast.success("Reviewed") })}>
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Attribution Tab */}
        <TabsContent value="attribution" className="space-y-6 mt-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Multi-touch attribution analysis</p>
            <Button size="sm" variant="outline" onClick={() => recomputeAttr.mutate(clientId, { onSuccess: () => toast.success("Attribution recomputed"), onError: () => toast.error("Failed") })} disabled={recomputeAttr.isPending}>
              <RefreshCw className={`mr-2 h-4 w-4 ${recomputeAttr.isPending ? "animate-spin" : ""}`} /> Recompute
            </Button>
          </div>

          {loadingAttr ? <KPISkeleton /> : (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="hover-lift">
                  <CardHeader><CardTitle className="text-lg">Leads by Channel</CardTitle><CardDescription>First-touch attribution</CardDescription></CardHeader>
                  <CardContent>
                    {channelChartData.length === 0 ? (
                      <div className="flex flex-col items-center py-8">
                        <TrendingUp className="h-8 w-8 text-muted-foreground/40 mb-2" />
                        <p className="text-sm text-muted-foreground">No attribution data yet. Click Recompute.</p>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie data={channelChartData} dataKey="contacts" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, contacts }) => `${name}: ${contacts}`}>
                            {channelChartData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                          </Pie>
                          <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
                <Card className="hover-lift">
                  <CardHeader><CardTitle className="text-lg">Revenue Attribution</CardTitle><CardDescription>Revenue attributed to each channel</CardDescription></CardHeader>
                  <CardContent>
                    {revenueChartData.length === 0 ? (
                      <div className="flex flex-col items-center py-8">
                        <DollarSign className="h-8 w-8 text-muted-foreground/40 mb-2" />
                        <p className="text-sm text-muted-foreground">No revenue data yet.</p>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={revenueChartData}><CartesianGrid strokeDasharray="3 3" className="stroke-border" /><XAxis dataKey="name" tick={{ fontSize: 11 }} className="fill-muted-foreground" /><YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} /><Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} formatter={(value: number) => formatCurrency(value)} /><Bar dataKey="revenue" fill="hsl(var(--crm-primary))" radius={[4, 4, 0, 0]} /></BarChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
              </div>

              <Card className="hover-lift">
                <CardHeader><CardTitle className="text-lg">Attribution Summary</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 rounded-lg bg-muted/30">
                      <DollarSign className="h-6 w-6 mx-auto text-emerald-500 mb-2" />
                      <p className="text-2xl font-bold text-foreground">{formatCurrency(attribution.dealAttribution.reduce((s, d) => s + Number(d.attributed_revenue), 0))}</p>
                      <p className="text-xs text-muted-foreground">Total Attributed Revenue</p>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-muted/30">
                      <Users className="h-6 w-6 mx-auto text-[hsl(var(--crm-primary))] mb-2" />
                      <p className="text-2xl font-bold text-foreground">{attribution.byChannel.reduce((s, c) => s + Number(c.contacts), 0)}</p>
                      <p className="text-xs text-muted-foreground">Total Attributed Contacts</p>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-muted/30">
                      <TrendingUp className="h-6 w-6 mx-auto text-amber-500 mb-2" />
                      <p className="text-2xl font-bold text-foreground">{attribution.byChannel.length}</p>
                      <p className="text-xs text-muted-foreground">Active Channels</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </PageTransition>
  );
}
