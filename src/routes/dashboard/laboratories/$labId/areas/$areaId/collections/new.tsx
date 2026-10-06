import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/hf/adapter";
import { can } from "@/lib/hf/permissions";
import { ApiError } from "@/lib/hf/types";
import { OccurredAtForm } from "@/components/hf/occurred-at-form";
import { Crumb, ErrorState, Loading, PageHeader } from "@/components/hf/ui-bits";

export const Route = createFileRoute("/dashboard/laboratories/$labId/areas/$areaId/collections/new")({
  head: () => ({
    meta: [
      { title: "Nova coleta — HidroFlorestas" },
      { name: "description", content: "Registro de nova coleta com data, hora e fuso explícito (demonstração)." },
      { property: "og:title", content: "Nova coleta — HidroFlorestas" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NewCollection,
});

function NewCollection() {
  const { labId, areaId } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const area = useQuery({ queryKey: ["area", labId, areaId], queryFn: () => api.getArea(labId, areaId) });
  const lab = useQuery({ queryKey: ["lab", labId], queryFn: () => api.getLab(labId) });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Chave de idempotência estável por tentativa de formulário.
  const idempotencyKey = useMemo(() => crypto.randomUUID(), []);

  if (area.isLoading || lab.isLoading) return <Loading />;
  if (area.isError || lab.isError) return <ErrorState onRetry={() => { void area.refetch(); void lab.refetch(); }} />;
  if (!can(lab.data!.context).registerCollection)
    return <ErrorState title="Somente leitura" description="Este laboratório está inativo ou seu papel não permite registrar coletas." />;

  async function confirm(occurredAt: string) {
    setBusy(true);
    setError(null);
    try {
      const c = await api.createCollection(labId, areaId, occurredAt, idempotencyKey);
      await qc.invalidateQueries({ queryKey: ["map", labId] });
      navigate({ to: "/dashboard/laboratories/$labId/areas/$areaId/collections/$collectionId", params: { labId, areaId, collectionId: c.id } });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Não foi possível confirmar a coleta.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Crumb items={[{ label: "Meus laboratórios", to: "/workspace" }, { label: lab.data!.name }, { label: area.data!.name, to: `/dashboard/laboratories/${labId}/areas/${areaId}` }, { label: "Nova coleta" }]} />
      <PageHeader title="Nova coleta" description={`Área: ${area.data!.name}`} />
      <OccurredAtForm busy={busy} serverError={error} onConfirm={confirm} />
    </>
  );
}
