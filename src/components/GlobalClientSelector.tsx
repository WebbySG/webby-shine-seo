import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useActiveClient } from "@/contexts/ClientContext";
import { Building2 } from "lucide-react";

export function GlobalClientSelector() {
  const { activeClientId, setActiveClientId, clients, activeClient } = useActiveClient();

  if (clients.length <= 1) return null;

  return (
    <div className="flex items-center gap-2">
      <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
      <Select value={activeClientId} onValueChange={setActiveClientId}>
        <SelectTrigger className="w-[180px] h-8 text-xs bg-background border">
          <SelectValue placeholder="Select client" />
        </SelectTrigger>
        <SelectContent>
          {clients.map((c: any) => (
            <SelectItem key={c.id} value={c.id} className="text-xs">{c.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
