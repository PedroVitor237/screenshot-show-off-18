import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { api } from "@/lib/hf/adapter";
import { can } from "@/lib/hf/permissions";
import { formatDeclared } from "@/lib/hf/datetime";
import { Crumb, ErrorState, Loading, PageHeader } from "@/components/hf/ui-bits";
import { AreaMap } from "@/components/hf/map";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/dashboard/laboratories/$labId/areas/$areaId")({
  head: () => ({
    meta: [
      { title: "Área — HidroFlorestas" },
      { name: "description", content: "Detalhes da área e coletas confirmadas (demonstração)." },
      { property: "og:title", content: "Área — HidroFlorestas" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AreaDetail,
});

function AreaDetail() {
  const { labId, areaId } = Route.useParams();
  const area = useQuery({ queryKey: ["area", labId, areaId], queryFn: () => api.getArea(labId, areaId) });
  const map = useQuery({ queryKey: ["map", labId], queryFn: () => api.territorialMap(labId) });

  if (area.isLoading) return <Loading />;
  if (area.isError) return <ErrorState onRetry={() => void area.refetch()} />;

  const a = area.data!;
  const ctx = { laboratory: a.laboratory, role: "MEMBER" as const, readOnly: a.readOnly };
  const labCtx = map.data?.context ?? ctx;
  const canCollect = can(labCtx).registerCollection;
  const collections = map.data?.areas.find((x) => x.id === areaId)?.confirmedCollections ?? [];

  return (
    <>
      <Crumb items={[{ label: "Meus laboratórios", to: "/workspace" }, { label: a.laboratory.name }, { label: "Áreas", to: `/dashboard/laboratories/${labId}/areas` }, { label: a.name }]} />
      <PageHeader
        title={a.name}
        description={a.municipality && a.state ? `${a.municipality}/${a.state}` : "Localidade não informada"}
        actions={
          canCollect ? (
            <Button asChild className="min-h-11">
              <Link to="/dashboard/laboratories/$labId/areas/$areaId/collections/new" params={{ labId, areaId }}>
                <Plus className="size-4" aria-hidden /> Nova coleta
              </Link>
            </Button>
          ) : undefined
        }
      />
      {a.locationMissing ? (
        <p role="status" className="mb-4 rounded-lg bg-ochre/10 px-3 py-2 text-sm font-medium text-ochre">
          Esta área não possui localização registrada; o ponto não aparece no mapa.
        </p>
      ) : null}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-card shadow-soft">
          <CardHeader><CardTitle className="text-lg">Detalhes</CardTitle></CardHeader>
          <CardContent>
            <dl className="grid gap-2 text-sm">
              <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Coordenadas</dt><dd className="font-mono text-xs">{a.latitude.toFixed(6)}, {a.longitude.toFixed(6)}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Tipo de terra</dt><dd>{a.landType ?? "Não informado"}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Descrição</dt><dd className="text-right">{a.description ?? "Não informada"}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Criada em</dt><dd>{new Date(a.createdAt).toLocaleDateString("pt-BR")}</dd></div>
            </dl>
          </CardContent>
        </Card>
        {!a.locationMissing ? (
          <AreaMap points={[{ id: a.id, name: a.name, latitude: a.latitude, longitude: a.longitude }]} />
        ) : null}
      </div>
      <section className="mt-8" aria-label="Coletas">
        <h2 className="mb-3 text-lg font-semibold">Coletas confirmadas</h2>
        {collections.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma coleta confirmada nesta área.</p>
        ) : (
          <ul className="space-y-2">
            {collections.map((c) => (
              <li key={c.id}>
                <Link
                  to="/dashboard/laboratories/$labId/areas/$areaId/collections/$collectionId"
                  params={{ labId, areaId, collectionId: c.id }}
                  className="block rounded-lg border bg-card px-4 py-3 text-sm shadow-soft hover:bg-accent"
                >
                  <span className="font-medium">Coleta de {formatDeclared(c.occurredAt)}</span>
                  <span className="block text-xs text-muted-foreground">
                    Confirmada em {new Date(c.confirmedAt).toLocaleString("pt-BR")}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
