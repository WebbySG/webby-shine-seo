import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useClient, useKeywords, useCompetitors, useAuditIssues, useInternalLinks } from "@/hooks/use-api";
import { clients as dummyClients, getClientRankings, getClientCompetitors, getClientAuditIssues } from "@/data/dummy";
import { RankChangeIndicator } from "@/components/RankChangeIndicator";
import { ArrowLeft, Globe, TrendingUp, TrendingDown, Target, Link2, ExternalLink } from "lucide-react";
import type { InternalLinkSuggestion } from "@/lib/api";

const PRIORITY_BADGE: Record<string, "destructive" | "secondary" | "outline"> = {
  high: "destructive",
  medium: "secondary",
  low: "outline",
};

function buildDummyInternalLinks(): InternalLinkSuggestion[] {
  return [
    { id: "il1", from_url: "https://renovo.sg/services", to_url: "https://renovo.sg/kitchen", anchor_text: "kitchen renovation singapore", reason: 'Boost "kitchen renovation singapore" (currently #9) by adding internal link from related page.', priority: "high", status: "pending", created_at: new Date().toISOString() },
    { id: "il2", from_url: "https://renovo.sg/hdb", to_url: "https://renovo.sg/condo", anchor_text: "condo renovation singapore", reason: 'Link from high-ranking page (#4) to boost "condo renovation singapore" at #11.', priority: "high", status: "pending", created_at: new Date().toISOString() },
    { id: "il3", from_url: "https://renovo.sg/blog/ideas", to_url: "https://renovo.sg/interior", anchor_text: "interior design singapore", reason: 'Boost "interior design singapore" (currently #18) by adding internal link from related page.', priority: "medium", status: "pending", created_at: new Date().toISOString() },
  ];
}

