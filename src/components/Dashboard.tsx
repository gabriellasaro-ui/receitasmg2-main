import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useDashboardStore } from "@/data/store";
import { useAuth } from "@/hooks/useAuth";
import { KpiCard } from "@/components/KpiCard";
import { RankingClosers, RankingPreVendas } from "@/components/Rankings";
import { FunnelChart } from "@/components/FunnelChart";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RevenueChart } from "@/components/RevenueChart";
import { SemaforoBadge } from "@/components/SemaforoBadge";
import {
  getDiaUtilAtual,
  formatCurrency,
  formatPercent,
  calcIdealDia,
  calcPctIdeal,
  getSemaforoStatus,
  getChurnSemaforoStatus,
  GoalSettings,
  defaultGoalSettings,
} from "@/data/seedData";
import { AlertTriangle, Calendar, Activity, Target, TrendingUp, Building2, Trophy, Filter } from "lucide-react";

export default function Dashboard() {
  const { getTotais, loadFromDB } = useDashboardStore();
  const { isAdmin, profile } = useAuth();
  const [goals, setGoals] = useState<GoalSettings>(defaultGoalSettings);
  const [unitRanking, setUnitRanking] = useState<{ name: string; receita: number; contratos: number; recorrente: number; churn: number }[]>([]);
  const [unitsList, setUnitsList] = useState<{ id: string; name: string }[]>([]);
  const [selectedUnitId, setSelectedUnitId] = useState<string>("all");
  const totais = getTotais();
  const diaAtual = getDiaUtilAtual();

  // Fetch units list for admin filter
  useEffect(() => {
    if (!isAdmin) return;
    supabase.from("units").select("id, name").order("name").then(({ data }) => {
      if (data) setUnitsList(data);
    });
  }, [isAdmin]);

  // Reload store data when unit filter changes (admin only)
  useEffect(() => {
    if (!isAdmin) return;
    if (selectedUnitId === "all") {
      loadFromDB(null); // load all
    } else {
      loadFromDB(selectedUnitId);
    }
  }, [selectedUnitId, isAdmin]);

  // Fetch goal from database
  useEffect(() => {
    const now = new Date();
    const mesRef = now.getMonth() + 1;
    const anoRef = now.getFullYear();

    let query = supabase
      .from("goals")
      .select("*")
      .eq("mes_ref", mesRef)
      .eq("ano_ref", anoRef);

    if (isAdmin) {
      if (selectedUnitId !== "all") {
        query = query.eq("unit_id", selectedUnitId);
      } else {
        query = query.is("unit_id", null);
      }
    } else if (profile?.unit_id) {
      query = query.eq("unit_id", profile.unit_id);
    } else {
      query = query.is("unit_id", null);
    }

    query.maybeSingle().then(({ data }) => {
      if (data) {
        setGoals({
          mesRef: data.mes_ref,
          anoRef: data.ano_ref,
          diasUteisTotal: data.dias_uteis_total,
          metaReceitaTotal: Number(data.meta_receita_total),
          metaReceitaRecorrente: Number(data.meta_receita_recorrente),
          metaReceitaOnetime: Number(data.meta_receita_onetime),
          metaChurnM0Max: Number(data.meta_churn_m0_max),
          metaReceitaLiquida: Number(data.meta_receita_liquida),
          metaCaixaMarco60pct: Number(data.meta_caixa_60pct),
          bookingMedioMeses: data.booking_medio_meses,
          metaLeads: data.meta_leads,
          metaConexoes: data.meta_conexoes,
          metaStake: data.meta_stake,
          metaRM: data.meta_rm,
          metaRR: data.meta_rr,
          metaContratos: data.meta_contratos,
          ticketMedio: Number(data.ticket_medio),
          investimentoTotal: Number(data.investimento_total),
          cplMedio: Number(data.cpl_medio),
        });
      } else {
        setGoals(defaultGoalSettings);
      }
    });
  }, [selectedUnitId]);

  // Fetch unit ranking for admin
  useEffect(() => {
    if (!isAdmin) return;
    const fetchUnitRanking = async () => {
      const now = new Date();
      const startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
      const endDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-31`;
      const [{ data: units }, { data: closerSubs }, { data: pvSubs }] = await Promise.all([
        supabase.from("units").select("id, name"),
        supabase.from("closer_submissions").select("unit_id, valor_contrato_total, contratos_assinados, valor_recorrente, churn_m0").gte("data_referencia", startDate).lte("data_referencia", endDate),
        supabase.from("pv_submissions").select("unit_id, valor_contrato_total, contratos_assinados, valor_recorrente, churn_m0").gte("data_referencia", startDate).lte("data_referencia", endDate),
      ]);
      if (!units) return;
      const unitMap = new Map(units.map((u: any) => [u.id, u.name]));
      const agg = new Map<string, { receita: number; contratos: number; recorrente: number; churn: number }>();
      const addSub = (sub: any) => {
        if (!sub.unit_id) return;
        const existing = agg.get(sub.unit_id) || { receita: 0, contratos: 0, recorrente: 0, churn: 0 };
        existing.receita += Number(sub.valor_contrato_total);
        existing.contratos += sub.contratos_assinados;
        existing.recorrente += Number(sub.valor_recorrente);
        existing.churn += Number(sub.churn_m0);
        agg.set(sub.unit_id, existing);
      };
      (closerSubs || []).forEach(addSub);
      (pvSubs || []).forEach(addSub);
      setUnitRanking(
        Array.from(agg.entries())
          .map(([unitId, data]) => ({ name: unitMap.get(unitId) || "Sem nome", ...data }))
          .sort((a, b) => b.receita - a.receita)
      );
    };
    fetchUnitRanking();
  }, [isAdmin]);

  const pctMetaReceita = goals.metaReceitaTotal > 0 ? totais.faturamento / goals.metaReceitaTotal : 0;
  const idealReceita = calcIdealDia(goals.metaReceitaTotal, diaAtual, goals.diasUteisTotal);
  const pctIdealReceita = calcPctIdeal(totais.faturamento, idealReceita);
  const gapReceita = totais.faturamento - idealReceita;
  const projecaoFinal = diaAtual > 0 ? (totais.faturamento / diaAtual) * goals.diasUteisTotal : 0;
  const semaforoGeral = getSemaforoStatus(pctIdealReceita);
  const semaforoChurn = getChurnSemaforoStatus(totais.churnM0, goals.metaChurnM0Max);
  const hasData = totais.faturamento > 0 || totais.contratos > 0 || totais.rm > 0;
  const totalUnitReceita = unitRanking.reduce((a, u) => a + u.receita, 0);

  return (
    <div className="space-y-10 pb-16">
      {/* ── Header Area (Refined) ── */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8 pt-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-primary">
            <Target className="w-4 h-4" />
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] leading-none">Gestão de Performance</p>
          </div>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-[-0.04em] text-foreground">
            Meta <span className="text-primary italic">Março 2026.</span>
          </h1>
          <div className="flex items-center gap-4 pt-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/50 border border-border/40">
              <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-[11px] font-semibold tabular">Dia {diaAtual} de {goals.diasUteisTotal}</span>
            </div>
            {hasData && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/50 border border-border/40">
                <Activity className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-[11px] font-semibold text-muted-foreground italic">Pace:</span>
                <span className={`text-[11px] font-semibold tabular ${semaforoGeral === "verde" ? "semaforo-verde" : "semaforo-vermelho"}`}>
                  {formatPercent(pctIdealReceita)}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isAdmin && unitsList.length > 0 && (
            <Select value={selectedUnitId} onValueChange={setSelectedUnitId}>
              <SelectTrigger className="w-[240px] h-11 rounded-2xl glass-panel border-white/10 shadow-lg text-sm font-semibold">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-primary" />
                  <SelectValue placeholder="Todas unidades" />
                </div>
              </SelectTrigger>
              <SelectContent className="glass-panel border-white/10 rounded-2xl">
                <SelectItem value="all" className="font-semibold">Consolidado Regional</SelectItem>
                {unitsList.map((u) => (
                  <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {hasData && (
            <SemaforoBadge status={semaforoGeral} pctIdeal={pctIdealReceita} />
          )}
        </div>
      </div>

      {/* ── Empty State ── */}
      {!hasData && (
        <div className="kpi-card text-center py-16">
          <div className="w-14 h-14 rounded-2xl bg-secondary/80 flex items-center justify-center mx-auto mb-5">
            <Activity className="w-6 h-6 text-muted-foreground" />
          </div>
          <h3 className="text-base font-semibold mb-2">Nenhum lançamento ainda</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
            Os dados aparecerão aqui conforme os formulários diários forem preenchidos pela equipe.
          </p>
        </div>
      )}

      {/* ── METRICS GRID ── */}
      <div className="space-y-12">
        {/* Nível 1: Strategic Indicators */}
        <section className="space-y-6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary" />
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Indicadores Estratégicos</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard label="Faturamento Total" value={totais.faturamento} meta={goals.metaReceitaTotal} format="currency" size="large" />
            <KpiCard label="Receita Líquida" value={totais.receitaLiquida} meta={goals.metaReceitaLiquida} format="currency" size="large" />

            {/* Projeção Final Glass Card */}
            <div className="group relative glass-panel rounded-3xl p-6 sm:p-8 border-white/10 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 overflow-hidden animation-shine-container">
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 shadow-overlay">
                <div className="shine-overlay" />
              </div>
              <div className={`absolute top-4 bottom-4 left-0 w-[4px] rounded-r-full ${projecaoFinal >= goals.metaReceitaTotal ? "bg-semaforo-verde" : "bg-semaforo-vermelho"} opacity-80`} />

              <p className="kpi-label mb-4 opacity-60">Projeção Final</p>
              <p className="text-3xl sm:text-4xl font-semibold tabular tracking-tighter leading-none">{hasData ? formatCurrency(projecaoFinal) : "—"}</p>

              {hasData && (
                <div className="mt-6 flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className={`w-3.5 h-3.5 ${projecaoFinal >= goals.metaReceitaTotal ? "semaforo-verde" : "semaforo-vermelho"}`} />
                    <span className={`text-[11px] font-semibold tabular ${projecaoFinal >= goals.metaReceitaTotal ? "semaforo-verde" : "semaforo-vermelho"}`}>
                      Gap: {formatCurrency(projecaoFinal - goals.metaReceitaTotal)}
                    </span>
                  </div>
                  <div className="h-1 w-full bg-secondary/30 rounded-full overflow-hidden">
                    <div className={`h-full bg-primary rounded-full transition-all duration-1000 w-[65%] progress-glow`} />
                  </div>
                </div>
              )}
            </div>

            {/* Gap vs Ideal Glass Card */}
            <div className="group relative glass-panel rounded-3xl p-6 sm:p-8 border-white/10 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 overflow-hidden">
              <div className={`absolute top-4 bottom-4 left-0 w-[4px] rounded-r-full ${hasData ? (gapReceita >= 0 ? "bg-semaforo-verde" : "bg-semaforo-vermelho") : "bg-border/40"} opacity-80`} />
              <p className="kpi-label mb-4 opacity-60">Gap vs Ideal</p>
              <p className={`text-3xl sm:text-4xl font-semibold tabular tracking-tighter leading-none ${hasData ? (gapReceita >= 0 ? "semaforo-verde" : "semaforo-vermelho") : "text-muted-foreground"}`}>
                {hasData ? formatCurrency(gapReceita) : "—"}
              </p>
              <div className="mt-8 pt-4 border-t border-border/40">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground opacity-50">Acumulado Ideal</p>
                <p className="text-xs font-semibold text-foreground/80 mt-1 tabular">{formatCurrency(idealReceita)}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Nível 2: Revenue Breakdown */}
        <section className="space-y-6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary/40" />
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Composição de Receita</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <KpiCard label="Recorrente" value={totais.recorrente} meta={goals.metaReceitaRecorrente} format="currency" />
            <KpiCard label="One-Time" value={totais.onetime} meta={goals.metaReceitaOnetime} format="currency" />
            <KpiCard label="Churn M0" value={totais.churnM0} meta={goals.metaChurnM0Max} format="currency" invertSemaforo />
            <KpiCard label="Contratos" value={totais.contratos} meta={goals.metaContratos} />

            <div className="group relative glass-panel rounded-3xl p-6 border-white/10 shadow-lg hover:shadow-xl transition-all duration-500 overflow-hidden">
              <p className="kpi-label mb-4 opacity-60">% Meta Geral</p>
              <div className="flex items-center gap-4">
                <p className={`text-3xl font-semibold tabular tracking-tighter ${hasData ? (pctMetaReceita >= 1 ? "semaforo-verde" : "semaforo-vermelho") : "text-muted-foreground"}`}>
                  {hasData ? formatPercent(pctMetaReceita) : "—"}
                </p>
              </div>
              <div className="mt-6 h-1.5 w-full bg-secondary/30 rounded-full overflow-hidden">
                <div className={`h-full bg-primary rounded-full transition-all duration-1000 progress-glow`} style={{ width: `${Math.min(pctMetaReceita * 100, 100)}%` }} />
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* ── Top Unidades (Admin only) ── */}
      {isAdmin && unitRanking.length > 0 && (
        <section>
          <p className="section-title mb-4 flex items-center gap-2">
            <Building2 className="w-3.5 h-3.5" />
            Top Unidades por Receita
          </p>
          <div className="kpi-card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="table-header-v4">
                    <th className="text-center p-3 w-10">#</th>
                    <th className="text-left p-3">Unidade</th>
                    <th className="text-right p-3">Receita Total</th>
                    <th className="text-right p-3">Recorrente</th>
                    <th className="text-right p-3">Churn M0</th>
                    <th className="text-right p-3">Contratos</th>
                    <th className="text-right p-3">% Regional</th>
                  </tr>
                </thead>
                <tbody>
                  {unitRanking.map((unit, idx) => {
                    const pctRegional = totalUnitReceita > 0 ? unit.receita / totalUnitReceita : 0;
                    return (
                      <tr key={unit.name} className="table-row-v4">
                        <td className="text-center p-3">
                          <span className={`inline-flex items-center justify-center w-6 h-6 rounded-lg text-[10px] font-semibold ${idx === 0 ? "bg-primary/15 text-primary" :
                            idx === 1 ? "bg-primary/10 text-primary/80" :
                              idx === 2 ? "bg-primary/5 text-primary/60" :
                                "bg-secondary text-muted-foreground"
                            }`}>
                            {idx + 1}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                            <span className="font-medium">{unit.name}</span>
                          </div>
                        </td>
                        <td className="p-3 text-right tabular font-semibold">{formatCurrency(unit.receita)}</td>
                        <td className="p-3 text-right tabular text-muted-foreground">{formatCurrency(unit.recorrente)}</td>
                        <td className="p-3 text-right tabular text-muted-foreground">{formatCurrency(unit.churn)}</td>
                        <td className="p-3 text-right tabular">{unit.contratos}</td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-12 progress-track">
                              <div className="progress-fill bg-primary progress-glow" style={{ width: `${Math.min(pctRegional * 100, 100)}%` }} />
                            </div>
                            <span className="tabular font-medium text-[11px]">{formatPercent(pctRegional)}</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* ── NÍVEL 3: Charts & Rankings (Linear Layout) ── */}
      <section className="space-y-12">
        {/* Gráfico de Faturamento - Foco Total */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Evolução de Faturamento</p>
          </div>
          <RevenueChart />
        </div>

        {/* Funil de Vendas - Foco Total */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Funil de Vendas Acumulado</p>
          </div>
          <FunnelChart />
        </div>

        {/* Rankings - Grid de Base */}
        <div className="space-y-6 pt-6 border-t border-border/40">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-primary" />
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Performance Regional (Rankings)</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <RankingClosers />
            <RankingPreVendas />
          </div>
        </div>
      </section>

      {/* ── Alerts ── */}
      {totais.churnM0 > goals.metaChurnM0Max && (
        <div className="kpi-card border-destructive/30 bg-destructive/5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-destructive/15 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-destructive" />
          </div>
          <div>
            <p className="font-semibold text-destructive text-sm">Churn M0 acima da meta</p>
            <p className="text-[11px] text-muted-foreground mt-0.5 tabular">
              {formatCurrency(totais.churnM0)} / {formatCurrency(goals.metaChurnM0Max)} máximo
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
