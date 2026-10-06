import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Plus, Settings } from "lucide-react";
import { api } from "@/lib/hf/adapter";
import { ApiError, type LaboratorySummary } from "@/lib/hf/types";
import { LAB_STATUS } from "@/lib/hf/labels";
import { AppShell, RequireSession } from "@/components/hf/layout";
import { EmptyState, ErrorState, Loading, PageHeader } from "@/components/hf/ui-bits";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/hf/ui-bits";

export const Route = createFileRoute("/workspace")({
  head: () => ({
    meta: [
      { title: "Meus laboratórios — HidroFlorestas" },
      { name: "description", content: "Lista de laboratórios acessíveis, criação e configurações (demonstração)." },
      { property: "og:title", content: "Meus laboratórios — HidroFlorestas" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Workspace,
});

const LIMIT = 5;

function Workspace() {
  return (
    <RequireSession>
      <AppShell>
        <WorkspaceBody />
      </AppShell>
    </RequireSession>
  );
}

function WorkspaceBody() {
  const qc = useQueryClient();
  const labs = useQuery({ queryKey: ["labs"], queryFn: () => api.listLabs() });
  const [createOpen, setCreateOpen] = useState(false);
  const [settingsFor, setSettingsFor] = useState<LaboratorySummary | null>(null);
  const [name, setName] = useState("");
  const [confirmName, setConfirmName] = useState("");
  const [action, setAction] = useState<"deactivate" | "delete" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const create = useMutation({
    mutationFn: () => api.createLab(name),
    onSuccess: () => {
      setCreateOpen(false);
      setName("");
      void qc.invalidateQueries({ queryKey: ["labs"] });
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : "Não foi possível criar."),
  });

  const deactivate = useMutation({
    mutationFn: () => api.deactivateLab(settingsFor!.id, confirmName),
    onSuccess: () => {
      setAction(null);
      setConfirmName("");
      void qc.invalidateQueries({ queryKey: ["labs"] });
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : "Não foi possível desativar."),
  });

  const del = useMutation({
    mutationFn: () => api.deleteLab(settingsFor!.id, confirmName),
    onSuccess: () => {
      setAction(null);
      setSettingsFor(null);
      setConfirmName("");
      void qc.invalidateQueries({ queryKey: ["labs"] });
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : "Não foi possível excluir."),
  });

  if (labs.isLoading) return <Loading label="Carregando laboratórios…" />;
  if (labs.isError)
    return <ErrorState description="Falha de rede ao listar os laboratórios." onRetry={() => void labs.refetch()} />;

  const list = labs.data ?? [];
  const atLimit = list.length >= LIMIT;

  return (
    <>
      <PageHeader
        title="Meus laboratórios"
        description={`Você participa de ${list.length} de ${LIMIT} laboratórios.`}
        actions={
          <>
            <Button className="min-h-11" disabled={atLimit} onClick={() => { setError(null); setCreateOpen(true); }}>
              <Plus className="size-4" aria-hidden /> Novo laboratório
            </Button>
            <Button variant="outline" className="min-h-11" disabled title="Ainda indisponível nesta demonstração">
              Solicitar participação (ainda indisponível)
            </Button>
          </>
        }
      />
      {atLimit ? (
        <p role="status" className="mb-4 rounded-lg bg-ochre/10 px-3 py-2 text-sm font-medium text-ochre">
          Limite de cinco laboratórios atingido. Para criar outro, deixe de participar de um existente.
        </p>
      ) : null}
      {list.length === 0 ? (
        <EmptyState
          title="Você ainda não participa de nenhum laboratório"
          description="Crie o primeiro laboratório para começar a registrar áreas e coletas."
          action={
            <Button className="min-h-11" onClick={() => setCreateOpen(true)}>
              <Plus className="size-4" aria-hidden /> Criar laboratório
            </Button>
          }
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {list.map((l) => (
            <li key={l.id}>
              <Card className="rounded-card shadow-soft">
                <CardContent className="flex items-start justify-between gap-3 pt-6">
                  <div className="space-y-1">
                    <Link
                      to="/dashboard/laboratories/$labId"
                      params={{ labId: l.id }}
                      className="font-medium hover:underline"
                    >
                      {l.name}
                    </Link>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant={l.status === "ACTIVE" ? "secondary" : "outline"}>{LAB_STATUS[l.status]}</Badge>
                      {l.isOwner ? <Badge variant="outline">Proprietário</Badge> : null}
                    </div>
                  </div>
                  {l.isOwner ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="min-h-11 min-w-11"
                      aria-label={`Configurações de ${l.name}`}
                      onClick={() => { setSettingsFor(l); setError(null); setAction(null); setConfirmName(""); }}
                    >
                      <Settings className="size-4" />
                    </Button>
                  ) : null}
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="size-5" aria-hidden /> Novo laboratório
            </DialogTitle>
          </DialogHeader>
          <Field label="Nome do laboratório" htmlFor="lab-name" hint="Entre 1 e 100 caracteres.">
            <Input id="lab-name" className="min-h-11" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} />
          </Field>
          {error ? <p role="alert" className="text-sm font-medium text-destructive">{error}</p> : null}
          <DialogFooter>
            <Button variant="outline" className="min-h-11" onClick={() => setCreateOpen(false)}>Cancelar</Button>
            <Button className="min-h-11" disabled={create.isPending || name.trim().length === 0} onClick={() => create.mutate()}>
              {create.isPending ? "Criando…" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={settingsFor !== null} onOpenChange={(o) => !o && setSettingsFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configurações — {settingsFor?.name}</DialogTitle>
          </DialogHeader>
          {action === null ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Ações sensíveis exigem digitar o nome do laboratório para confirmar.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" className="min-h-11" onClick={() => { setAction("deactivate"); setError(null); }}>
                  Desativar laboratório
                </Button>
                <Button variant="destructive" className="min-h-11" onClick={() => { setAction("delete"); setError(null); }}>
                  Excluir laboratório
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm">
                Para {action === "delete" ? "excluir" : "desativar"}, digite exatamente:{" "}
                <strong>{settingsFor?.name}</strong>
              </p>
              <Field label="Confirmação" htmlFor="lab-confirm">
                <Input id="lab-confirm" className="min-h-11" value={confirmName} onChange={(e) => setConfirmName(e.target.value)} />
              </Field>
              {error ? <p role="alert" className="text-sm font-medium text-destructive">{error}</p> : null}
              <DialogFooter>
                <Button variant="outline" className="min-h-11" onClick={() => setAction(null)}>Voltar</Button>
                <Button
                  variant="destructive"
                  className="min-h-11"
                  disabled={confirmName !== settingsFor?.name || deactivate.isPending || del.isPending}
                  onClick={() => (action === "delete" ? del.mutate() : deactivate.mutate())}
                >
                  {action === "delete" ? "Excluir definitivamente" : "Desativar"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
