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
        <div className={`kpi-card relative overflow-hidden group ${isLarge ? "p-8" : isCompact ? "p-4" : "p-6"}`}>
          {/* Left accent stripe */}
          {semaforo && (
            <div className={`absolute top-3 bottom-3 left-0 w-[3px] rounded-r-full ${getSemaforoBgClass(semaforo)}`} />
          )}

          <div className="relative">
            {/* Header row: label + badge */}
            <div className="flex items-start justify-between gap-2 mb-3">
              <p className="kpi-label">{label}</p>
              {semaforo && (
                <SemaforoBadge status={semaforo} compact />
              )}
            </div>

            {/* Value */}
            <p className={`tabular font-bold tracking-tight leading-none ${
              isLarge ? "text-[36px]" : isCompact ? "text-lg" : "text-[28px]"
            }`}>
              {displayValue}
            </p>

            {/* Meta + progress */}
            {meta !== undefined && meta > 0 && (
              <div className="mt-4 space-y-2.5">
                {/* Meta info row */}
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">
                    Meta: {format === "currency" ? formatCurrency(meta) : formatNumber(meta)}
                  </span>
                  <span className={`text-[11px] font-semibold tabular ${getSemaforoColorClass(semaforo || "vermelho")}`}>
                    {formatPercent(pctMeta)}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="progress-track">
                  <div
                    className={`progress-fill ${getSemaforoBgClass(semaforo || "vermelho")}`}
                    style={{ width: `${Math.min(pctMeta * 100, 100)}%` }}
                  />
                </div>

                {/* Gap row */}
                {value > 0 && (
                  <div className="flex items-center gap-1.5">
                    {gap >= 0 ? (
                      <ArrowUpRight className="w-3 h-3 semaforo-verde" />
                    ) : (
                      <ArrowDownRight className="w-3 h-3 semaforo-vermelho" />
                    )}
                    <span className={`text-[11px] font-medium tabular ${gap >= 0 ? "semaforo-verde" : "semaforo-vermelho"}`}>
                      {format === "currency" ? formatCurrency(Math.abs(gap)) : formatNumber(Math.abs(gap))}
                      {gap >= 0 ? " acima" : " abaixo"} do ideal
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
