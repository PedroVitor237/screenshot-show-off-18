// DEMONSTRAÇÃO: implementação em memória do HfAdapter com fixtures sintéticas.
// Nenhuma função aqui calcula IHFR a partir das medições: resultados são fixtures predefinidas.
import type { HfAdapter } from "./adapter";
import {
  ApiError, type AdminUser, type AreaDetail, type AuditEntry, type Collection, type EnvironmentalData,
  type EnvironmentalInput, type HistoryItem, type InsufficiencyReason, type LabContext, type LabRole,
  type LabStatus, type OperationResponse, type PublicDiagnosis, type GlobalRole, type AccountStatus,
} from "./types";
import { getScenario, setScenario } from "./scenario-store";
import { SCIENTIFIC_LABELS } from "./labels";

interface DbUser { id: string; profile: string; firstName: string; lastName: string; email: string; role: GlobalRole; status: AccountStatus; createdAt: string; revision: number }
interface DbLab { id: string; name: string; createdAt: string; status: LabStatus }
interface DbMember { id: string; labId: string; userId: string; role: LabRole }
interface DbArea extends Omit<AreaDetail, "laboratory" | "readOnly"> { labId: string; locationMissing?: boolean }
interface DbCollection { id: string; areaId: string; labId: string; occurredAt: string; confirmedAt: string }
interface Db {
  users: DbUser[]; labs: DbLab[]; members: DbMember[]; areas: DbArea[]; collections: DbCollection[];
  env: EnvironmentalData[]; diagnoses: PublicDiagnosis[]; ops: Map<string, { body: string; res: OperationResponse }>;
  audit: AuditEntry[];
}

const VERSIONS = {
  measurementContractVersion: "ihfr-measurement-v1",
  inputContractVersion: "ihfr-diagnosis-input-experimental-v0.1.0",
  mathContractVersion: "ihfr-math-experimental-v0.1.1",
  algorithmVersion: "ihfr-evaluator-ts-v0.1.0",
  contractHash: "sha256:f8104143f1505aceaa68a7ffa06fac50f4906cdfc4119609875d99c9fecc6f89",
};

const uid = () => crypto.randomUUID();

