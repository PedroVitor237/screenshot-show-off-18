import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Droplets } from "lucide-react";
import { api } from "@/lib/hf/adapter";
import { ApiError } from "@/lib/hf/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Field, Wordmark } from "@/components/hf/ui-bits";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Entrar — HidroFlorestas" },
      { name: "description", content: "Acesse sua conta do HidroFlorestas (demonstração com dados fictícios)." },
      { property: "og:title", content: "Entrar — HidroFlorestas" },
      { property: "og:description", content: "Acesse sua conta do HidroFlorestas (demonstração)." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);

  async function submit(ev: React.FormEvent) {
    ev.preventDefault();
    const errs: Record<string, string> = {};
    if (!/^\S+@\S+\.\S+$/.test(email)) errs.email = "Informe um e-mail válido.";
    if (password.length === 0) errs.password = "Informe a senha.";
    setErrors(errs);
    if (Object.keys(errs).length) {
      emailRef.current?.focus();
      return;
    }
    setBusy(true);
    setServerError(null);
    try {
      const r = await api.signIn({ email, password });
      navigate({ to: r.destination as "/workspace" | "/admin" });
    } catch (e) {
      setServerError(e instanceof ApiError ? e.message : "Não foi possível entrar. Tente novamente.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-2">
      <div className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-6">
          <Link to="/" aria-label="Voltar ao início">
            <Wordmark />
          </Link>
          <Card className="rounded-card shadow-soft">
            <CardHeader>
              <CardTitle className="text-xl">Entrar</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={submit} className="space-y-4" noValidate>
                <Field label="E-mail" htmlFor="login-email" error={errors.email} hint="Demonstração: use um e-mail do painel, ex.: ana@demo.hf">
                  <Input ref={emailRef} id="login-email" type="email" autoComplete="email" className="min-h-11" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={!!errors.email} />
                </Field>
                <Field label="Senha" htmlFor="login-password" error={errors.password} hint="Na demonstração, qualquer senha não vazia funciona.">
                  <Input id="login-password" type="password" autoComplete="current-password" className="min-h-11" value={password} onChange={(e) => setPassword(e.target.value)} aria-invalid={!!errors.password} />
                </Field>
                {serverError ? (
                  <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">{serverError}</p>
                ) : null}
                <Button type="submit" className="min-h-11 w-full" disabled={busy}>
                  {busy ? "Entrando…" : "Entrar"}
                </Button>
              </form>
              <p className="mt-4 text-center text-sm text-muted-foreground">
                Ainda não tem conta?{" "}
                <Link to="/register" className="font-medium text-primary hover:underline">
                  Criar conta
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
      <aside className="hidden items-center justify-center bg-accent lg:flex" aria-hidden>
        <div className="max-w-sm space-y-4 px-8 text-center">
          <Droplets className="mx-auto size-16 text-primary" />
          <p className="text-xl font-semibold">Cada coleta conta uma história do território.</p>
          <p className="text-sm text-muted-foreground">
            Água, solo, vegetação e terreno reunidos em um diagnóstico experimental e transparente.
          </p>
        </div>
      </aside>
    </div>
  );
}
