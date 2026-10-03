// DEMONSTRAÇÃO: sessão fictícia e cenários controlados, somente em memória.
// Nenhuma senha ou token é guardado. Remova este módulo na integração real.
import { useSyncExternalStore } from "react";

export type ProfileKey = "owner" | "labadmin" | "member" | "gadmin" | "nolab" | "inactive" | "limit" | string;

export const DEMO_PROFILES: { key: ProfileKey; label: string; email: string; hint: string }[] = [
  { key: "owner", label: "Ana — proprietária (OWNER)", email: "ana@demo.hf", hint: "Proprietária do laboratório de Hidrologia" },
  { key: "labadmin", label: "Bruno — administrador do laboratório", email: "bruno@demo.hf", hint: "ADMIN contextual" },
  { key: "member", label: "Carla — membro (MEMBER)", email: "carla@demo.hf", hint: "Também vê um laboratório inativo" },
  { key: "gadmin", label: "Diego — administrador global", email: "diego@demo.hf", hint: "Sem vínculo de laboratório" },
  { key: "nolab", label: "Elisa — conta sem laboratório", email: "elisa@demo.hf", hint: "Workspace vazio" },
  { key: "inactive", label: "Fábio — laboratório inativo", email: "fabio@demo.hf", hint: "Somente leitura" },
  { key: "limit", label: "Gabriela — limite de 5 laboratórios", email: "gabriela@demo.hf", hint: "Criação bloqueada" },
];

export type IhfrMode = "normal" | "insufficient" | "incompatible" | "unknown" | "conflict";

export interface ScenarioState {
  session: { userId: string; profile: ProfileKey } | null;
  delayMs: number;
  failNext: boolean;
  logoutFail: boolean;
  geo: "ok" | "denied" | "late";
  tiles: "ok" | "fail";
  ihfrMode: IhfrMode;
  adminConflict: boolean;
  membershipConflict: boolean;
  panelOpen: boolean;
}

let state: ScenarioState = {
  session: null,
  delayMs: 500,
  failNext: false,
  logoutFail: false,
  geo: "ok",
  tiles: "ok",
  ihfrMode: "normal",
  adminConflict: false,
  membershipConflict: false,
  panelOpen: false,
};

const listeners = new Set<() => void>();
const PROFILE_KEY = "hf-demo-profile"; // apenas a chave do perfil de demonstração, nunca credenciais

export function getScenario() {
  return state;
}
export function setScenario(patch: Partial<ScenarioState>) {
  state = { ...state, ...patch };
  if ("session" in patch && typeof window !== "undefined") {
    if (patch.session) sessionStorage.setItem(PROFILE_KEY, JSON.stringify(patch.session));
    else sessionStorage.removeItem(PROFILE_KEY);
  }
  listeners.forEach((l) => l());
}
/** Restaura o perfil de demonstração após recarregar a página (chamar em useEffect). */
export function restoreDemoSession() {
  if (state.session) return;
  try {
    const raw = sessionStorage.getItem(PROFILE_KEY);
    if (raw) {
      state = { ...state, session: JSON.parse(raw) };
      listeners.forEach((l) => l());
    }
  } catch {
    /* ignore */
  }
}
function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}
export function useScenario() {
  return useSyncExternalStore(subscribe, getScenario, getScenario);
}
