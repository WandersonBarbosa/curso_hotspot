import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";
import { useAuthStore } from "@/store/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function HotspotPage() {
  const companyId = useAuthStore((s) => s.user?.companyId);
  const { data } = useQuery({
    queryKey: ["hotspot-users", companyId],
    enabled: Boolean(companyId),
    queryFn: async () => {
      const { data: rows } = await api.get(`/hotspot-users/${companyId}`);
      return rows as { id: string; username: string; blocked: boolean }[];
    },
  });

  if (!companyId) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Usuários Hotspot</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="py-2">Usuário</th>
                <th className="py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {data?.map((u) => (
                <tr key={u.id} className="border-b border-border/60">
                  <td className="py-2 font-medium">{u.username}</td>
                  <td className="py-2">{u.blocked ? "Bloqueado" : "Ativo"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
