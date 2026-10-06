// Dados ambientais: quatro grupos (água, solo, vegetação, terreno) com revisão e confirmação.
import { useState } from "react";
import { EROSION, LEVEL_F, LEVEL_M, MSG, SALINITY, SOIL_TEXTURE, WATER_AVAILABILITY, WATER_SOURCE, nf2 } from "@/lib/hf/labels";
import type { EnvironmentalInput } from "@/lib/hf/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Field } from "./ui-bits";

interface Props {
  busy: boolean;
  serverError?: string | null;
  onConfirm: (input: EnvironmentalInput) => Promise<void>;
}

const EMPTY: EnvironmentalInput = {
  water: { waterSourceType: "RIVER_STREAM", hasSpring: false, wellDepthMeters: null, waterAvailability: "PERMANENT", salinityIndicator: null },
  soil: { soilTexture: "SANDY", infiltrationRateMmPerHour: 0, compactionLevel: "LOW", erosionSigns: "NONE", soilExposedPercent: null },
  vegetation: { vegetationCoverPercent: 0, fragmentationLevel: "LOW", hasRiparianApp: null, landscapeDegradation: "LOW" },
  terrain: { drainageDensityKmPerKm2: null, elevationMeters: null, slopePercent: null },
};

function num(raw: string): number | null {
  if (raw["trim"]() === "") return null;
  const n = Number(raw["replace"](",", "."));
  return Number.isFinite(n) ? n : Number.NaN;
}

