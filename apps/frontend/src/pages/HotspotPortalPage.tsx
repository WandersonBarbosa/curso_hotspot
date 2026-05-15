import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { api } from "@/api/client";
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

export function HotspotPortalPage() {
  const [searchParams] = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const companySlug = searchParams.get("company") ?? searchParams.get("codigoCliente") ?? searchParams.get("slug") ?? undefined;
  const hotspotName = searchParams.get("hotspot") ?? "";

  const { data: portalSettings } = useQuery({
    queryKey: ["portal-settings", companySlug],
    enabled: Boolean(companySlug),
    queryFn: async () => {
      const { data } = await api.get<PortalSettings>(`/companies/slug/${companySlug}/portal-settings`);
      return data;
    },
  });

  const settings = useMemo(() => ({ ...defaultSettings, ...portalSettings }), [portalSettings]);
  const showSplash = settings.showSplash !== false;
  const [showSplashScreen, setShowSplashScreen] = useState(showSplash);

  useEffect(() => {
    setShowSplashScreen(showSplash);
  }, [showSplash]);

  useEffect(() => {
    if (!showSplash || !showSplashScreen) return;
    const timeout = window.setTimeout(() => setShowSplashScreen(false), (settings.splashDuration ?? 5) * 1000);
    return () => window.clearTimeout(timeout);
  }, [showSplash, showSplashScreen, settings.splashDuration]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  if (showSplash && showSplashScreen) {
    return (
      <div
        className="min-h-screen px-4 py-8"
        style={
          settings.splashImageUrl
            ? {
                backgroundImage: `url(${settings.splashImageUrl})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
            : { backgroundColor: settings.splashColor ?? "#0f172a" }
        }
      >
        <div className="mx-auto flex w-full max-w-2xl items-center justify-center px-4 py-24">
          <div className="w-full rounded-3xl border border-white/10 bg-slate-950/80 p-10 text-white shadow-2xl backdrop-blur">
            <div className="space-y-6 text-center">
              <p className="text-4xl font-semibold">{settings.title}</p>
              <p className="text-sm text-muted-foreground">{settings.subtitle}</p>
              <p className="text-sm text-muted-foreground">
                A tela de login aparecerá em {settings.splashDuration ?? 5} segundos.
              </p>
              <Button type="button" onClick={() => setShowSplashScreen(false)} className="mx-auto">
                Ir para login agora
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 py-8">
      <div className="mx-auto w-full max-w-md">
        <Card className="border-border/60 bg-card/95 shadow-2xl">
          <CardHeader>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">Wi</span>
                  <CardTitle className="text-2xl">{settings.title}</CardTitle>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-800">
                  {showSplash ? "Splash ativo" : "Splash desativado"}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{settings.subtitle}</p>
              <div className="rounded-lg border border-border/70 bg-muted/30 p-3 text-xs text-muted-foreground">
                <p>Empresa: <span className="font-medium text-foreground">{companySlug ?? "não informado"}</span></p>
                {hotspotName ? <p>Hotspot: <span className="font-medium text-foreground">{hotspotName}</span></p> : null}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {settings.loginMode === "cpf" ? (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">CPF</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none ring-primary focus:ring-2"
                    placeholder={settings.cpfPlaceholder ?? "Digite seu CPF"}
                  />
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">Usuário</label>
                    <input
                      type="text"
                      value={username}
                      onChange={(event) => setUsername(event.target.value)}
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none ring-primary focus:ring-2"
                      placeholder="Digite seu usuário"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">Senha</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none ring-primary focus:ring-2"
                      placeholder="Digite sua senha"
                    />
                  </div>
                </>
              )}
              <Button className="w-full" type="submit">
                {settings.buttonText}
              </Button>
            </form>
            {submitted ? (
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-100">
                Simulação de login enviada. No próximo passo, você pode integrar este formulário com o backend.
              </div>
            ) : (
              <div className="rounded-lg border border-border/70 bg-muted/30 p-4 text-sm text-muted-foreground">
                {settings.description}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
