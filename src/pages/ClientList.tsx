import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { clients } from "@/data/dummy";
import { Plus, Globe, Key, Users2 } from "lucide-react";

export default function ClientList() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clients</h1>
          <p className="text-muted-foreground text-sm mt-1">{clients.length} active clients</p>
        </div>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-1" /> Add Client
        </Button>
      </div>

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
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${c.health_score}%` }}
                    />
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
    </div>
  );
}
