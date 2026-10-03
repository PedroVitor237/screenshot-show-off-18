// DTOs modelados a partir dos contratos HTTP do HidroFlorestas.
// Nomes e valores técnicos (enums) NÃO são traduzidos aqui.

export type GlobalRole = "USER" | "ADMIN" | "DEVELOPER" | "MODERATOR";
export type LabRole = "OWNER" | "ADMIN" | "MEMBER";
export type AccountStatus = "ACTIVE" | "PENDING" | "INACTIVE" | "BLOCKED";
export type LabStatus = "ACTIVE" | "INACTIVE";

export interface PublicUser {
  firstName: string;
  lastName: string;
  image: string | null;
}

export interface LaboratorySummary {
  id: string;
  name: string;
  createdAt: string;
  status: LabStatus;
  isOwner: boolean;
}

export interface LaboratoryDetails extends LaboratorySummary {
  members: { name: string; initials: string }[];
}

/** Contexto autorizado retornado pelas leituras do laboratório. */
export interface LabContext {
  laboratory: { id: string; name: string; status: LabStatus };
  role: LabRole;
  readOnly: boolean;
}

export interface Membership {
  id: string;
  name: string;
  initials: string;
  role: LabRole;
}

export interface AreaSummary {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  municipality: string | null;
  state: string | null;
}

export interface AreaDetail extends AreaSummary {
  landType: string | null;
  description: string | null;
  createdAt: string;
  laboratory: { id: string; name: string; status: LabStatus };
  readOnly: boolean;
}

export interface AreaInput {
  name: string;
  latitude: number;
  longitude: number;
  municipality: string | null;
  state: string | null;
  landType: string | null;
  description: string | null;
}

export interface Collection {
  id: string;
  occurredAt: string;
  confirmedAt: string;
  area: { id: string; name: string };
  laboratory: { id: string; name: string; status: LabStatus };
  readOnly: boolean;
}

export type Level = "LOW" | "MEDIUM" | "HIGH";
export type WaterSourceType =
  | "RIVER_STREAM"
  | "SPRING"
  | "SHALLOW_WELL"
  | "TUBULAR_WELL"
  | "CISTERN"
  | "OTHER";

export interface EnvironmentalInput {
  water: {
    waterSourceType: WaterSourceType;
    hasSpring: boolean;
    wellDepthMeters: number | null;
    waterAvailability: "PERMANENT" | "SEASONAL" | "SCARCE";
    salinityIndicator: "NONE" | "SUSPECTED" | "CONFIRMED" | null;
  };
  soil: {
    soilTexture: "SANDY" | "MEDIUM" | "CLAYEY";
    infiltrationRateMmPerHour: number;
    compactionLevel: Level;
    erosionSigns: "NONE" | "LAMINAR" | "RILLS_GULLIES";
    soilExposedPercent: number | null;
  };
  vegetation: {
    vegetationCoverPercent: number;
    fragmentationLevel: Level;
    hasRiparianApp: boolean | null;
    landscapeDegradation: Level;
  };
  terrain: {
    drainageDensityKmPerKm2: number | null;
    elevationMeters: number | null;
    slopePercent: number | null;
  };
}

export interface EnvironmentalData extends EnvironmentalInput {
  id: string;
  collectionId: string;
  measurementContractVersion: "ihfr-measurement-v1";
  confirmedAt: string;
  readOnly: boolean;
}

export interface HistoryItem {
  id: string;
  type: "AREA_CREATED" | "COLLECTION_CONFIRMED";
  label: string;
  eventAt: string;
  area: { id: string; name: string };
  destination: string;
  collection?: { id: string };
  occurredAt?: string;
}

export interface TerritorialArea {
  id: string;
  name: string;
  location: { latitude: number; longitude: number } | null;
  confirmedCollections: { id: string; occurredAt: string; confirmedAt: string }[];
}

// ---------- IHFR ----------
export type LandUseType =
  | "FOREST"
  | "AGROFORESTRY"
  | "CROPLAND"
  | "PASTURE"
  | "DEGRADED_PASTURE"
  | "BARE_SOIL"
  | "URBAN";
export type LifecycleState = "CURRENT" | "SUPERSEDED" | "REVOKED";
export type IhfrClass = "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
export type DataQuality = "LOW" | "MEDIUM" | "HIGH";
export type InsufficiencyReason =
  | "MISSING_ENVIRONMENTAL_DATA"
  | "MISSING_SLOPE_PERCENT"
  | "MISSING_LAND_USE_TYPE"
  | "INSUFFICIENT_DIMENSION";
export type Outcome = "SUCCEEDED" | "INSUFFICIENT_DATA" | "INCOMPATIBLE_VERSION";

export interface ContractVersions {
  measurementContractVersion: string;
  inputContractVersion: string;
  mathContractVersion: string;
  algorithmVersion: string;
  contractHash: string;
}

export interface PublicDiagnosis {
  id: string;
  areaId: string;
  collectionId: string;
  environmentalMeasurementSetId: string;
  inputSupplementId: string;
  lifecycleState: LifecycleState;
  rawScore: number;
  displayScore: number;
  ihfrClass: IhfrClass;
  dataQuality: DataQuality;
  componentScores: { W: number; S: number; V: number; T: number };
  decomposition: { variable: string; component: "W" | "S" | "V" | "T"; score: number | null }[];
  drivers: ("W" | "S" | "V" | "T")[];
  explanation: string;
  versions: ContractVersions;
  calculatedAt: string;
  validFrom: string;
  transitionedAt: string | null;
  scientificState: "EXPERIMENTAL";
  scientificLabels: string[];
}

export interface Eligibility {
  eligible: boolean;
  outcome: Outcome;
  reasons: InsufficiencyReason[];
  hasCurrentDiagnosis: boolean;
  currentDiagnosisId: string | null;
}

export interface DiagnosisRequest {
  operation: "CREATE" | "REPLACE";
  expectedCurrentDiagnosisId: string | null;
  supplement: {
    landUseType: LandUseType | null;
    landUseSource: "FIELD_OBSERVATION" | "AUTHORIZED_RECORD";
    landUseObservedAt: string;
  };
  versions: ContractVersions;
}

export interface OperationResponse {
  outcome: Outcome;
  diagnosis: PublicDiagnosis | null;
  insufficiencyReasons: InsufficiencyReason[];
}

// ---------- Admin ----------
export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: GlobalRole;
  status: AccountStatus;
  createdAt: string;
  revision: number;
}

export interface AuditEntry {
  id: string;
  at: string;
  actor: string;
  targetId: string;
  targetName: string;
  field: "role" | "status";
  before: string;
  after: string;
  reason: string;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}
