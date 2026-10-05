import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ClipboardList } from "lucide-react";
import { api } from "@/lib/hf/adapter";
import { formatDeclared } from "@/lib/hf/datetime";
import { Crumb, ErrorState, Loading, PageHeader } from "@/components/hf/ui-bits";
import { IhfrSection } from "@/components/hf/ihfr";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/dashboard/laboratories/$labId/areas/$areaId/collections/$collectionId")({
  head: () => ({
    meta: [
      { title: "Coleta — HidroFlorestas" },
      { name: "description", content: "Detalhes da coleta, dados ambientais e diagnóstico experimental (demonstração)." },
      { property: "og:title", content: "Coleta — HidroFlorestas" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CollectionDetail,
});

function CollectionDetail() {
  const { labId, areaId, collectionId } = Route.useParams();
  const col = useQuery({ queryKey: ["collection", labId, areaId, collectionId], queryFn: () => api.getCollection(labId, areaId, collectionId) });
  const env = useQuery({ queryKey: ["env", collectionId], queryFn: () => api.getEnvironmental(labId, areaId, collectionId) });
  const lab = useQuery({ queryKey: ["lab", labId], queryFn: () => api.getLab(labId) });

  if (col.isLoading || lab.isLoading) return <Loading />;
  if (col.isError || lab.isError) return <ErrorState onRetry={() => { void col.refetch(); void lab.refetch(); }} />;

  const c = col.data;

  return (
    <>
      <Crumb items={[{ label: "Meus laboratórios", to: "/workspace" }, { label: c.laboratory.name }, { label: c.area.name, to: `/dashboard/laboratories/${labId}/areas/${areaId}` }, { label: "Coleta" }]} />
      <PageHeader title="Coleta" description={`Ocorrida em ${formatDeclared(c.occurredAt)}`} />
      <div className="space-y-6">
        <Card className="rounded-card shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ClipboardList className="size-5 text-primary" aria-hidden /> Dados ambientais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {env.isLoading ? (
              <Loading />
            ) : env.data ? (
              <p className="text-sm text-muted-foreground">
                Conjunto confirmado em {new Date(env.data.confirmedAt).toLocaleString("pt-BR")} (contrato {env.data.measurementContractVersion}).
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhum conjunto ambiental confirmado para esta coleta.</p>
            )}
            <Button asChild variant="outline" className="min-h-11">
              <Link
                to="/dashboard/laboratories/$labId/areas/$areaId/collections/$collectionId/environmental"
                params={{ labId, areaId, collectionId }}
              >
                {env.data ? "Ver dados ambientais" : "Registrar dados ambientais"}
              </Link>
            </Button>
          </CardContent>
        </Card>
        <IhfrSection labId={labId} areaId={areaId} collectionId={collectionId} ctx={lab.data.context} />
      </div>
    </>
  );
}
