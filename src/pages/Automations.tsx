import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { request } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { FadeIn, StaggerContainer } from "@/components/motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Zap, Plus, Play, Pause, Trash2, ArrowRight, MessageSquare,
  UserPlus, Tag, Mail, Bell, MoreVertical,
} from "lucide-react";

const eventLabels: Record<string, string> = {
  conversation_created: "Conversation Created",
  message_created: "Message Created",
  conversation_status_changed: "Status Changed",
  contact_created: "Contact Created",
  conversation_assigned: "Conversation Assigned",
};

const actionIcons: Record<string, React.ReactNode> = {
  assign: <UserPlus className="h-4 w-4" />,
  add_tag: <Tag className="h-4 w-4" />,
  send_message: <MessageSquare className="h-4 w-4" />,
  send_email: <Mail className="h-4 w-4" />,
  notify: <Bell className="h-4 w-4" />,
};

export default function Automations() {
  const { clientId } = useAuth();
  const [showCreate, setShowCreate] = useState(false);

  const { data: rules = [] } = useQuery<any[]>({
    queryKey: ["automation-rules", clientId],
    queryFn: () => request(`/automations?workspace_id=${clientId}`),
  });

  return (
    <FadeIn>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Automations</h1>
            <p className="text-sm text-muted-foreground mt-1">Create rules to automate conversation routing, tagging, and notifications</p>
          </div>
          <Button onClick={() => setShowCreate(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Create Rule
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Total Rules", value: rules.length, icon: Zap },
            { label: "Active", value: rules.filter((r: any) => r.is_active).length, icon: Play },
            { label: "Paused", value: rules.filter((r: any) => !r.is_active).length, icon: Pause },
            { label: "Executions (30d)", value: rules.reduce((s: number, r: any) => s + (r.execution_count || 0), 0), icon: ArrowRight },
          ].map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <stat.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Rules List */}
        <StaggerContainer className="space-y-3">
          {rules.map((rule: any) => (
            <FadeIn key={rule.id}>
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${rule.is_active ? "bg-green-500/10" : "bg-muted"}`}>
                          <Zap className={`h-4 w-4 ${rule.is_active ? "text-green-500" : "text-muted-foreground"}`} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">{rule.name}</h3>
                          {rule.description && <p className="text-xs text-muted-foreground">{rule.description}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-3 text-xs">
                        <Badge variant="outline" className="gap-1">
                          <span className="text-muted-foreground">When:</span>
                          {eventLabels[rule.event_type] || rule.event_type}
                        </Badge>
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        {(rule.actions || []).map((action: any, i: number) => (
                          <Badge key={i} variant="secondary" className="gap-1">
                            {actionIcons[action.type] || <Zap className="h-3 w-3" />}
                            {action.type?.replace(/_/g, " ")}
                          </Badge>
                        ))}
                        {rule.execution_count > 0 && (
                          <span className="text-muted-foreground ml-2">Ran {rule.execution_count} times</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={rule.is_active} />
                      <Button size="icon" variant="ghost" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </FadeIn>
          ))}
        </StaggerContainer>
      </div>
    </FadeIn>
  );
}
