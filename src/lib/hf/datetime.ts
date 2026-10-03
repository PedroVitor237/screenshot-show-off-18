// Utilitários de data/hora para `occurredAt` (RFC3339 com segundos e offset explícito).
// Nunca anexar "Z" a uma hora local: o offset é sempre explícito.

export interface WallTime {
  date: string; // YYYY-MM-DD
  time: string; // HH:MM[:SS[.mmm]]
}

const pad = (n: number, l = 2) => String(Math.abs(n)).padStart(l, "0");

export function formatOffset(minutes: number): string {
  if (minutes === 0) return "+00:00";
  const sign = minutes > 0 ? "+" : "-";
  return `${sign}${pad(Math.floor(Math.abs(minutes) / 60))}:${pad(Math.abs(minutes) % 60)}`;
}

/** Valida "+HH:MM"/"-HH:MM". Retorna minutos ou mensagem de erro. */
export function parseOffset(raw: string): { ok: true; minutes: number } | { ok: false; error: string } {
  const m = /^([+-])(\d{2}):(\d{2})$/.exec(raw.trim());
  if (!m) return { ok: false, error: "Use o formato ±HH:MM, por exemplo -03:00." };
  const [, sign, hh, mm] = m;
  const h = Number(hh);
  const min = Number(mm);
  if (sign === "-" && h === 0 && min === 0) return { ok: false, error: "-00:00 não é um offset válido; use +00:00." };
  if (min > 59) return { ok: false, error: "Minutos do offset devem estar entre 00 e 59." };
  if (h > 14 || (h === 14 && min !== 0)) return { ok: false, error: "Offset máximo é ±14:00." };
  const total = h * 60 + min;
  return { ok: true, minutes: sign === "-" ? -total : total };
}

interface Parts { y: number; mo: number; d: number; h: number; mi: number; s: number; ms: number; msRaw: string | null }

function parseWall(w: WallTime): Parts | string {
  const dm = /^(\d{4})-(\d{2})-(\d{2})$/.exec(w.date);
  if (!dm) return "Informe uma data válida.";
  const tm = /^(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?$/.exec(w.time);
  if (!tm) return "Informe uma hora válida (HH:MM:SS).";
  const y = +dm[1], mo = +dm[2], d = +dm[3];
  const h = +tm[1], mi = +tm[2], s = tm[3] ? +tm[3] : 0;
  const msRaw = tm[4] ?? null;
  const ms = msRaw ? Number(msRaw.padEnd(3, "0")) : 0;
  const probe = new Date(Date.UTC(y, mo - 1, d));
  if (mo < 1 || mo > 12 || probe.getUTCDate() !== d || probe.getUTCMonth() !== mo - 1) return "Esta data não existe no calendário.";
  if (h > 23 || mi > 59 || s > 59) return "Informe uma hora válida (HH:MM:SS).";
  return { y, mo, d, h, mi, s, ms, msRaw };
}

function wallUtcMs(p: Parts) {
  return Date.UTC(p.y, p.mo - 1, p.d, p.h, p.mi, p.s, p.ms);
}

/** Offsets do fuso do dispositivo que produzem exatamente esta hora de parede. */
export function deviceOffsetsFor(w: WallTime): number[] | string {
  const p = parseWall(w);
  if (typeof p === "string") return p;
  const base = wallUtcMs(p);
  const candidates = new Set<number>();
  for (const delta of [-3, -1, 0, 1, 3]) {
    candidates.add(-new Date(base + delta * 3600_000).getTimezoneOffset());
  }
  return [...candidates].filter((off) => -new Date(base - off * 60_000).getTimezoneOffset() === off).sort((a, b) => a - b);
}

export function toRFC3339(w: WallTime, offsetMinutes: number): string | string[] {
  const p = parseWall(w);
  if (typeof p === "string") return [p];
  const sec = pad(p.s);
  const frac = p.msRaw ? "." + p.msRaw.padEnd(3, "0") : "";
  return `${p.y}-${pad(p.mo)}-${pad(p.d)}T${pad(p.h)}:${pad(p.mi)}:${sec}${frac}${formatOffset(offsetMinutes)}`;
}

export function instantOf(w: WallTime, offsetMinutes: number): number | null {
  const p = parseWall(w);
  if (typeof p === "string") return null;
  return wallUtcMs(p) - offsetMinutes * 60_000;
}

/** Inicialização única a partir do relógio do dispositivo. */
export function nowWall(): WallTime {
  const n = new Date();
  return {
    date: `${n.getFullYear()}-${pad(n.getMonth() + 1)}-${pad(n.getDate())}`,
    time: `${pad(n.getHours())}:${pad(n.getMinutes())}:${pad(n.getSeconds())}`,
  };
}

export function deviceOffsetNow(): number {
  return -new Date().getTimezoneOffset();
}

/** Mostra a hora de parede declarada no próprio RFC3339, preservando o offset original. */
export function formatDeclared(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(\.\d+)?(Z|[+-]\d{2}:\d{2})$/.exec(iso);
  if (!m) return iso;
  const [, y, mo, d, h, mi, s, frac, off] = m;
  const offLabel = off === "Z" ? "UTC" : `UTC${off.replace("-", "−")}`;
  return `${d}/${mo}/${y} às ${h}:${mi}:${s}${frac ?? ""} (${offLabel})`;
}

export function toUtcIso(iso: string): string {
  return new Date(iso).toISOString();
}