export default function ClientDetail() {
  const { id } = useParams<{ id: string }>();

  const { data: apiClient } = useClient(id!);
  const { data: apiKeywords } = useKeywords(id!);
  const { data: apiCompetitors } = useCompetitors(id!);
  const { data: apiAuditIssues } = useAuditIssues(id!);
  const { data: apiInternalLinks } = useInternalLinks(id!);

  const dummyClient = dummyClients.find((c) => c.id === id);
  const client = apiClient ?? dummyClient;

  const kws = apiKeywords ?? getClientRankings(id!).map(r => ({
    ...r, current_position: r.current_position, last_position: r.last_position, change: r.change, ranking_url: r.ranking_url, tracked_date: r.tracked_date
  }));

  const comps = apiCompetitors ?? getClientCompetitors(id!).map(c => ({
    id: c.id, domain: c.domain, label: null, source: "manual", confirmed: true
  }));

  const issues = apiAuditIssues ?? getClientAuditIssues(id!).map(i => ({
    id: i.id, issue_type: i.type, severity: i.severity, affected_url: i.affected_url,
    description: i.description, fix_instruction: i.fix_instruction, status: i.status
  }));

  const internalLinks: InternalLinkSuggestion[] = apiInternalLinks ?? buildDummyInternalLinks();

  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-muted-foreground">Client not found.</p>
        <Link to="/clients"><Button variant="ghost" className="mt-2">Back to Clients</Button></Link>
      </div>
    );
  }

  const gainers = [...kws].filter((r) => (r.change ?? 0) > 0).sort((a, b) => (b.change ?? 0) - (a.change ?? 0)).slice(0, 5);
  const losers = [...kws].filter((r) => (r.change ?? 0) < 0).sort((a, b) => (a.change ?? 0) - (b.change ?? 0)).slice(0, 5);
  const nearWins = kws.filter((r) => (r.current_position ?? 100) >= 11 && (r.current_position ?? 100) <= 20);
  const openIssues = issues.filter((i) => i.status !== "done");
  const pendingLinks = internalLinks.filter((l) => l.status === "pending");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/clients"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{client.name}</h1>
          <p className="text-sm text-muted-foreground font-mono flex items-center gap-1"><Globe className="h-3 w-3" />{client.domain}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-5">
        {[
          { label: "Keywords", value: kws.length },
          { label: "Competitors", value: comps.length },
          { label: "Open Issues", value: openIssues.length },
          { label: "Link Suggestions", value: pendingLinks.length },
          { label: "Health Score", value: `${client.health_score}%` },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">{s.label}</p>
              <p className="text-xl font-bold mt-1">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="rankings" className="space-y-4">
        <TabsList>
          <TabsTrigger value="rankings">Rankings</TabsTrigger>
          <TabsTrigger value="movers">Movers</TabsTrigger>
          <TabsTrigger value="competitors">Competitors</TabsTrigger>
          <TabsTrigger value="internal-links">Internal Links ({pendingLinks.length})</TabsTrigger>
          <TabsTrigger value="issues">Issues ({openIssues.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="rankings">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="p-3 font-medium text-muted-foreground">Keyword</th>
                      <th className="p-3 font-medium text-muted-foreground text-center">Position</th>
                      <th className="p-3 font-medium text-muted-foreground text-center">Previous</th>
                      <th className="p-3 font-medium text-muted-foreground text-center">Change</th>
                      <th className="p-3 font-medium text-muted-foreground">URL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {kws.map((r) => (
                      <tr key={r.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="p-3 font-medium">{r.keyword}</td>
                        <td className="p-3 text-center font-mono">{r.current_position ?? "–"}</td>
                        <td className="p-3 text-center font-mono text-muted-foreground">{r.last_position ?? "–"}</td>
                        <td className="p-3 text-center"><RankChangeIndicator change={r.change ?? 0} /></td>
                        <td className="p-3 text-xs font-mono text-muted-foreground truncate max-w-[200px]">{r.ranking_url ?? "–"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="movers">
          <div className="grid gap-6 lg:grid-cols-3">
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-4 w-4 text-success" />Gainers</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {gainers.length === 0 && <p className="text-sm text-muted-foreground">No gainers this week.</p>}
                {gainers.map((r) => (
                  <div key={r.id} className="flex justify-between py-2 border-b last:border-0">
                    <span className="text-sm">{r.keyword}</span>
                    <RankChangeIndicator change={r.change ?? 0} />
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><TrendingDown className="h-4 w-4 text-destructive" />Losers</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {losers.length === 0 && <p className="text-sm text-muted-foreground">No losers this week.</p>}
                {losers.map((r) => (
                  <div key={r.id} className="flex justify-between py-2 border-b last:border-0">
                    <span className="text-sm">{r.keyword}</span>
                    <RankChangeIndicator change={r.change ?? 0} />
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Target className="h-4 w-4 text-warning" />Near Wins (11–20)</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {nearWins.length === 0 && <p className="text-sm text-muted-foreground">No near wins.</p>}
                {nearWins.map((r) => (
                  <div key={r.id} className="flex justify-between py-2 border-b last:border-0">
                    <span className="text-sm">{r.keyword}</span>
                    <span className="font-mono text-sm text-muted-foreground">#{r.current_position}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="competitors">
          <div className="grid gap-4 sm:grid-cols-2">
            {comps.map((c) => (
              <Card key={c.id}>
                <CardContent className="p-5">
                  <p className="font-mono font-medium">{c.domain}</p>
                  <p className="text-xs text-muted-foreground mt-1">{c.label || "Competitor"}</p>
                </CardContent>
              </Card>
            ))}
            {comps.length === 0 && <p className="text-sm text-muted-foreground">No competitors added yet.</p>}
          </div>
        </TabsContent>

        <TabsContent value="internal-links">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Link2 className="h-4 w-4 text-primary" />Internal Link Suggestions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {pendingLinks.length === 0 && <p className="text-sm text-muted-foreground">No internal link suggestions at the moment.</p>}
              {pendingLinks.map((link) => (
                <div key={link.id} className="p-4 rounded-md border bg-muted/20 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={PRIORITY_BADGE[link.priority]} className="text-xs">{link.priority}</Badge>
                    <span className="text-sm font-medium">"{link.anchor_text}"</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-mono truncate max-w-[280px]">{link.from_url}</span>
                    <span>→</span>
                    <span className="font-mono truncate max-w-[280px]">{link.to_url}</span>
                    <a href={link.to_url} target="_blank" rel="noopener noreferrer" className="ml-1 hover:text-primary">
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                  <p className="text-xs text-muted-foreground">{link.reason}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="issues">
          <div className="space-y-2">
            {openIssues.map((issue) => (
              <Card key={issue.id}>
                <CardContent className="p-4 flex items-start gap-4">
                  <Badge variant={issue.severity === "critical" ? "destructive" : issue.severity === "warning" ? "secondary" : "outline"} className="text-xs shrink-0 mt-0.5">
                    {issue.severity}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{issue.issue_type}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{issue.description}</p>
                    <p className="text-xs font-mono text-muted-foreground mt-1 truncate">{issue.affected_url}</p>
                  </div>
                  <Badge variant="outline" className="text-xs shrink-0">{issue.status.replace("_", " ")}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
