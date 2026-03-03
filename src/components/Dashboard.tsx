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
    <div className="space-y-8">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Meta Março <span className="text-primary">2026</span>
          </h1>
          <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>Dia {diaAtual}/{goals.diasUteisTotal}</span>
            </div>
            {hasData && (
              <>
                <span className="w-px h-3.5 bg-border" />
                <div className="flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5" />
                  <span>Pace</span>
                  <span className={`font-bold tabular ${semaforoGeral === "verde" ? "semaforo-verde" : semaforoGeral === "amarelo" ? "semaforo-amarelo" : semaforoGeral === "laranja" ? "semaforo-laranja" : "semaforo-vermelho"}`}>
                    {formatPercent(pctIdealReceita)}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isAdmin && unitsList.length > 0 && (
            <Select value={selectedUnitId} onValueChange={setSelectedUnitId}>
              <SelectTrigger className="w-[200px] h-9 text-sm">
                <div className="flex items-center gap-2">
                  <Filter className="w-3.5 h-3.5 text-muted-foreground" />
                  <SelectValue placeholder="Todas unidades" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Consolidado Regional</SelectItem>
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

      {/* ── NÍVEL 1: Indicadores Estratégicos ── */}
      <section>
        <p className="section-title mb-4">Indicadores Estratégicos</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard label="Faturamento Total" value={totais.faturamento} meta={goals.metaReceitaTotal} format="currency" size="large" />
          <KpiCard label="Receita Líquida" value={totais.receitaLiquida} meta={goals.metaReceitaLiquida} format="currency" size="large" />
          <div className="kpi-card p-6 relative overflow-hidden">
            {hasData && (
              <div className={`absolute top-3 bottom-3 left-0 w-[3px] rounded-r-full ${projecaoFinal >= goals.metaReceitaTotal ? "bg-semaforo-verde" : "bg-semaforo-vermelho"}`} />
            )}
            <p className="kpi-label mb-3">Projeção Final</p>
            <p className="text-[28px] font-bold tracking-tight leading-none tabular">{hasData ? formatCurrency(projecaoFinal) : "—"}</p>
            {hasData && (
              <div className="mt-4 flex items-center gap-1.5">
                <TrendingUp className={`w-3 h-3 ${projecaoFinal >= goals.metaReceitaTotal ? "semaforo-verde" : "semaforo-vermelho"}`} />
                <span className={`text-[11px] font-medium tabular ${projecaoFinal >= goals.metaReceitaTotal ? "semaforo-verde" : "semaforo-vermelho"}`}>
                  Gap: {formatCurrency(projecaoFinal - goals.metaReceitaTotal)}
                </span>
              </div>
            )}
          </div>
          <div className="kpi-card p-6 relative overflow-hidden">
            {hasData && (
              <div className={`absolute top-3 bottom-3 left-0 w-[3px] rounded-r-full ${gapReceita >= 0 ? "bg-semaforo-verde" : "bg-semaforo-vermelho"}`} />
            )}
            <p className="kpi-label mb-3">Gap vs Ideal</p>
            <p className={`text-[28px] font-bold tracking-tight leading-none tabular ${hasData ? (gapReceita >= 0 ? "semaforo-verde" : "semaforo-vermelho") : "text-muted-foreground"}`}>
              {hasData ? formatCurrency(gapReceita) : "—"}
            </p>
            <p className="text-[11px] text-muted-foreground mt-4 tabular">
              Ideal acumulado: {formatCurrency(idealReceita)}
            </p>
          </div>
        </div>
      </section>

      {/* ── NÍVEL 1b: Receita Breakdown ── */}
      <section>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <KpiCard label="Recorrente" value={totais.recorrente} meta={goals.metaReceitaRecorrente} format="currency" />
          <KpiCard label="One-Time" value={totais.onetime} meta={goals.metaReceitaOnetime} format="currency" />
          <KpiCard label="Churn M0" value={totais.churnM0} meta={goals.metaChurnM0Max} format="currency" invertSemaforo />
          <KpiCard label="Contratos" value={totais.contratos} meta={goals.metaContratos} />
          <div className="kpi-card p-6">
            <p className="kpi-label mb-3">% Meta</p>
            <p className={`text-[28px] font-bold tracking-tight leading-none tabular ${hasData ? (pctMetaReceita >= 1 ? "semaforo-verde" : pctMetaReceita >= 0.75 ? "semaforo-amarelo" : "semaforo-vermelho") : "text-muted-foreground"}`}>
              {hasData ? formatPercent(pctMetaReceita) : "—"}
            </p>
          </div>
        </div>
      </section>

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
                          <span className={`inline-flex items-center justify-center w-6 h-6 rounded-lg text-[10px] font-bold ${
                            idx === 0 ? "bg-primary/15 text-primary" :
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
                              <div className="progress-fill bg-primary" style={{ width: `${Math.min(pctRegional * 100, 100)}%` }} />
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

      {/* ── NÍVEL 3: Charts & Rankings ── */}
      <section>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <RevenueChart />
            <FunnelChart />
          </div>
          <div className="space-y-6">
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
