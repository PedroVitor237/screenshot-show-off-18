import type { LabContext } from "./types";

// Matriz de permissões do laboratório (apenas UX — o servidor real decide).
export function can(ctx: LabContext | undefined) {
  const role = ctx?.role;
  const active = !!ctx && !ctx.readOnly && ctx.laboratory.status === "ACTIVE";
  const manager = role === "OWNER" || role === "ADMIN";
  return {
    read: !!ctx,
    createArea: active && manager,
    registerCollection: active,
    registerEnvironmental: active,
    manageIhfr: active && manager,
    manageRoles: active && role === "OWNER",
    viewMembers: role === "OWNER",
    deactivateOrDelete: role === "OWNER",
  };
}
