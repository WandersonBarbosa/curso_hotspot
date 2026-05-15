import type { FormEvent } from "react";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";
import { useAuthStore } from "@/store/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface CompanyProfile {
  id: string;
  name: string;
  slug: string;
  document?: string;
  active: boolean;
  settings: Record<string, unknown>;
}

export function CompanyProfilePage() {
  const companyId = useAuthStore((state) => state.user?.companyId);
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [document, setDocument] = useState("");
  const [active, setActive] = useState(true);

  const { data, isLoading } = useQuery({
    queryKey: ["company-profile", companyId],
    enabled: Boolean(companyId),
    queryFn: async () => {
      const { data: res } = await api.get<CompanyProfile>(`/companies/${companyId}`);
      return res;
    },
    onSuccess: (res) => {
      setName(res.name);
      setDocument(res.document ?? "");
      setActive(res.active);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      const { data: res } = await api.patch<CompanyProfile>(`/companies/${companyId}`, {
        name,
        document,
        active,
      });
      return res;
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries(["company-profile", companyId]);
      setName(res.name);
      setDocument(res.document ?? "");
      setActive(res.active);
    },
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    updateMutation.mutate();
  }

  if (!companyId) {
    return <p className="text-sm text-muted-foreground">Sem empresa vinculada. Faça login novamente ou contate o administrador.</p>;
  }

  if (isLoading || !data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Dados da empresa</CardTitle>
          <p className="text-sm text-muted-foreground">Edite informações públicas e o status da sua empresa.</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm">
                <span>Nome da empresa</span>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                />
              </label>
              <label className="space-y-2 text-sm">
                <span>Slug público</span>
                <input
                  value={data.slug}
                  disabled
                  className="w-full rounded-md border border-border bg-slate-950/40 px-3 py-2 text-sm text-muted-foreground outline-none"
                />
              </label>
            </div>
            <label className="space-y-2 text-sm">
              <span>Documento</span>
              <input
                value={document}
                onChange={(event) => setDocument(event.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                placeholder="CNPJ ou CPF"
              />
            </label>
            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={active}
                onChange={(event) => setActive(event.target.checked)}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
              />
              <span>Empresa ativa</span>
            </label>
            <div className="space-y-2 rounded-lg border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
              <p>Link público atual:</p>
              <p className="break-all text-foreground">{window.location.origin}/portal?company={data.slug}</p>
            </div>
            <Button className="w-full" type="submit" disabled={updateMutation.isLoading}>
              {updateMutation.isLoading ? "Atualizando..." : "Salvar dados da empresa"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
