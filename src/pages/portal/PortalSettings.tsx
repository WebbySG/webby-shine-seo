import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings as SettingsIcon, User, Shield } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";

export default function PortalSettings() {
  const { user, roles, workspace } = useAuth();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
        <SettingsIcon className="h-6 w-6 text-primary" /> Settings
      </h1>

      <Card className="border-border/50">
        <CardHeader><CardTitle className="flex items-center gap-2"><User className="h-4 w-4" /> Profile</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Name</span><span className="font-medium">{user?.full_name}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span className="font-medium">{user?.email}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Workspace</span><span className="font-medium">{workspace?.name}</span></div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardHeader><CardTitle className="flex items-center gap-2"><Shield className="h-4 w-4" /> Roles & Permissions</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {roles.map(r => <Badge key={r} variant="secondary">{r}</Badge>)}
            {roles.length === 0 && <p className="text-sm text-muted-foreground">No roles assigned</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
