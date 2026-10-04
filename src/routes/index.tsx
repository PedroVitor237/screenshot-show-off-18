import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Droplets, FlaskConical, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Wordmark } from "@/components/hf/ui-bits";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "HidroFlorestas — monitoramento hidroambiental participativo" },
      {
        name: "description",
        content:
          "HidroFlorestas: laboratórios registram áreas, coletas e dados ambientais e acompanham o diagnóstico experimental IHFR. Demonstração com dados fictícios.",
      },
      { property: "og:title", content: "HidroFlorestas — monitoramento hidroambiental participativo" },
      {
        property: "og:description",
        content: "Demonstração navegável do HidroFlorestas com dados fictícios: laboratórios, áreas, coletas e diagnóstico experimental IHFR.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Wordmark />
          <div className="flex gap-2">
            <Button asChild variant="ghost" className="min-h-11">
              <Link to="/login">Entrar</Link>
            </Button>
            <Button asChild className="min-h-11">
              <Link to="/register">Criar conta</Link>
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-16">
        <section className="max-w-2xl space-y-6">
          <h1 className="text-4xl font-semibold leading-tight tracking-tight">
            Monitoramento hidroambiental feito por quem vive o território
          </h1>
          <p className="text-lg text-muted-foreground">
            Laboratórios comunitários registram áreas, coletas e dados ambientais — água, solo,
            vegetação e terreno — e acompanham o Índice HidroFlorestal (IHFR), um diagnóstico
            experimental em validação científica.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" className="min-h-11">
              <Link to="/register">
                Começar agora <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="min-h-11">
              <Link to="/login">Já tenho conta</Link>
            </Button>
          </div>
        </section>
        <section className="mt-16 grid gap-4 sm:grid-cols-3" aria-label="Como funciona">
          {[
            { icon: MapPin, title: "Áreas", text: "Cadastre pontos de interesse com coordenadas manuais, clique no mapa ou localização do dispositivo." },
            { icon: Droplets, title: "Coletas", text: "Confirme o momento exato da coleta com fuso horário explícito e registre os dados ambientais." },
            { icon: FlaskConical, title: "Diagnóstico IHFR", text: "Acompanhe o índice experimental por coleta, com transparência sobre versões e qualidade dos dados." },
          ].map((f) => (
            <Card key={f.title} className="rounded-card shadow-soft">
              <CardContent className="space-y-2 pt-6">
                <span className="flex size-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                  <f.icon className="size-5" aria-hidden />
                </span>
                <h2 className="font-semibold">{f.title}</h2>
                <p className="text-sm text-muted-foreground">{f.text}</p>
              </CardContent>
            </Card>
          ))}
        </section>
        <p className="mt-12 text-xs text-muted-foreground">
          Demonstração navegável com dados fictícios. Use o painel “Demonstração” no canto inferior
          direito para alternar perfis e cenários.
        </p>
      </main>
    </div>
  );
}
