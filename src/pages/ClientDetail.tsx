import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { clients, getClientRankings, getTopGainers, getTopLosers, getNearWins, getClientCompetitors, getClientAuditIssues } from "@/data/dummy";
import { RankChangeIndicator } from "@/components/RankChangeIndicator";
import { ArrowLeft, Globe, TrendingUp, TrendingDown, Target } from "lucide-react";

export default function ClientDetail() {
  const { id } = useParams<{ id: string }>();
  const client = clients.find((c) => c.id === id);

  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-muted-foreground">Client not found.</p>
        <Link to="/clients"><Button variant="ghost" className="mt-2">Back to Clients</Button></Link>
      </div>
    );
  }

  const kws = getClientRankings(client.id);
  const gainers = getTopGainers(client.id);
  const losers = getTopLosers(client.id);
  const nearWins = getNearWins(client.id);
  const comps = getClientCompetitors(client.id);
  const issues = getClientAuditIssues(client.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/clients"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{client.name}</h1>
          <p className="text-sm text-muted-foreground font-mono flex items-center gap-1"><Globe className="h-3 w-3" />{client.domain}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: "Keywords", value: kws.length },
          { label: "Competitors", value: comps.length },
          { label: "Open Issues", value: issues.filter(i => i.status !== "done").length },
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
          <TabsTrigger value="issues">Issues ({issues.filter(i => i.status !== "done").length})</TabsTrigger>
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
                        <td className="p-3 text-center font-mono">{r.current_position}</td>
                        <td className="p-3 text-center font-mono text-muted-foreground">{r.last_position}</td>
                        <td className="p-3 text-center"><RankChangeIndicator change={r.change} /></td>
                        <td className="p-3 text-xs font-mono text-muted-foreground truncate max-w-[200px]">{r.ranking_url}</td>
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
                    <RankChangeIndicator change={r.change} />
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
                    <RankChangeIndicator change={r.change} />
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
                  <p className="text-xs text-muted-foreground mt-1">SERP Overlap</p>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${c.overlap_score}%` }} />
                    </div>
                    <span className="text-sm font-mono font-semibold">{c.overlap_score}%</span>
                  </div>
                </CardContent>
              </Card>
            ))}
            {comps.length === 0 && <p className="text-sm text-muted-foreground">No competitors added yet.</p>}
          </div>
        </TabsContent>

        <TabsContent value="issues">
          <div className="space-y-2">
            {issues.filter(i => i.status !== "done").map((issue) => (
              <Card key={issue.id}>
                <CardContent className="p-4 flex items-start gap-4">
                  <Badge variant={issue.severity === "critical" ? "destructive" : issue.severity === "warning" ? "secondary" : "outline"} className="text-xs shrink-0 mt-0.5">
                    {issue.severity}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{issue.type}</p>
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
