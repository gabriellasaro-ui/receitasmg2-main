import { useDashboardStore } from "@/data/store";
import { useUnitData } from "@/hooks/useUnitData";
import {
  getDiaUtilAtual,
  formatCurrency,
  formatPercent,
  getSemaforoStatus,
  getSemaforoBgClass,
} from "@/data/seedData";
import { SemaforoBadge } from "./SemaforoBadge";

function MemberAvatar({ name, className }: { name: string; className?: string }) {
  const initials = name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  return (
    <div className={`rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-[13px] ${className}`}>
      {initials}
    </div>
  );
}

function MetricCell({ label, value, highlight, muted }: { label: string; value: string; highlight?: boolean; muted?: boolean }) {
  return (
    <div className="space-y-1">
      <p className="kpi-label text-[10px]">{label}</p>
      <p className={`tabular font-semibold text-[14px] ${highlight ? "semaforo-vermelho" : muted ? "text-muted-foreground" : ""}`}>
        {value}
      </p>
    </div>
  );
}

export function PersonView() {
  const { getCloserAcumulado, getPvAcumulado, goals } = useDashboardStore();
  const { closers, preVendas } = useUnitData();
  const diaAtual = getDiaUtilAtual();

  return (
    <div className="space-y-10">
      {/* Closers */}
      <div>
        <div className="mb-5">
          <h1 className="text-2xl font-bold tracking-tight">Visão por Pessoa</h1>
          <p className="text-sm text-muted-foreground mt-1">Métricas individuais de performance</p>
        </div>

        <p className="section-title mb-4">Closers</p>
        {closers.length === 0 ? (
          <div className="kpi-card text-center py-8">
            <p className="text-sm text-muted-foreground">Nenhum closer cadastrado na unidade.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {closers.map((c) => {
              const ac = getCloserAcumulado(c.userId);
              const conversao = ac.calls > 0 ? ac.contratos / ac.calls : 0;

              return (
                <div key={c.userId} className="kpi-card relative overflow-hidden">
                  <div className="flex items-center gap-4 mb-5">
                    <MemberAvatar name={c.fullName} className="w-12 h-12" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[15px]">{c.fullName}</p>
                      <span className="text-[11px] text-muted-foreground">{c.email}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-x-5 gap-y-4">
                    <MetricCell label="Faturamento" value={formatCurrency(ac.faturamento)} />
                    <MetricCell label="Recorrente" value={formatCurrency(ac.recorrente)} />
                    <MetricCell label="One-Time" value={formatCurrency(ac.onetime)} />
                    <MetricCell label="Contratos" value={String(ac.contratos)} />
                    <MetricCell label="Calls" value={String(ac.calls)} />
                    <MetricCell label="Propostas" value={String(ac.propostas)} />
                    <MetricCell label="Conversão" value={formatPercent(conversao)} />
                    <MetricCell label="No Show" value={String(ac.noShow)} muted />
                    <MetricCell label="Churn M0" value={formatCurrency(ac.churnM0)} highlight={ac.churnM0 > 0} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pré-Vendas */}
      <div>
        <p className="section-title mb-4">Pré-Vendas</p>
        {preVendas.length === 0 ? (
          <div className="kpi-card text-center py-8">
            <p className="text-sm text-muted-foreground">Nenhum SDR cadastrado na unidade.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {preVendas.map((p) => {
              const ac = getPvAcumulado(p.userId);
              const showRate = ac.callsMarcadas > 0 ? ac.callsRealizadas / ac.callsMarcadas : 0;

              return (
                <div key={p.userId} className="kpi-card relative overflow-hidden">
                  <div className="flex items-center gap-4 mb-5">
                    <MemberAvatar name={p.fullName} className="w-12 h-12" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[15px]">{p.fullName}</p>
                      <span className="text-[11px] text-muted-foreground">{p.email}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-x-5 gap-y-4">
                    <MetricCell label="Marcadas" value={String(ac.callsMarcadas)} />
                    <MetricCell label="Realizadas" value={String(ac.callsRealizadas)} />
                    <MetricCell label="Show Rate" value={formatPercent(showRate)} />
                    <MetricCell label="No Show" value={String(ac.noShow)} muted />
                    <MetricCell label="Reagend." value={String(ac.reagendamentos)} muted />
                    <MetricCell label="Contratos" value={String(ac.contratos)} />
                    <MetricCell label="Faturamento" value={formatCurrency(ac.faturamento)} />
                    <MetricCell label="Recorrente" value={formatCurrency(ac.recorrente)} />
                    <MetricCell label="Churn M0" value={formatCurrency(ac.churnM0)} highlight={ac.churnM0 > 0} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
