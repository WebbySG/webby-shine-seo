import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Shield, Mail, Paintbrush, CreditCard, Settings, UserPlus, Loader2, Trash2, BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

function useWorkspaceUsers(workspaceId: string) {
  const { token } = useAuth();
  return useQuery({
    queryKey: ["workspace-users", workspaceId],
    queryFn: () => fetch(`${API_BASE}/workspaces/${workspaceId}/users`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
    enabled: !!workspaceId && !!token,
  });
}

function useWorkspaceInvites(workspaceId: string) {
  const { token } = useAuth();
  return useQuery({
    queryKey: ["workspace-invites", workspaceId],
    queryFn: () => fetch(`${API_BASE}/workspaces/${workspaceId}/invites`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
    enabled: !!workspaceId && !!token,
  });
}

function useWorkspaceUsage(workspaceId: string) {
  const { token } = useAuth();
  return useQuery({
    queryKey: ["workspace-usage", workspaceId],
    queryFn: () => fetch(`${API_BASE}/workspaces/${workspaceId}/usage`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
    enabled: !!workspaceId && !!token,
  });
}

function useWorkspaceSubscription(workspaceId: string) {
  const { token } = useAuth();
  return useQuery({
    queryKey: ["workspace-subscription", workspaceId],
    queryFn: () => fetch(`${API_BASE}/workspaces/${workspaceId}/subscription`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
    enabled: !!workspaceId && !!token,
  });
}

const ROLE_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  owner: { label: "Owner", variant: "default" },
  admin: { label: "Admin", variant: "default" },
  manager: { label: "Manager", variant: "secondary" },
  seo: { label: "SEO", variant: "outline" },
  content: { label: "Content", variant: "outline" },
  designer: { label: "Designer", variant: "outline" },
  ads: { label: "Ads", variant: "outline" },
  client_admin: { label: "Client Admin", variant: "secondary" },
  client_user: { label: "Client User", variant: "outline" },
  viewer: { label: "Viewer", variant: "outline" },
};

export default function WorkspaceSettings() {
  const { workspace, token, hasPermission } = useAuth();
  const workspaceId = workspace?.id || "";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Settings className="h-6 w-6 text-primary" /> Workspace Settings
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{workspace?.name || "Your Workspace"}</p>
        </div>
      </div>

      <Tabs defaultValue="team" className="space-y-4">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="team" className="gap-1.5"><Users className="h-3.5 w-3.5" /> Team</TabsTrigger>
          <TabsTrigger value="invites" className="gap-1.5"><Mail className="h-3.5 w-3.5" /> Invites</TabsTrigger>
          {hasPermission("manage_branding") && <TabsTrigger value="branding" className="gap-1.5"><Paintbrush className="h-3.5 w-3.5" /> Branding</TabsTrigger>}
          {hasPermission("view_billing") && <TabsTrigger value="usage" className="gap-1.5"><BarChart3 className="h-3.5 w-3.5" /> Usage & Plan</TabsTrigger>}
        </TabsList>

        <TabsContent value="team"><TeamTab workspaceId={workspaceId} /></TabsContent>
        <TabsContent value="invites"><InvitesTab workspaceId={workspaceId} /></TabsContent>
        <TabsContent value="branding"><BrandingTab workspaceId={workspaceId} /></TabsContent>
        <TabsContent value="usage"><UsageTab workspaceId={workspaceId} /></TabsContent>
      </Tabs>
    </div>
  );
}

function TeamTab({ workspaceId }: { workspaceId: string }) {
  const { data: users, isLoading } = useWorkspaceUsers(workspaceId);
  const { token } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();

  const updateRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      await fetch(`${API_BASE}/workspaces/${workspaceId}/users/${userId}/role`, {
        method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ role }),
      });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["workspace-users"] }); toast({ title: "Role updated" }); },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ userId, status }: { userId: string; status: string }) => {
      await fetch(`${API_BASE}/workspaces/${workspaceId}/users/${userId}/status`, {
        method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["workspace-users"] }); toast({ title: "User status updated" }); },
  });

  if (isLoading) return <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>;

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2"><Shield className="h-4 w-4" /> Team Members</CardTitle>
        <CardDescription>{Array.isArray(users) ? users.length : 0} members in this workspace</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.isArray(users) && users.map((u: any) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.full_name}</TableCell>
                  <TableCell className="text-muted-foreground">{u.email}</TableCell>
                  <TableCell>
                    {u.roles?.map((r: string) => {
                      const info = ROLE_LABELS[r] || { label: r, variant: "outline" as const };
                      return <Badge key={r} variant={info.variant} className="mr-1 text-xs">{info.label}</Badge>;
                    })}
                  </TableCell>
                  <TableCell>
                    <Badge variant={u.status === "active" ? "default" : "secondary"} className="text-xs">{u.status}</Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {u.last_login_at ? new Date(u.last_login_at).toLocaleDateString() : "Never"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Select onValueChange={(role) => updateRole.mutate({ userId: u.id, role })}>
                      <SelectTrigger className="h-8 w-28"><SelectValue placeholder="Change role" /></SelectTrigger>
                      <SelectContent>
                        {Object.keys(ROLE_LABELS).map(r => <SelectItem key={r} value={r}>{ROLE_LABELS[r].label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function InvitesTab({ workspaceId }: { workspaceId: string }) {
  const { data: invites, isLoading } = useWorkspaceInvites(workspaceId);
  const { token } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("viewer");

  const sendInvite = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API_BASE}/workspaces/${workspaceId}/invites`, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ email, role }),
      });
      if (!res.ok) { const b = await res.json(); throw new Error(b.error); }
      return res.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["workspace-invites"] }); setOpen(false); setEmail(""); toast({ title: "Invite sent" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  if (isLoading) return <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>;

  return (
    <Card className="border-border/50">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg flex items-center gap-2"><Mail className="h-4 w-4" /> Invitations</CardTitle>
          <CardDescription>Manage pending team invitations</CardDescription>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="button-premium"><UserPlus className="h-4 w-4 mr-2" /> Invite Member</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Invite Team Member</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" placeholder="colleague@agency.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.keys(ROLE_LABELS).filter(r => r !== "owner").map(r => (
                      <SelectItem key={r} value={r}>{ROLE_LABELS[r].label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button className="button-premium" onClick={() => sendInvite.mutate()} disabled={sendInvite.isPending || !email}>
                {sendInvite.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send Invite"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Expires</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.isArray(invites) && invites.map((inv: any) => (
              <TableRow key={inv.id}>
                <TableCell className="font-medium">{inv.email}</TableCell>
                <TableCell><Badge variant="outline" className="text-xs">{ROLE_LABELS[inv.role]?.label || inv.role}</Badge></TableCell>
                <TableCell><Badge variant={inv.status === "pending" ? "secondary" : inv.status === "accepted" ? "default" : "destructive"} className="text-xs">{inv.status}</Badge></TableCell>
                <TableCell className="text-xs text-muted-foreground">{new Date(inv.expires_at).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
            {(!Array.isArray(invites) || invites.length === 0) && (
              <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No invitations yet</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function BrandingTab({ workspaceId }: { workspaceId: string }) {
  const { token, workspace } = useAuth();
  const { toast } = useToast();
  const [form, setForm] = useState({
    brand_name: workspace?.brand_name || "",
    logo_url: workspace?.logo_url || "",
    primary_color: workspace?.primary_color || "",
    secondary_color: workspace?.secondary_color || "",
    accent_color: workspace?.accent_color || "",
    support_email: "",
  });

  const saveBranding = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API_BASE}/workspaces/${workspaceId}/branding`, {
        method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to save");
      return res.json();
    },
    onSuccess: () => toast({ title: "Branding updated" }),
    onError: () => toast({ title: "Error saving branding", variant: "destructive" }),
  });

  const update = (key: string, value: string) => setForm(f => ({ ...f, [key]: value }));

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2"><Paintbrush className="h-4 w-4" /> White-Label Branding</CardTitle>
        <CardDescription>Customize the appearance for your workspace and client portals</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Brand Name</Label>
            <Input placeholder="Your Agency Name" value={form.brand_name} onChange={(e) => update("brand_name", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Logo URL</Label>
            <Input placeholder="https://..." value={form.logo_url} onChange={(e) => update("logo_url", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Primary Color (hex)</Label>
            <div className="flex gap-2">
              <Input placeholder="#6366f1" value={form.primary_color} onChange={(e) => update("primary_color", e.target.value)} />
              {form.primary_color && <div className="w-10 h-10 rounded-md border" style={{ backgroundColor: form.primary_color }} />}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Secondary Color (hex)</Label>
            <div className="flex gap-2">
              <Input placeholder="#8b5cf6" value={form.secondary_color} onChange={(e) => update("secondary_color", e.target.value)} />
              {form.secondary_color && <div className="w-10 h-10 rounded-md border" style={{ backgroundColor: form.secondary_color }} />}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Accent Color (hex)</Label>
            <Input placeholder="#06b6d4" value={form.accent_color} onChange={(e) => update("accent_color", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Support Email</Label>
            <Input type="email" placeholder="support@agency.com" value={form.support_email} onChange={(e) => update("support_email", e.target.value)} />
          </div>
        </div>
        <Button className="button-premium" onClick={() => saveBranding.mutate()} disabled={saveBranding.isPending}>
          {saveBranding.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Branding"}
        </Button>
      </CardContent>
    </Card>
  );
}

function UsageTab({ workspaceId }: { workspaceId: string }) {
  const { data: usage, isLoading: usageLoading } = useWorkspaceUsage(workspaceId);
  const { data: subscription, isLoading: subLoading } = useWorkspaceSubscription(workspaceId);

  if (usageLoading || subLoading) return <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full" />)}</div>;

  return (
    <div className="space-y-6">
      {subscription && (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2"><CreditCard className="h-4 w-4" /> Current Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-4">
              <div>
                <span className="text-2xl font-bold">{subscription.plan_name}</span>
                <Badge variant="secondary" className="ml-2">{subscription.status}</Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                ${subscription.monthly_price}/mo · Ends {subscription.ends_at ? new Date(subscription.ends_at).toLocaleDateString() : "—"}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><BarChart3 className="h-4 w-4" /> Usage This Month</CardTitle>
        </CardHeader>
        <CardContent>
          {usage && typeof usage === "object" ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Object.entries(usage).map(([key, val]: [string, any]) => (
                <div key={key} className="rounded-lg border border-border/50 p-4 space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{key.replace(/_/g, " ")}</p>
                  <div className="flex items-end gap-2">
                    <span className="text-2xl font-bold">{val.used}</span>
                    {val.limit !== null && <span className="text-sm text-muted-foreground">/ {val.limit}</span>}
                  </div>
                  {val.limit !== null && (
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.min((val.used / val.limit) * 100, 100)}%` }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">No usage data available yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
