import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useDashboardStore } from "@/data/store";
import { useUnitData } from "@/hooks/useUnitData";
import {
  getDiaUtilAtual,
  calcIdealDia,
  calcPctIdeal,
  getSemaforoStatus,
  getSemaforoBgClass,
  formatCurrency,
  formatPercent,
} from "@/data/seedData";
import { SemaforoBadge } from "./SemaforoBadge";
import { AlertTriangle, TrendingDown, Target, Activity, ShieldAlert, AlertOctagon } from "lucide-react";

function MemberAvatar({ name, className }: { name: string; className?: string }) {
  const initials = name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  return (
    <div className={`rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-[10px] ${className}`}>
      {initials}
    </div>
  );
}

export function ManagementView() {
  const { goals, getTotais, getCloserAcumulado, getPvAcumulado, channels: chs, closerSubmissions, pvSubmissions } = useDashboardStore();
  const { closers, preVendas } = useUnitData();
  const totais = getTotais();
  const diaAtual = getDiaUtilAtual();
  const hasData = closerSubmissions.length > 0 || pvSubmissions.length > 0;

  const [criticalUnits, setCriticalUnits] = useState<{ id: string; name: string }[]>([]);
  const [loadingCrit, setLoadingCrit] = useState(true);

  useEffect(() => {
    const fetchCriticalUnits = async () => {
      try {
        const now = new Date();
        const mesRef = now.getMonth() + 1;
        const anoRef = now.getFullYear();
        const startDate = `${anoRef}-${String(mesRef).padStart(2, "0")}-01`;
        const endDate = `${anoRef}-${String(mesRef).padStart(2, "0")}-31`;

        const { data: units } = await supabase.from("units").select("id, name");
        const { data: profiles } = await supabase.from("profiles").select("user_id, unit_id");

        const { data: cs } = await supabase.from("closer_submissions").select("user_id").gte("data_referencia", startDate).lte("data_referencia", endDate);
        const { data: pv } = await supabase.from("pv_submissions").select("user_id").gte("data_referencia", startDate).lte("data_referencia", endDate);
        const { data: props } = await supabase.from("closer_proposals_detail").select("user_id").gte("data_referencia", startDate).lte("data_referencia", endDate);

        if (!units || !profiles) return;

        const activeUnitIds = new Set<string>();
        const registerActivity = (items: any[]) => {
          items?.forEach(i => {
            const prof = profiles.find(p => p.user_id === i.user_id);
            if (prof?.unit_id) activeUnitIds.add(prof.unit_id);
          });
        };

        registerActivity(cs || []);
        registerActivity(pv || []);
        registerActivity(props || []);

        const crit = units.filter(u => !activeUnitIds.has(u.id));
        setCriticalUnits(crit);
      } catch (e) {
        console.error("Erro ao carregar unidades criticas:", e);
      } finally {
        setLoadingCrit(false);
      }
    };
    fetchCriticalUnits();
  }, []);
  const projecaoReceita = diaAtual > 0 && hasData ? (totais.faturamento / diaAtual) * goals.diasUteisTotal : 0;
  const projecaoRecorrente = diaAtual > 0 && hasData ? (totais.recorrente / diaAtual) * goals.diasUteisTotal : 0;
  const projecaoOnetime = diaAtual > 0 && hasData ? (totais.onetime / diaAtual) * goals.diasUteisTotal : 0;
  const projecaoChurn = diaAtual > 0 && hasData ? (totais.churnM0 / diaAtual) * goals.diasUteisTotal : 0;

  const closersBelowPace = closers.map((c) => {
    const ac = getCloserAcumulado(c.userId);
    return { ...c, faturamento: ac.faturamento, semaforo: getSemaforoStatus(0.7) as any, pctIdeal: 0.7 };
  }).filter((c) => c.faturamento > 0);

  const pvBelowPace = preVendas.map((p) => {
    const ac = getPvAcumulado(p.userId);
    return { ...p, realizadas: ac.callsRealizadas, semaforo: getSemaforoStatus(0.7) as any, pctIdeal: 0.7 };
  }).filter((p) => p.realizadas > 0);

  const channelsBelowPace = chs.map((ch) => {
    const clSubs = closerSubmissions.filter((s) => s.channelId === ch.id);
    const realizadoReceita = clSubs.reduce((a, s) => a + s.valorContratoTotal, 0);
    const ideal = calcIdealDia(ch.metaReceitaTotal, diaAtual, goals.diasUteisTotal);
    const pct = calcPctIdeal(realizadoReceita, ideal);
    return { ...ch, pctIdeal: pct, semaforo: getSemaforoStatus(pct), realizado: realizadoReceita };
  }).filter((c) => c.realizado > 0 && (c.semaforo === "vermelho" || c.semaforo === "laranja"));

  function ProjectionCard({ label, value, meta, inverted }: { label: string; value: number; meta: number; inverted?: boolean }) {
    const isGood = inverted ? value <= meta : value >= meta;
    const semaforo = hasData ? (isGood ? getSemaforoStatus(1.1) : getSemaforoStatus(0.7)) : null;
    return (
      <div className="space-y-2">
        <p className="kpi-label">{label}</p>
        <p className={`tabular font-bold text-xl ${hasData ? (isGood ? "semaforo-verde" : "semaforo-vermelho") : "text-muted-foreground"}`}>
          {hasData ? formatCurrency(value) : "—"}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground tabular">Meta: {formatCurrency(meta)}</span>
          {hasData && semaforo && <SemaforoBadge status={semaforo} compact />}
        </div>
        {hasData && (
          <div className="progress-track">
            <div className={`progress-fill ${inverted ? (value <= meta ? "bg-semaforo-verde" : "bg-semaforo-vermelho") : (value >= meta ? "bg-semaforo-verde" : "bg-semaforo-vermelho")}`}
              style={{ width: `${Math.min((meta > 0 ? value / meta : 0) * 100, 100)}%` }} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Gestão / Direção</h1>
        <p className="text-sm text-muted-foreground mt-1">Visão consolidada para tomada de decisão</p>
      </div>

      {!hasData && (
        <div className="kpi-card text-center py-16">
          <Activity className="w-8 h-8 text-muted-foreground mx-auto mb-3 opacity-20" />
          <p className="text-sm text-muted-foreground">Dados de gestão aparecerão após os primeiros lançamentos.</p>
        </div>
      )}

      <div className="kpi-card">
        <div className="flex items-center gap-2 mb-6">
          <Target className="w-4 h-4 text-primary" />
          <p className="text-[13px] font-semibold">Projeção de Fechamento</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <ProjectionCard label="Receita Total" value={projecaoReceita} meta={goals.metaReceitaTotal} />
          <ProjectionCard label="Recorrente" value={projecaoRecorrente} meta={goals.metaReceitaRecorrente} />
          <ProjectionCard label="One-Time" value={projecaoOnetime} meta={goals.metaReceitaOnetime} />
          <ProjectionCard label="Churn M0" value={projecaoChurn} meta={goals.metaChurnM0Max} inverted />
        </div>
      </div>

      {hasData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="kpi-card">
            <div className="flex items-center gap-2 mb-5">
              <ShieldAlert className="w-4 h-4 text-primary" />
              <p className="text-[13px] font-semibold">Closers ({closers.length})</p>
            </div>
            {closersBelowPace.length === 0 ? (
              <p className="text-[12px] text-muted-foreground">Sem dados ainda.</p>
            ) : (
              <div className="space-y-3">
                {closersBelowPace.map((c) => (
                  <div key={c.userId} className="flex items-center gap-3">
                    <MemberAvatar name={c.fullName} className="w-8 h-8" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-medium truncate">{c.fullName}</p>
                      <p className="text-[10px] text-muted-foreground tabular">{formatCurrency(c.faturamento)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="kpi-card">
            <div className="flex items-center gap-2 mb-5">
              <ShieldAlert className="w-4 h-4 text-primary" />
              <p className="text-[13px] font-semibold">Pré-Vendas ({preVendas.length})</p>
            </div>
            {pvBelowPace.length === 0 ? (
              <p className="text-[12px] text-muted-foreground">Sem dados ainda.</p>
            ) : (
              <div className="space-y-3">
                {pvBelowPace.map((p) => (
                  <div key={p.userId} className="flex items-center gap-3">
                    <MemberAvatar name={p.fullName} className="w-8 h-8" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-medium truncate">{p.fullName}</p>
                      <p className="text-[10px] text-muted-foreground tabular">{p.realizadas} calls</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="kpi-card">
            <div className="flex items-center gap-2 mb-5">
              <TrendingDown className="w-4 h-4 text-primary" />
              <p className="text-[13px] font-semibold">Canais em Risco</p>
            </div>
            {channelsBelowPace.length === 0 ? (
              <div className="flex items-center gap-2">
                <SemaforoBadge status="verde" compact />
                <span className="text-[12px]">Todos no pace</span>
              </div>
            ) : (
              <div className="space-y-3">
                {channelsBelowPace.slice(0, 5).map((c) => (
                  <div key={c.id} className="flex items-center justify-between gap-2">
                    <span className="text-[12px] truncate">{c.nome}</span>
                    <SemaforoBadge status={c.semaforo} pctIdeal={c.pctIdeal} compact />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="kpi-card border-destructive/20 bg-destructive/5 hover:border-destructive/40 hover:bg-destructive/10 transition-colors">
            <div className="flex items-center gap-2 mb-5">
              <AlertOctagon className="w-4 h-4 text-destructive" />
              <p className="text-[13px] font-semibold text-destructive">Unidades Críticas</p>
            </div>
            {loadingCrit ? (
              <p className="text-[12px] text-muted-foreground">Verificando...</p>
            ) : criticalUnits.length === 0 ? (
              <div className="flex items-center gap-2">
                <SemaforoBadge status="verde" compact />
                <span className="text-[12px]">Nenhuma unidade parada</span>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-[10px] text-muted-foreground mb-3 leading-tight">
                  Zero lançamentos e zero propostas detectadas no mês atual:
                </p>
                {criticalUnits.slice(0, 5).map((u) => (
                  <div key={u.id} className="flex items-center justify-between gap-2">
                    <span className="text-[12px] font-medium text-destructive truncate">{u.name}</span>
                    <SemaforoBadge status="vermelho" compact />
                  </div>
                ))}
                {criticalUnits.length > 5 && (
                  <p className="text-[10px] text-muted-foreground text-center pt-2">
                    + {criticalUnits.length - 5} unidades
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {hasData && projecaoReceita < goals.metaReceitaTotal && (
        <div className="kpi-card border-destructive/25 bg-destructive/5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-destructive/15 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-destructive" />
          </div>
          <div>
            <p className="font-semibold text-destructive text-sm">Risco de não bater a meta</p>
            <p className="text-[11px] text-muted-foreground mt-0.5 tabular">
              Projeção: {formatCurrency(projecaoReceita)} — Gap: {formatCurrency(goals.metaReceitaTotal - projecaoReceita)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
