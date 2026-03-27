import React, { createContext, useContext, useState, useEffect } from "react";
import { useClients } from "@/hooks/use-api";

interface ClientContextType {
  activeClientId: string;
  setActiveClientId: (id: string) => void;
  activeClient: { id: string; name: string; domain: string } | null;
  clients: { id: string; name: string; domain: string }[];
  isLoading: boolean;
}

const ClientContext = createContext<ClientContextType | null>(null);

export function ClientProvider({ children }: { children: React.ReactNode }) {
  const { data: clients = [], isLoading } = useClients();
  const [activeClientId, setActiveClientIdRaw] = useState<string>(() => {
    return localStorage.getItem("active_client_id") || "";
  });

  const setActiveClientId = (id: string) => {
    setActiveClientIdRaw(id);
    localStorage.setItem("active_client_id", id);
  };

  // Auto-select first client if none selected
  useEffect(() => {
    if (!activeClientId && clients.length > 0) {
      setActiveClientId(clients[0].id);
    }
  }, [clients, activeClientId]);

  const activeClient = clients.find(c => c.id === activeClientId) || clients[0] || null;
  const resolvedId = activeClient?.id || activeClientId;

  return (
    <ClientContext.Provider value={{
      activeClientId: resolvedId,
      setActiveClientId,
      activeClient: activeClient as any,
      clients: clients as any[],
      isLoading,
    }}>
      {children}
    </ClientContext.Provider>
  );
}

export function useActiveClient() {
  const ctx = useContext(ClientContext);
  if (!ctx) throw new Error("useActiveClient must be used within ClientProvider");
  return ctx;
}
