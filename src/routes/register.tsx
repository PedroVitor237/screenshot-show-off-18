import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Sprout } from "lucide-react";
import { api } from "@/lib/hf/adapter";
import { ApiError } from "@/lib/hf/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Field, Wordmark } from "@/components/hf/ui-bits";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Criar conta — HidroFlorestas" },
      { name: "description", content: "Crie sua conta do HidroFlorestas (demonstração com dados fictícios)." },
      { property: "og:title", content: "Criar conta — HidroFlorestas" },
      { property: "og:description", content: "Crie sua conta do HidroFlorestas (demonstração)." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Register,
});

function Register() {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const firstRef = useRef<HTMLInputElement>(null);

  async function submit(ev: React.FormEvent) {
    ev.preventDefault();
    const errs: Record<string, string> = {};
    if (firstName.trim().length < 1) errs["firstName = "Informe seu nome.";
    if (lastName.trim().length < 1) errs["lastName = "Informe seu sobrenome.";
    if (!/^\S+@\S+\.\S+$/.test(email)) errs["email = "Informe um e-mail válido.";
    if (password.length < 8) errs["password = "A senha deve ter pelo menos 8 caracteres.";
    setErrors(errs);
    if (Object.keys(errs).length) {
      firstRef.current?.focus();
      return;
    }
    setBusy(true);
    setServerError(null);
    try {
      await api.signUp({ firstName, lastName, email, password });
      navigate({ to: "/workspace" });
    } catch (e) {
      setServerError(e instanceof ApiError ? e.message : "Não foi possível criar a conta.");
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
              <CardTitle className="text-xl">Criar conta</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={submit} className="space-y-4" noValidate>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Nome" htmlFor="reg-first" error={errors["firstName"]}>
                    <Input ref={firstRef} id="reg-first" autoComplete="given-name" className="min-h-11" value={firstName} onChange={(e) => setFirstName(e.target.value)} aria-invalid={!!errors["firstName"]} />
                  </Field>
                  <Field label="Sobrenome" htmlFor="reg-last" error={errors["lastName"]}>
                    <Input id="reg-last" autoComplete="family-name" className="min-h-11" value={lastName} onChange={(e) => setLastName(e.target.value)} aria-invalid={!!errors["lastName"]} />
                  </Field>
                </div>
                <Field label="E-mail" htmlFor="reg-email" error={errors["email"]}>
                  <Input id="reg-email" type="email" autoComplete="email" className="min-h-11" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={!!errors["email"]} />
                </Field>
                <Field label="Senha" htmlFor="reg-password" error={errors["password"]} hint="Mínimo de 8 caracteres.">
                  <Input id="reg-password" type="password" autoComplete="new-password" className="min-h-11" value={password} onChange={(e) => setPassword(e.target.value)} aria-invalid={!!errors["password"]} />
                </Field>
                {serverError ? (
                  <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">{serverError}</p>
                ) : null}
                <Button type="submit" className="min-h-11 w-full" disabled={busy}>
                  {busy ? "Criando…" : "Criar conta"}
                </Button>
              </form>
              <p className="mt-4 text-center text-sm text-muted-foreground">
                Já tem conta?{" "}
                <Link to="/login" className="font-medium text-primary hover:underline">
                  Entrar
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
      <aside className="hidden items-center justify-center bg-accent lg:flex" aria-hidden>
        <div className="max-w-sm space-y-4 px-8 text-center">
          <Sprout className="mx-auto size-16 text-primary" />
          <p className="text-xl font-semibold">Junte-se a um laboratório ou crie o seu.</p>
          <p className="text-sm text-muted-foreground">
            Cada conta pode participar de até cinco laboratórios.
          </p>
        </div>
      </aside>
    </div>
  );
}
