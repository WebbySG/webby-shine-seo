import { useState, useMemo } from "react";
import { PageTransition, StaggerContainer, StaggerItem } from "@/components/motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { RankChangeIndicator } from "@/components/RankChangeIndicator";
import { useClients, useKeywords } from "@/hooks/use-api";
import { clients as dummyClients, getClientRankings } from "@/data/dummy";
import { ArrowUpDown, TrendingUp, TrendingDown, BarChart3, Target } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

type SortKey = "keyword" | "current_position" | "change";
type SortDir = "asc" | "desc";

export default function Rankings() {
  const { data: apiClients } = useClients();
  const clients = apiClients ?? dummyClients;

  const [clientId, setClientId] = useState(clients[0]?.id ?? "");
  const { data: apiKeywords, isLoading } = useKeywords(clientId);

  const [sortKey, setSortKey] = useState<SortKey>("current_position");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const rawKws = apiKeywords ?? getClientRankings(clientId).map(r => ({
    ...r, current_position: r.current_position as number | null,
    last_position: r.last_position as number | null,
    change: r.change as number | null,
    ranking_url: r.ranking_url as string | null,
    tracked_date: r.tracked_date as string | null,
  }));

  const kws = useMemo(() => {
    return [...rawKws].sort((a, b) => {
      const mul = sortDir === "asc" ? 1 : -1;
      if (sortKey === "keyword") return mul * a.keyword.localeCompare(b.keyword);
      return mul * ((a[sortKey] as number ?? 100) - (b[sortKey] as number ?? 100));
    });
  }, [rawKws, sortKey, sortDir]);

  const gainers = [...rawKws].filter(r => (r.change ?? 0) > 0).sort((a, b) => (b.change ?? 0) - (a.change ?? 0)).slice(0, 3);
  const losers = [...rawKws].filter(r => (r.change ?? 0) < 0).sort((a, b) => (a.change ?? 0) - (b.change ?? 0)).slice(0, 3);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  };

  const avgPos = rawKws.length > 0 ? (rawKws.reduce((s, r) => s + (r.current_position ?? 0), 0) / rawKws.length).toFixed(1) : "–";
  const page1Count = rawKws.filter(r => (r.current_position ?? 100) <= 10).length;

  return (
    <PageTransition className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Keyword Rankings</h1>
          <p className="text-muted-foreground text-sm mt-1.5">Weekly position tracking across all keywords</p>
        </div>
        <Select value={clientId} onValueChange={setClientId}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="Select client" /></SelectTrigger>
          <SelectContent>
            {clients.map((c) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}
          </SelectContent>
        </Select>
      </div>

      {/* KPI Row */}
      <StaggerContainer className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StaggerItem><Card className="border-l-4 border-l-seo-primary hover-lift">
          <CardContent className="p-4">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">Total Keywords</p>
            <p className="text-2xl font-bold mt-1 text-foreground">{rawKws.length}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-seo-primary hover-lift">
          <CardContent className="p-4">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">Avg Position</p>
            <p className="text-2xl font-bold mt-1 text-foreground">{avgPos}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-emerald-500 hover-lift">
          <CardContent className="p-4">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">Page 1</p>
            <p className="text-2xl font-bold mt-1 text-emerald-600">{page1Count}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500 hover-lift">
          <CardContent className="p-4">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">Improved</p>
            <p className="text-2xl font-bold mt-1 text-foreground">{gainers.length + rawKws.filter(r => (r.change ?? 0) > 0).length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Gainers & Losers */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="hover-lift">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <div className="h-6 w-6 rounded-md bg-emerald-500/10 flex items-center justify-center">
                <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
              </div>
              Top Gainers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {gainers.map((r) => (
              <div key={r.id} className="flex justify-between items-center py-2 px-3 rounded-lg hover:bg-muted/40 transition-colors">
                <span className="text-sm font-medium truncate mr-4">{r.keyword}</span>
                <RankChangeIndicator change={r.change ?? 0} />
              </div>
            ))}
            {gainers.length === 0 && <p className="text-xs text-muted-foreground py-4 text-center">No improvements this week.</p>}
          </CardContent>
        </Card>
        <Card className="hover-lift">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <div className="h-6 w-6 rounded-md bg-destructive/10 flex items-center justify-center">
                <TrendingDown className="h-3.5 w-3.5 text-destructive" />
              </div>
              Top Losers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {losers.map((r) => (
              <div key={r.id} className="flex justify-between items-center py-2 px-3 rounded-lg hover:bg-muted/40 transition-colors">
                <span className="text-sm font-medium truncate mr-4">{r.keyword}</span>
                <RankChangeIndicator change={r.change ?? 0} />
              </div>
            ))}
            {losers.length === 0 && <p className="text-xs text-muted-foreground py-4 text-center">No drops this week.</p>}
          </CardContent>
        </Card>
      </div>

      {/* Rankings Table */}
      <Card className="hover-lift">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">{[1,2,3,4].map(i => <Skeleton key={i} className="h-10 w-full rounded-lg" />)}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead onClick={() => toggleSort("keyword")} className="cursor-pointer hover:text-foreground transition-colors">
                    <span className="inline-flex items-center gap-1">Keyword <ArrowUpDown className="h-3 w-3" /></span>
                  </TableHead>
                  <TableHead onClick={() => toggleSort("current_position")} className="cursor-pointer hover:text-foreground transition-colors text-center">
                    <span className="inline-flex items-center gap-1">Position <ArrowUpDown className="h-3 w-3" /></span>
                  </TableHead>
                  <TableHead className="text-center">Previous</TableHead>
                  <TableHead onClick={() => toggleSort("change")} className="cursor-pointer hover:text-foreground transition-colors text-center">
                    <span className="inline-flex items-center gap-1">Change <ArrowUpDown className="h-3 w-3" /></span>
                  </TableHead>
                  <TableHead>Ranking URL</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {kws.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.keyword}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className={`font-mono text-xs ${
                        (r.current_position ?? 100) <= 3 ? "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400" :
                        (r.current_position ?? 100) <= 10 ? "bg-seo-background text-seo-primary border-seo-border" :
                        "bg-muted text-muted-foreground"
                      }`}>
                        {r.current_position ?? "–"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center font-mono text-sm text-muted-foreground">{r.last_position ?? "–"}</TableCell>
                    <TableCell className="text-center"><RankChangeIndicator change={r.change ?? 0} /></TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground truncate max-w-[220px]">{r.ranking_url ?? "–"}</TableCell>
                  </TableRow>
                ))}
                {kws.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">No keywords tracked for this client.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
