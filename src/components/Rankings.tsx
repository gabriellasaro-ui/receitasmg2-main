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
import { Trophy, Crown, Medal } from "lucide-react";

function MemberAvatar({ name, avatarUrl, className }: { name: string; avatarUrl?: string | null; className?: string }) {
  if (avatarUrl) {
    return (
      <div className={`rounded-full overflow-hidden flex items-center justify-center bg-secondary/80 border border-border/40 shrink-0 ${className}`}>
        <img
          src={avatarUrl}
          alt={name}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      </div>
    );
  }

  const initials = name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  return (
    <div className={`rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-[11px] shrink-0 ${className}`}>
      {initials}
    </div>
  );
}

function PodiumBlock({ rank, name, avatarUrl, mainValue, isFirst }: { rank: number; name: string; avatarUrl?: string; mainValue: string; isFirst?: boolean }) {
  const heightClass = isFirst ? "h-64 sm:h-72" : rank === 2 ? "h-48 sm:h-56" : "h-36 sm:h-44";
  const positionLabel = rank === 1 ? "1º" : rank === 2 ? "2º" : "3º";

  return (
    <div className="flex flex-col items-center group flex-1 max-w-[180px] sm:max-w-[220px]">
      <div className="relative mb-6 group-hover:scale-110 transition-transform duration-500 z-10">
        <MemberAvatar
          name={name}
          avatarUrl={avatarUrl}
          className={`shrink-0 shadow-[0_20px_50px_rgba(0,0,0,0.2)] ${isFirst ? "w-28 h-28 sm:w-36 sm:h-36 border-[6px] border-amber-400" : "w-20 h-20 sm:w-28 sm:h-28 border-4 border-white/40"}`}
        />
        {isFirst && (
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 animate-float">
            <Crown className="w-14 h-14 text-amber-500 fill-amber-500 drop-shadow-2xl" />
          </div>
        )}
      </div>

      <div className={`w-full ${heightClass} glass-panel ${rank === 1 ? "rank-gold shadow-[0_0_50px_rgba(255,157,0,0.4)]" : rank === 2 ? "rank-silver shadow-xl" : "rank-bronze shadow-lg"} rounded-t-[2.5rem] flex flex-col items-center justify-center border-b-0 shadow-2xl relative animate-fadeIn transition-all duration-300 group-hover:brightness-110`}>
        <span className={`text-5xl sm:text-7xl font-black ${isFirst ? "text-white/20" : "text-white/10"} absolute top-4`}>{rank}</span>
        <div className="absolute bottom-8 w-full px-4 text-center">
          <p className={`font-black text-white truncate uppercase tracking-tight drop-shadow-md ${isFirst ? "text-base sm:text-xl" : "text-sm sm:text-base"}`}>{name.split(' ')[0]}</p>
          <p className={`font-black text-white/90 tabular drop-shadow-sm ${isFirst ? "text-lg sm:text-2xl mt-1" : "text-base sm:text-xl"}`}>{mainValue}</p>
        </div>
      </div>
    </div>
  );
}

function RankingSection({ title, subtitle, data, type }: { title: string; subtitle: string; data: any[]; type: 'closer' | 'pv' }) {
  const isCloser = type === 'closer';
  const others = data.slice(3, 10);

  return (
    <div className="space-y-12 animate-fadeIn pb-12">
      <div className="text-center space-y-2">
        <h3 className="text-3xl font-black tracking-tighter flex items-center justify-center gap-3">
          <Trophy className="w-8 h-8 text-primary" /> {title}
        </h3>
        <p className="text-sm text-muted-foreground font-bold uppercase tracking-widest opacity-60">{subtitle}</p>
      </div>

      <div className="flex flex-col xl:flex-row items-stretch gap-12">
        {/* Podium Area */}
        <div className="flex-1 flex justify-center items-end gap-3 sm:gap-6 pt-16 px-4">
          {data.length >= 2 && data[1] && (
            <PodiumBlock rank={2} name={data[1].fullName} avatarUrl={data[1].avatarUrl} mainValue={isCloser ? formatCurrency(data[1].faturamento) : `${data[1].callsRealizadas} calls`} />
          )}
          {data.length >= 1 && data[0] && (
            <PodiumBlock rank={1} isFirst name={data[0].fullName} avatarUrl={data[0].avatarUrl} mainValue={isCloser ? formatCurrency(data[0].faturamento) : `${data[0].callsRealizadas} calls`} />
          )}
          {data.length >= 3 && data[2] && (
            <PodiumBlock rank={3} name={data[2].fullName} avatarUrl={data[2].avatarUrl} mainValue={isCloser ? formatCurrency(data[2].faturamento) : `${data[2].callsRealizadas} calls`} />
          )}
        </div>

        {/* List Area */}
        {others.length > 0 && (
          <div className="xl:w-[450px] flex flex-col justify-center">
            <div className="glass-panel rounded-[2rem] overflow-hidden border-border/10 shadow-2xl">
              <div className="bg-secondary/20 px-8 py-5 border-b border-border/20">
                <span className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Colocações de Honra (#4 a #10)</span>
              </div>
              <div className="divide-y divide-border/20">
                {others.map((r, i) => (
                  <div key={r.userId} className="flex items-center gap-5 px-8 py-4 hover:bg-primary/5 transition-all group cursor-pointer">
                    <span className="text-sm font-black text-muted-foreground/30 w-8">#{i + 4}</span>
                    <MemberAvatar name={r.fullName} avatarUrl={r.avatarUrl} className="w-10 h-10 border-2 border-border/20" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black truncate group-hover:text-primary transition-colors">{r.fullName}</p>
                      <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-tighter opacity-60">
                        {isCloser ? `${r.contratos} contratos` : `${r.callsMarcadas} marcadas`}
                      </p>
                    </div>
                    <span className="text-sm font-black tabular text-primary">
                      {isCloser ? formatCurrency(r.faturamento) : r.callsRealizadas}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function RankingClosers() {
  const { getCloserAcumulado, getPvAcumulado } = useDashboardStore();
  const { closers, preVendas } = useUnitData();

  const rankedClosers = closers
    .map((c) => {
      const ac = getCloserAcumulado(c.userId);
      return { ...c, ...ac };
    })
    .sort((a, b) => b.faturamento - a.faturamento);

  const rankedPV = preVendas
    .map((p) => {
      const ac = getPvAcumulado(p.userId);
      return { ...p, ...ac };
    })
    .sort((a, b) => b.callsRealizadas - a.callsRealizadas);

  return (
    <div className="space-y-32">
      <RankingSection
        title="Ranking de Vendas (Closers)"
        subtitle="Performance baseada em faturamento líquido acumulado"
        data={rankedClosers}
        type="closer"
      />
      <RankingSection
        title="Ranking de Conexão (Pré-Vendas)"
        subtitle="Performance baseada em reuniões realizadas (RR)"
        data={rankedPV}
        type="pv"
      />
    </div>
  );
}

export function RankingPreVendas() {
  return null; // Integrated into RankingClosers to ensure stacking
}
