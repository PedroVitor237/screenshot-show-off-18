// Rótulos pt-BR para apresentação. O transporte sempre usa o valor técnico.

export const LEVEL_M = { LOW: "Baixo", MEDIUM: "Médio", HIGH: "Alto" } as const;
export const LEVEL_F = { LOW: "Baixa", MEDIUM: "Média", HIGH: "Alta" } as const;

export const WATER_SOURCE = {
  RIVER_STREAM: "Rio ou riacho",
  SPRING: "Nascente",
  SHALLOW_WELL: "Poço raso",
  TUBULAR_WELL: "Poço tubular",
  CISTERN: "Cisterna",
  OTHER: "Outra",
} as const;
export const WATER_AVAILABILITY = { PERMANENT: "Permanente", SEASONAL: "Sazonal", SCARCE: "Escassa" } as const;
export const SALINITY = { NONE: "Nenhum", SUSPECTED: "Suspeita", CONFIRMED: "Confirmada" } as const;
export const SOIL_TEXTURE = { SANDY: "Arenosa", MEDIUM: "Média", CLAYEY: "Argilosa" } as const;
export const EROSION = { NONE: "Nenhum", LAMINAR: "Laminar", RILLS_GULLIES: "Sulcos ou ravinas" } as const;

export const LAND_USE = {
  FOREST: "Floresta",
  AGROFORESTRY: "Sistema agroflorestal (SAF)",
  CROPLAND: "Agricultura",
  PASTURE: "Pastagem",
  DEGRADED_PASTURE: "Pastagem degradada",
  BARE_SOIL: "Solo exposto",
  URBAN: "Área urbanizada",
} as const;
export const LAND_USE_SOURCE = {
  FIELD_OBSERVATION: "Observação em campo",
  AUTHORIZED_RECORD: "Registro autorizado",
} as const;

export const LIFECYCLE = { CURRENT: "Vigente", SUPERSEDED: "Substituído", REVOKED: "Revogado" } as const;
export const IHFR_CLASS = { LOW: "Baixo", MODERATE: "Moderado", HIGH: "Alto", CRITICAL: "Crítico" } as const;
export const DATA_QUALITY = LEVEL_F;
export const COMPONENT = { W: "Água", S: "Solo", V: "Vegetação", T: "Território" } as const;

export const INSUFFICIENCY = {
  MISSING_ENVIRONMENTAL_DATA: "Não há conjunto ambiental confirmado para esta coleta.",
  MISSING_SLOPE_PERCENT: "A declividade (%) não foi informada nas medições confirmadas.",
  MISSING_LAND_USE_TYPE: "O uso predominante da terra não foi informado.",
  INSUFFICIENT_DIMENSION: "Alguma dimensão (Água, Solo, Vegetação ou Território) tem menos de dois scores disponíveis.",
} as const;

export const LAB_ROLE = { OWNER: "Proprietário", ADMIN: "Administrador do laboratório", MEMBER: "Membro" } as const;
export const GLOBAL_ROLE = { USER: "Usuário", ADMIN: "Administrador global", DEVELOPER: "Desenvolvedor", MODERATOR: "Moderador" } as const;
export const ACCOUNT_STATUS = { ACTIVE: "Ativa", PENDING: "Pendente", INACTIVE: "Inativa", BLOCKED: "Bloqueada" } as const;
export const LAB_STATUS = { ACTIVE: "Ativo", INACTIVE: "Inativo" } as const;

export const SCIENTIFIC_LABELS = [
  "CONTRATO_EXPERIMENTAL",
  "VALIDACAO_CIENTIFICA_PENDENTE",
  "SUJEITO_A_RECALIBRACAO",
  "NAO_APROVADO_COMO_CONTRATO_CIENTIFICO_DEFINITIVO",
];

export const MSG = {
  required: "Campo obrigatório.",
  invalidOption: "Selecione uma opção válida.",
  checkFields: "Verifique os campos indicados.",
  pct: "Informe um número entre 0 e 100.",
  depthOnlyWells: "Profundidade é aplicável somente a poços.",
  network: "Não foi possível conectar ao servidor.",
  readOnly: "Laboratório inativo — somente leitura.",
  noDiagnosis: "Sem diagnóstico experimental vigente",
  badCredentials: "Email ou senha inválidos.",
};

export const nf2 = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const nf = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 6 });

export function fmtDateTime(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(iso));
}
export function fmtDate(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(new Date(iso));
}
