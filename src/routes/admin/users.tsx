import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { api } from "@/lib/hf/adapter";
import { ACCOUNT_STATUS, GLOBAL_ROLE } from "@/lib/hf/labels";
import { ApiError, type AccountStatus, type AdminUser, type GlobalRole } from "@/lib/hf/types";
import { AppShell, RequireSession } from "@/components/hf/layout";
import { Crumb, ErrorState, Field, Loading, PageHeader } from "@/components/hf/ui-bits";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/admin/users")({
  head: () => ({
    meta: [
      { title: "Contas — Administração — HidroFlorestas" },
      { name: "description", content: "Busca, filtros e gerenciamento de contas com auditoria (demonstração)." },
      { property: "og:title", content: "Contas — Administração — HidroFlorestas" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminUsers,
});

function AdminUsers() {
  return (
    <RequireSession>
      <AppShell>
        <UsersBody />
      </AppShell>
    </RequireSession>
  );
}

function UsersBody() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<GlobalRole | "">("");
  const [status, setStatus] = useState<AccountStatus | "">("");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<AdminUser | null>(null);
  const [edit, setEdit] = useState<{ field: "role" | "status"; value: string } | null>(null);
  const [reason, setReason] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [auditPage, setAuditPage] = useState(0);

  const users = useQuery({
    queryKey: ["admin-users", search, role, status, page],
    queryFn: () => api.adminListUsers({ search, role, status, page }),
    retry: false,
  });
  const audit = useQuery({
    queryKey: ["admin-audit", auditPage],
    queryFn: () => api.adminAudit(auditPage),
    retry: false,
  });

  const update = useMutation({
    mutationFn: () =>
      api.adminUpdateUser(selected!.id, {
        field: edit!.field,
        value: edit!.value,
        reason,
        expectedRevision: selected!.revision,
        expectedValue: selected![edit!.field],
      }),
    onSuccess: (u) => {
      setSelected(u);
      setEdit(null);
      setReason("");
      setConfirming(false);
      setError(null);
      void qc.invalidateQueries({ queryKey: ["admin-users"] });
      void qc.invalidateQueries({ queryKey: ["admin-audit"] });
      void qc.invalidateQueries({ queryKey: ["admin-overview"] });
    },
    onError: async (e) => {
      setConfirming(false);
      setError(e instanceof ApiError ? e.message : "Não foi possível atualizar.");
      // Conflito: recarrega os dados atuais da conta para nova revisão.
      if (e instanceof ApiError && e.status === 409 && selected) {
        try {
          setSelected(await api.adminGetUser(selected.id));
        } catch {
          /* ignore */
        }
      }
    },
  });

  if (users.isLoading) return <Loading />;
  if (users.isError)
    return (
      <ErrorState
        title="Acesso restrito"
        description="Esta área é exclusiva de administradores globais. Entre com o perfil de Diego no painel de demonstração."
      />
    );

  const udata = users.data!;
  const totalPages = Math.max(1, Math.ceil(udata.total / udata.pageSize));

  return (
    <>
      <Crumb items={[{ label: "Administração", to: "/admin" }, { label: "Contas" }]} />
      <PageHeader title="Contas" description={`${udata.total} conta(s) encontradas.`} />

      <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_180px_180px]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-3.5 size-4 text-muted-foreground" aria-hidden />
          <Input
            aria-label="Buscar por nome ou e-mail"
            placeholder="Buscar por nome ou e-mail"
            className="min-h-11 pl-9"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          />
        </div>
        <Select value={role || "ALL"} onValueChange={(v) => { setRole(v === "ALL" ? "" : (v as GlobalRole)); setPage(0); }}>
          <SelectTrigger aria-label="Filtrar por papel" className="min-h-11"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos os papéis</SelectItem>
            {Object.entries(GLOBAL_ROLE).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={status || "ALL"} onValueChange={(v) => { setStatus(v === "ALL" ? "" : (v as AccountStatus)); setPage(0); }}>
          <SelectTrigger aria-label="Filtrar por estado" className="min-h-11"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos os estados</SelectItem>
            {Object.entries(ACCOUNT_STATUS).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card className="rounded-card shadow-soft">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead className="hidden sm:table-cell">E-mail</TableHead>
                <TableHead>Papel</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {udata.users.map((u) => (
                <TableRow key={u.id} className="cursor-pointer" onClick={() => { setSelected(u); setEdit(null); setError(null); }}>
                  <TableCell className="font-medium">{u.name}</TableCell>
                  <TableCell className="hidden sm:table-cell">{u.email}</TableCell>
                  <TableCell><Badge variant="outline">{GLOBAL_ROLE[u.role]}</Badge></TableCell>
                  <TableCell><Badge variant={u.status === "ACTIVE" ? "secondary" : "outline"}>{ACCOUNT_STATUS[u.status]}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="mt-4 flex items-center justify-between">
        <Button variant="outline" className="min-h-11" disabled={page === 0} onClick={() => setPage(page - 1)}>
          <ChevronLeft className="size-4" aria-hidden /> Anterior
        </Button>
        <span className="text-sm text-muted-foreground">Página {page + 1} de {totalPages}</span>
        <Button variant="outline" className="min-h-11" disabled={page + 1 >= totalPages} onClick={() => setPage(page + 1)}>
          Próxima <ChevronRight className="size-4" aria-hidden />
        </Button>
      </div>

      <section className="mt-10" aria-label="Registro de auditoria">
        <h2 className="mb-3 text-lg font-semibold">Auditoria</h2>
        {audit.isLoading ? (
          <Loading />
        ) : audit.isError ? null : (
          <>
            <ul className="space-y-2">
              {audit.data!.items.map((a) => (
                <li key={a.id} className="rounded-lg border bg-card px-4 py-3 text-sm shadow-soft">
                  <span className="font-medium">{a.actor}</span> alterou {a.field === "role" ? "o papel" : "o estado"} de{" "}
                  <span className="font-medium">{a.targetName}</span>: {a.before} → {a.after}.{" "}
                  <span className="text-muted-foreground">Motivo: {a.reason} · {new Date(a.at).toLocaleString("pt-BR")}</span>
                </li>
              ))}
              {audit.data!.items.length === 0 ? <li className="text-sm text-muted-foreground">Nenhum registro ainda.</li> : null}
            </ul>
            <div className="mt-3 flex items-center gap-2">
              <Button variant="outline" className="min-h-11" disabled={auditPage === 0} onClick={() => setAuditPage(auditPage - 1)}>Anterior</Button>
              <Button
                variant="outline"
                className="min-h-11"
                disabled={(auditPage + 1) * audit.data!.pageSize >= audit.data!.total}
                onClick={() => setAuditPage(auditPage + 1)}
              >
                Próxima
              </Button>
            </div>
          </>
        )}
      </section>

      <Dialog open={selected !== null} onOpenChange={(o) => { if (!o) { setSelected(null); setEdit(null); setConfirming(false); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selected?.name}</DialogTitle>
          </DialogHeader>
          {selected ? (
            <div className="space-y-4 text-sm">
              <dl className="grid gap-1">
                <div className="flex justify-between"><dt className="text-muted-foreground">E-mail</dt><dd>{selected.email}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Papel</dt><dd>{GLOBAL_ROLE[selected.role]}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Estado</dt><dd>{ACCOUNT_STATUS[selected.status]}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Criada em</dt><dd>{new Date(selected.createdAt).toLocaleDateString("pt-BR")}</dd></div>
              </dl>
              {edit === null ? (
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" className="min-h-11" onClick={() => setEdit({ field: "role", value: selected.role })}>Alterar papel</Button>
                  <Button variant="outline" className="min-h-11" onClick={() => setEdit({ field: "status", value: selected.status })}>Alterar estado</Button>
                </div>
              ) : confirming ? (
                <div className="space-y-3 rounded-lg border p-3">
                  <p className="font-medium">Revise a alteração</p>
                  <p>
                    {edit.field === "role" ? "Papel" : "Estado"}:{" "}
                    <strong>{edit.field === "role" ? GLOBAL_ROLE[selected.role] : ACCOUNT_STATUS[selected.status]}</strong> →{" "}
                    <strong>{edit.field === "role" ? GLOBAL_ROLE[edit.value as GlobalRole] : ACCOUNT_STATUS[edit.value as AccountStatus]}</strong>
                  </p>
                  <p className="text-muted-foreground">Justificativa: {reason}</p>
                  {error ? <p role="alert" className="font-medium text-destructive">{error}</p> : null}
                  <DialogFooter>
                    <Button variant="outline" className="min-h-11" onClick={() => setConfirming(false)}>Corrigir</Button>
                    <Button className="min-h-11" disabled={update.isPending} onClick={() => update.mutate()}>
                      {update.isPending ? "Aplicando…" : "Confirmar alteração"}
                    </Button>
                  </DialogFooter>
                </div>
              ) : (
                <div className="space-y-3">
                  <Field label={edit.field === "role" ? "Novo papel" : "Novo estado"} htmlFor="edit-value">
                    <Select value={edit.value} onValueChange={(v) => setEdit({ ...edit, value: v })}>
                      <SelectTrigger id="edit-value" className="min-h-11"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(edit.field === "role" ? GLOBAL_ROLE : ACCOUNT_STATUS).map(([k, l]) => (
                          <SelectItem key={k} value={k}>{l}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Justificativa (obrigatória)" htmlFor="edit-reason">
                    <Textarea id="edit-reason" rows={3} maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} />
                  </Field>
                  {error ? <p role="alert" className="font-medium text-destructive">{error}</p> : null}
                  <DialogFooter>
                    <Button variant="outline" className="min-h-11" onClick={() => setEdit(null)}>Cancelar</Button>
                    <Button className="min-h-11" disabled={reason.trim().length === 0} onClick={() => setConfirming(true)}>
                      Revisar
                    </Button>
                  </DialogFooter>
                </div>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
