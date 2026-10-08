// Seção do diagnóstico experimental IHFR: criar, substituir, revogar e recuperar tentativas.
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FlaskConical, RotateCcw, Trash2 } from "lucide-react";
import { api, ACTIVE_VERSIONS } from "@/lib/hf/adapter";
import { COMPONENT, DATA_QUALITY, IHFR_CLASS, INSUFFICIENCY, LAND_USE, LAND_USE_SOURCE, LIFECYCLE, SCIENTIFIC_LABELS, nf2 } from "@/lib/hf/labels";
import { can } from "@/lib/hf/permissions";
import { ApiError, type LandUseType, type LabContext } from "@/lib/hf/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DemoTag, Field, Loading } from "./ui-bits";
import { Badge } from "@/components/ui/badge";

interface Props {
  labId: string;
  areaId: string;
  collectionId: string;
  ctx: LabContext;
}

export function IhfrSection({ labId, areaId, collectionId, ctx }: Props) {
  const qc = useQueryClient();
  const [landUse, setLandUse] = useState<LandUseType | "">("");
  const [review, setReview] = useState<"create" | "replace" | "revoke" | null>(null);
  const [reason, setReason] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [opKey, setOpKey] = useState<string | null>(null);

  const current = useQuery({ queryKey: ["ihfr", collectionId], queryFn: () => api.currentDiagnosis(labId, areaId, collectionId) });
  const elig = useQuery({
    queryKey: ["ihfr-elig", collectionId, landUse],
    queryFn: () => api.eligibility(labId, areaId, collectionId, landUse || null),
  });

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ["ihfr", collectionId] });
    void qc.invalidateQueries({ queryKey: ["ihfr-elig", collectionId] });
  };

  const mutate = useMutation({
    mutationFn: async (op: "create" | "replace" | "revoke") => {
      const key = opKey ?? crypto.randomUUID();
      setOpKey(key);
      setNotice(null);
      try {
        if (op === "revoke") {
          const res = await api.revokeDiagnosis(labId, areaId, collectionId, elig.data!.currentDiagnosisId!, { expectedCurrentDiagnosisId: elig.data!.currentDiagnosisId!, reason }, key);
          return res.replayed ? "Resultado recuperado da tentativa anterior (idempotência)." : "Diagnóstico revogado.";
        }
        const res = await api.createDiagnosis(labId, areaId, collectionId, {
          operation: op === "replace" ? "REPLACE" : "CREATE",
          expectedCurrentDiagnosisId: elig.data!.currentDiagnosisId,
          supplement: { landUseType: landUse || null, landUseSource: "FIELD_OBSERVATION", landUseObservedAt: new Date().toISOString() },
          versions: ACTIVE_VERSIONS,
        }, key);
        if (res.outcome === "INSUFFICIENT_DATA") return "Dados insuficientes: nenhum diagnóstico foi gerado.";
        return res.replayed ? "Resultado recuperado da tentativa anterior (idempotência)." : "Diagnóstico gerado (simulado).";
      } catch (e) {
        // Recuperação de tentativa incerta: consulta o resultado terminal da operação.
        if (e instanceof ApiError && (e.status === 0 || e.code === "NETWORK")) {
          try {
            const recovered = await api.getOperation(labId, areaId, collectionId, key);
            return recovered.outcome === "SUCCEEDED"
              ? "A conexão falhou, mas o resultado foi recuperado com segurança."
              : "A conexão falhou; a tentativa terminou sem gerar diagnóstico.";
          } catch {
            throw e;
          }
        }
        throw e;
      }
    },
    onSuccess: (msg) => {
      setNotice(msg);
      setReview(null);
      setReason("");
      invalidate();
    },
    onError: (e) => {
      setReview(null);
      setNotice(e instanceof Error ? e.message : "Erro inesperado.");
      invalidate();
    },
  });

  if (current.isLoading || elig.isLoading) return <Loading label="Carregando diagnóstico…" />;

  const d = current.data;
  const e = elig.data;
  const allowed = can(ctx).manageIhfr;

  return (
    <Card className="rounded-card shadow-soft">
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2 text-lg">
          <FlaskConical className="size-5 text-info" aria-hidden />
          Diagnóstico experimental IHFR
          <DemoTag />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="border-ochre/40 bg-ochre/5">
          <AlertTitle className="text-ochre">Funcionalidade experimental</AlertTitle>
          <AlertDescription className="text-sm">
            Este diagnóstico usa contratos experimentais e está sujeito a recalibração. Rótulos científicos:{" "}
            <span className="font-mono text-xs">{SCIENTIFIC_LABELS.join(", ")}</span>
          </AlertDescription>
        </Alert>

        {notice ? (
          <p role="status" className="rounded-lg bg-info/10 px-3 py-2 text-sm text-info">{notice}</p>
        ) : null}

        {d ? (
          <div className="space-y-3 rounded-lg border p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-2xl font-semibold">{nf2.format(d.displayScore)}</span>
              <Badge variant="secondary">{IHFR_CLASS[d.ihfrClass]}</Badge>
              <Badge variant="outline">{LIFECYCLE[d.lifecycleState]}</Badge>
              <Badge variant="outline">Qualidade: {DATA_QUALITY[d.dataQuality]}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{d.explanation}</p>
            <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
              {(Object.keys(COMPONENT) as (keyof typeof COMPONENT)[]).map((k) => (
                <div key={k} className="rounded-lg bg-secondary px-3 py-2">
                  <span className="block text-xs text-muted-foreground">{COMPONENT[k]}</span>
                  <span className="font-medium">{nf2.format(d.componentScores[k])}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Calculado em {new Date(d.calculatedAt).toLocaleString("pt-BR")} · algoritmo {d.versions.algorithmVersion}
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Nenhum diagnóstico vigente para esta coleta.</p>
        )}

        {e && !e.eligible && !d ? (
          <Alert variant="destructive">
            <AlertTitle>Dados insuficientes</AlertTitle>
            <AlertDescription>
              <ul className="list-inside list-disc text-sm">
                {e.reasons.map((r) => (
                  <li key={r}>{INSUFFICIENCY[r]}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        ) : null}

        {allowed ? (
          <div className="space-y-3">
            <Field label="Uso predominante da terra" htmlFor="ihfr-landuse">
              <Select value={landUse} onValueChange={(x) => setLandUse(x as LandUseType)}>
                <SelectTrigger id="ihfr-landuse" className="min-h-11"><SelectValue placeholder="Selecione…" /></SelectTrigger>
                <SelectContent>{Object.entries(LAND_USE).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <div className="flex flex-wrap gap-2">
              {!d ? (
                <Button className="min-h-11" disabled={!e?.eligible || mutate.isPending} onClick={() => setReview("create")}>
                  Gerar diagnóstico
                </Button>
              ) : (
                <>
                  <Button variant="outline" className="min-h-11" disabled={!e?.eligible || mutate.isPending} onClick={() => setReview("replace")}>
                    <RotateCcw className="size-4" aria-hidden /> Substituir
                  </Button>
                  <Button variant="destructive" className="min-h-11" disabled={mutate.isPending} onClick={() => setReview("revoke")}>
                    <Trash2 className="size-4" aria-hidden /> Revogar
                  </Button>
                </>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Somente proprietários e administradores do laboratório gerenciam o diagnóstico.</p>
        )}

        <Dialog open={review !== null} onOpenChange={(o) => !o && setReview(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {review === "create" ? "Confirmar geração" : review === "replace" ? "Confirmar substituição" : "Confirmar revogação"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 text-sm">
              <p>
                Uso da terra: <strong>{landUse ? LAND_USE[landUse] : "não informado"}</strong> · fonte: {LAND_USE_SOURCE.FIELD_OBSERVATION}.
              </p>
              {review === "revoke" ? (
                <Field label="Motivo da revogação" htmlFor="ihfr-reason">
                  <Textarea id="ihfr-reason" value={reason} onChange={(ev) => setReason(ev.target.value)} rows={3} maxLength={500} />
                </Field>
              ) : null}
              <p className="text-xs text-muted-foreground">Versões fixas do contrato: {ACTIVE_VERSIONS.inputContractVersion} / {ACTIVE_VERSIONS.mathContractVersion}.</p>
            </div>
            <DialogFooter>
              <Button variant="outline" className="min-h-11" onClick={() => setReview(null)}>Corrigir</Button>
              <Button
                className="min-h-11"
                disabled={mutate.isPending || (review === "revoke" && reason.trim().length === 0)}
                onClick={() => review && mutate.mutate(review)}
              >
                {mutate.isPending ? "Processando…" : "Confirmar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
