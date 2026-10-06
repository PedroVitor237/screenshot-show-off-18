import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ShieldCheck, Users } from "lucide-react";
import { api } from "@/lib/hf/adapter";
import { ACCOUNT_STATUS } from "@/lib/hf/labels";
import { AppShell, RequireSession } from "@/components/hf/layout";
import { ErrorState, Loading, PageHeader } from "@/components/hf/ui-bits";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Administração — HidroFlorestas" },
      { name: "description", content: "Visão geral da administração global (demonstração)." },
      { property: "og:title", content: "Administração — HidroFlorestas" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminHome,
});

function AdminHome() {
  return (
    <RequireSession>
      <AppShell>
        <AdminBody />
      </AppShell>
    </RequireSession>
  );
}

function AdminBody() {
  const overview = useQuery({ queryKey: ["admin-overview"], queryFn: () => api.adminOverview(), retry: false });

  if (overview.isLoading) return <Loading />;
  if (overview.isError)
    return (
      <ErrorState
        title="Acesso restrito"
        description="Esta área é exclusiva de administradores globais. Entre com o perfil de Diego no painel de demonstração."
      />
    );

  const o = overview.data!;
  return (
    <>
      <PageHeader
        title="Administração"
        description="Visão geral das contas da plataforma."
        actions={
          <Button asChild className="min-h-11">
            <Link to="/admin/users">
              <Users className="size-4" aria-hidden /> Gerenciar contas
            </Link>
          </Button>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-card shadow-soft">
          <CardContent className="pt-6">
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <ShieldCheck className="size-4" aria-hidden /> Total de contas
            </p>
            <p className="mt-1 text-3xl font-semibold">{o.total}</p>
          </CardContent>
        </Card>
        {(Object.keys(ACCOUNT_STATUS) as (keyof typeof ACCOUNT_STATUS)[]).map((s) => (
          <Card key={s} className="rounded-card shadow-soft">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">{ACCOUNT_STATUS[s]}</p>
              <p className="mt-1 text-3xl font-semibold">{o.byStatus[s]}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
