// Formulário de nova área: coordenadas manuais, clique no mapa ou localização do dispositivo.
import { useRef, useState } from "react";
import { Crosshair, MapPin } from "lucide-react";
import { useScenario } from "@/lib/hf/scenario-store";
import type { AreaInput } from "@/lib/hf/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "./ui-bits";
import { AreaMap } from "./map";

interface Props {
  busy: boolean;
  serverError?: string | null;
  onConfirm: (input: AreaInput) => Promise<void>;
}

export function AreaForm({ busy, serverError, onConfirm }: Props) {
  const s = useScenario();
  const [name, setName] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [municipality, setMunicipality] = useState("");
  const [uf, setUf] = useState("");
  const [landType, setLandType] = useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [step, setStep] = useState<"edit" | "review">("edit");
  const [geoState, setGeoState] = useState<"idle" | "waiting" | "denied" | "late">("idle");
  const nameRef = useRef<HTMLInputElement>(null);
  const latRef = useRef<HTMLInputElement>(null);

  const latN = Number(lat.replace(",", "."));
  const lngN = Number(lng.replace(",", "."));
  const hasPoint = lat.trim() !== "" && lng.trim() !== "" && Number.isFinite(latN) && Number.isFinite(lngN);

  function validate(): AreaInput | null {
    const errs: Record<string, string> = {};
    if (name.trim().length < 1 || name.trim().length > 100) errs.name = "Informe um nome entre 1 e 100 caracteres.";
    if (!hasPoint) errs.lat = "Informe coordenadas válidas (manual, mapa ou localização do dispositivo).";
    else {
      if (latN < -90 || latN > 90) errs.lat = "Latitude deve estar entre -90 e 90.";
      if (lngN < -180 || lngN > 180) errs.lng = "Longitude deve estar entre -180 e 180.";
    }
    if (uf && !/^[A-Za-z]{2}$/.test(uf)) errs.uf = "Use a sigla do estado, ex.: CE.";
    setErrors(errs);
    if (errs.name) nameRef.current?.focus();
    else if (errs.lat) latRef.current?.focus();
    if (Object.keys(errs).length) return null;
    return {
      name: name.trim(),
      latitude: latN,
      longitude: lngN,
      municipality: municipality.trim() || null,
      state: uf.trim().toUpperCase() || null,
      landType: landType.trim() || null,
      description: description.trim() || null,
    };
  }

  function useDeviceLocation() {
    if (s.geo === "denied") {
      setGeoState("denied");
      return;
    }
    setGeoState(s.geo === "late" ? "late" : "waiting");
    const apply = () => {
      setLat("-7.2307");
      setLng("-39.3128");
      setGeoState("idle");
    };
    // Cenário "atrasada": a resposta demora vários segundos.
    setTimeout(apply, s.geo === "late" ? 6000 : 800);
  }

  if (step === "review") {
    const input = validate();
    if (!input) setStep("edit");
    else
      return (
        <Card className="rounded-card shadow-soft">
          <CardHeader>
            <CardTitle className="text-lg">Revise a nova área</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <dl className="grid gap-2 text-sm">
              <Row k="Nome" v={input.name} />
              <Row k="Coordenadas" v={`${input.latitude.toFixed(6)}, ${input.longitude.toFixed(6)}`} />
              <Row k="Município" v={input.municipality ?? "Não informado"} />
              <Row k="Estado" v={input.state ?? "Não informado"} />
              <Row k="Tipo de terra" v={input.landType ?? "Não informado"} />
              <Row k="Descrição" v={input.description ?? "Não informada"} />
            </dl>
            {serverError ? (
              <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">{serverError}</p>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" className="min-h-11" onClick={() => setStep("edit")} disabled={busy}>
                Corrigir
              </Button>
              <Button className="min-h-11" disabled={busy} onClick={() => void onConfirm(input)}>
                {busy ? "Salvando…" : "Confirmar área"}
              </Button>
            </div>
          </CardContent>
        </Card>
      );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="rounded-card shadow-soft">
        <CardHeader>
          <CardTitle className="text-lg">Dados da área</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="Nome da área" htmlFor="area-name" error={errors.name}>
            <Input ref={nameRef} id="area-name" className="min-h-11" value={name} onChange={(e) => setName(e.target.value)} aria-invalid={!!errors.name} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Latitude" htmlFor="area-lat" error={errors.lat}>
              <Input ref={latRef} id="area-lat" inputMode="decimal" className="min-h-11" value={lat} onChange={(e) => setLat(e.target.value)} aria-invalid={!!errors.lat} />
            </Field>
            <Field label="Longitude" htmlFor="area-lng" error={errors.lng}>
              <Input id="area-lng" inputMode="decimal" className="min-h-11" value={lng} onChange={(e) => setLng(e.target.value)} aria-invalid={!!errors.lng} />
            </Field>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" className="min-h-11" onClick={useDeviceLocation} disabled={geoState === "waiting" || geoState === "late"}>
              <Crosshair className="size-4" aria-hidden />
              {geoState === "waiting" ? "Obtendo localização…" : geoState === "late" ? "Aguardando resposta do dispositivo…" : "Usar localização do dispositivo"}
            </Button>
          </div>
          {geoState === "denied" ? (
            <p role="alert" className="rounded-lg bg-ochre/10 px-3 py-2 text-sm text-ochre">
              Permissão de localização negada. Informe as coordenadas manualmente ou clique no mapa.
            </p>
          ) : null}
          {geoState === "late" ? (
            <p role="status" className="rounded-lg bg-info/10 px-3 py-2 text-sm text-info">
              A localização está demorando. Você pode continuar preenchendo os outros campos.
            </p>
          ) : null}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Município (opcional)" htmlFor="area-mun">
              <Input id="area-mun" className="min-h-11" value={municipality} onChange={(e) => setMunicipality(e.target.value)} />
            </Field>
            <Field label="Estado (UF, opcional)" htmlFor="area-uf" error={errors.uf}>
              <Input id="area-uf" className="min-h-11" maxLength={2} value={uf} onChange={(e) => setUf(e.target.value)} aria-invalid={!!errors.uf} />
            </Field>
          </div>
          <Field label="Tipo de terra (opcional)" htmlFor="area-land">
            <Input id="area-land" className="min-h-11" value={landType} onChange={(e) => setLandType(e.target.value)} />
          </Field>
          <Field label="Descrição (opcional)" htmlFor="area-desc">
            <Textarea id="area-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </Field>
          <Button
            className="min-h-11"
            onClick={() => {
              if (validate()) setStep("review");
            }}
          >
            Revisar
          </Button>
        </CardContent>
      </Card>
      <div className="space-y-2">
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="size-4" aria-hidden /> Clique no mapa para definir o ponto da área.
        </p>
        <AreaMap
          points={[]}
          picked={hasPoint ? { latitude: latN, longitude: lngN } : null}
          onPick={(la, ln) => {
            setLat(la.toFixed(6));
            setLng(ln.toFixed(6));
          }}
        />
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="text-right font-medium">{v}</dd>
    </div>
  );
}