function seed(): Db {
  const u = (id: string, profile: string, firstName: string, lastName: string, email: string, role: GlobalRole = "USER", status: AccountStatus = "ACTIVE"): DbUser =>
    ({ id, profile, firstName, lastName, email, role, status, createdAt: "2026-03-10T12:00:00.000Z", revision: 1 });
  const users = [
    u("7d1f2a10-0000-4000-8000-000000000001", "owner", "Ana", "Souza", "ana@demo.hf"),
    u("7d1f2a10-0000-4000-8000-000000000002", "labadmin", "Bruno", "Lima", "bruno@demo.hf"),
    u("7d1f2a10-0000-4000-8000-000000000003", "member", "Carla", "Dias", "carla@demo.hf"),
    u("7d1f2a10-0000-4000-8000-000000000004", "gadmin", "Diego", "Ramos", "diego@demo.hf", "ADMIN"),
    u("7d1f2a10-0000-4000-8000-000000000005", "nolab", "Elisa", "Prado", "elisa@demo.hf"),
    u("7d1f2a10-0000-4000-8000-000000000006", "inactive", "Fábio", "Nunes", "fabio@demo.hf"),
    u("7d1f2a10-0000-4000-8000-000000000007", "limit", "Gabriela", "Rocha", "gabriela@demo.hf"),
    u("7d1f2a10-0000-4000-8000-000000000008", "-", "Helena", "Costa", "helena@demo.hf", "ADMIN"),
    u("7d1f2a10-0000-4000-8000-000000000009", "-", "Igor", "Matos", "igor@demo.hf", "USER", "PENDING"),
    u("7d1f2a10-0000-4000-8000-000000000010", "-", "Júlia", "Freitas", "julia@demo.hf", "MODERATOR", "INACTIVE"),
    u("7d1f2a10-0000-4000-8000-000000000011", "-", "Kleber", "Alves", "kleber@demo.hf", "USER", "BLOCKED"),
    u("7d1f2a10-0000-4000-8000-000000000012", "-", "Larissa", "Moura", "larissa@demo.hf", "DEVELOPER"),
  ];
  const [ana, bruno, carla, , , fabio, gabi] = users as [DbUser, DbUser, DbUser, DbUser, DbUser, DbUser, DbUser];
  const L1 = "a1000000-0000-4000-8000-000000000001", L2 = "a1000000-0000-4000-8000-000000000002", L3 = "a1000000-0000-4000-8000-000000000003";
  const labs: DbLab[] = [
    { id: L1, name: "Laboratório de Hidrologia do Semiárido", createdAt: "2026-04-02T13:00:00.000Z", status: "ACTIVE" },
    { id: L2, name: "Núcleo de Solos do Cerrado", createdAt: "2026-05-11T13:00:00.000Z", status: "ACTIVE" },
    { id: L3, name: "Grupo Mata Atlântica — ciclo 2025", createdAt: "2025-11-20T13:00:00.000Z", status: "INACTIVE" },
    ...[4, 5, 6, 7].map((n) => ({ id: `a1000000-0000-4000-8000-00000000000${n}`, name: `Estação experimental ${n - 3}`, createdAt: "2026-06-01T13:00:00.000Z", status: "ACTIVE" as LabStatus })),
  ];
  let mi = 0;
  const m = (labId: string, userId: string, role: LabRole): DbMember => ({ id: `b2000000-0000-4000-8000-${String(++mi).padStart(12, "0")}`, labId, userId, role });
  const members = [
    m(L1, ana.id, "OWNER"), m(L1, bruno.id, "ADMIN"), m(L1, carla.id, "MEMBER"), m(L1, gabi.id, "MEMBER"),
    m(L2, bruno.id, "OWNER"), m(L2, ana.id, "MEMBER"),
    m(L3, fabio.id, "OWNER"), m(L3, carla.id, "MEMBER"),
    ...[4, 5, 6, 7].map((n) => m(`a1000000-0000-4000-8000-00000000000${n}`, gabi.id, "OWNER")),
  ];
  const A1 = "c3000000-0000-4000-8000-000000000001", A2 = "c3000000-0000-4000-8000-000000000002", A3 = "c3000000-0000-4000-8000-000000000003", B1 = "c3000000-0000-4000-8000-000000000004";
  const areas: DbArea[] = [
    { id: A1, labId: L1, name: "Nascente do Riacho Seco", latitude: -4.9712, longitude: -39.0154, municipality: "Quixadá", state: "CE", landType: "Caatinga arbustiva", description: "Ponto de afloramento próximo à estrada vicinal.", createdAt: "2026-04-10T14:00:00.000Z" },
    { id: A2, labId: L1, name: "Açude Velho — margem norte", latitude: -7.2219, longitude: -35.8808, municipality: "Campina Grande", state: "PB", landType: null, description: null, createdAt: "2026-05-03T11:30:00.000Z" },
    { id: A3, labId: L1, name: "Vereda do Pau-Ferro", latitude: -6.3, longitude: -38.1, municipality: null, state: null, landType: null, description: "Registro legado: localização ausente no mapa territorial.", createdAt: "2026-06-18T16:00:00.000Z", locationMissing: true },
    { id: B1, labId: L3, name: "Fragmento Serra do Mar", latitude: -23.62, longitude: -45.42, municipality: "Caraguatatuba", state: "SP", landType: "Floresta ombrófila", description: null, createdAt: "2025-12-01T12:00:00.000Z" },
  ];
  const C1 = "d4000000-0000-4000-8000-000000000001", C2 = "d4000000-0000-4000-8000-000000000002", C3 = "d4000000-0000-4000-8000-000000000003", C4 = "d4000000-0000-4000-8000-000000000004", C5 = "d4000000-0000-4000-8000-000000000005";
  const collections: DbCollection[] = [
    { id: C1, areaId: A1, labId: L1, occurredAt: "2026-08-14T09:20:00-03:00", confirmedAt: "2026-08-14T15:02:11.000Z" },
    { id: C2, areaId: A1, labId: L1, occurredAt: "2026-09-02T15:05:30.250-03:00", confirmedAt: "2026-09-02T19:10:00.000Z" },
    { id: C3, areaId: A2, labId: L1, occurredAt: "2026-09-20T07:45:00+00:00", confirmedAt: "2026-09-20T08:01:40.000Z" },
    { id: C4, areaId: A2, labId: L1, occurredAt: "2026-09-25T18:30:00+05:45", confirmedAt: "2026-09-25T13:00:00.000Z" },
    { id: C5, areaId: B1, labId: L3, occurredAt: "2025-12-05T10:00:00-03:00", confirmedAt: "2025-12-05T14:00:00.000Z" },
  ];
  const envBase: EnvironmentalInput = {
    water: { waterSourceType: "SPRING", hasSpring: true, wellDepthMeters: null, waterAvailability: "SEASONAL", salinityIndicator: "NONE" },
    soil: { soilTexture: "SANDY", infiltrationRateMmPerHour: 32.5, compactionLevel: "MEDIUM", erosionSigns: "LAMINAR", soilExposedPercent: 18 },
    vegetation: { vegetationCoverPercent: 64, fragmentationLevel: "MEDIUM", hasRiparianApp: true, landscapeDegradation: "LOW" },
    terrain: { drainageDensityKmPerKm2: 1.8, elevationMeters: 212, slopePercent: 7.5 },
  };
  const env: EnvironmentalData[] = [
    { ...envBase, id: "e5000000-0000-4000-8000-000000000001", collectionId: C1, measurementContractVersion: "ihfr-measurement-v1", confirmedAt: "2026-08-14T16:00:00.000Z", readOnly: true },
    { ...envBase, water: { ...envBase.water, waterSourceType: "SHALLOW_WELL", hasSpring: false, wellDepthMeters: 0 }, terrain: { drainageDensityKmPerKm2: null, elevationMeters: null, slopePercent: null }, id: "e5000000-0000-4000-8000-000000000002", collectionId: C2, measurementContractVersion: "ihfr-measurement-v1", confirmedAt: "2026-09-02T20:00:00.000Z", readOnly: true },
    { ...envBase, id: "e5000000-0000-4000-8000-000000000005", collectionId: C5, measurementContractVersion: "ihfr-measurement-v1", confirmedAt: "2025-12-05T15:00:00.000Z", readOnly: true },
  ];
  const diagnoses = [
    fixtureDiagnosis("f6000000-0000-4000-8000-000000000001", A1, C1, env[0]!.id, "SUPERSEDED", 0.38, "MODERATE", "MEDIUM", "2026-08-15T10:00:00.000Z", "2026-08-20T09:00:00.000Z"),
    fixtureDiagnosis("f6000000-0000-4000-8000-000000000002", A1, C1, env[0]!.id, "CURRENT", 0.42, "MODERATE", "HIGH", "2026-08-20T09:00:00.000Z", null),
  ];
  return { users, labs, members, areas, collections, env, diagnoses, ops: new Map(), audit: [
    { id: uid(), at: "2026-09-01T12:00:00.000Z", actor: "Helena Costa", targetId: users[10]!.id, targetName: "Kleber Alves", field: "status", before: "ACTIVE", after: "BLOCKED", reason: "Tentativas repetidas de acesso indevido." },
  ] };
}

