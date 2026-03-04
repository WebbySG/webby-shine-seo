import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useClients } from "@/hooks/use-api";
import { clients as dummyClients } from "@/data/dummy";
import { Plus, Globe, Key, Users2 } from "lucide-react";

export default function ClientList() {
  const { data: apiClients, isLoading, isError } = useClients();
  const clients = apiClients ?? dummyClients;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clients</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {clients.length} active clients
            {isError && <span className="text-warning ml-2">(using demo data)</span>}
          </p>
        </div>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-1" /> Add Client
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}><CardContent className="p-6 space-y-3"><Skeleton className="h-5 w-32" /><Skeleton className="h-3 w-24" /><Skeleton className="h-2 w-full" /></CardContent></Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {clients.map((c) => (
            <Link key={c.id} to={`/clients/${c.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{c.name}</CardTitle>
                  <p className="text-xs text-muted-foreground font-mono flex items-center gap-1">
                    <Globe className="h-3 w-3" /> {c.domain}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Key className="h-3.5 w-3.5" /> {c.keywords_count}
                    </span>
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Users2 className="h-3.5 w-3.5" /> {c.competitors_count}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${c.health_score}%` }} />
                    </div>
                    <Badge variant={c.health_score >= 80 ? "default" : c.health_score >= 60 ? "secondary" : "destructive"} className="text-xs font-mono">
                      {c.health_score}%
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
