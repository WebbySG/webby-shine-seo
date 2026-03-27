import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { request } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { FadeIn, StaggerContainer } from "@/components/motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  MessageSquare, Search, Send, Phone, Mail, Globe, Hash,
  Clock, User, ChevronRight, Paperclip, Smile, MoreVertical,
  Filter, Plus, CheckCircle2, AlertCircle, Pause,
} from "lucide-react";

const statusColors: Record<string, string> = {
  open: "bg-green-500/10 text-green-500 border-green-500/20",
  pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  resolved: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  snoozed: "bg-muted text-muted-foreground border-border",
};

const channelIcons: Record<string, React.ReactNode> = {
  live_chat: <MessageSquare className="h-3.5 w-3.5" />,
  email: <Mail className="h-3.5 w-3.5" />,
  whatsapp: <Phone className="h-3.5 w-3.5" />,
  api: <Globe className="h-3.5 w-3.5" />,
};

const priorityColors: Record<string, string> = {
  urgent: "text-red-500",
  high: "text-orange-500",
  medium: "text-yellow-500",
  low: "text-muted-foreground",
};

export default function Inbox() {
  const { clientId } = useAuth();
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: conversations = [] } = useQuery<any[]>({
    queryKey: ["inbox-conversations", clientId],
    queryFn: () => request(`/inbox/conversations?workspace_id=${clientId}`),
  });

  const filteredConversations = conversations.filter((c: any) => {
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    if (searchQuery && !c.subject?.toLowerCase().includes(searchQuery.toLowerCase()) && !c.contact_name?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const handleSendMessage = () => {
    if (!messageInput.trim()) return;
    setMessageInput("");
  };

  return (
    <FadeIn>
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Conversation List */}
        <div className="w-80 border-r border-border flex flex-col bg-card">
          <div className="p-4 border-b border-border space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">Inbox</h2>
              <Button size="sm" variant="outline" className="gap-1">
                <Plus className="h-3.5 w-3.5" /> New
              </Button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search conversations..." className="pl-9 h-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
            <div className="flex gap-1">
              {["all", "open", "pending", "resolved"].map((s) => (
                <Button key={s} size="sm" variant={statusFilter === s ? "default" : "ghost"} className="h-7 text-xs capitalize" onClick={() => setStatusFilter(s)}>
                  {s}
                </Button>
              ))}
            </div>
          </div>
          <ScrollArea className="flex-1">
            <div className="divide-y divide-border">
              {filteredConversations.map((conv: any) => (
                <button key={conv.id} onClick={() => setSelectedConversation(conv)}
                  className={`w-full text-left p-4 hover:bg-muted/50 transition-colors ${selectedConversation?.id === conv.id ? "bg-primary/5 border-l-2 border-l-primary" : ""}`}>
                  <div className="flex items-start gap-3">
                    <Avatar className="h-9 w-9 shrink-0">
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">{conv.contact_name?.[0] || "?"}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-sm font-medium truncate text-foreground">{conv.contact_name || "Unknown"}</span>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">{conv.time_ago}</span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{conv.subject || conv.last_message}</p>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <span className="text-muted-foreground">{channelIcons[conv.channel] || channelIcons.live_chat}</span>
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 ${statusColors[conv.status] || ""}`}>{conv.status}</Badge>
                        {conv.priority === "urgent" && <AlertCircle className="h-3 w-3 text-red-500" />}
                        {conv.messages_count > 0 && <span className="text-[10px] text-muted-foreground ml-auto">{conv.messages_count}</span>}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Conversation Detail */}
        <div className="flex-1 flex flex-col">
          {selectedConversation ? (
            <>
              {/* Header */}
              <div className="h-16 px-6 border-b border-border flex items-center justify-between bg-card">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">{selectedConversation.contact_name?.[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{selectedConversation.contact_name}</p>
                    <p className="text-xs text-muted-foreground">{selectedConversation.contact_email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={statusColors[selectedConversation.status]}>{selectedConversation.status}</Badge>
                  <Button size="sm" variant="outline" onClick={() => {}}>
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Resolve
                  </Button>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-6">
                <div className="space-y-4 max-w-3xl mx-auto">
                  {(selectedConversation.messages || []).map((msg: any) => (
                    <div key={msg.id} className={`flex ${msg.message_type === "outgoing" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${msg.message_type === "outgoing" ? "bg-primary text-primary-foreground" : msg.is_private ? "bg-yellow-500/10 border border-yellow-500/20" : "bg-muted"}`}>
                        {msg.is_private && <span className="text-[10px] font-semibold text-yellow-600 block mb-1">🔒 Private Note</span>}
                        <p className="text-sm">{msg.content}</p>
                        <p className={`text-[10px] mt-1 ${msg.message_type === "outgoing" ? "text-primary-foreground/60" : "text-muted-foreground"}`}>{msg.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Input */}
              <div className="border-t border-border p-4 bg-card">
                <div className="flex items-end gap-2 max-w-3xl mx-auto">
                  <div className="flex-1 relative">
                    <Textarea placeholder="Type a message... (/ for canned responses)" className="min-h-[44px] max-h-32 resize-none pr-20" value={messageInput} onChange={(e) => setMessageInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }} />
                    <div className="absolute right-2 bottom-2 flex gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7"><Paperclip className="h-3.5 w-3.5" /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7"><Smile className="h-3.5 w-3.5" /></Button>
                    </div>
                  </div>
                  <Button size="icon" className="h-11 w-11 shrink-0" onClick={handleSendMessage}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center">
              <div>
                <MessageSquare className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-1">Select a conversation</h3>
                <p className="text-sm text-muted-foreground">Choose a conversation from the left to start messaging</p>
              </div>
            </div>
          )}
        </div>

        {/* Contact Sidebar */}
        {selectedConversation && (
          <div className="w-72 border-l border-border bg-card p-4 space-y-4 overflow-auto">
            <div className="text-center">
              <Avatar className="h-16 w-16 mx-auto mb-2">
                <AvatarFallback className="text-lg bg-primary/10 text-primary">{selectedConversation.contact_name?.[0]}</AvatarFallback>
              </Avatar>
              <h3 className="font-semibold text-foreground">{selectedConversation.contact_name}</h3>
              <p className="text-xs text-muted-foreground">{selectedConversation.contact_email}</p>
            </div>
            <Separator />
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Details</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Channel</span><span className="text-foreground capitalize">{selectedConversation.channel}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Priority</span><span className={priorityColors[selectedConversation.priority] || "text-foreground"}>{selectedConversation.priority}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Assignee</span><span className="text-foreground">{selectedConversation.assignee_name || "Unassigned"}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Messages</span><span className="text-foreground">{selectedConversation.messages_count}</span></div>
              </div>
            </div>
            <Separator />
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tags</h4>
              <div className="flex flex-wrap gap-1">
                {(selectedConversation.tags || []).map((tag: string) => (
                  <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                ))}
                <Button size="sm" variant="ghost" className="h-6 text-xs"><Plus className="h-3 w-3 mr-1" />Add</Button>
              </div>
            </div>
            <Separator />
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Previous Conversations</h4>
              <p className="text-xs text-muted-foreground">{selectedConversation.previous_count || 0} previous conversations</p>
            </div>
          </div>
        )}
      </div>
    </FadeIn>
  );
}