function fixtureDiagnosis(id: string, areaId: string, collectionId: string, envId: string, state: PublicDiagnosis["lifecycleState"], score: number, cls: PublicDiagnosis["ihfrClass"], q: PublicDiagnosis["dataQuality"], from: string, transitioned: string | null): PublicDiagnosis {
  return {
    id, areaId, collectionId, environmentalMeasurementSetId: envId, inputSupplementId: uid(), lifecycleState: state,
    rawScore: score + 0.0037, displayScore: score, ihfrClass: cls, dataQuality: q,
    componentScores: { W: 0.51, S: 0.39, V: 0.33, T: 0.46 },
    decomposition: [
      { variable: "water.waterAvailability", component: "W", score: 0.5 }, { variable: "water.salinityIndicator", component: "W", score: 0.2 },
      { variable: "soil.compactionLevel", component: "S", score: 0.5 }, { variable: "soil.erosionSigns", component: "S", score: 0.4 },
      { variable: "vegetation.vegetationCoverPercent", component: "V", score: 0.36 }, { variable: "vegetation.fragmentationLevel", component: "V", score: 0.5 },
      { variable: "terrain.slopePercent", component: "T", score: 0.3 }, { variable: "landUseType", component: "T", score: 0.6 },
      { variable: "terrain.drainageDensityKmPerKm2", component: "T", score: null },
    ],
    drivers: ["W", "T"],
    explanation: "Resultado simulado — demonstração. Explicação determinística retornada pelo servidor: os componentes Água e Território têm maior contribuição neste registro.",
    versions: VERSIONS, calculatedAt: from, validFrom: from, transitionedAt: transitioned, scientificState: "EXPERIMENTAL", scientificLabels: SCIENTIFIC_LABELS,
  };
}

let _db: Db | null = null;
const db = () => (_db ??= seed());

