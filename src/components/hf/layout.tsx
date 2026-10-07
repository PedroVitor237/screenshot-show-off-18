// Cascas de layout: barra superior e menu lateral do laboratório.
import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { LayoutDashboard, LogOut, Map as MapIcon, Menu, Users, Waypoints } from "lucide-react";
import { api } from "@/lib/hf/adapter";
import { useScenario } from "@/lib/hf/scenario-store";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Wordmark } from "./ui-bits";
import { cn } from "@/lib/utils";

export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: () => api.me(),
    retry: false,
    staleTime: 30_000,
  });
}

/** Redireciona para /login quando não há sessão de demonstração. */
export function RequireSession({ children }: { children: ReactNode }) {
  const s = useScenario();
  const navigate = useNavigate();
  const me = useMe();
  // A sessão de demonstração só existe no navegador: evita divergência de hidratação.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  const mustLeave = hydrated && (!s.session || me.isError);
  useEffect(() => {
    if (mustLeave) void navigate({ to: "/login" });
  }, [mustLeave, navigate]);
  if (!hydrated || mustLeave) return null;
  if (!me.data) return <div className="p-8 text-sm text-muted-foreground" role="status">Carregando sessão…</div>;
  return <>{children}</>;
}

export function AppShell({ children }: { children: ReactNode }) {
  const me = useMe();
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-card">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
          <Link to="/workspace" aria-label="HidroFlorestas — início">
            <Wordmark />
          </Link>
          <div className="flex items-center gap-2">
            {me.data ? (
              <span className="hidden text-sm text-muted-foreground sm:inline">
                {me.data.user.firstName} {me.data.user.lastName}
              </span>
            ) : null}
            {me.data?.isGlobalAdmin ? (
              <Button asChild variant="ghost" className="min-h-11">
                <Link to="/admin">Administração</Link>
              </Button>
            ) : null}
            <Button asChild variant="outline" className="min-h-11">
              <Link to="/logout">
                <LogOut className="size-4" aria-hidden /> Sair
              </Link>
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}

const NAV = [
  { to: "/dashboard/laboratories/$labId", label: "Resumo", icon: LayoutDashboard, exact: true },
  { to: "/dashboard/laboratories/$labId/areas", label: "Áreas", icon: Waypoints },
  { to: "/dashboard/laboratories/$labId/mapa", label: "Mapa", icon: MapIcon },
  { to: "/dashboard/laboratories/$labId/membros", label: "Membros", icon: Users, ownerOnly: true },
] as const;

export function LabShell({ children }: { children: ReactNode }) {
  const { labId } = useParams({ strict: false }) as { labId: string };
  const lab = useQuery({ queryKey: ["lab", labId], queryFn: () => api.getLab(labId) });
  const [open, setOpen] = useState(false);
  const isOwner = lab.data?.context.role === "OWNER";

  const nav = (
    <nav aria-label="Menu do laboratório" className="grid gap-1">
      {NAV.filter((n) => !("ownerOnly" in n && n.ownerOnly) || isOwner).map((n) => (
        <Link
          key={n.label}
          to={n.to}
          params={{ labId }}
          activeOptions={{ exact: "exact" in n && n.exact }}
          onClick={() => setOpen(false)}
          className="flex min-h-11 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
          activeProps={{ className: "bg-accent text-foreground" }}
        >
          <n.icon className="size-4" aria-hidden />
          {n.label}
        </Link>
      ))}
    </nav>
  );

  return (
    <div className="grid gap-6 md:grid-cols-[220px_1fr]">
      <div className="md:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="min-h-11">
              <Menu className="size-4" aria-hidden /> Menu do laboratório
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-4">
            <p className="mb-3 mt-6 text-sm font-semibold">{lab.data?.name ?? "Laboratório"}</p>
            {nav}
          </SheetContent>
        </Sheet>
      </div>
      <aside className="hidden md:block">
        <div className={cn("sticky top-24 rounded-card border bg-card p-3 shadow-soft")}>
          <p className="mb-2 px-3 text-sm font-semibold">{lab.data?.name ?? "…"}</p>
          {lab.data?.context.laboratory.status === "INACTIVE" ? (
            <p className="mb-2 rounded-lg bg-ochre/10 px-3 py-2 text-xs font-medium text-ochre">
              Laboratório inativo — somente leitura.
            </p>
          ) : null}
          {nav}
        </div>
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
