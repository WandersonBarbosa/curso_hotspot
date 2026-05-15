import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";
import { useAuthStore } from "@/store/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PortalSettings {
  title?: string;
  subtitle?: string;
  buttonText?: string;
  description?: string;
  footerText?: string;
  splashColor?: string;
  splashImageUrl?: string;
  showSplash?: boolean;
  splashDuration?: number;
  loginMode?: "full" | "cpf";
  cpfPlaceholder?: string;
}

const defaultSettings: PortalSettings = {
  title: "Hotspot MikroTik",
  subtitle: "Use seu usuário e senha para acessar a rede hotspot.",
  buttonText: "Conectar",
  description: "Esta página pode ser usada como a tela de login do hotspot MikroTik.",
  footerText: "Hotspot SaaS",
  splashColor: "#0f172a",
  splashImageUrl: "",
  showSplash: true,
  splashDuration: 5,
  loginMode: "full",
  cpfPlaceholder: "Digite seu CPF",
};

export function PortalBrandingPage() {
  const companyId = useAuthStore((state) => state.user?.companyId);
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<PortalSettings>(defaultSettings);

  const { data, isLoading } = useQuery({
    queryKey: ["company-settings", companyId],
    enabled: Boolean(companyId),
    queryFn: async () => {
      const { data } = await api.get<{ name: string; slug: string; settings: { portal?: PortalSettings } }>(`/companies/${companyId}/settings`);
      return data;
    },
    onSuccess: (data) => {
      setSettings({ ...defaultSettings, ...(data.settings?.portal ?? {}) });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (payload: PortalSettings) => {
      const { data } = await api.patch<{ name: string; slug: string; settings: { portal?: PortalSettings } }>(`/companies/${companyId}/settings`, {
        portal: payload,
      });
      return data;
    },
    onSuccess: (data) => {
      setSettings({ ...defaultSettings, ...(data.settings?.portal ?? {}) });
      queryClient.invalidateQueries(["company-settings", companyId]);
    },
  });
  useEffect(() => {
    if (data) setSettings({ ...defaultSettings, ...(data.settings?.portal ?? {}) });
  }, [data]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    updateMutation.mutate(settings);
  }

  if (!companyId) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
        Empresa não encontrada. Faça login novamente ou contate o administrador.
      </div>
    );
  }

  const portalUrl = data?.slug ? `${window.location.origin}/portal?company=${data.slug}` : null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Personalizar portal público</CardTitle>
          <p className="text-sm text-muted-foreground">
            Edite o conteúdo que será exibido na página pública do hotspot.
          </p>
          {portalUrl ? (
            <p className="text-sm text-muted-foreground">
              Link público da empresa: <span className="font-medium text-primary">{portalUrl}</span>
            </p>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <label className="space-y-2 text-sm">
                <span>Título</span>
                <input
                  value={settings.title ?? ""}
                  onChange={(event) => setSettings((current) => ({ ...current, title: event.target.value }))}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Título do portal"
                />
              </label>
              <label className="space-y-2 text-sm">
                <span>Botão</span>
                <input
                  value={settings.buttonText ?? ""}
                  onChange={(event) => setSettings((current) => ({ ...current, buttonText: event.target.value }))}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Texto do botão"
                />
              </label>
            </div>
            <div className="space-y-4">
              <label className="space-y-2 text-sm">
                <span>Subtítulo</span>
                <input
                  value={settings.subtitle ?? ""}
                  onChange={(event) => setSettings((current) => ({ ...current, subtitle: event.target.value }))}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Mensagem de apoio"
                />
              </label>
              <label className="space-y-2 text-sm">
                <span>Descrição</span>
                <textarea
                  value={settings.description ?? ""}
                  onChange={(event) => setSettings((current) => ({ ...current, description: event.target.value }))}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                  rows={4}
                  placeholder="Informações adicionais para o usuário"
                />
              </label>
              <label className="space-y-2 text-sm">
                <span>Exibir splash pública</span>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={settings.showSplash ?? true}
                      onChange={(event) => setSettings((current) => ({ ...current, showSplash: event.target.checked }))}
                      className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                    />
                    Ativar splash
                  </label>
                </div>
              </label>
              <label className="space-y-2 text-sm">
                <span>Imagem de splash (URL)</span>
                <input
                  type="text"
                  value={settings.splashImageUrl ?? ""}
                  onChange={(event) => setSettings((current) => ({ ...current, splashImageUrl: event.target.value }))}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                  placeholder="https://example.com/splash.jpg"
                />
              </label>
              <label className="space-y-2 text-sm">
                <span>Duração da splash (segundos)</span>
                <input
                  type="number"
                  min={1}
                  value={settings.splashDuration ?? 5}
                  onChange={(event) => setSettings((current) => ({ ...current, splashDuration: Number(event.target.value) }))}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                />
              </label>
              <label className="space-y-2 text-sm">
                <span>Cor da Splash Page</span>
                <input
                  type="color"
                  value={settings.splashColor ?? "#0f172a"}
                  onChange={(event) => setSettings((current) => ({ ...current, splashColor: event.target.value }))}
                  className="h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                />
              </label>
              <label className="space-y-2 text-sm">
                <span>Modo de login</span>
                <select
                  value={settings.loginMode ?? "full"}
                  onChange={(event) => setSettings((current) => ({ ...current, loginMode: event.target.value as "full" | "cpf" }))}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="full">Usuário e senha</option>
                  <option value="cpf">CPF apenas</option>
                </select>
              </label>
              {settings.loginMode === "cpf" ? (
                <label className="space-y-2 text-sm">
                  <span>Placeholder CPF</span>
                  <input
                    value={settings.cpfPlaceholder ?? ""}
                    onChange={(event) => setSettings((current) => ({ ...current, cpfPlaceholder: event.target.value }))}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Digite seu CPF"
                  />
                </label>
              ) : null}
              <label className="space-y-2 text-sm">
                <span>Rodapé</span>
                <input
                  value={settings.footerText ?? ""}
                  onChange={(event) => setSettings((current) => ({ ...current, footerText: event.target.value }))}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Texto do rodapé"
                />
              </label>
            </div>
            <Button className="w-full" type="submit" disabled={updateMutation.isLoading || isLoading}>
              {updateMutation.isLoading ? "Salvando..." : "Salvar personalização"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Prévia do portal público</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={`space-y-4 rounded-3xl border border-border p-6 text-white shadow-lg ${
              settings.showSplash === false ? "bg-slate-950" : ""
            }`}
            style={
              settings.showSplash === false
                ? undefined
                : {
                    backgroundColor: settings.splashColor ?? "#0f172a",
                    backgroundImage: settings.splashImageUrl ? `url(${settings.splashImageUrl})` : undefined,
                    backgroundSize: settings.splashImageUrl ? "cover" : undefined,
                    backgroundPosition: settings.splashImageUrl ? "center" : undefined,
                  }
            }
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-3xl font-semibold">{settings.title}</p>
                <p className="text-sm text-muted-foreground">{settings.subtitle}</p>
              </div>
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-wider text-white/80">
                {settings.showSplash === false ? "Splash desativado" : "Splash ativo"}
              </span>
            </div>
            <div className="rounded-2xl bg-slate-950/90 p-6 shadow-inner">
              <p className="text-sm text-muted-foreground">{settings.description}</p>
              {settings.splashImageUrl ? (
                <p className="mt-3 text-xs text-muted-foreground">
                  A imagem de splash será exibida antes do login por {settings.splashDuration ?? 5} segundos.
                </p>
              ) : null}
              {settings.loginMode === "cpf" ? (
                <div className="mt-6 space-y-4 rounded-2xl bg-slate-900/80 p-5">
                  <label className="block text-sm text-muted-foreground">CPF</label>
                  <input
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                    placeholder={settings.cpfPlaceholder ?? "Digite seu CPF"}
                    disabled
                  />
                </div>
              ) : (
                <div className="mt-6 space-y-4 rounded-2xl bg-slate-900/80 p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Usuário</span>
                    <span className="text-sm font-medium">Senha</span>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <input
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Usuário"
                      disabled
                    />
                    <input
                      type="password"
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Senha"
                      disabled
                    />
                  </div>
                </div>
              )}
              <div className="mt-6 flex justify-center">
                <Button>{settings.buttonText}</Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">{settings.footerText}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