// ---------- infraestrutura ----------
async function net() {
  const s = getScenario();
  await new Promise((r) => setTimeout(r, s.delayMs));
  if (s.failNext) {
    setScenario({ failNext: false });
    throw new ApiError(0, "NETWORK", "Não foi possível conectar ao servidor.");
  }
}
function me(): DbUser {
  const s = getScenario().session;
  const user = s && db().users.find((u) => u.id === s.userId);
  if (!user || user.status !== "ACTIVE") throw new ApiError(401, "UNAUTHENTICATED", "Sessão expirada.");
  return user;
}
const notFound = () => new ApiError(404, "NOT_FOUND", "Recurso não encontrado.");
function ctxFor(labId: string): LabContext {
  const user = me();
  const lab = db().labs.find((l) => l.id === labId);
  const mem = lab && db().members.find((m) => m.labId === labId && m.userId === user.id);
  if (!lab || !mem) throw notFound();
  return { laboratory: { id: lab.id, name: lab.name, status: lab.status }, role: mem.role, readOnly: lab.status !== "ACTIVE" };
}
function mustWrite(ctx: LabContext, allowed: LabRole[]) {
  if (ctx.readOnly) throw new ApiError(409, "LABORATORY_INACTIVE", "Laboratório inativo — somente leitura.");
  if (!allowed.includes(ctx.role)) throw new ApiError(403, "FORBIDDEN", "Você não tem permissão para esta ação.");
}
function areaIn(labId: string, areaId: string) {
  const a = db().areas.find((x) => x.id === areaId && x.labId === labId);
  if (!a) throw notFound();
  return a;
}
function colIn(labId: string, areaId: string, collectionId: string) {
  areaIn(labId, areaId);
  const c = db().collections.find((x) => x.id === collectionId && x.areaId === areaId);
  if (!c) throw notFound();
  return c;
}
const pubUser = (u: DbUser) => ({ firstName: u.firstName, lastName: u.lastName, image: null });
const initials = (u: DbUser) => (u.firstName[0]! + u.lastName[0]!).toUpperCase();
const accessibleLabs = (userId: string) => db().members.filter((m) => m.userId === userId);
function toCollection(c: DbCollection): Collection {
  const a = db().areas.find((x) => x.id === c.areaId)!;
  const l = db().labs.find((x) => x.id === c.labId)!;
  return { id: c.id, occurredAt: c.occurredAt, confirmedAt: c.confirmedAt, area: { id: a.id, name: a.name }, laboratory: { id: l.id, name: l.name, status: l.status }, readOnly: true };
}
const opKey = (collectionId: string, key: string) => `${collectionId}:${key}`;

function reasonsFor(collectionId: string, landUse: string | null): InsufficiencyReason[] {
  const e = db().env.find((x) => x.collectionId === collectionId);
  const r: InsufficiencyReason[] = [];
  if (!e) r.push("MISSING_ENVIRONMENTAL_DATA");
  else if (e.terrain.slopePercent === null) r.push("MISSING_SLOPE_PERCENT");
  if (!landUse) r.push("MISSING_LAND_USE_TYPE");
  if (getScenario().ihfrMode === "insufficient") r.push("INSUFFICIENT_DIMENSION");
  return r;
}

