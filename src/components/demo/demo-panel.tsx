// DEMONSTRAÇÃO: painel de cenários. Remover na integração real.
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { FlaskConical, X } from "lucide-react";
import { DEMO_PROFILES, setScenario, useScenario, type IhfrMode } from "@/lib/hf/scenario-store";
import { api } from "@/lib/hf/adapter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const IHFR_MODES: { key: IhfrMode; label: string }[] = [
  { key: "normal", label: "IHFR: resultado vigente" },
  { key: "insufficient", label: "IHFR: dados insuficientes" },
  { key: "incompatible", label: "IHFR: versão incompatível" },
  { key: "unknown", label: "IHFR: resultado desconhecido" },
  { key: "conflict", label: "IHFR: conflito 409" },
];

export function DemoPanel() {
  const s = useScenario();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  async function switchProfile(key: string) {
    const p = DEMO_PROFILES.find((x) => x.key === key);
    if (!p) return;
    setBusy(true);
    try {
      await api.signIn({ email: p.email, password: "demo" });
      navigate({ to: "/workspace" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setScenario({ panelOpen: true })}
        className="fixed bottom-4 right-4 z-50 inline-flex min-h-11 items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background shadow-soft hover:opacity-90"
      >
        <FlaskConical className="size-4" aria-hidden />
        Demonstração
      </button>
      <Sheet open={s.panelOpen} onOpenChange={(open) => setScenario({ panelOpen: open })}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="flex items-center justify-between">
              Painel de demonstração
              <Button variant="ghost" size="icon" aria-label="Fechar painel" onClick={() => setScenario({ panelOpen: false })}>
                <X className="size-4" />
              </Button>
            </SheetTitle>
          </SheetHeader>
          <div className="space-y-6 px-4 pb-8 text-sm">
            <section>
              <h3 className="mb-2 font-medium">Perfis</h3>
              <div className="grid gap-2">
                {DEMO_PROFILES.map((p) => (
                  <button
                    key={p.key}
                    disabled={busy}
                    onClick={() => switchProfile(p.key)}
                    className={cn(
                      "rounded-lg border px-3 py-2 text-left transition-colors hover:bg-accent",
                      s.session?.profile === p.key && "border-primary bg-accent",
                    )}
                  >
                    <span className="block font-medium">{p.label}</span>
                    <span className="block text-xs text-muted-foreground">{p.hint}</span>
                  </button>
                ))}
              </div>
            </section>
            <section>
              <h3 className="mb-2 font-medium">Cenários</h3>
              <div className="grid gap-2">
                <Toggle label="Simular lentidão (2,5 s)" checked={s.delayMs > 1000} onChange={(v) => setScenario({ delayMs: v ? 2500 : 500 })} />
                <Toggle label="Próxima ação falha (rede)" checked={s.failNext} onChange={(v) => setScenario({ failNext: v })} />
                <Toggle label="Falha ao sair" checked={s.logoutFail} onChange={(v) => setScenario({ logoutFail: v })} />
                <Toggle label="Localização negada" checked={s.geo === "denied"} onChange={(v) => setScenario({ geo: v ? "denied" : "ok" })} />
                <Toggle label="Localização atrasada" checked={s.geo === "late"} onChange={(v) => setScenario({ geo: v ? "late" : "ok" })} />
                <Toggle label="Mapa sem tiles" checked={s.tiles === "fail"} onChange={(v) => setScenario({ tiles: v ? "fail" : "ok" })} />
                <Toggle label="Conflito em membros" checked={s.membershipConflict} onChange={(v) => setScenario({ membershipConflict: v })} />
                <Toggle label="Conflito no admin" checked={s.adminConflict} onChange={(v) => setScenario({ adminConflict: v })} />
              </div>
            </section>
            <section>
              <h3 className="mb-2 font-medium">Diagnóstico IHFR</h3>
              <div className="grid gap-2">
                {IHFR_MODES.map((m) => (
                  <label key={m.key} className="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 hover:bg-accent">
                    <input
                      type="radio"
                      name="ihfr-mode"
                      checked={s.ihfrMode === m.key}
                      onChange={() => setScenario({ ihfrMode: m.key })}
                      className="size-4 accent-[oklch(0.527_0.154_150.07)]"
                    />
                    {m.label}
                  </label>
                ))}
              </div>
            </section>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 hover:bg-accent">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="size-4 accent-[oklch(0.527_0.154_150.07)]" />
      {label}
    </label>
  );
}
