import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp } from "lucide-react";
import { api } from "@/lib/hf/adapter";
import { LAB_ROLE } from "@/lib/hf/labels";
import { ApiError, type Membership } from "@/lib/hf/types";
import { Crumb, ErrorState, Loading, PageHeader } from "@/components/hf/ui-bits";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/dashboard/laboratories/$labId/membros")({
  head: () => ({
    meta: [
      { title: "Membros — HidroFlorestas" },
      { name: "description", content: "Gerenciamento de papéis dos membros do laboratório (demonstração)." },
      { property: "og:title", content: "Membros — HidroFlorestas" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Members,
});

function Members() {
  const { labId } = Route.useParams();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["members", labId], queryFn: () => api.listMemberships(labId), retry: false });
  const [notice, setNotice] = useState<string | null>(null);

  const update = useMutation({
    mutationFn: (m: Membership) =>
      api.updateMembership(labId, m.id, {
        expectedRole: m.role,
        role: m.role === "MEMBER" ? "ADMIN" : "MEMBER",
      }),
    onSuccess: () => {
      setNotice("Papel atualizado.");
      void qc.invalidateQueries({ queryKey: ["members", labId] });
    },
    onError: (e) => {
      setNotice(e instanceof ApiError ? e.message : "Não foi possível atualizar o papel.");
      // Conflito: recarrega a lista para nova revisão.
      void qc.invalidateQueries({ queryKey: ["members", labId] });
    },
  });

  if (q.isLoading) return <Loading />;
  if (q.isError)
    return <ErrorState title="Acesso restrito" description="Somente o proprietário do laboratório gerencia membros." />;

  const { context, memberships } = q.data;

  return (
    <>
      <Crumb items={[{ label: "Meus laboratórios", to: "/workspace" }, { label: context.laboratory.name }, { label: "Membros" }]} />
      <PageHeader title="Membros" description="Promova ou rebaixe membros entre Membro e Administrador do laboratório." />
      {notice ? (
        <p role="status" className="mb-4 rounded-lg bg-info/10 px-3 py-2 text-sm text-info">{notice}</p>
      ) : null}
      <ul className="space-y-2">
        {memberships.map((m) => (
          <li key={m.id}>
            <Card className="rounded-card shadow-soft">
              <CardContent className="flex items-center justify-between gap-3 py-4">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>{m.initials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{m.name}</p>
                    <Badge variant={m.role === "OWNER" ? "secondary" : "outline"}>{LAB_ROLE[m.role]}</Badge>
                  </div>
                </div>
                {m.role !== "OWNER" ? (
                  <Button
                    variant="outline"
                    className="min-h-11"
                    disabled={update.isPending}
                    onClick={() => { setNotice(null); update.mutate(m); }}
                  >
                    {m.role === "MEMBER" ? (
                      <>
                        <ArrowUp className="size-4" aria-hidden /> Promover a administrador
                      </>
                    ) : (
                      <>
                        <ArrowDown className="size-4" aria-hidden /> Rebaixar a membro
                      </>
                    )}
                  </Button>
                ) : null}
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    </>
  );
}
