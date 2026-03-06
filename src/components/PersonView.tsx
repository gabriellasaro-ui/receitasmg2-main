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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter, Users } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

function MemberAvatar({ name, avatarUrl, className }: { name: string; avatarUrl?: string | null; className?: string }) {
  const [error, setError] = useState(false);

  if (avatarUrl && !error) {
    return (
      <div className={`rounded-full overflow-hidden flex items-center justify-center bg-secondary/80 border border-border/40 shrink-0 ${className}`}>
        <img
          src={avatarUrl}
          alt={name}
          className="w-full h-full object-cover"
          onError={() => setError(true)}
        />
      </div>
    );
  }

  const initials = name.split(" ").filter(n => n).map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  return (
    <div className={`rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-[13px] shrink-0 ${className}`}>
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
  const { isAdmin, profile } = useAuth();
  const [selectedUnitId, setSelectedUnitId] = useState<string>("all");
  const [unitsList, setUnitsList] = useState<{ id: string; name: string }[]>([]);

  const { closers, preVendas, loading } = useUnitData(selectedUnitId);
  const diaAtual = getDiaUtilAtual();

  useEffect(() => {
    if (!isAdmin) return;
    supabase.from("units").select("id, name").order("name").then(({ data }) => {
      if (data) setUnitsList(data);
    });
  }, [isAdmin]);

  return (
    <div className="space-y-10">
      {/* Closers */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Users className="w-6 h-6 text-primary" />
              Visão por Pessoa
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Métricas individuais de performance</p>
          </div>

          {/* Filtro de unidade — admin */}
          {isAdmin && unitsList.length > 0 && (
            <div className="flex items-center gap-3">
              <Select
                value={selectedUnitId || "all"}
                onValueChange={(v) => setSelectedUnitId(v === "all" ? "all" : v)}
              >
                <SelectTrigger className="filter-pill w-[260px] border-0 shadow-lg shadow-black/5 focus:ring-0 focus:ring-offset-0 h-11 rounded-full px-5 gap-3">
                  <Filter className="filter-icon-red shrink-0 w-4 h-4" />
                  <SelectValue placeholder="Selecionar unidade" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border border-border/60 shadow-2xl shadow-black/10 backdrop-blur-sm bg-white/95 dark:bg-card/95 mt-1">
                  <SelectItem value="all" className="rounded-xl font-semibold text-sm cursor-pointer">
                    Time Completo (Brasil)
                  </SelectItem>
                  {unitsList.map((u) => (
                    <SelectItem key={u.id} value={u.id} className="rounded-xl text-sm cursor-pointer">
                      {u.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
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
                <div key={c.userId} className="group relative glass-panel rounded-3xl p-6 border-white/10 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 overflow-hidden">
                  {/* Subtle Shine */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none">
                    <div className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-[-20deg] animate-shine" />
                  </div>
                  <div className="flex items-center gap-4 mb-5">
                    <MemberAvatar name={c.fullName} avatarUrl={c.avatarUrl} className="w-12 h-12 shrink-0 border-2 border-white/20 shadow-lg group-hover:scale-110 transition-transform" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[15px] group-hover:text-primary transition-colors">{c.fullName}</p>
                      <span className="text-[11px] text-muted-foreground font-medium opacity-60">{c.email}</span>
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
                <div key={p.userId} className="group relative glass-panel rounded-3xl p-6 border-white/10 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 overflow-hidden">
                  {/* Subtle Shine */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none">
                    <div className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-[-20deg] animate-shine" />
                  </div>
                  <div className="flex items-center gap-4 mb-5">
                    <MemberAvatar name={p.fullName} avatarUrl={p.avatarUrl} className="w-12 h-12 shrink-0 border-2 border-white/20 shadow-lg group-hover:scale-110 transition-transform" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[15px] group-hover:text-primary transition-colors">{p.fullName}</p>
                      <span className="text-[11px] text-muted-foreground font-medium opacity-60">{p.email}</span>
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
