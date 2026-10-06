import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/hf/adapter";
import { formatDeclared } from "@/lib/hf/datetime";
import { Crumb, EmptyState, ErrorState, Loading, PageHeader } from "@/components/hf/ui-bits";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/dashboard/laboratories/$labId/")({
  head: () => ({
    meta: [
      { title: "Resumo do laboratório — HidroFlorestas" },
      { name: "description", content: "Totais e histórico do laboratório (demonstração)." },
      { property: "og:title", content: "Resumo do laboratório — HidroFlorestas" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LabSummary,
});

function LabSummary() {
  const { labId } = Route.useParams();
  const summary = useQuery({ queryKey: ["summary", labId], queryFn: () => api.summary(labId) });
  const history = useInfiniteQuery({
    queryKey: ["history", labId],
    queryFn: ({ pageParam }) => api.history(labId, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.page.nextCursor ?? undefined,
  });

  if (summary.isLoading) return <Loading />;
  if (summary.isError) return <ErrorState onRetry={() => void summary.refetch()} />;

  const labName = summary.data!.context.laboratory.name;

  return (
    <>
      <Crumb items={[{ label: "Meus laboratórios", to: "/workspace" }, { label: labName }, { label: "Resumo" }]} />
      <PageHeader title="Resumo" description={labName} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="rounded-card shadow-soft">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Áreas cadastradas</p>
            <p className="mt-1 text-3xl font-semibold">{summary.data!.totals.areas}</p>
          </CardContent>
        </Card>
        <Card className="rounded-card shadow-soft">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Coletas confirmadas</p>
            <p className="mt-1 text-3xl font-semibold">{summary.data!.totals.confirmedCollections}</p>
          </CardContent>
        </Card>
      </div>

      <section className="mt-8" aria-label="Histórico">
        <h2 className="mb-3 text-lg font-semibold">Histórico</h2>
        {history.isLoading ? (
          <Loading />
        ) : history.isError ? (
          <ErrorState onRetry={() => void history.refetch()} />
        ) : history.data!.pages[0]!.items.length === 0 ? (
          <EmptyState title="Nenhum evento ainda" description="Crie uma área ou confirme uma coleta para ver o histórico." />
        ) : (
          <>
            <ul className="space-y-2">
              {history.data!.pages.flatMap((p) => p.items).map((h) => (
                <li key={h.id}>
                  <Link to={h.destination as never} className="block rounded-lg border bg-card px-4 py-3 text-sm shadow-soft hover:bg-accent">
                    <span className="font-medium">{h.label}</span>
                    <span className="block text-xs text-muted-foreground">
                      {h.type === "COLLECTION_CONFIRMED" && h.occurredAt
                        ? `Ocorrida em ${formatDeclared(h.occurredAt)}`
                        : new Date(h.eventAt).toLocaleString("pt-BR")}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            {history.hasNextPage ? (
              <Button
                variant="outline"
                className="mt-4 min-h-11"
                disabled={history.isFetchingNextPage}
                onClick={() => void history.fetchNextPage()}
              >
                {history.isFetchingNextPage ? "Carregando…" : "Carregar mais"}
              </Button>
            ) : null}
          </>
        )}
      </section>
    </>
  );
}
