// Formulário de data/hora da coleta com fuso explícito (RFC3339) e etapa de revisão.
import { useMemo, useRef, useState } from "react";
import { deviceOffsetNow, deviceOffsetsFor, formatDeclared, formatOffset, instantOf, nowWall, parseOffset, toRFC3339, type WallTime } from "@/lib/hf/datetime";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Field } from "./ui-bits";

interface Props {
  onConfirm: (occurredAt: string) => Promise<void>;
  busy: boolean;
  serverError?: string | null;
}

export function OccurredAtForm({ onConfirm, busy, serverError }: Props) {
  const initial = useMemo(nowWall, []);
  const [wall, setWall] = useState<WallTime>(initial);
  const [offset, setOffset] = useState(() => formatOffset(deviceOffsetNow()));
  const [step, setStep] = useState<"edit" | "review">("edit");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const refs = { date: useRef<HTMLInputElement>(null), time: useRef<HTMLInputElement>(null), offset: useRef<HTMLInputElement>(null) };

  function validate(): string | null {
    const errs: Record<string, string> = {};
    const off = parseOffset(offset);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(wall.date)) errs.date = "Informe uma data válida.";
    if (!/^\d{2}:\d{2}(:\d{2})?$/.test(wall.time)) errs.time = "Informe uma hora válida (HH:MM:SS).";
    if (!off.ok) errs.offset = off.error;
    const iso = typeof toRFC3339(wall, off.ok ? off.minutes : 0) === "string" ? (toRFC3339(wall, off.ok ? off.minutes : 0) as string) : null;
    if (iso === null && !errs.date && !errs.time) errs.date = "Esta data não existe no calendário.";
    const inst = off.ok ? instantOf(wall, off.minutes) : null;
    if (inst !== null && inst > Date.now()) errs.date = "A coleta não pode ser no futuro.";
    setErrors(errs);
    const first = ["date", "time", "offset"].find((k) => errs[k]) as keyof typeof refs | undefined;
    if (first) {
      refs[first].current?.focus();
      return null;
    }
    return iso;
  }

  const suggestions = useMemo(() => {
    const r = deviceOffsetsFor(wall);
    return Array.isArray(r) ? r : [];
  }, [wall]);

  if (step === "review") {
    const off = parseOffset(offset);
    const iso = off.ok ? (toRFC3339(wall, off.minutes) as string) : "";
    return (
      <Card className="rounded-card shadow-soft">
        <CardHeader>
          <CardTitle className="text-lg">Revise antes de confirmar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <dl className="grid gap-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Momento declarado</dt>
              <dd className="font-medium">{formatDeclared(iso)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Valor enviado (RFC3339)</dt>
              <dd className="font-mono text-xs">{iso}</dd>
            </div>
          </dl>
          {serverError ? (
            <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
              {serverError}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="min-h-11" onClick={() => setStep("edit")} disabled={busy}>
              Corrigir
            </Button>
            <Button className="min-h-11" disabled={busy} onClick={() => void onConfirm(iso)}>
              {busy ? "Confirmando…" : "Confirmar coleta"}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-card shadow-soft">
      <CardHeader>
        <CardTitle className="text-lg">Quando a coleta aconteceu?</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Data" htmlFor="occ-date" error={errors["date"]}>
            <Input ref={refs.date} id="occ-date" type="date" className="min-h-11" value={wall.date} onChange={(e) => setWall({ ...wall, date: e.target.value })} aria-invalid={!!errors["date"]} />
          </Field>
          <Field label="Hora" htmlFor="occ-time" error={errors["time"]} hint="Com segundos, ex.: 14:35:00">
            <Input ref={refs.time} id="occ-time" type="time" step={1} className="min-h-11" value={wall.time} onChange={(e) => setWall({ ...wall, time: e.target.value })} aria-invalid={!!errors["time"]} />
          </Field>
          <Field label="Fuso (offset)" htmlFor="occ-offset" error={errors["offset"]} hint="Formato ±HH:MM, ex.: -03:00">
            <Input ref={refs.offset} id="occ-offset" className="min-h-11" value={offset} onChange={(e) => setOffset(e.target.value)} aria-invalid={!!errors["offset"]} />
          </Field>
        </div>
        {suggestions.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            Sugestões do seu dispositivo:
            {suggestions.map((m) => (
              <button key={m} type="button" onClick={() => setOffset(formatOffset(m))} className="min-h-11 rounded-lg border px-3 py-1 font-mono hover:bg-accent">
                {formatOffset(m)}
              </button>
            ))}
          </div>
        ) : null}
        <Button
          className="min-h-11"
          onClick={() => {
            const iso = validate();
            if (iso) setStep("review");
          }}
        >
          Revisar
        </Button>
      </CardContent>
    </Card>
  );
}
