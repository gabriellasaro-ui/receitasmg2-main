import { useDashboardStore } from "@/data/store";
import { getDiaUtilAtual, formatPercent, calcIdealDia, calcPctIdeal, getSemaforoStatus, getSemaforoColorClass, getSemaforoBgClass, getSemaforoLabel } from "@/data/seedData";
import { SemaforoBadge } from "./SemaforoBadge";
import { useAuth } from "@/hooks/useAuth";

export function FunnelChart() {
  const { goals, getTotais } = useDashboardStore();
  const totais = getTotais();
  const diaAtual = getDiaUtilAtual();

  const { isAdmin } = useAuth();
  const steps = [
    ...(isAdmin ? [] : [{ label: "Leads / RM", value: totais.rm, meta: goals.metaRM }]),
    { label: "Reuniões Realizadas", value: totais.rr, meta: goals.metaRR },
    { label: "Contratos", value: totais.contratos, meta: goals.metaContratos },
  ];

  const maxMeta = Math.max(...steps.map((s) => s.meta));

  return (
    <div className="kpi-card">
      <p className="section-title mb-6">Funil de Vendas</p>
      <div className="space-y-5">
        {steps.map((step, i) => {
          const pct = step.meta > 0 ? step.value / step.meta : 0;
          const idealDia = calcIdealDia(step.meta, diaAtual, 22);
          const pctIdeal = calcPctIdeal(step.value, idealDia);
          const semaforo = step.value > 0 ? getSemaforoStatus(pctIdeal) : null;
          const widthPct = (step.meta / maxMeta) * 100;
          const conversion = i > 0 && steps[i - 1].value > 0
            ? step.value / steps[i - 1].value
            : null;

          return (
            <div key={step.label}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-medium">{step.label}</span>
                  {semaforo && <SemaforoBadge status={semaforo} compact />}
                </div>
                <span className="text-[12px] tabular text-muted-foreground">
                  <span className="font-semibold text-foreground">{step.value}</span>
                  <span className="mx-1">/</span>
                  <span>{step.meta}</span>
                  {step.value > 0 && (
                    <span className={`ml-2 font-semibold ${getSemaforoColorClass(semaforo || "vermelho")}`}>
                      {formatPercent(pct)}
                    </span>
                  )}
                </span>
              </div>
              <div className="relative" style={{ width: `${widthPct}%` }}>
                <div className="w-full rounded-lg overflow-hidden" style={{ background: "hsl(var(--v4-surface))", height: "28px" }}>
                  <div
                    className={`h-full rounded-lg transition-all duration-700 flex items-center justify-end pr-3 ${semaforo ? getSemaforoBgClass(semaforo) : "bg-secondary/30"
                      }`}
                    style={{ width: `${Math.min(pct * 100, 100)}%`, opacity: 0.7 }}
                  >
                    {step.value > 0 && (
                      <span className="text-[10px] font-bold text-white tabular">{formatPercent(pctIdeal)} pace</span>
                    )}
                  </div>
                </div>
              </div>
              {conversion !== null && conversion > 0 && (
                <p className="text-[10px] text-muted-foreground mt-1 ml-1">
                  Taxa de conversão: <span className="font-medium text-foreground tabular">{formatPercent(conversion)}</span>
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
