import type { FormEvent } from "react";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";
import { useAuthStore } from "@/store/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface CompanyUser {
  id: string;
  email: string;
  name: string;
  role: string;
  active: boolean;
  createdAt: string;
}

const roles = [
  { value: "admin", label: "Admin" },
  { value: "subadmin", label: "Subadmin" },
  { value: "operator", label: "Operador" },
];

export function CompanyUsersPage() {
  const companyId = useAuthStore((state) => state.user?.companyId);
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("operator");
  const [password, setPassword] = useState("");

  const { data: users, isLoading } = useQuery({
    queryKey: ["company-users", companyId],
    enabled: Boolean(companyId),
    queryFn: async () => {
      const { data } = await api.get<CompanyUser[]>(`/users/${companyId}`);
      return data;
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post<CompanyUser>("/users", {
        companyId,
        name,
        email,
        role,
        password,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["company-users", companyId]);
      setName("");
      setEmail("");
      setRole("operator");
      setPassword("");
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { data } = await api.patch<CompanyUser>(`/users/${id}`, { active });
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries(["company-users", companyId]),
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/users/${id}`);
      return id;
    },
    onSuccess: () => queryClient.invalidateQueries(["company-users", companyId]),
  });

  function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    createUserMutation.mutate();
  }

  if (!companyId) {
    return <p className="text-sm text-muted-foreground">Sem empresa vinculada. Faça login novamente ou contate o administrador.</p>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Usuários da empresa</CardTitle>
          <p className="text-sm text-muted-foreground">Cadastre novos colaboradores e administre perfis de acesso.</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleCreate} className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
            <div className="space-y-4 rounded-lg border border-border bg-background/80 p-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-sm">
                  <span>Nome</span>
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Nome completo"
                  />
                </label>
                <label className="space-y-2 text-sm">
                  <span>E-mail</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                    placeholder="usuario@empresa.com"
                  />
                </label>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-sm">
                  <span>Função</span>
                  <select
                    value={role}
                    onChange={(event) => setRole(event.target.value)}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                  >
                    {roles.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-2 text-sm">
                  <span>Senha inicial</span>
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Mínimo 6 caracteres"
                  />
                </label>
              </div>
              <Button className="w-full" type="submit" disabled={createUserMutation.isLoading || !name || !email || !password}>
                {createUserMutation.isLoading ? "Salvando..." : "Criar usuário"}
              </Button>
            </div>
            <div className="rounded-lg border border-border bg-muted/40 p-4">
              <p className="text-sm font-semibold">Guia rápido</p>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li>Admins podem gerenciar hotspot, integrações e portal.</li>
                <li>Subadmins têm acesso operacional limitado.</li>
                <li>Operadores podem apenas visualizar e operar o hotspot.</li>
              </ul>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lista de usuários</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : users?.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="py-2">Nome</th>
                    <th className="py-2">E-mail</th>
                    <th className="py-2">Função</th>
                    <th className="py-2">Status</th>
                    <th className="py-2">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-border/60">
                      <td className="py-2 font-medium">{user.name}</td>
                      <td className="py-2">{user.email}</td>
                      <td className="py-2">{user.role}</td>
                      <td className="py-2">{user.active ? "Ativo" : "Inativo"}</td>
                      <td className="py-2 space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleStatusMutation.mutate({ id: user.id, active: !user.active })}
                          disabled={toggleStatusMutation.isLoading}
                        >
                          {user.active ? "Bloquear" : "Ativar"}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteUserMutation.mutate(user.id)}
                          disabled={deleteUserMutation.isLoading}
                        >
                          Excluir
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhum usuário cadastrado ainda para esta empresa.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
