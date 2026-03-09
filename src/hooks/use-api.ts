import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as api from "@/lib/api";

// ---------- Clients ----------
export function useClients() {
  return useQuery({ queryKey: ["clients"], queryFn: api.getClients });
}

export function useClient(id: string) {
  return useQuery({ queryKey: ["clients", id], queryFn: () => api.getClient(id), enabled: !!id });
}

export function useCreateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; domain: string }) => api.createClient(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["clients"] }),
  });
}

export function useDeleteClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteClient(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["clients"] }),
  });
}

// ---------- Keywords ----------
export function useKeywords(clientId: string) {
  return useQuery({
    queryKey: ["keywords", clientId],
    queryFn: () => api.getKeywords(clientId),
    enabled: !!clientId,
  });
}

export function useCreateKeyword(clientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { keyword: string }) => api.createKeyword(clientId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["keywords", clientId] }),
  });
}

// ---------- Competitors ----------
export function useCompetitors(clientId: string) {
  return useQuery({
    queryKey: ["competitors", clientId],
    queryFn: () => api.getCompetitors(clientId),
    enabled: !!clientId,
  });
}

export function useCreateCompetitor(clientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { domain: string; label?: string }) => api.createCompetitor(clientId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["competitors", clientId] }),
  });
}

// ---------- Audit ----------
export function useAuditIssues(clientId: string) {
  return useQuery({
    queryKey: ["audit-issues", clientId],
    queryFn: () => api.getAuditIssues(clientId),
    enabled: !!clientId,
  });
}

// ---------- Opportunities ----------
export function useOpportunities(clientId: string) {
  return useQuery({
    queryKey: ["opportunities", clientId],
    queryFn: () => api.getOpportunities(clientId),
    enabled: !!clientId,
  });
}

// ---------- Internal Links ----------
export function useInternalLinks(clientId: string) {
  return useQuery({
    queryKey: ["internal-links", clientId],
    queryFn: () => api.getInternalLinks(clientId),
    enabled: !!clientId,
  });
}

// ---------- Content Plan ----------
export function useContentPlan(clientId: string) {
  return useQuery({
    queryKey: ["content-plan", clientId],
    queryFn: () => api.getContentPlan(clientId),
    enabled: !!clientId,
  });
}

// ---------- SEO Briefs ----------
export function useBriefs(clientId: string) {
  return useQuery({
    queryKey: ["briefs", clientId],
    queryFn: () => api.getBriefs(clientId),
    enabled: !!clientId,
  });
}

export function useGenerateBrief(clientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (keyword: string) => api.generateBrief(clientId, keyword),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["briefs", clientId] }),
  });
}
