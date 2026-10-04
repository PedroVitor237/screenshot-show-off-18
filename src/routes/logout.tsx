import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { api } from "@/lib/hf/adapter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ErrorState, Loading, Wordmark } from "@/components/hf/ui-bits";

export const Route = createFileRoute("/logout")({
  head: () => ({
    meta: [
      { title: "Sair — HidroFlorestas" },
      { name: "description", content: "Encerramento de sessão do HidroFlorestas (demonstração)." },
      { property: "og:title", content: "Sair — HidroFlorestas" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Logout,
});

function Logout() {
  const [state, setState] = useState<"working" | "done" | "error">("working");
  const ran = useRef(false);

  async function doLogout() {
    setState("working");
    try {
      await api.logout();
      setState("done");
    } catch {
      setState("error");
    }
  }

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    void doLogout();
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="flex justify-center">
          <Wordmark />
        </div>
        {state === "working" ? (
          <Card className="rounded-card shadow-soft">
            <CardContent className="py-10">
              <Loading label="Encerrando a sessão…" />
            </CardContent>
          </Card>
        ) : state === "done" ? (
          <Card className="rounded-card shadow-soft">
            <CardContent className="flex flex-col items-center gap-3 py-10">
              <CheckCircle2 className="size-10 text-primary" aria-hidden />
              <p className="font-medium" role="status">Sessão encerrada com sucesso.</p>
              <Button asChild className="min-h-11">
                <Link to="/">Voltar ao início</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <ErrorState
            title="Não foi possível encerrar a sessão"
            description="Ocorreu uma falha ao sair. Você pode tentar novamente."
            onRetry={() => void doLogout()}
          />
        )}
      </div>
    </div>
  );
}
