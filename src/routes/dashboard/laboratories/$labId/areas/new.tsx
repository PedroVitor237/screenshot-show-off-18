import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/hf/adapter";
import { can } from "@/lib/hf/permissions";
import { ApiError, type AreaInput } from "@/lib/hf/types";
import { AreaForm } from "@/components/hf/area-form";
import { Crumb, ErrorState, Loading, PageHeader } from "@/components/hf/ui-bits";

export const Route = createFileRoute("/dashboard/laboratories/$labId/areas/new")({
  head: () => ({
    meta: [
      { title: "Nova área — HidroFlorestas" },
      { name: "description", content: "Cadastro de nova área com coordenadas, mapa ou localização do dispositivo (demonstração)." },
      { property: "og:title", content: "Nova área — HidroFlorestas" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NewArea,
});

function NewArea() {
  const { labId } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const lab = useQuery({ queryKey: ["lab", labId], queryFn: () => api.getLab(labId) });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (lab.isLoading) return <Loading />;
  if (lab.isError) return <ErrorState onRetry={() => void lab.refetch()} />;
  if (!can(lab.data!.context).createArea)
    return <ErrorState title="Sem permissão" description="Somente proprietários e administradores cadastram áreas." />;

  async function confirm(input: AreaInput) {
    setBusy(true);
    setError(null);
    try {
      const a = await api.createArea(labId, input);
      await qc.invalidateQueries({ queryKey: ["areas", labId] });
      navigate({ to: "/dashboard/laboratories/$labId/areas/$areaId", params: { labId, areaId: a.id } });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Não foi possível salvar a área.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Crumb items={[{ label: "Meus laboratórios", to: "/workspace" }, { label: lab.data!.name }, { label: "Áreas", to: `/dashboard/laboratories/${labId}/areas` }, { label: "Nova área" }]} />
      <PageHeader title="Nova área" description="Informe os dados e revise antes de confirmar." />
      <AreaForm busy={busy} serverError={error} onConfirm={confirm} />
    </>
  );
}
