import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/hf/adapter";
import { can } from "@/lib/hf/permissions";
import { ApiError, type EnvironmentalInput } from "@/lib/hf/types";
import { EROSION, LEVEL_F, LEVEL_M, SALINITY, SOIL_TEXTURE, WATER_AVAILABILITY, WATER_SOURCE, nf2 } from "@/lib/hf/labels";
import { EnvForm } from "@/components/hf/env-form";
import { Crumb, ErrorState, Loading, PageHeader } from "@/components/hf/ui-bits";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/dashboard/laboratories/$labId/areas/$areaId/collections/$collectionId/environmental")({
  head: () => ({
    meta: [
      { title: "Dados ambientais — HidroFlorestas" },
      { name: "description", content: "Conjunto ambiental da coleta: água, solo, vegetação e terreno (demonstração)." },
      { property: "og:title", content: "Dados ambientais — HidroFlorestas" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Environmental,
});

function Environmental() {
  const { labId, areaId, collectionId } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const env = useQuery({ queryKey: ["env", collectionId], queryFn: () => api.getEnvironmental(labId, areaId, collectionId) });
  const lab = useQuery({ queryKey: ["lab", labId], queryFn: () => api.getLab(labId) });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [key] = useState(() => crypto.randomUUID());

  if (env.isLoading || lab.isLoading) return <Loading />;
  if (env.isError || lab.isError) return <ErrorState onRetry={() => { void env.refetch(); void lab.refetch(); }} />;

  const crumbs = (
    <Crumb items={[{ label: "Meus laboratórios", to: "/workspace" }, { label: lab.data.name }, { label: "Coleta", to: `/dashboard/laboratories/${labId}/areas/${areaId}/collections/${collectionId}` }, { label: "Dados ambientais" }]} />
  );

  if (env.data) {
    const e = env.data;
    const na = "Não informado";
    return (
      <>
        {crumbs}
        <PageHeader title="Dados ambientais" description={`Confirmados em ${new Date(e.confirmedAt).toLocaleString("pt-BR")} · somente leitura.`} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Group title="Água" rows={[
            ["Fonte de água", WATER_SOURCE[e.water.waterSourceType]],
            ["Há nascente", e.water.hasSpring ? "Sim" : "Não"],
            ["Profundidade do poço (m)", e.water.wellDepthMeters === null ? na : nf2.format(e.water.wellDepthMeters)],
            ["Disponibilidade", WATER_AVAILABILITY[e.water.waterAvailability]],
            ["Salinidade", e.water.salinityIndicator === null ? na : SALINITY[e.water.salinityIndicator]],
          ]} />
          <Group title="Solo" rows={[
            ["Textura", SOIL_TEXTURE[e.soil.soilTexture]],
            ["Infiltração (mm/h)", nf2.format(e.soil.infiltrationRateMmPerHour)],
            ["Compactação", LEVEL_M[e.soil.compactionLevel]],
            ["Erosão", EROSION[e.soil.erosionSigns]],
            ["Solo exposto (%)", e.soil.soilExposedPercent === null ? na : nf2.format(e.soil.soilExposedPercent)],
          ]} />
          <Group title="Vegetação" rows={[
            ["Cobertura vegetal (%)", nf2.format(e.vegetation.vegetationCoverPercent)],
            ["Fragmentação", LEVEL_F[e.vegetation.fragmentationLevel]],
            ["APP ripária", e.vegetation.hasRiparianApp === null ? na : e.vegetation.hasRiparianApp ? "Sim" : "Não"],
            ["Degradação da paisagem", LEVEL_F[e.vegetation.landscapeDegradation]],
          ]} />
          <Group title="Terreno" rows={[
            ["Densidade de drenagem (km/km²)", e.terrain.drainageDensityKmPerKm2 === null ? na : nf2.format(e.terrain.drainageDensityKmPerKm2)],
            ["Elevação (m)", e.terrain.elevationMeters === null ? na : nf2.format(e.terrain.elevationMeters)],
            ["Declividade (%)", e.terrain.slopePercent === null ? na : nf2.format(e.terrain.slopePercent)],
          ]} />
        </div>
      </>
    );
  }

  if (!can(lab.data.context).registerEnvironmental)
    return (
      <>
        {crumbs}
        <ErrorState title="Somente leitura" description="Este laboratório está inativo ou seu papel não permite registrar dados ambientais." />
      </>
    );

  async function confirm(input: EnvironmentalInput) {
    setBusy(true);
    setError(null);
    try {
      await api.createEnvironmental(labId, areaId, collectionId, input, key);
      await qc.invalidateQueries({ queryKey: ["env", collectionId] });
      navigate({ to: "/dashboard/laboratories/$labId/areas/$areaId/collections/$collectionId", params: { labId, areaId, collectionId } });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Não foi possível confirmar os dados ambientais.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {crumbs}
      <PageHeader title="Registrar dados ambientais" description="Preencha os quatro grupos e revise antes de confirmar." />
      <EnvForm busy={busy} serverError={error} onConfirm={confirm} />
    </>
  );
}

function Group({ title, rows }: { title: string; rows: [string, string][] }) {
  return (
    <Card className="rounded-card shadow-soft">
      <CardHeader><CardTitle className="text-lg">{title}</CardTitle></CardHeader>
      <CardContent>
        <dl className="grid gap-1 text-sm">
          {rows.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4">
              <dt className="text-muted-foreground">{k}</dt>
              <dd className="text-right font-medium">{v}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}
