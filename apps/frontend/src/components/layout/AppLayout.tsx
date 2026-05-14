import { Menu, Moon, Sun, Wifi } from "lucide-react";
import { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth";
import { cn } from "@/lib/utils";

const links = [
  { to: "/", label: "Dashboard" },
  { to: "/hotspot", label: "Hotspot" },
  { to: "/financeiro", label: "Financeiro" },
];

export function AppLayout() {
  const [open, setOpen] = useState(false);
  const [light, setLight] = useState(false);
  const clear = useAuthStore((s) => s.clear);
  const navigate = useNavigate();

  const toggleTheme = () => {
    setLight((v) => !v);
    document.documentElement.classList.toggle("light", !light);
  };

  return (
    <div className="flex min-h-screen bg-background">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 border-r border-border bg-card/80 backdrop-blur transition-transform lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="flex h-16 items-center gap-2 border-b border-border px-4">
          <Wifi className="h-6 w-6 text-primary" />
          <div>
            <p className="text-sm font-semibold">Hotspot SaaS</p>
            <p className="text-xs text-muted-foreground">MikroTik · Atlaz · PIX</p>
          </div>
        </div>
        <nav className="space-y-1 p-3">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === "/"}
              className={({ isActive }) =>
                cn(
                  "block rounded-md px-3 py-2 text-sm transition-colors",
                  isActive ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )
              }
              onClick={() => setOpen(false)}
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="absolute bottom-4 left-4 right-4 space-y-2">
          <Button variant="outline" className="w-full" onClick={toggleTheme}>
            {light ? <Moon className="mr-2 h-4 w-4" /> : <Sun className="mr-2 h-4 w-4" />}
            Tema
          </Button>
          <Button variant="ghost" className="w-full" onClick={() => { clear(); navigate("/login"); }}>
            Sair
          </Button>
        </div>
      </aside>
      {open && <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setOpen(false)} />}
      <div className="flex min-h-screen flex-1 flex-col lg:pl-0">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur">
          <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex flex-1 items-center justify-between">
            <p className="text-sm text-muted-foreground">Painel administrativo</p>
            <Link to="/" className="text-sm font-medium text-primary">
              Suporte
            </Link>
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
