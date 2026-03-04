import { TrendingUp, TrendingDown, Minus, ArrowUpRight, ArrowDownRight } from "lucide-react";
import {
  formatCurrency,
  formatPercent,
  formatNumber,
  calcIdealDia,
  calcPctIdeal,
  getSemaforoStatus,
  getSemaforoColorClass,
  getSemaforoBgClass,
  getSemaforoLabel,
  getDiaUtilAtual,
  SemaforoStatus,
} from "@/data/seedData";
import { SemaforoBadge } from "./SemaforoBadge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface KpiCardProps {
  label: string;
  value: number;
  meta?: number;
  format?: "currency" | "percent" | "number";
  diasUteisTotal?: number;
  size?: "default" | "large" | "compact";
  invertSemaforo?: boolean;
}

export function KpiCard({
  label,
  value,
  meta,
  format = "number",
  diasUteisTotal = 22,
  size = "default",
  invertSemaforo = false,
}: KpiCardProps) {
  const diaAtual = getDiaUtilAtual();
  const idealDia = meta ? calcIdealDia(meta, diaAtual, diasUteisTotal) : 0;
  const pctIdeal = idealDia > 0 ? calcPctIdeal(value, idealDia) : 0;
  const semaforo: SemaforoStatus | null = meta && value > 0
    ? (invertSemaforo ? getSemaforoStatus(meta > 0 ? (1 - (value / meta)) + 1 : 1) : getSemaforoStatus(pctIdeal))
    : null;
  const pctMeta = meta && meta > 0 ? value / meta : 0;
  const gap = meta ? value - idealDia : 0;

  const displayValue =
    format === "currency" ? formatCurrency(value)
      : format === "percent" ? formatPercent(value)
        : formatNumber(value);

  const isLarge = size === "large";
  const isCompact = size === "compact";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={`group relative glass-panel rounded-3xl border-white/10 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 overflow-hidden animate-fadeIn ${isLarge ? "p-8" : isCompact ? "p-4" : "p-6"}`}>
          {/* Subtle Shine Effect on Hover */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none">
            <div className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-[-20deg] animate-shine" />
          </div>

          {/* Left accent stripe (Semáforo) */}
          {semaforo && (
            <div className={`absolute top-4 bottom-4 left-0 w-[4px] rounded-r-full ${getSemaforoBgClass(semaforo)} opacity-80`} />
          )}

          <div className="relative z-10">
            {/* Header row: label + badge */}
            <div className="flex items-start justify-between gap-2 mb-4">
              <p className="kpi-label opacity-60 group-hover:opacity-100 transition-opacity">{label}</p>
              {semaforo && (
                <SemaforoBadge status={semaforo} compact />
              )}
            </div>

            {/* Value */}
            <p className={`tabular font-semibold tracking-tighter leading-none group-hover:scale-[1.02] transition-transform duration-500 origin-left ${isLarge ? "text-4xl sm:text-5xl" : isCompact ? "text-xl" : "text-3xl"
              }`}>
              {displayValue}
            </p>

            {/* Meta + progress */}
            {meta !== undefined && meta > 0 && (
              <div className="mt-6 space-y-3">
                {/* Meta info row */}
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-muted-foreground/60">
                    Meta: <span className="text-foreground/70">{format === "currency" ? formatCurrency(meta) : formatNumber(meta)}</span>
                  </span>
                  <span className={`text-[11px] font-semibold tabular ${getSemaforoColorClass(semaforo || "vermelho")}`}>
                    {formatPercent(pctMeta)}
                  </span>
                </div>

                {/* Progress bar (Custom styling) */}
                <div className="h-1.5 w-full bg-secondary/30 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ease-out ${getSemaforoBgClass(semaforo || "vermelho")} ${semaforo === "vermelho" || !semaforo ? "progress-glow" : ""}`}
                    style={{ width: `${Math.min(pctMeta * 100, 100)}%` }}
                  />
                </div>

                {/* Gap row */}
                {value > 0 && (
                  <div className="flex items-center gap-1.5 pt-1">
                    <div className={`flex items-center justify-center w-4 h-4 rounded-full ${gap >= 0 ? "bg-semaforo-verde/10" : "bg-semaforo-vermelho/10"}`}>
                      {gap >= 0 ? (
                        <ArrowUpRight className="w-2.5 h-2.5 semaforo-verde" />
                      ) : (
                        <ArrowDownRight className="w-2.5 h-2.5 semaforo-vermelho" />
                      )}
                    </div>
                    <span className={`text-[11px] font-semibold tabular ${gap >= 0 ? "semaforo-verde" : "semaforo-vermelho"}`}>
                      {format === "currency" ? formatCurrency(Math.abs(gap)) : formatNumber(Math.abs(gap))}
                      <span className="opacity-60 font-medium font-sans"> {gap >= 0 ? "acima" : "abaixo"} do ideal</span>
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </TooltipTrigger>
      {meta !== undefined && meta > 0 && (
        <TooltipContent side="bottom" className="max-w-[240px] text-xs">
          <div className="space-y-1">
            <p><strong>Ideal dia {diaAtual}:</strong> {format === "currency" ? formatCurrency(idealDia) : idealDia.toFixed(1)}</p>
            <p><strong>% do ideal:</strong> {formatPercent(pctIdeal)}</p>
            <p><strong>Gap:</strong> {format === "currency" ? formatCurrency(gap) : gap.toFixed(1)}</p>
            <p className="text-muted-foreground pt-1">Pace = (dia útil ÷ {diasUteisTotal}) × meta</p>
          </div>
        </TooltipContent>
      )}
    </Tooltip>
  );
}
