import { useQuery } from "@tanstack/react-query";
import { Activity, CreditCard, Users, Wifi } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/api/client";
import { useAuthStore } from "@/store/auth";

interface Summary {
  hotspotUsers: number;
  revenueMonthCents: number;
  overdueInvoices: number;
  onlineClients: number;
  bandwidthMbps: { download: number | null; upload: number | null };
  recentLogs: { id: string; action: string; createdAt: string }[];
}

export function DashboardPage() {
  const companyId = useAuthStore((s) => s.user?.companyId);

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", companyId],
    enabled: Boolean(companyId),
    queryFn: async () => {
      const { data: res } = await api.get<Summary>(`/dashboard/${companyId}/summary`);
      return res;
    },
  });

  if (!companyId) {
    return <p className="text-muted-foreground">Usuário sem empresa vinculada (super admin use API direta).</p>;
  }

  if (isLoading || !data) {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
    );
  }

  const formatMoney = (cents: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Visão geral financeira e operação Hotspot.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes Hotspot</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.hotspotUsers}</div>
            <p className="text-xs text-muted-foreground">Cadastrados no painel</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Online agora</CardTitle>
            <Wifi className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.onlineClients}</div>
            <p className="text-xs text-muted-foreground">Sessões ativas (MikroTik)</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita mês</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatMoney(data.revenueMonthCents)}</div>
            <p className="text-xs text-muted-foreground">PIX / pagamentos confirmados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inadimplentes</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overdueInvoices}</div>
            <p className="text-xs text-muted-foreground">Faturas em atraso</p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Consumo de banda</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 rounded-md bg-gradient-to-r from-primary/20 via-primary/5 to-transparent p-4">
              <p className="text-sm text-muted-foreground">
                Gráfico agregado (placeholder) — conecte séries temporais do MikroTik ou Netflow para produção.
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Logs recentes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {data.recentLogs.length === 0 && <p className="text-muted-foreground">Sem eventos.</p>}
            {data.recentLogs.map((log) => (
              <div key={log.id} className="rounded-md border border-border/60 p-2">
                <p className="font-medium">{log.action}</p>
                <p className="text-xs text-muted-foreground">{new Date(log.createdAt).toLocaleString("pt-BR")}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
