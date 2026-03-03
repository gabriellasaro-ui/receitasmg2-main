import { useDashboardStore } from "@/data/store";
import { formatCurrency, getDiaUtilAtual, calcIdealDia } from "@/data/seedData";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { Activity } from "lucide-react";

export function RevenueChart() {
  const { goals, closerSubmissions, pvSubmissions } = useDashboardStore();
  const diaAtual = getDiaUtilAtual();
  const hasData = closerSubmissions.length > 0 || pvSubmissions.length > 0;

  const dailyData: { dia: number; realizado: number; ideal: number }[] = [];
  let acumulado = 0;

  for (let d = 1; d <= goals.diasUteisTotal; d++) {
    const ideal = calcIdealDia(goals.metaReceitaTotal, d, goals.diasUteisTotal);
    if (d <= diaAtual && hasData) {
      const dateStr = `2026-03-${String(d + 1).padStart(2, "0")}`;
      const pvDia = pvSubmissions.filter((s) => s.dataReferencia === dateStr).reduce((a, s) => a + s.valorContratoTotal, 0);
      const clDia = closerSubmissions.filter((s) => s.dataReferencia === dateStr).reduce((a, s) => a + s.valorContratoTotal, 0);
      acumulado += pvDia + clDia;
      dailyData.push({ dia: d, realizado: acumulado, ideal });
    } else {
      dailyData.push({ dia: d, realizado: 0, ideal });
    }
  }

  return (
    <div className="kpi-card">
      <div className="flex items-center justify-between mb-6">
        <p className="section-title">Faturamento Acumulado vs Ideal</p>
        {hasData && (
          <span className="text-[11px] text-muted-foreground tabular">
            Meta: {formatCurrency(goals.metaReceitaTotal)}
          </span>
        )}
      </div>
      {!hasData ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Activity className="w-8 h-8 mb-3 opacity-20" />
          <p className="text-sm">Aguardando lançamentos</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={dailyData}>
            <defs>
              <linearGradient id="colorRealizado" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(0, 80%, 48%)" stopOpacity={0.25} />
                <stop offset="100%" stopColor="hsl(0, 80%, 48%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorIdeal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(152, 56%, 42%)" stopOpacity={0.1} />
                <stop offset="100%" stopColor="hsl(152, 56%, 42%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 12%)" vertical={false} />
            <XAxis
              dataKey="dia"
              stroke="hsl(0, 0%, 35%)"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `D${v}`}
            />
            <YAxis
              stroke="hsl(0, 0%, 35%)"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              width={40}
            />
            <ReferenceLine x={diaAtual} stroke="hsl(0, 0%, 25%)" strokeDasharray="3 3" label={{ value: "Hoje", fill: "hsl(0, 0%, 45%)", fontSize: 10 }} />
            <Tooltip
              contentStyle={{
                background: "hsl(0, 0%, 7%)",
                border: "1px solid hsl(0, 0%, 15%)",
                borderRadius: "12px",
                color: "hsl(0, 0%, 95%)",
                fontSize: 12,
                padding: "12px 16px",
              }}
              formatter={(v: number, name: string) => [formatCurrency(v), name === "realizado" ? "Realizado" : "Ideal"]}
              labelFormatter={(l) => `Dia útil ${l}`}
            />
            <Area type="monotone" dataKey="ideal" stroke="hsl(152, 56%, 42%)" fill="url(#colorIdeal)" strokeWidth={1.5} strokeDasharray="6 3" />
            <Area type="monotone" dataKey="realizado" stroke="hsl(0, 80%, 48%)" fill="url(#colorRealizado)" strokeWidth={2.5} />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
