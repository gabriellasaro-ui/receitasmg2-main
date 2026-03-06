import { create } from "zustand";
import { supabase } from "@/integrations/supabase/client";
import {
  GoalSettings,
  Channel,
  DailySubmissionPreVendas,
  DailySubmissionCloser,
  defaultGoalSettings,
  channels,
} from "./seedData";

interface DashboardStore {
  goals: GoalSettings;
  channels: Channel[];
  pvSubmissions: DailySubmissionPreVendas[];
  closerSubmissions: DailySubmissionCloser[];
  filters: {
    canal: string;
    pessoa: string;
    funcao: string;
  };
  pendingApprovalsCount: number;
  setFilter: (key: string, value: string) => void;
  addPvSubmission: (sub: DailySubmissionPreVendas) => void;
  addCloserSubmission: (sub: DailySubmissionCloser) => void;
  loadFromDB: (unitId?: string | null) => Promise<void>;
  getCloserAcumulado: (userId: string) => {
    calls: number;
    noShow: number;
    contratos: number;
    propostas: number;
    faturamento: number;
    recorrente: number;
    onetime: number;
    churnM0: number;
  };
  getPvAcumulado: (userId: string) => {
    callsMarcadas: number;
    callsRealizadas: number;
    noShow: number;
    reagendamentos: number;
    contratos: number;
    faturamento: number;
    recorrente: number;
    onetime: number;
    churnM0: number;
  };
  getTotais: () => {
    leads: number;
    rm: number;
    rr: number;
    contratos: number;
    faturamento: number;
    recorrente: number;
    onetime: number;
    churnM0: number;
    receitaLiquida: number;
  };
}

