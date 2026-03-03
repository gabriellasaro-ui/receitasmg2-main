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
import { Trophy } from "lucide-react";

function MemberAvatar({ name, className }: { name: string; className?: string }) {
  const initials = name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  return (
    <div className={`rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-[11px] ${className}`}>
      {initials}
    </div>
  );
}

function PodiumCard({ rank, name, mainValue, mainLabel, pctIdeal, semaforo, secondaryLabel, secondaryValue }: {
  rank: number; name: string; mainValue: string; mainLabel: string;
  pctIdeal: number; semaforo: ReturnType<typeof getSemaforoStatus> | null;
  secondaryLabel: string; secondaryValue: string;
}) {
  const isFirst = rank === 1;
  return (
    <div className={`kpi-card flex flex-col items-center text-center relative ${
      isFirst ? "border-primary/30 ring-1 ring-primary/10 p-6" : "p-5"
    }`}>
      <div className={`absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${
        rank === 1 ? "bg-primary text-primary-foreground" : rank === 2 ? "bg-secondary text-foreground" : "bg-secondary text-muted-foreground"
      }`}>
        {rank}
      </div>
      <MemberAvatar name={name} className={`mt-1 ${isFirst ? "w-14 h-14" : "w-11 h-11"}`} />
      <p className={`font-semibold mt-3 ${isFirst ? "text-sm" : "text-[13px]"}`}>{name}</p>
      <p className={`tabular font-bold mt-1 ${isFirst ? "text-lg" : "text-base"}`}>{mainValue}</p>
      <p className="text-[10px] text-muted-foreground">{mainLabel}</p>
      {semaforo && (
        <div className="mt-2">
          <SemaforoBadge status={semaforo} pctIdeal={pctIdeal} compact />
        </div>
      )}
      <div className="mt-2 text-[10px] text-muted-foreground">
        {secondaryLabel}: <span className="font-medium text-foreground">{secondaryValue}</span>
      </div>
    </div>
  );
}

function RankRow({ rank, name, mainValue, pctIdeal, semaforo, meta, secondaryInfo }: {
  rank: number; name: string; mainValue: string;
  pctIdeal: number; semaforo: ReturnType<typeof getSemaforoStatus> | null; meta: number;
  secondaryInfo: string;
}) {
  const pctMeta = meta > 0 ? pctIdeal : 0;
  return (
    <div className="table-row-v4 flex items-center gap-3 px-5 py-3">
      <span className="text-[13px] font-bold text-muted-foreground tabular w-5 text-center shrink-0">{rank}</span>
      <MemberAvatar name={name} className="w-9 h-9 shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="font-medium text-[13px] truncate">{name}</p>
          {semaforo && <SemaforoBadge status={semaforo} compact />}
        </div>
        <div className="flex items-center gap-3 mt-1">
          <span className="text-[12px] tabular font-semibold">{mainValue}</span>
          <span className="text-[10px] text-muted-foreground">{secondaryInfo}</span>
        </div>
        {meta > 0 && (
          <div className="progress-track mt-2">
            <div
              className={`progress-fill ${getSemaforoBgClass(semaforo || "vermelho")}`}
              style={{ width: `${Math.min(pctMeta * 100, 100)}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export function RankingClosers() {
  const { getCloserAcumulado, goals } = useDashboardStore();
  const { closers } = useUnitData();
  const diaAtual = getDiaUtilAtual();

  const ranked = closers
    .map((c) => {
      const ac = getCloserAcumulado(c.userId);
      const pctIdeal = ac.faturamento > 0 ? ac.faturamento / (ac.faturamento + 1) : 0; // simplified since no individual goal
      const semaforo = ac.faturamento > 0 ? getSemaforoStatus(pctIdeal > 0 ? 1 : 0) : null;
      return { ...c, ...ac, pctIdeal, semaforo };
    })
    .sort((a, b) => b.faturamento - a.faturamento);

  const hasAnyData = ranked.some((r) => r.faturamento > 0);

  return (
    <div className="space-y-4">
      <h3 className="section-title flex items-center gap-2">
        <Trophy className="w-3.5 h-3.5 text-primary" /> Ranking Closers
      </h3>

      {closers.length === 0 && (
        <div className="kpi-card text-center py-8">
          <p className="text-sm text-muted-foreground">Nenhum closer cadastrado na unidade.</p>
        </div>
      )}

      {hasAnyData && ranked.length >= 3 && (
        <div className="grid grid-cols-3 gap-2">
          {ranked.slice(0, 3).map((r, i) => (
            <PodiumCard
              key={r.userId}
              rank={i + 1}
              name={r.fullName}
              mainValue={formatCurrency(r.faturamento)}
              mainLabel="faturamento"
              pctIdeal={r.pctIdeal}
              semaforo={r.semaforo}
              secondaryLabel="Contratos"
              secondaryValue={String(r.contratos)}
            />
          ))}
        </div>
      )}

      {ranked.length > 0 && (
        <div className="kpi-card p-0 overflow-hidden">
          {ranked.map((r, i) => (
            <RankRow
              key={r.userId}
              rank={i + 1}
              name={r.fullName}
              mainValue={formatCurrency(r.faturamento)}
              pctIdeal={r.pctIdeal}
              semaforo={r.semaforo}
              meta={0}
              secondaryInfo={`${r.contratos} contratos · ${r.propostas} propostas`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function RankingPreVendas() {
  const { getPvAcumulado, goals } = useDashboardStore();
  const { preVendas } = useUnitData();
  const diaAtual = getDiaUtilAtual();

  const ranked = preVendas
    .map((p) => {
      const ac = getPvAcumulado(p.userId);
      const semaforo = ac.callsRealizadas > 0 ? getSemaforoStatus(1) : null;
      return { ...p, ...ac, pctIdeal: 0, semaforo };
    })
    .sort((a, b) => b.callsRealizadas - a.callsRealizadas);

  const hasAnyData = ranked.some((r) => r.callsRealizadas > 0);

  return (
    <div className="space-y-4">
      <h3 className="section-title flex items-center gap-2">
        <Trophy className="w-3.5 h-3.5 text-primary" /> Ranking Pré-Vendas
      </h3>

      {preVendas.length === 0 && (
        <div className="kpi-card text-center py-8">
          <p className="text-sm text-muted-foreground">Nenhum SDR cadastrado na unidade.</p>
        </div>
      )}

      {hasAnyData && ranked.length >= 2 && (
        <div className="grid grid-cols-2 gap-2">
          {ranked.slice(0, 2).map((r, i) => (
            <PodiumCard
              key={r.userId}
              rank={i + 1}
              name={r.fullName}
              mainValue={`${r.callsRealizadas} calls`}
              mainLabel="realizadas"
              pctIdeal={r.pctIdeal}
              semaforo={r.semaforo}
              secondaryLabel="Marcadas"
              secondaryValue={String(r.callsMarcadas)}
            />
          ))}
        </div>
      )}

      {ranked.length > 0 && (
        <div className="kpi-card p-0 overflow-hidden">
          {ranked.map((r, i) => (
            <RankRow
              key={r.userId}
              rank={i + 1}
              name={r.fullName}
              mainValue={`${r.callsRealizadas} realizadas`}
              pctIdeal={r.pctIdeal}
              semaforo={r.semaforo}
              meta={0}
              secondaryInfo={`${r.callsMarcadas} marcadas · ${r.noShow} no show`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
