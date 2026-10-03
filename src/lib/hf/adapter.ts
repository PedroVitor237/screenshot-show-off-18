// Camada de acesso a dados substituível. Espelha os endpoints existentes do HidroFlorestas.
// Na integração real, implemente `HfAdapter` com fetch(..., { credentials: "include", cache: "no-store" }).
import type {
  AdminUser, AreaDetail, AreaInput, AreaSummary, AuditEntry, Collection, DiagnosisRequest, Eligibility,
  EnvironmentalData, EnvironmentalInput, HistoryItem, LabContext, LaboratoryDetails, LaboratorySummary,
  LabRole, LandUseType, Membership, OperationResponse, PublicDiagnosis, PublicUser, TerritorialArea,
  AccountStatus, GlobalRole,
} from "./types";
import { mockAdapter } from "./mock-adapter";

export interface HfAdapter {
  signUp(b: { firstName: string; lastName: string; email: string; password: string }): Promise<{ user: PublicUser }>;
  signIn(b: { email: string; password: string }): Promise<{ user: PublicUser; destination: string }>;
  me(): Promise<{ user: PublicUser; isGlobalAdmin: boolean }>;
  logout(): Promise<void>;

  listLabs(): Promise<LaboratorySummary[]>;
  createLab(name: string): Promise<LaboratorySummary>;
  getLab(labId: string): Promise<LaboratoryDetails & { context: LabContext }>;
  deactivateLab(labId: string, confirmationName: string): Promise<"DEACTIVATED">;
  deleteLab(labId: string, confirmationName: string): Promise<"DELETED">;

  listMemberships(labId: string): Promise<{ context: LabContext; memberships: Membership[] }>;
  updateMembership(labId: string, id: string, b: { expectedRole: LabRole; role: LabRole }): Promise<Membership>;

  listAreas(labId: string): Promise<{ context: LabContext; areas: AreaSummary[] }>;
  createArea(labId: string, b: AreaInput): Promise<AreaSummary>;
  getArea(labId: string, areaId: string): Promise<AreaDetail & { locationMissing?: boolean }>;

  createCollection(labId: string, areaId: string, occurredAt: string, idempotencyKey: string): Promise<Collection>;
  getCollection(labId: string, areaId: string, collectionId: string): Promise<Collection>;

  getEnvironmental(labId: string, areaId: string, collectionId: string): Promise<EnvironmentalData | null>;
  createEnvironmental(labId: string, areaId: string, collectionId: string, b: EnvironmentalInput, key: string): Promise<EnvironmentalData>;

  summary(labId: string): Promise<{ context: LabContext; totals: { areas: number; confirmedCollections: number } }>;
  history(labId: string, cursor?: string): Promise<{ context: LabContext; items: HistoryItem[]; page: { nextCursor: string | null } }>;
  territorialMap(labId: string): Promise<{ context: LabContext; areas: TerritorialArea[] }>;

  currentDiagnosis(labId: string, areaId: string, collectionId: string): Promise<PublicDiagnosis | null>;
  eligibility(labId: string, areaId: string, collectionId: string, landUseType: LandUseType | null): Promise<Eligibility>;
  createDiagnosis(labId: string, areaId: string, collectionId: string, b: DiagnosisRequest, key: string): Promise<OperationResponse & { replayed: boolean }>;
  getDiagnosis(labId: string, areaId: string, collectionId: string, diagnosisId: string): Promise<PublicDiagnosis>;
  revokeDiagnosis(labId: string, areaId: string, collectionId: string, diagnosisId: string, b: { expectedCurrentDiagnosisId: string; reason: string }, key: string): Promise<OperationResponse & { replayed: boolean }>;
  getOperation(labId: string, areaId: string, collectionId: string, key: string): Promise<OperationResponse & { replayed: boolean }>;

  adminListUsers(q: { search: string; role: GlobalRole | ""; status: AccountStatus | ""; page: number }): Promise<{ users: AdminUser[]; total: number; pageSize: number }>;
  adminGetUser(id: string): Promise<AdminUser>;
  adminUpdateUser(id: string, b: { field: "role" | "status"; value: string; reason: string; expectedRevision: number; expectedValue: string }): Promise<AdminUser>;
  adminAudit(page: number): Promise<{ items: AuditEntry[]; total: number; pageSize: number }>;
  adminOverview(): Promise<{ total: number; byStatus: Record<AccountStatus, number> }>;
}

export const api: HfAdapter = mockAdapter;

/** Versões ativas fixas do adapter — nunca editáveis pela pessoa. */
export const ACTIVE_VERSIONS = {
  measurementContractVersion: "ihfr-measurement-v1",
  inputContractVersion: "ihfr-diagnosis-input-experimental-v0.1.0",
  mathContractVersion: "ihfr-math-experimental-v0.1.1",
  algorithmVersion: "ihfr-evaluator-ts-v0.1.0",
  contractHash: "sha256:f8104143f1505aceaa68a7ffa06fac50f4906cdfc4119609875d99c9fecc6f89",
};
