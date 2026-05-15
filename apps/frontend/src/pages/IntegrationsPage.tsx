import type { FormEvent } from "react";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";
import { useAuthStore } from "@/store/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface MikrotikConfig {
  id: string;
  name: string;
  host: string;
  port: number;
  apiUser: string;
  useTls?: boolean | null;
}

export function IntegrationsPage() {
  const companyId = useAuthStore((state) => state.user?.companyId);
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [host, setHost] = useState("");
  const [port, setPort] = useState("8728");
  const [apiUser, setApiUser] = useState("");
  const [apiPassword, setApiPassword] = useState("");
  const [useTls, setUseTls] = useState(false);

  const { data: mikrotiks, isLoading } = useQuery({
    queryKey: ["mikrotiks", companyId],
    enabled: Boolean(companyId),
    queryFn: async () => {
      const { data } = await api.get<MikrotikConfig[]>(`/mikrotiks/${companyId}`);
      return data;
    },
  });

  const addMikrotikMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post<MikrotikConfig>("/mikrotiks", {
        companyId,
        name,
        host,
        port: Number(port) || 8728,
        apiUser,
        apiPassword,
        useTls,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["mikrotiks", companyId]);
      setName("");
      setHost("");
      setPort("8728");
      setApiUser("");
      setApiPassword("");
      setUseTls(false);
    },
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    addMikrotikMutation.mutate();
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Integrações</CardTitle>
          <p className="text-sm text-muted-foreground">
            Configure seus roteadores MikroTik e outras integrações de serviço.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <div className="space-y-4">
              <div className="rounded-lg border border-border bg-muted/40 p-4">
                <p className="font-semibold">MikroTik</p>
                <p className="text-sm text-muted-foreground">
                  Cadastre o acesso API do roteador para sincronizar usuários e liberar conexões.
                </p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-border bg-background/80 p-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="space-y-2 text-sm">
                    <span>Nome do roteador</span>
                    <input
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Ex: Mikrotik Principal"
                    />
                  </label>
                  <label className="space-y-2 text-sm">
                    <span>Hostname ou IP</span>
                    <input
                      value={host}
                      onChange={(event) => setHost(event.target.value)}
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                      placeholder="192.168.88.1"
                    />
                  </label>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="space-y-2 text-sm">
                    <span>Porta</span>
                    <input
                      value={port}
                      onChange={(event) => setPort(event.target.value)}
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                      placeholder="8728"
                    />
                  </label>
                  <label className="space-y-2 text-sm">
                    <span>Usuário API</span>
                    <input
                      value={apiUser}
                      onChange={(event) => setApiUser(event.target.value)}
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                      placeholder="api"
                    />
                  </label>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="space-y-2 text-sm">
                    <span>Senha API</span>
                    <input
                      type="password"
                      value={apiPassword}
                      onChange={(event) => setApiPassword(event.target.value)}
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Senha do router"
                    />
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={useTls} onChange={(event) => setUseTls(event.target.checked)} />
                    Usar TLS
                  </label>
                </div>
                <Button className="w-full" type="submit" disabled={addMikrotikMutation.isLoading || !companyId}>
                  {addMikrotikMutation.isLoading ? "Salvando..." : "Salvar integração"}
                </Button>
              </form>
            </div>
            <div className="space-y-4">
              <div className="rounded-lg border border-border bg-muted/40 p-4">
                <p className="font-semibold">Integração de pagamentos</p>
                <p className="text-sm text-muted-foreground">
                  Em breve você poderá configurar Atlaz, Mercado Pago, Asaas e Gerencianet neste painel.
                </p>
              </div>
              <div className="rounded-lg border border-border bg-background/80 p-4">
                <p className="text-sm font-medium">Status atual</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  O backend já possui suporte a webhooks e geração de PIX. Use a seção de integração MikroTik para começar.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Roteadores MikroTik cadastrados</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando integrações...</p>
          ) : mikrotiks?.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="py-2">Nome</th>
                    <th className="py-2">Host</th>
                    <th className="py-2">Porta</th>
                    <th className="py-2">Usuário</th>
                  </tr>
                </thead>
                <tbody>
                  {mikrotiks.map((row) => (
                    <tr key={row.id} className="border-b border-border/60">
                      <td className="py-2 font-medium">{row.name}</td>
                      <td className="py-2">{row.host}</td>
                      <td className="py-2">{row.port}</td>
                      <td className="py-2">{row.apiUser}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhum MikroTik cadastrado ainda. Salve uma nova integração acima.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
