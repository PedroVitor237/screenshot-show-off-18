import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/hf/adapter";
import { formatDeclared } from "@/lib/hf/datetime";
import { AreaMap } from "@/components/hf/map";
import { Crumb, ErrorState, Loading, PageHeader } from "@/components/hf/ui-bits";

export const Route = createFileRoute("/dashboard/laboratories/$labId/mapa")({
  head: () => ({
    meta: [
      { title: "Mapa territorial — HidroFlorestas" },
      { name: "description", content: "Mapa das áreas do laboratório com lista acessível (demonstração)." },
      { property: "og:title", content: "Mapa territorial — HidroFlorestas" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LabMap,
});

function LabMap() {
  const { labId } = Route.useParams();
  const q = useQuery({ queryKey: ["map", labId], queryFn: () => api.territorialMap(labId) });

  if (q.isLoading) return <Loading label="Carregando mapa…" />;
  if (q.isError) return <ErrorState onRetry={() => void q.refetch()} />;

  const { context, areas } = q.data!;
  const withLocation = areas.filter((a) => a.location !== null);
  const withoutLocation = areas.filter((a) => a.location === null);

  return (
    <>
      <Crumb items={[{ label: "Meus laboratórios", to: "/workspace" }, { label: context.laboratory.name }, { label: "Mapa" }]} />
      <PageHeader title="Mapa territorial" description="Pontos das áreas e suas coletas confirmadas." />
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <AreaMap
          height={440}
          points={withLocation.map((a) => ({ id: a.id, name: a.name, latitude: a.location!.latitude, longitude: a.location!.longitude }))}
        />
        <nav aria-label="Lista de áreas" className="space-y-2">
          <h2 className="text-sm font-semibold">Áreas ({areas.length})</h2>
          <ul className="space-y-2">
            {areas.map((a) => (
              <li key={a.id}>
                <Link
                  to="/dashboard/laboratories/$labId/areas/$areaId"
                  params={{ labId, areaId: a.id }}
                  className="block rounded-lg border bg-card px-4 py-3 text-sm shadow-soft hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring"
                >
                  <span className="font-medium">{a.name}</span>
                  <span className="block text-xs text-muted-foreground">
                    {a.location
                      ? `${a.location.latitude.toFixed(4)}, ${a.location.longitude.toFixed(4)} · ${a.confirmedCollections.length} coleta(s)`
                      : "Área sem localização"}
                  </span>
                  {a.confirmedCollections[0] ? (
                    <span className="block text-xs text-muted-foreground">
                      Última coleta: {formatDeclared(a.confirmedCollections[a.confirmedCollections.length - 1]!.occurredAt)}
                    </span>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
          {withoutLocation.length > 0 ? (
            <p className="rounded-lg bg-ochre/10 px-3 py-2 text-xs text-ochre" role="status">
              {withoutLocation.length} área(s) sem localização não aparecem no mapa.
            </p>
          ) : null}
        </nav>
      </div>
    </>
  );
}
