import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { api } from "@/lib/hf/adapter";
import { can } from "@/lib/hf/permissions";
import { Crumb, EmptyState, ErrorState, Loading, PageHeader } from "@/components/hf/ui-bits";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/dashboard/laboratories/$labId/areas/")({
  head: () => ({
    meta: [
      { title: "Áreas — HidroFlorestas" },
      { name: "description", content: "Áreas cadastradas do laboratório (demonstração)." },
      { property: "og:title", content: "Áreas — HidroFlorestas" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Areas,
});

function Areas() {
  const { labId } = Route.useParams();
  const q = useQuery({ queryKey: ["areas", labId], queryFn: () => api.listAreas(labId) });

  if (q.isLoading) return <Loading />;
  if (q.isError) return <ErrorState onRetry={() => void q.refetch()} />;

  const { context, areas } = q.data!;
  const canCreate = can(context).createArea;

  return (
    <>
      <Crumb items={[{ label: "Meus laboratórios", to: "/workspace" }, { label: context.laboratory.name }, { label: "Áreas" }]} />
      <PageHeader
        title="Áreas"
        description={`${areas.length} área(s) cadastradas.`}
        actions={
          canCreate ? (
            <Button asChild className="min-h-11">
              <Link to="/dashboard/laboratories/$labId/areas/new" params={{ labId }}>
                <Plus className="size-4" aria-hidden /> Nova área
              </Link>
            </Button>
          ) : undefined
        }
      />
      {areas.length === 0 ? (
        <EmptyState
          title="Nenhuma área cadastrada"
          description={canCreate ? "Cadastre a primeira área para começar as coletas." : "Aguarde um administrador cadastrar a primeira área."}
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {areas.map((a) => (
            <li key={a.id}>
              <Link to="/dashboard/laboratories/$labId/areas/$areaId" params={{ labId, areaId: a.id }}>
                <Card className="rounded-card shadow-soft transition-colors hover:bg-accent">
                  <CardContent className="space-y-1 pt-6">
                    <p className="font-medium">{a.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {a.municipality && a.state ? `${a.municipality}/${a.state}` : "Localidade não informada"}
                    </p>
                    <p className="font-mono text-xs text-muted-foreground">
                      {a.latitude.toFixed(4)}, {a.longitude.toFixed(4)}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
