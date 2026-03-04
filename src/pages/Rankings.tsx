import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RankChangeIndicator } from "@/components/RankChangeIndicator";
import { clients, getClientRankings, getTopGainers, getTopLosers } from "@/data/dummy";
import { ArrowUpDown, TrendingUp, TrendingDown } from "lucide-react";

type SortKey = "keyword" | "current_position" | "change";
type SortDir = "asc" | "desc";

export default function Rankings() {
  const [clientId, setClientId] = useState(clients[0]?.id ?? "");
  const [sortKey, setSortKey] = useState<SortKey>("current_position");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const kws = useMemo(() => {
    const data = getClientRankings(clientId);
    return [...data].sort((a, b) => {
      const mul = sortDir === "asc" ? 1 : -1;
      if (sortKey === "keyword") return mul * a.keyword.localeCompare(b.keyword);
      return mul * ((a[sortKey] as number) - (b[sortKey] as number));
    });
  }, [clientId, sortKey, sortDir]);

  const gainers = getTopGainers(clientId, 3);
  const losers = getTopLosers(clientId, 3);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  };

  const SortHeader = ({ label, k }: { label: string; k: SortKey }) => (
    <th
      onClick={() => toggleSort(k)}
      className="p-3 font-medium text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors"
    >
      <span className="inline-flex items-center gap-1">
        {label} <ArrowUpDown className="h-3 w-3" />
      </span>
    </th>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Keyword Rankings</h1>
          <p className="text-muted-foreground text-sm mt-1">Weekly position tracking</p>
        </div>
        <Select value={clientId} onValueChange={setClientId}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select client" />
          </SelectTrigger>
          <SelectContent>
            {clients.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Gainers / Losers widgets */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="h-4 w-4 text-success" />Top Gainers</CardTitle>
          </CardHeader>
          <CardContent>
            {gainers.map((r) => (
              <div key={r.id} className="flex justify-between py-1.5">
                <span className="text-sm truncate mr-4">{r.keyword}</span>
                <RankChangeIndicator change={r.change} />
              </div>
            ))}
            {gainers.length === 0 && <p className="text-xs text-muted-foreground">No improvements this week.</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><TrendingDown className="h-4 w-4 text-destructive" />Top Losers</CardTitle>
          </CardHeader>
          <CardContent>
            {losers.map((r) => (
              <div key={r.id} className="flex justify-between py-1.5">
                <span className="text-sm truncate mr-4">{r.keyword}</span>
                <RankChangeIndicator change={r.change} />
              </div>
            ))}
            {losers.length === 0 && <p className="text-xs text-muted-foreground">No drops this week.</p>}
          </CardContent>
        </Card>
      </div>

      {/* Sortable rankings table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <SortHeader label="Keyword" k="keyword" />
                  <SortHeader label="Position" k="current_position" />
                  <th className="p-3 font-medium text-muted-foreground">Previous</th>
                  <SortHeader label="Change" k="change" />
                  <th className="p-3 font-medium text-muted-foreground">Ranking URL</th>
                </tr>
              </thead>
              <tbody>
                {kws.map((r) => (
                  <tr key={r.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="p-3 font-medium">{r.keyword}</td>
                    <td className="p-3 font-mono text-center">{r.current_position}</td>
                    <td className="p-3 font-mono text-center text-muted-foreground">{r.last_position}</td>
                    <td className="p-3 text-center"><RankChangeIndicator change={r.change} /></td>
                    <td className="p-3 text-xs font-mono text-muted-foreground truncate max-w-[220px]">{r.ranking_url}</td>
                  </tr>
                ))}
                {kws.length === 0 && (
                  <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">No keywords tracked for this client.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