export const mockAdapter: HfAdapter = {
  async signUp(b) {
    await net();
    if (db().users.some((u) => u.email.toLowerCase() === b.email.toLowerCase())) throw new ApiError(409, "EMAIL_IN_USE", "Não foi possível criar a conta com este e-mail.");
    const user: DbUser = { id: uid(), profile: "new", firstName: b.firstName.trim(), lastName: b.lastName.trim(), email: b.email.trim(), role: "USER", status: "ACTIVE", createdAt: new Date().toISOString(), revision: 1 };
    db().users.push(user);
    setScenario({ session: { userId: user.id, profile: "new" } });
    return { user: pubUser(user) };
  },
  async signIn(b) {
    await net();
    const user = db().users.find((u) => u.email.toLowerCase() === b.email.trim().toLowerCase());
    if (!user || user.status !== "ACTIVE" || b.password.length === 0) throw new ApiError(401, "INVALID_CREDENTIALS", "Email ou senha inválidos.");
    setScenario({ session: { userId: user.id, profile: user.profile } });
    return { user: pubUser(user), destination: user.role === "ADMIN" ? "/admin" : "/workspace" };
  },
  async me() {
    await net();
    const u = me();
    return { user: pubUser(u), isGlobalAdmin: u.role === "ADMIN" };
  },
  async logout() {
    const s = getScenario();
    await new Promise((r) => setTimeout(r, Math.max(600, s.delayMs)));
    if (s.logoutFail) throw new ApiError(500, "INTERNAL", "Não foi possível encerrar a sessão.");
    setScenario({ session: null });
  },

  async listLabs() {
    await net();
    const u = me();
    return accessibleLabs(u.id).map((m) => {
      const l = db().labs.find((x) => x.id === m.labId)!;
      return { ...l, isOwner: m.role === "OWNER" };
    });
  },
  async createLab(name) {
    await net();
    const u = me();
    const n = name.trim();
    if (n.length < 1 || n.length > 100) throw new ApiError(400, "INVALID_NAME", "O nome deve ter entre 1 e 100 caracteres.");
    if (accessibleLabs(u.id).length >= 5) throw new ApiError(409, "LABORATORY_LIMIT_REACHED", "Limite de cinco laboratórios acessíveis atingido.");
    const lab: DbLab = { id: uid(), name: n, createdAt: new Date().toISOString(), status: "ACTIVE" };
    db().labs.push(lab);
    db().members.push({ id: uid(), labId: lab.id, userId: u.id, role: "OWNER" });
    return { ...lab, isOwner: true };
  },
  async getLab(labId) {
    await net();
    const context = ctxFor(labId);
    const l = db().labs.find((x) => x.id === labId)!;
    const members = db().members.filter((m) => m.labId === labId).map((m) => db().users.find((u) => u.id === m.userId)!).map((u) => ({ name: `${u.firstName} ${u.lastName}`, initials: initials(u) }));
    return { ...l, isOwner: context.role === "OWNER", members, context };
  },
  async deactivateLab(labId, confirmationName) {
    await net();
    const ctx = ctxFor(labId);
    if (ctx.role !== "OWNER") throw new ApiError(403, "FORBIDDEN", "Somente o proprietário pode desativar.");
    const l = db().labs.find((x) => x.id === labId)!;
    if (confirmationName !== l.name) throw new ApiError(400, "CONFIRMATION_MISMATCH", "O nome digitado não corresponde ao laboratório.");
    if (l.status === "INACTIVE") throw new ApiError(409, "LABORATORY_INACTIVE", "O laboratório já está inativo.");
    l.status = "INACTIVE";
    return "DEACTIVATED";
  },
  async deleteLab(labId, confirmationName) {
    await net();
    const ctx = ctxFor(labId);
    if (ctx.role !== "OWNER") throw new ApiError(403, "FORBIDDEN", "Somente o proprietário pode excluir.");
    const l = db().labs.find((x) => x.id === labId)!;
    if (confirmationName !== l.name) throw new ApiError(400, "CONFIRMATION_MISMATCH", "O nome digitado não corresponde ao laboratório.");
    if (db().areas.some((a) => a.labId === labId)) throw new ApiError(409, "LABORATORY_HAS_AREAS", "Não é possível excluir: o laboratório já possui áreas cadastradas.");
    _db!.labs = db().labs.filter((x) => x.id !== labId);
    _db!.members = db().members.filter((x) => x.labId !== labId);
    return "DELETED";
  },

  async listMemberships(labId) {
    await net();
    const context = ctxFor(labId);
    if (context.role !== "OWNER") throw new ApiError(403, "FORBIDDEN", "Somente o proprietário consulta membros.");
    const memberships = db().members.filter((m) => m.labId === labId).map((m) => {
      const u = db().users.find((x) => x.id === m.userId)!;
      return { id: m.id, name: `${u.firstName} ${u.lastName}`, initials: initials(u), role: m.role };
    });
    return { context, memberships };
  },
  async updateMembership(labId, id, b) {
    await net();
    const ctx = ctxFor(labId);
    mustWrite(ctx, ["OWNER"]);
    const m = db().members.find((x) => x.id === id && x.labId === labId);
    if (!m) throw notFound();
    if (m.role === "OWNER" || b.role === "OWNER" || b.expectedRole === b.role) throw new ApiError(400, "INVALID_ROLE", "Alteração de papel inválida.");
    if (getScenario().membershipConflict) {
      setScenario({ membershipConflict: false });
      m.role = m.role === "MEMBER" ? "ADMIN" : "MEMBER";
    }
    if (m.role !== b.expectedRole) throw new ApiError(409, "STATE_CONFLICT", "O papel foi alterado por outra pessoa. Os dados foram atualizados; revise novamente.");
    m.role = b.role;
    const u = db().users.find((x) => x.id === m.userId)!;
    return { id: m.id, name: `${u.firstName} ${u.lastName}`, initials: initials(u), role: m.role };
  },

  async listAreas(labId) {
    await net();
    const context = ctxFor(labId);
    return { context, areas: db().areas.filter((a) => a.labId === labId).map(({ id, name, latitude, longitude, municipality, state }) => ({ id, name, latitude, longitude, municipality, state })) };
  },
  async createArea(labId, b) {
    await net();
    mustWrite(ctxFor(labId), ["OWNER", "ADMIN"]);
    const a: DbArea = { ...b, id: uid(), labId, createdAt: new Date().toISOString() };
    db().areas.push(a);
    return { id: a.id, name: a.name, latitude: a.latitude, longitude: a.longitude, municipality: a.municipality, state: a.state };
  },
  async getArea(labId, areaId) {
    await net();
    const ctx = ctxFor(labId);
    const { labId: _l, ...a } = areaIn(labId, areaId);
    return { ...a, laboratory: ctx.laboratory, readOnly: ctx.readOnly };
  },

  async createCollection(labId, areaId, occurredAt, key) {
    await net();
    mustWrite(ctxFor(labId), ["OWNER", "ADMIN", "MEMBER"]);
    areaIn(labId, areaId);
    if (new Date(occurredAt).getTime() > Date.now()) throw new ApiError(400, "OCCURRED_AT_IN_FUTURE", "A ocorrência não pode ser posterior ao momento atual.");
    const existing = db().collections.find((c) => (c as DbCollection & { key?: string }).key === key);
    if (existing) return toCollection(existing);
    const c = { id: uid(), areaId, labId, occurredAt, confirmedAt: new Date().toISOString(), key } as DbCollection;
    db().collections.push(c);
    return toCollection(c);
  },
  async getCollection(labId, areaId, collectionId) {
    await net();
    ctxFor(labId);
    return toCollection(colIn(labId, areaId, collectionId));
  },

  async getEnvironmental(labId, areaId, collectionId) {
    await net();
    ctxFor(labId);
    colIn(labId, areaId, collectionId);
    return db().env.find((e) => e.collectionId === collectionId) ?? null;
  },
  async createEnvironmental(labId, areaId, collectionId, b) {
    await net();
    mustWrite(ctxFor(labId), ["OWNER", "ADMIN", "MEMBER"]);
    colIn(labId, areaId, collectionId);
    if (db().env.some((e) => e.collectionId === collectionId)) throw new ApiError(409, "ALREADY_CONFIRMED", "Esta coleta já possui um conjunto ambiental confirmado.");
    const e: EnvironmentalData = { ...b, id: uid(), collectionId, measurementContractVersion: "ihfr-measurement-v1", confirmedAt: new Date().toISOString(), readOnly: true };
    db().env.push(e);
    return e;
  },

  async summary(labId) {
    await net();
    const context = ctxFor(labId);
    return { context, totals: { areas: db().areas.filter((a) => a.labId === labId).length, confirmedCollections: db().collections.filter((c) => c.labId === labId).length } };
  },
  async history(labId, cursor) {
    await net();
    const context = ctxFor(labId);
    const base = `/dashboard/laboratories/${labId}`;
    const items: HistoryItem[] = [
      ...db().areas.filter((a) => a.labId === labId).map((a) => ({ id: `h-a-${a.id}`, type: "AREA_CREATED" as const, label: `Área criada: ${a.name}`, eventAt: a.createdAt, area: { id: a.id, name: a.name }, destination: `${base}/areas/${a.id}` })),
      ...db().collections.filter((c) => c.labId === labId).map((c) => {
        const a = db().areas.find((x) => x.id === c.areaId)!;
        return { id: `h-c-${c.id}`, type: "COLLECTION_CONFIRMED" as const, label: `Coleta confirmada em ${a.name}`, eventAt: c.confirmedAt, area: { id: a.id, name: a.name }, destination: `${base}/areas/${a.id}/collections/${c.id}`, collection: { id: c.id }, occurredAt: c.occurredAt };
      }),
    ].sort((x, y) => y.eventAt.localeCompare(x.eventAt));
    const size = 4; // páginas pequenas para demonstrar paginação (contrato: até 20)
    const start = cursor ? Number(atob(cursor)) : 0;
    const next = start + size < items.length ? btoa(String(start + size)) : null;
    return { context, items: items.slice(start, start + size), page: { nextCursor: next } };
  },
  async territorialMap(labId) {
    await net();
    const context = ctxFor(labId);
    return {
      context,
      areas: db().areas.filter((a) => a.labId === labId).map((a) => ({
        id: a.id, name: a.name,
        location: a.locationMissing ? null : { latitude: a.latitude, longitude: a.longitude },
        confirmedCollections: db().collections.filter((c) => c.areaId === a.id).map(({ id, occurredAt, confirmedAt }) => ({ id, occurredAt, confirmedAt })),
      })),
    };
  },

  async currentDiagnosis(labId, areaId, collectionId) {
    await net();
    ctxFor(labId);
    colIn(labId, areaId, collectionId);
    return db().diagnoses.find((d) => d.collectionId === collectionId && d.lifecycleState === "CURRENT") ?? null;
  },
  async eligibility(labId, areaId, collectionId, landUseType) {
    await net();
    ctxFor(labId);
    colIn(labId, areaId, collectionId);
    const reasons = reasonsFor(collectionId, landUseType);
    const cur = db().diagnoses.find((d) => d.collectionId === collectionId && d.lifecycleState === "CURRENT");
    return { eligible: reasons.length === 0, outcome: reasons.length ? "INSUFFICIENT_DATA" : "SUCCEEDED", reasons, hasCurrentDiagnosis: !!cur, currentDiagnosisId: cur?.id ?? null };
  },
  async createDiagnosis(labId, areaId, collectionId, b, key) {
    await net();
    const ctx = ctxFor(labId);
    mustWrite(ctx, ["OWNER", "ADMIN"]);
    colIn(labId, areaId, collectionId);
    const k = opKey(collectionId, key);
    const body = JSON.stringify(b);
    const prev = db().ops.get(k);
    if (prev) {
      if (prev.body !== body) throw new ApiError(409, "IDEMPOTENCY_CONFLICT", "Esta tentativa já foi usada com outros dados.");
      return { ...prev.res, replayed: true };
    }
    const mode = getScenario().ihfrMode;
    if (mode === "conflict") {
      setScenario({ ihfrMode: "normal" });
      throw new ApiError(409, "STATE_CONFLICT", "O diagnóstico vigente mudou. Atualize a consulta antes de nova ação.");
    }
    if (mode === "incompatible") {
      const res: OperationResponse = { outcome: "INCOMPATIBLE_VERSION", diagnosis: null, insufficiencyReasons: [] };
      db().ops.set(k, { body, res });
      throw Object.assign(new ApiError(422, "INCOMPATIBLE_VERSION", "Combinação de versões incompatível com o servidor."), { operation: res });
    }
    const cur = db().diagnoses.find((d) => d.collectionId === collectionId && d.lifecycleState === "CURRENT");
    if ((cur?.id ?? null) !== b.expectedCurrentDiagnosisId) throw new ApiError(409, "STATE_CONFLICT", "O diagnóstico vigente mudou. Atualize a consulta antes de nova ação.");
    const reasons = reasonsFor(collectionId, b.supplement.landUseType);
    let res: OperationResponse;
    if (reasons.length) {
      res = { outcome: "INSUFFICIENT_DATA", diagnosis: null, insufficiencyReasons: reasons };
    } else {
      const now = new Date().toISOString();
      if (cur) { cur.lifecycleState = "SUPERSEDED"; cur.transitionedAt = now; }
      const env = db().env.find((e) => e.collectionId === collectionId)!;
      const d = fixtureDiagnosis(uid(), areaId, collectionId, env.id, "CURRENT", cur ? 0.47 : 0.44, "MODERATE", "HIGH", now, null);
      db().diagnoses.push(d);
      res = { outcome: "SUCCEEDED", diagnosis: d, insufficiencyReasons: [] };
    }
    db().ops.set(k, { body, res });
    if (mode === "unknown") {
      setScenario({ ihfrMode: "normal" });
      throw new ApiError(0, "NETWORK", "Não foi possível conectar ao servidor.");
    }
    return { ...res, replayed: false };
  },
  async getDiagnosis(labId, areaId, collectionId, diagnosisId) {
    await net();
    ctxFor(labId);
    colIn(labId, areaId, collectionId);
    const d = db().diagnoses.find((x) => x.id === diagnosisId && x.collectionId === collectionId);
    if (!d) throw notFound();
    return d;
  },
  async revokeDiagnosis(labId, areaId, collectionId, diagnosisId, b, key) {
    await net();
    mustWrite(ctxFor(labId), ["OWNER", "ADMIN"]);
    colIn(labId, areaId, collectionId);
    const k = opKey(collectionId, key);
    const prev = db().ops.get(k);
    if (prev) return { ...prev.res, replayed: true };
    const d = db().diagnoses.find((x) => x.id === diagnosisId && x.collectionId === collectionId);
    if (!d) throw notFound();
    if (d.lifecycleState !== "CURRENT" || d.id !== b.expectedCurrentDiagnosisId) throw new ApiError(409, "STATE_CONFLICT", "O diagnóstico vigente mudou. Atualize a consulta antes de nova ação.");
    const r = b.reason.trim();
    if (r.length < 1 || r.length > 500) throw new ApiError(400, "INVALID_REASON", "Motivo deve ter entre 1 e 500 caracteres.");
    d.lifecycleState = "REVOKED";
    d.transitionedAt = new Date().toISOString();
    const res: OperationResponse = { outcome: "SUCCEEDED", diagnosis: d, insufficiencyReasons: [] };
    db().ops.set(k, { body: JSON.stringify(b), res });
    if (getScenario().ihfrMode === "unknown") {
      setScenario({ ihfrMode: "normal" });
      throw new ApiError(0, "NETWORK", "Não foi possível conectar ao servidor.");
    }
    return { ...res, replayed: false };
  },
  async getOperation(labId, _areaId, collectionId, key) {
    await net();
    ctxFor(labId);
    const prev = db().ops.get(opKey(collectionId, key));
    if (!prev) throw new ApiError(404, "OPERATION_NOT_FOUND", "Não há resultado terminal recuperável para esta tentativa.");
    return { ...prev.res, replayed: true };
  },

  async adminListUsers(q) {
    await net();
    if (me().role !== "ADMIN") throw new ApiError(403, "FORBIDDEN", "Acesso restrito a administradores globais.");
    const s = q.search.trim().toLowerCase();
    const all = db().users.filter((u) => (!s || `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(s)) && (!q.role || u.role === q.role) && (!q.status || u.status === q.status));
    const pageSize = 5;
    return { users: all.slice(q.page * pageSize, q.page * pageSize + pageSize).map(toAdmin), total: all.length, pageSize };
  },
  async adminGetUser(id) {
    await net();
    if (me().role !== "ADMIN") throw new ApiError(403, "FORBIDDEN", "Acesso restrito.");
    const u = db().users.find((x) => x.id === id);
    if (!u) throw notFound();
    return toAdmin(u);
  },
  async adminUpdateUser(id, b) {
    await net();
    const actor = me();
    if (actor.role !== "ADMIN") throw new ApiError(403, "FORBIDDEN", "Acesso restrito.");
    if (actor.id === id) throw new ApiError(400, "SELF_CHANGE", "Não é permitido alterar o próprio papel ou estado.");
    const u = db().users.find((x) => x.id === id);
    if (!u) throw notFound();
    const r = b.reason.trim();
    if (r.length < 1 || r.length > 500) throw new ApiError(400, "INVALID_REASON", "Justificativa deve ter entre 1 e 500 caracteres.");
    if (getScenario().adminConflict) {
      setScenario({ adminConflict: false });
      u.revision++;
      db().audit.unshift({ id: uid(), at: new Date().toISOString(), actor: "Helena Costa", targetId: u.id, targetName: `${u.firstName} ${u.lastName}`, field: "status", before: u.status, after: u.status, reason: "Revisão concorrente (demonstração)." });
    }
    if (u.revision !== b.expectedRevision || u[b.field] !== b.expectedValue) throw new ApiError(409, "STATE_CONFLICT", "A conta foi alterada por outra pessoa. Os dados foram atualizados; revise novamente.");
    const losesAdmin = u.role === "ADMIN" && u.status === "ACTIVE" && ((b.field === "role" && b.value !== "ADMIN") || (b.field === "status" && b.value !== "ACTIVE"));
    if (losesAdmin && db().users.filter((x) => x.role === "ADMIN" && x.status === "ACTIVE").length <= 1) throw new ApiError(409, "LAST_ADMIN", "A plataforma precisa de pelo menos um administrador ativo.");
    const before = u[b.field];
    if (b.field === "role") u.role = b.value as GlobalRole;
    else u.status = b.value as AccountStatus;
    u.revision++;
    db().audit.unshift({ id: uid(), at: new Date().toISOString(), actor: `${actor.firstName} ${actor.lastName}`, targetId: u.id, targetName: `${u.firstName} ${u.lastName}`, field: b.field, before, after: b.value, reason: r });
    return toAdmin(u);
  },
  async adminAudit(page) {
    await net();
    if (me().role !== "ADMIN") throw new ApiError(403, "FORBIDDEN", "Acesso restrito.");
    const pageSize = 5;
    return { items: db().audit.slice(page * pageSize, page * pageSize + pageSize), total: db().audit.length, pageSize };
  },
  async adminOverview() {
    await net();
    if (me().role !== "ADMIN") throw new ApiError(403, "FORBIDDEN", "Acesso restrito.");
    const byStatus = { ACTIVE: 0, PENDING: 0, INACTIVE: 0, BLOCKED: 0 } as Record<AccountStatus, number>;
    db().users.forEach((u) => byStatus[u.status]++);
    return { total: db().users.length, byStatus };
  },
};

function toAdmin(u: DbUser): AdminUser {
  return { id: u.id, name: `${u.firstName} ${u.lastName}`, email: u.email, role: u.role, status: u.status, createdAt: u.createdAt, revision: u.revision };
}

/** Somente demonstração: id do usuário de um perfil. */
export function demoUserIdFor(profile: string) {
  return db().users.find((u) => u.profile === profile)?.id ?? null;
}
