// Team member images removed — members will come from database

export interface GoalSettings {
  mesRef: number;
  anoRef: number;
  diasUteisTotal: number;
  metaReceitaTotal: number;
  metaReceitaRecorrente: number;
  metaReceitaOnetime: number;
  metaChurnM0Max: number;
  metaReceitaLiquida: number;
  metaCaixaMarco60pct: number;
  bookingMedioMeses: number;
  metaLeads: number;
  metaConexoes: number;
  metaStake: number;
  metaRM: number;
  metaRR: number;
  metaContratos: number;
  ticketMedio: number;
  investimentoTotal: number;
  cplMedio: number;
}

export interface TeamMember {
  id: string;
  nome: string;
  funcao: "closer" | "pre_vendas";
  ativo: boolean;
  foto: string;
  percentualMeta?: number;
  metaReceitaTotal: number;
  metaReceitaRecorrente: number;
  metaReceitaOnetime: number;
  metaRM?: number;
  metaRR?: number;
  metaContratos?: number;
  metaLeads?: number;
  metaConexoes?: number;
  metaStake?: number;
  ticketMedio?: number;
}

export interface Channel {
  id: string;
  nome: string;
  tipo: string;
  ativo: boolean;
  metaLeads: number;
  metaRM: number;
  metaRR: number;
  metaContratos: number;
  metaReceitaTotal: number;
  metaReceitaRecorrente: number;
  metaReceitaOnetime: number;
  investimentoFixo: number;
  metaROAS: number;
}

export interface DailySubmissionPreVendas {
  id: string;
  dataReferencia: string;
  userId: string;
  channelId?: string;
  callsMarcadas: number;
  callsRealizadas: number;
  noShow: number;
  reagendamentos: number;
  contratosAssinados: number;
  valorContratoTotal: number;
  valorRecorrente: number;
  valorOnetime: number;
  churnM0: number;
  linkedCloserId?: string; // ID do Closer vinculado ao contrato
  observacoes?: string;
  submittedAt: string;
}

export interface DailySubmissionCloser {
  id: string;
  dataReferencia: string;
  userId: string;
  channelId: string;
  callsRealizadas: number;
  noShow: number;
  contratosAssinados: number;
  propostasRealizadas: number;
  valorContratoTotal: number;
  valorRecorrente: number;
  valorOnetime: number;
  churnM0: number;
  temperaturaCall: "frio" | "morno" | "quente";
  temperaturaProposta: "frio" | "morno" | "quente";
  linkedSdrId?: string; // ID do SDR vinculado à venda
  observacoes?: string;
  submittedAt: string;
}

export const defaultGoalSettings: GoalSettings = {
  mesRef: 3,
  anoRef: 2026,
  diasUteisTotal: 22,
  metaReceitaTotal: 0,
  metaReceitaRecorrente: 0,
  metaReceitaOnetime: 0,
  metaChurnM0Max: 0,
  metaReceitaLiquida: 0,
  metaCaixaMarco60pct: 0,
  bookingMedioMeses: 6,
  metaLeads: 0,
  metaConexoes: 0,
  metaStake: 0,
  metaRM: 0,
  metaRR: 0,
  metaContratos: 0,
  ticketMedio: 0,
  investimentoTotal: 0,
  cplMedio: 0,
};

export const closers: TeamMember[] = [];

export const preVendas: TeamMember[] = [];

