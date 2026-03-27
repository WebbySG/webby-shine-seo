import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { request } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { FadeIn, StaggerContainer } from "@/components/motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Link2, ExternalLink, TrendingUp, TrendingDown, Shield, Search,
  Plus, Download, RefreshCw, ArrowUpRight, AlertTriangle,
} from "lucide-react";

export default function Backlinks() {
  const { clientId } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: backlinks = [] } = useQuery({
    queryKey: ["backlinks", clientId],
    queryFn: () => request(`/clients/${clientId}/backlinks`),
  });

  const { data: summary } = useQuery({
    queryKey: ["backlinks-summary", clientId],
    queryFn: () => request(`/clients/${clientId}/backlinks/summary`),
  });

  const filteredBacklinks = backlinks.filter((b: any) =>
    !searchQuery || b.source_url?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.anchor_text?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const linkTypeColors: Record<string, string> = {
    dofollow: "bg-green-500/10 text-green-500",
    nofollow: "bg-yellow-500/10 text-yellow-500",
    ugc: "bg-blue-500/10 text-blue-500",
    sponsored: "bg-purple-500/10 text-purple-500",
  };

  const statusColors: Record<string, string> = {
    active: "bg-green-500/10 text-green-500",
    lost: "bg-red-500/10 text-red-500",
    broken: "bg-orange-500/10 text-orange-500",
  };

  return (
    <FadeIn>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Backlink Analyzer</h1>
            <p className="text-sm text-muted-foreground mt-1">Monitor and analyze your backlink profile</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2"><Download className="h-4 w-4" /> Export</Button>
            <Button variant="outline" className="gap-2"><RefreshCw className="h-4 w-4" /> Refresh</Button>
            <Button className="gap-2"><Plus className="h-4 w-4" /> Add Backlink</Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-6 gap-4">
          {[
            { label: "Total Backlinks", value: summary?.total || 0, icon: Link2, color: "text-primary" },
            { label: "Referring Domains", value: summary?.referring_domains || 0, icon: ExternalLink, color: "text-blue-500" },
            { label: "Dofollow", value: summary?.dofollow || 0, icon: TrendingUp, color: "text-green-500" },
            { label: "Nofollow", value: summary?.nofollow || 0, icon: Shield, color: "text-yellow-500" },
            { label: "Lost", value: summary?.lost || 0, icon: TrendingDown, color: "text-red-500" },
            { label: "Avg DA", value: Math.round(summary?.avg_da || 0), icon: ArrowUpRight, color: "text-purple-500" },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="p-4 text-center">
                <s.icon className={`h-5 w-5 mx-auto mb-2 ${s.color}`} />
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by URL, domain, or anchor text..." className="pl-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>

        {/* Backlinks Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Source URL</TableHead>
                  <TableHead>Target URL</TableHead>
                  <TableHead>Anchor Text</TableHead>
                  <TableHead className="text-center">DA</TableHead>
                  <TableHead className="text-center">PA</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>First Seen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBacklinks.map((link: any) => (
                  <TableRow key={link.id}>
                    <TableCell className="max-w-[200px]">
                      <a href={link.source_url} target="_blank" rel="noopener" className="text-sm text-primary hover:underline truncate block">{link.source_url}</a>
                      <span className="text-[10px] text-muted-foreground">{link.source_domain}</span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[150px] truncate">{link.target_url}</TableCell>
                    <TableCell className="text-sm text-foreground max-w-[150px] truncate">{link.anchor_text || "—"}</TableCell>
                    <TableCell className="text-center">
                      <span className={`text-sm font-medium ${(link.domain_authority || 0) >= 50 ? "text-green-500" : (link.domain_authority || 0) >= 30 ? "text-yellow-500" : "text-muted-foreground"}`}>
                        {link.domain_authority || "—"}
                      </span>
                    </TableCell>
                    <TableCell className="text-center text-sm text-muted-foreground">{link.page_authority || "—"}</TableCell>
                    <TableCell><Badge variant="outline" className={`text-[10px] ${linkTypeColors[link.link_type] || ""}`}>{link.link_type}</Badge></TableCell>
                    <TableCell><Badge variant="outline" className={`text-[10px] ${statusColors[link.status] || ""}`}>{link.status}</Badge></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{link.first_seen || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </FadeIn>
  );
}