export function EnvForm({ busy, serverError, onConfirm }: Props) {
  const [v, setV] = useState<EnvironmentalInput>(EMPTY);
  const [raw, setRaw] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [step, setStep] = useState<"edit" | "review">("edit");

  const set = <G extends keyof EnvironmentalInput, K extends keyof EnvironmentalInput[G]>(g: G, k: K, val: EnvironmentalInput[G][K]) =>
    setV((p) => ({ ...p, [g]: { ...p[g], [k]: val } }));

  function validate(): boolean {
    const errs: Record<string, string> = {};
    const inf = num(raw["infiltration"] ?? String(v.soil.infiltrationRateMmPerHour));
    if (inf === null || Number.isNaN(inf) || inf < 0) errs["infiltration"] = "Informe um número maior ou igual a zero.";
    const cover = num(raw["cover"] ?? String(v.vegetation.vegetationCoverPercent));
    if (cover === null || Number.isNaN(cover) || cover < 0 || cover > 100) errs["cover"] = "Informe um percentual entre 0 e 100.";
    const depth = num(raw["depth"] ?? "");
    if (Number.isNaN(depth!) || (depth !== null && depth < 0)) errs["depth"] = "Profundidade inválida.";
    const exposed = num(raw["exposed"] ?? "");
    if (Number.isNaN(exposed!) || (exposed !== null && (exposed < 0 || exposed > 100))) errs["exposed"] = "Percentual entre 0 e 100.";
    const drain = num(raw["drain"] ?? "");
    if (Number.isNaN(drain!) || (drain !== null && drain < 0)) errs["drain"] = "Valor inválido.";
    const elev = num(raw["elev"] ?? "");
    if (Number.isNaN(elev!)) errs["elev"] = "Valor inválido.";
    const slope = num(raw["slope"] ?? "");
    if (Number.isNaN(slope!) || (slope !== null && (slope < 0 || slope > 100))) errs["slope"] = "Declividade entre 0 e 100%.";
    setErrors(errs);
    if (Object.keys(errs).length) {
      document.getElementById(`env-${Object.keys(errs)[0]}`)?.focus();
      return false;
    }
    setV((p) => ({
      ...p,
      water: { ...p.water, wellDepthMeters: depth },
      soil: { ...p.soil, infiltrationRateMmPerHour: inf!, soilExposedPercent: exposed },
      vegetation: { ...p.vegetation, vegetationCoverPercent: cover! },
      terrain: { drainageDensityKmPerKm2: drain, elevationMeters: elev, slopePercent: slope },
    }));
    return true;
  }

  if (step === "review") {
    const na = "Não informado";
    const simNao = (b: boolean | null) => (b === null ? na : b ? "Sim" : "Não");
    return (
      <Card className="rounded-card shadow-soft">
        <CardHeader>
          <CardTitle className="text-lg">Revise os dados ambientais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <Group title="Água" rows={[
            ["Fonte de água", WATER_SOURCE[v.water.waterSourceType]],
            ["Há nascente", v.water.hasSpring ? "Sim" : "Não"],
            ["Profundidade do poço (m)", v.water.wellDepthMeters === null ? na : nf2.format(v.water.wellDepthMeters)],
            ["Disponibilidade", WATER_AVAILABILITY[v.water.waterAvailability]],
            ["Salinidade", v.water.salinityIndicator === null ? na : SALINITY[v.water.salinityIndicator]],
          ]} />
          <Group title="Solo" rows={[
            ["Textura", SOIL_TEXTURE[v.soil.soilTexture]],
            ["Infiltração (mm/h)", nf2.format(v.soil.infiltrationRateMmPerHour)],
            ["Compactação", LEVEL_M[v.soil.compactionLevel]],
            ["Erosão", EROSION[v.soil.erosionSigns]],
            ["Solo exposto (%)", v.soil.soilExposedPercent === null ? na : nf2.format(v.soil.soilExposedPercent)],
          ]} />
          <Group title="Vegetação" rows={[
            ["Cobertura vegetal (%)", nf2.format(v.vegetation.vegetationCoverPercent)],
            ["Fragmentação", LEVEL_F[v.vegetation.fragmentationLevel]],
            ["APP ripária", simNao(v.vegetation.hasRiparianApp)],
            ["Degradação da paisagem", LEVEL_F[v.vegetation.landscapeDegradation]],
          ]} />
          <Group title="Terreno" rows={[
            ["Densidade de drenagem (km/km²)", v.terrain.drainageDensityKmPerKm2 === null ? na : nf2.format(v.terrain.drainageDensityKmPerKm2)],
            ["Elevação (m)", v.terrain.elevationMeters === null ? na : nf2.format(v.terrain.elevationMeters)],
            ["Declividade (%)", v.terrain.slopePercent === null ? na : nf2.format(v.terrain.slopePercent)],
          ]} />
          {serverError ? (
            <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">{serverError}</p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="min-h-11" onClick={() => setStep("edit")} disabled={busy}>Corrigir</Button>
            <Button className="min-h-11" disabled={busy} onClick={() => void onConfirm(v)}>
              {busy ? "Confirmando…" : "Confirmar dados ambientais"}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="rounded-card shadow-soft">
        <CardHeader><CardTitle className="text-lg">Água</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Fonte de água" htmlFor="env-source">
            <Select value={v.water.waterSourceType} onValueChange={(x) => set("water", "waterSourceType", x as typeof v.water.waterSourceType)}>
              <SelectTrigger id="env-source" className="min-h-11"><SelectValue /></SelectTrigger>
              <SelectContent>{Object.entries(WATER_SOURCE).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Disponibilidade" htmlFor="env-avail">
            <Select value={v.water.waterAvailability} onValueChange={(x) => set("water", "waterAvailability", x as typeof v.water.waterAvailability)}>
              <SelectTrigger id="env-avail" className="min-h-11"><SelectValue /></SelectTrigger>
              <SelectContent>{Object.entries(WATER_AVAILABILITY).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Profundidade do poço (m, opcional)" htmlFor="env-depth" error={errors["depth"]}>
            <Input id="env-depth" inputMode="decimal" className="min-h-11" value={raw["depth"] ?? ""} onChange={(e) => setRaw({ ...raw, depth: e.target.value })} aria-invalid={!!errors["depth"]} />
          </Field>
          <Field label="Indicador de salinidade (opcional)" htmlFor="env-sal">
            <Select value={v.water.salinityIndicator ?? "NONE_SET"} onValueChange={(x) => set("water", "salinityIndicator", x === "NONE_SET" ? null : (x as NonNullable<typeof v.water.salinityIndicator>))}>
              <SelectTrigger id="env-sal" className="min-h-11"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="NONE_SET">Não informado</SelectItem>
                {Object.entries(SALINITY).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <label className="flex min-h-11 items-center gap-2 text-sm">
            <Checkbox checked={v.water.hasSpring} onCheckedChange={(c) => set("water", "hasSpring", c === true)} />
            Há nascente na área
          </label>
        </CardContent>
      </Card>

      <Card className="rounded-card shadow-soft">
        <CardHeader><CardTitle className="text-lg">Solo</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Textura do solo" htmlFor="env-texture">
            <Select value={v.soil.soilTexture} onValueChange={(x) => set("soil", "soilTexture", x as typeof v.soil.soilTexture)}>
              <SelectTrigger id="env-texture" className="min-h-11"><SelectValue /></SelectTrigger>
              <SelectContent>{Object.entries(SOIL_TEXTURE).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Infiltração (mm/h)" htmlFor="env-infiltration" error={errors["infiltration"]}>
            <Input id="env-infiltration" inputMode="decimal" className="min-h-11" value={raw["infiltration"] ?? ""} onChange={(e) => setRaw({ ...raw, infiltration: e.target.value })} aria-invalid={!!errors["infiltration"]} />
          </Field>
          <Field label="Compactação" htmlFor="env-compaction">
            <Select value={v.soil.compactionLevel} onValueChange={(x) => set("soil", "compactionLevel", x as typeof v.soil.compactionLevel)}>
              <SelectTrigger id="env-compaction" className="min-h-11"><SelectValue /></SelectTrigger>
              <SelectContent>{Object.entries(LEVEL_M).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Sinais de erosão" htmlFor="env-erosion">
            <Select value={v.soil.erosionSigns} onValueChange={(x) => set("soil", "erosionSigns", x as typeof v.soil.erosionSigns)}>
              <SelectTrigger id="env-erosion" className="min-h-11"><SelectValue /></SelectTrigger>
              <SelectContent>{Object.entries(EROSION).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Solo exposto (%, opcional)" htmlFor="env-exposed" error={errors["exposed"]}>
            <Input id="env-exposed" inputMode="decimal" className="min-h-11" value={raw["exposed"] ?? ""} onChange={(e) => setRaw({ ...raw, exposed: e.target.value })} aria-invalid={!!errors["exposed"]} />
          </Field>
        </CardContent>
      </Card>

      <Card className="rounded-card shadow-soft">
        <CardHeader><CardTitle className="text-lg">Vegetação</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Cobertura vegetal (%)" htmlFor="env-cover" error={errors["cover"]}>
            <Input id="env-cover" inputMode="decimal" className="min-h-11" value={raw["cover"] ?? ""} onChange={(e) => setRaw({ ...raw, cover: e.target.value })} aria-invalid={!!errors["cover"]} />
          </Field>
          <Field label="Fragmentação" htmlFor="env-frag">
            <Select value={v.vegetation.fragmentationLevel} onValueChange={(x) => set("vegetation", "fragmentationLevel", x as typeof v.vegetation.fragmentationLevel)}>
              <SelectTrigger id="env-frag" className="min-h-11"><SelectValue /></SelectTrigger>
              <SelectContent>{Object.entries(LEVEL_F).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Degradação da paisagem" htmlFor="env-deg">
            <Select value={v.vegetation.landscapeDegradation} onValueChange={(x) => set("vegetation", "landscapeDegradation", x as typeof v.vegetation.landscapeDegradation)}>
              <SelectTrigger id="env-deg" className="min-h-11"><SelectValue /></SelectTrigger>
              <SelectContent>{Object.entries(LEVEL_F).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="APP ripária (opcional)" htmlFor="env-app">
            <Select value={v.vegetation.hasRiparianApp === null ? "NONE_SET" : v.vegetation.hasRiparianApp ? "YES" : "NO"} onValueChange={(x) => set("vegetation", "hasRiparianApp", x === "NONE_SET" ? null : x === "YES")}>
              <SelectTrigger id="env-app" className="min-h-11"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="NONE_SET">Não informado</SelectItem>
                <SelectItem value="YES">Sim</SelectItem>
                <SelectItem value="NO">Não</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </CardContent>
      </Card>

      <Card className="rounded-card shadow-soft">
        <CardHeader><CardTitle className="text-lg">Terreno</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <Field label="Densidade de drenagem (km/km²)" htmlFor="env-drain" error={errors["drain"]}>
            <Input id="env-drain" inputMode="decimal" className="min-h-11" value={raw["drain"] ?? ""} onChange={(e) => setRaw({ ...raw, drain: e.target.value })} aria-invalid={!!errors["drain"]} />
          </Field>
          <Field label="Elevação (m)" htmlFor="env-elev" error={errors["elev"]}>
            <Input id="env-elev" inputMode="decimal" className="min-h-11" value={raw["elev"] ?? ""} onChange={(e) => setRaw({ ...raw, elev: e.target.value })} aria-invalid={!!errors["elev"]} />
          </Field>
          <Field label="Declividade (%)" htmlFor="env-slope" error={errors["slope"]} hint="Necessária para o diagnóstico experimental.">
            <Input id="env-slope" inputMode="decimal" className="min-h-11" value={raw["slope"] ?? ""} onChange={(e) => setRaw({ ...raw, slope: e.target.value })} aria-invalid={!!errors["slope"]} />
          </Field>
        </CardContent>
      </Card>

      <Button
        className="min-h-11"
        onClick={() => {
          if (validate()) setStep("review");
        }}
      >
        Revisar
      </Button>
    </div>
  );
}

function Group({ title, rows }: { title: string; rows: [string, string][] }) {
  return (
    <section>
      <h3 className="mb-1 text-sm font-semibold">{title}</h3>
      <dl className="grid gap-1 text-sm">
        {rows.map(([k, val]) => (
          <div key={k} className="flex justify-between gap-4">
            <dt className="text-muted-foreground">{k}</dt>
            <dd className="text-right font-medium">{val}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