export const channels: Channel[] = [
  { id: "lead-broker", nome: "Lead Broker", tipo: "broker", ativo: true, metaLeads: 0, metaRM: 0, metaRR: 0, metaContratos: 0, metaReceitaTotal: 0, metaReceitaRecorrente: 0, metaReceitaOnetime: 0, investimentoFixo: 0, metaROAS: 0 },
  { id: "outbound", nome: "Outbound", tipo: "outbound", ativo: true, metaLeads: 0, metaRM: 0, metaRR: 0, metaContratos: 0, metaReceitaTotal: 0, metaReceitaRecorrente: 0, metaReceitaOnetime: 0, investimentoFixo: 0, metaROAS: 0 },
  { id: "parcerias", nome: "Parcerias Estratégicas", tipo: "parceria", ativo: true, metaLeads: 0, metaRM: 0, metaRR: 0, metaContratos: 0, metaReceitaTotal: 0, metaReceitaRecorrente: 0, metaReceitaOnetime: 0, investimentoFixo: 0, metaROAS: 0 },
  { id: "indicacao", nome: "Indicação Operação", tipo: "indicacao", ativo: true, metaLeads: 0, metaRM: 0, metaRR: 0, metaContratos: 0, metaReceitaTotal: 0, metaReceitaRecorrente: 0, metaReceitaOnetime: 0, investimentoFixo: 0, metaROAS: 0 },
  { id: "recomendacao", nome: "Recomendação", tipo: "recomendacao", ativo: true, metaLeads: 0, metaRM: 0, metaRR: 0, metaContratos: 0, metaReceitaTotal: 0, metaReceitaRecorrente: 0, metaReceitaOnetime: 0, investimentoFixo: 0, metaROAS: 0 },
];

export const allMembers = [...closers, ...preVendas];

// ── Pace calculation utilities ──

export function getDiaUtilAtual(): number {
  const today = new Date();
  const year = 2026;
  const month = 2; // March (0-indexed)
  let count = 0;
  for (let d = 1; d <= today.getDate(); d++) {
    const date = new Date(year, month, d);
    const dow = date.getDay();
    if (dow >= 1 && dow <= 5) count++;
  }
  return Math.max(count, 1);
}

export function calcIdealDia(meta: number, diaUtilAtual: number, diasUteisTotal: number): number {
  return (diaUtilAtual / diasUteisTotal) * meta;
}

export function calcPctIdeal(realizado: number, idealDia: number): number {
  if (idealDia <= 0) return 0;
  return realizado / idealDia;
}

export function calcGapVolume(realizado: number, idealDia: number): number {
  return realizado - idealDia;
}

// ── 4-state semaphore ──
export type SemaforoStatus = "verde" | "amarelo" | "laranja" | "vermelho";

export function getSemaforoStatus(pctIdeal: number): SemaforoStatus {
  if (pctIdeal >= 1) return "verde";
  if (pctIdeal >= 0.90) return "amarelo";
  if (pctIdeal >= 0.75) return "laranja";
  return "vermelho";
}

export function getSemaforoLabel(status: SemaforoStatus): string {
  switch (status) {
    case "verde": return "Saudável";
    case "amarelo": return "Atenção";
    case "laranja": return "Risco";
    case "vermelho": return "Crítico";
  }
}

export function getSemaforoBadgeClass(status: SemaforoStatus): string {
  return `semaforo-badge-${status}`;
}

export function getSemaforoColorClass(status: SemaforoStatus): string {
  return `semaforo-${status}`;
}

export function getSemaforoBgClass(status: SemaforoStatus): string {
  return `bg-semaforo-${status}`;
}

// ── Churn M0 semaphore (inverted logic) ──
export function getChurnSemaforoStatus(churn: number, limite: number): SemaforoStatus {
  if (limite <= 0) return "verde";
  const pct = churn / limite;
  if (pct <= 0.60) return "verde";
  if (pct <= 0.80) return "amarelo";
  if (pct <= 1.00) return "laranja";
  return "vermelho";
}

// ── Formatters ──

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatCurrencyFull(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("pt-BR").format(value);
}

export function getBusinessDaysInMarch(): string[] {
  const days: string[] = [];
  for (let d = 1; d <= 31; d++) {
    const date = new Date(2026, 2, d);
    if (date.getMonth() !== 2) break;
    const dow = date.getDay();
    if (dow >= 1 && dow <= 5) {
      days.push(`2026-03-${String(d).padStart(2, "0")}`);
    }
  }
  return days;
}
