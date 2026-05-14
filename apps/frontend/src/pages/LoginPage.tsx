import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { api } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "@/store/auth";

export function LoginPage() {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const [email, setEmail] = useState("admin@demo.local");
  const [password, setPassword] = useState("admin123");

  const mutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post("/auth/login", { email, password });
      return data as {
        accessToken: string;
        refreshToken: string;
        user: { id: string; email: string; name: string; role: string; companyId: string | null };
      };
    },
    onSuccess: (data) => {
      setSession({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        user: data.user,
      });
      toast.success("Bem-vindo de volta");
      navigate("/");
    },
    onError: () => toast.error("Credenciais inválidas"),
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4">
      <Card className="w-full max-w-md border-border/60 bg-card/90 shadow-2xl backdrop-blur">
        <CardHeader>
          <CardTitle className="text-2xl">Entrar</CardTitle>
          <p className="text-sm text-muted-foreground">Acesse o painel multiempresa Hotspot.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">E-mail</label>
            <input
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none ring-primary focus:ring-2"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Senha</label>
            <input
              type="password"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none ring-primary focus:ring-2"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          <Button className="w-full" disabled={mutation.isPending} onClick={() => mutation.mutate()}>
            {mutation.isPending ? "Entrando..." : "Entrar"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
