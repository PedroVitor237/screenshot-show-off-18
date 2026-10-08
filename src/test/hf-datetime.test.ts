import { describe, expect, it } from "vitest";

import { parseOffset, toRFC3339 } from "@/lib/hf/datetime";

// Regras do domínio: offset explícito ±14:00, "-00:00" inválido, RFC3339 com segundos.
describe("datetime (regras de occurredAt)", () => {
  it("aceita offsets dentro de ±14:00", () => {
    expect(parseOffset("-03:00")).toEqual({ ok: true, minutes: -180 });
    expect(parseOffset("+14:00")).toEqual({ ok: true, minutes: 840 });
    expect(parseOffset("+05:45")).toEqual({ ok: true, minutes: 345 });
  });

  it("rejeita -00:00", () => {
    const r = parseOffset("-00:00");
    expect(r.ok).toBe(false);
  });

  it("rejeita offsets acima de ±14:00", () => {
    expect(parseOffset("+14:01").ok).toBe(false);
    expect(parseOffset("+15:00").ok).toBe(false);
  });

  it("gera RFC3339 com segundos e offset explícito", () => {
    expect(toRFC3339({ date: "2026-09-25", time: "18:30" }, -180)).toBe("2026-09-25T18:30:00-03:00");
  });

  it("rejeita data inexistente no calendário", () => {
    const r = toRFC3339({ date: "2026-02-30", time: "10:00" }, 0);
    expect(Array.isArray(r)).toBe(true);
  });
});