export const useDashboardStore = create<DashboardStore>((set, get) => ({
  goals: defaultGoalSettings,
  channels: channels,
  pvSubmissions: [],
  closerSubmissions: [],
  filters: { canal: "todos", pessoa: "todos", funcao: "todos" },
  pendingApprovalsCount: 0,

  setFilter: (key, value) =>
    set((s) => ({ filters: { ...s.filters, [key]: value } })),

  addPvSubmission: (sub) =>
    set((s) => ({ pvSubmissions: [...s.pvSubmissions, sub] })),

  addCloserSubmission: (sub) =>
    set((s) => ({ closerSubmissions: [...s.closerSubmissions, sub] })),

  loadFromDB: async (unitId) => {
    const now = new Date();
    const mesRef = now.getMonth() + 1;
    const anoRef = now.getFullYear();
    const startDate = `${anoRef}-${String(mesRef).padStart(2, "0")}-01`;
    const endDate = `${anoRef}-${String(mesRef).padStart(2, "0")}-31`;

    // Query para buscar metas do banco (regional ou unidade)
    let goalsQuery = supabase
      .from("goals")
      .select("*")
      .eq("mes_ref", mesRef)
      .eq("ano_ref", anoRef);

    if (unitId) {
      goalsQuery = goalsQuery.eq("unit_id", unitId);
    } else {
      goalsQuery = goalsQuery.is("unit_id", null);
    }

    let csQuery = supabase
      .from("closer_submissions")
      .select("*")
      .gte("data_referencia", startDate)
      .lte("data_referencia", endDate);

    let pvQuery = supabase
      .from("pv_submissions")
      .select("*")
      .gte("data_referencia", startDate)
      .lte("data_referencia", endDate);

    if (unitId) {
      csQuery = csQuery.eq("unit_id", unitId);
      pvQuery = pvQuery.eq("unit_id", unitId);
    }

    const [csRes, pvRes, goalsRes, pendingRes] = await Promise.all([
      csQuery,
      pvQuery,
      goalsQuery,
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("status", "pending")
    ]);

    const pendingCount = pendingRes.count || 0;

    // Mapear metas do banco para o formato GoalSettings
    let loadedGoals: GoalSettings = { ...defaultGoalSettings, mesRef, anoRef };
    const goalRow = goalsRes.data?.[0];
    if (goalRow) {
      loadedGoals = {
        mesRef: goalRow.mes_ref,
        anoRef: goalRow.ano_ref,
        diasUteisTotal: goalRow.dias_uteis_total || 22,
        metaReceitaTotal: Number(goalRow.meta_receita_total) || 0,
        metaReceitaRecorrente: Number(goalRow.meta_receita_recorrente) || 0,
        metaReceitaOnetime: Number(goalRow.meta_receita_onetime) || 0,
        metaChurnM0Max: Number(goalRow.meta_churn_m0_max) || 0,
        metaReceitaLiquida: Number(goalRow.meta_receita_liquida) || 0,
        metaCaixaMarco60pct: Number(goalRow.meta_caixa_60pct) || 0,
        bookingMedioMeses: goalRow.booking_medio_meses || 6,
        metaLeads: goalRow.meta_leads || 0,
        metaConexoes: goalRow.meta_conexoes || 0,
        metaStake: goalRow.meta_stake || 0,
        metaRM: goalRow.meta_rm || 0,
        metaRR: goalRow.meta_rr || 0,
        metaContratos: goalRow.meta_contratos || 0,
        ticketMedio: Number(goalRow.ticket_medio) || 0,
        investimentoTotal: Number(goalRow.investimento_total) || 0,
        cplMedio: Number(goalRow.cpl_medio) || 0,
      };
    }

    const closerSubs: DailySubmissionCloser[] = (csRes.data || []).map((row: any) => ({
      id: row.id,
      dataReferencia: row.data_referencia,
      userId: row.closer_id,
      channelId: "",
      callsRealizadas: row.calls_realizadas,
      noShow: row.no_show,
      contratosAssinados: row.contratos_assinados,
      propostasRealizadas: row.propostas_realizadas,
      valorContratoTotal: Number(row.valor_contrato_total),
      valorRecorrente: Number(row.valor_recorrente),
      valorOnetime: Number(row.valor_onetime),
      churnM0: Number(row.churn_m0),
      temperaturaCall: "morno" as const,
      temperaturaProposta: "morno" as const,
      submittedAt: row.created_at,
      observacoes: row.observacoes,
    }));

    const pvSubs: DailySubmissionPreVendas[] = (pvRes.data || []).map((row: any) => ({
      id: row.id,
      dataReferencia: row.data_referencia,
      userId: row.pv_id,
      callsMarcadas: row.calls_marcadas,
      callsRealizadas: row.calls_realizadas,
      noShow: row.no_show,
      reagendamentos: row.reagendamentos,
      contratosAssinados: row.contratos_assinados,
      valorContratoTotal: Number(row.valor_contrato_total),
      valorRecorrente: Number(row.valor_recorrente),
      valorOnetime: Number(row.valor_onetime),
      churnM0: Number(row.churn_m0),
      submittedAt: row.created_at,
    }));

    set({
      closerSubmissions: closerSubs,
      pvSubmissions: pvSubs,
      goals: loadedGoals,
      pendingApprovalsCount: pendingCount
    });
  },

  getCloserAcumulado: (userId) => {
    const subs = get().closerSubmissions.filter((s) => s.userId === userId);
    return {
      calls: subs.reduce((a, s) => a + s.callsRealizadas, 0),
      noShow: subs.reduce((a, s) => a + s.noShow, 0),
      contratos: subs.reduce((a, s) => a + s.contratosAssinados, 0),
      propostas: subs.reduce((a, s) => a + s.propostasRealizadas, 0),
      faturamento: subs.reduce((a, s) => a + s.valorContratoTotal, 0),
      recorrente: subs.reduce((a, s) => a + s.valorRecorrente, 0),
      onetime: subs.reduce((a, s) => a + s.valorOnetime, 0),
      churnM0: subs.reduce((a, s) => a + s.churnM0, 0),
    };
  },

  getPvAcumulado: (userId) => {
    const subs = get().pvSubmissions.filter((s) => s.userId === userId);
    return {
      callsMarcadas: subs.reduce((a, s) => a + s.callsMarcadas, 0),
      callsRealizadas: subs.reduce((a, s) => a + s.callsRealizadas, 0),
      noShow: subs.reduce((a, s) => a + s.noShow, 0),
      reagendamentos: subs.reduce((a, s) => a + s.reagendamentos, 0),
      contratos: subs.reduce((a, s) => a + s.contratosAssinados, 0),
      faturamento: subs.reduce((a, s) => a + s.valorContratoTotal, 0),
      recorrente: subs.reduce((a, s) => a + s.valorRecorrente, 0),
      onetime: subs.reduce((a, s) => a + s.valorOnetime, 0),
      churnM0: subs.reduce((a, s) => a + s.churnM0, 0),
    };
  },

  getTotais: () => {
    const state = get();
    const pvTotals = state.pvSubmissions.reduce(
      (acc, s) => ({
        callsMarcadas: acc.callsMarcadas + s.callsMarcadas,
        callsRealizadas: acc.callsRealizadas + s.callsRealizadas,
        noShow: acc.noShow + s.noShow,
      }),
      { callsMarcadas: 0, callsRealizadas: 0, noShow: 0 }
    );

    // Lógica de Deduplicação para Contratos e Faturamento
    // Criamos um mapa de vendas únicas garantindo que o mesmo lead na mesma data não conte dobrado
    const uniqueSales = new Map<string, { faturamento: number; recorrente: number; onetime: number; churn: number }>();

    // Adiciona vendas dos Closers (geralmente a fonte final da venda)
    state.closerSubmissions.forEach(sub => {
      const key = `${sub.dataReferencia}_${sub.userId}_closer`; // Chave por closer para ranking individual é mantida no estado
      // Para o total regional, vamos usar lead name se disponível ou apenas somar se for lançamento consolidado
      // Como o sistema permite múltiplos leads por submissão nos detalhes, mas o total tá no submission
      // Para simplificar e amarrar: vamos usar o total das submissões de closers como base primária de faturamento
      const saleKey = `sale_${sub.id}`;
      uniqueSales.set(saleKey, {
        faturamento: sub.valorContratoTotal,
        recorrente: sub.valorRecorrente,
        onetime: sub.valorOnetime,
        churn: sub.churnM0
      });
    });

    // Adiciona vendas de SDRs APENAS se não houver vinculação que indique que o Closer já lançou (ou se for venda direta do SDR)
    // De acordo com o pedido, o valor não deve somar. 
    // Estratégia: Closers são o "Source of Truth" para o faturamento financeiro regional.
    // SDRs ganham crédito no ranking individual via pvSubmissions, mas para o TOTAL REGIONAL usamos CloserSubmissions.
    // Se um SDR lança um contrato, ele DEVE ser espelhado por um Closer.

    const faturamentoArr = Array.from(uniqueSales.values());
    const totalFaturamento = faturamentoArr.reduce((a, b) => a + b.faturamento, 0);
    const totalRecorrente = faturamentoArr.reduce((a, b) => a + b.recorrente, 0);
    const totalOnetime = faturamentoArr.reduce((a, b) => a + b.onetime, 0);
    const totalChurn = faturamentoArr.reduce((a, b) => a + b.churn, 0);

    const totalContratos = state.closerSubmissions.reduce((a, s) => a + s.contratosAssinados, 0);

    return {
      leads: pvTotals.callsMarcadas,
      rm: pvTotals.callsMarcadas,
      rr: pvTotals.callsRealizadas,
      contratos: totalContratos,
      faturamento: totalFaturamento,
      recorrente: totalRecorrente,
      onetime: totalOnetime,
      churnM0: totalChurn,
      receitaLiquida: totalFaturamento - totalChurn,
    };
  },
}));
