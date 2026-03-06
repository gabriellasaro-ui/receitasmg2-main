import { useDashboardStore } from "@/data/store";
import { useUnitData } from "@/hooks/useUnitData";
import { useState } from "react";
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
    <div className={`rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0 shadow-inner ${className}`}>
      <span className={className?.includes("w-40") ? "text-4xl" : "text-xl"}>{initials}</span>
    </div>
  );
}

function PodiumBlock({ rank, name, avatarUrl, mainValue, isFirst }: { rank: number; name: string; avatarUrl?: string; mainValue: string; isFirst?: boolean }) {
  const heightClass = isFirst ? "h-64 sm:h-96" : rank === 2 ? "h-48 sm:h-80" : "h-40 sm:h-64";
  const positionLabel = rank === 1 ? "1º" : rank === 2 ? "2º" : "3º";

  return (
    <div className={`flex flex-col items-center group transition-all duration-500 ${isFirst ? "z-20 scale-110 -translate-y-4" : "z-10"}`}>
      <div className="relative mb-8 group-hover:scale-110 transition-transform duration-500 z-10">
        <MemberAvatar
          name={name}
          avatarUrl={avatarUrl}
          className={`shrink-0 shadow-[0_20px_50px_rgba(var(--primary),0.3)] ${isFirst ? "w-28 h-28 sm:w-40 sm:h-40 border-[8px] border-amber-400" : "w-20 h-20 sm:w-32 sm:h-32 border-4 border-white/40"}`}
        />
        {isFirst && (
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 animate-float">
            <Crown className="w-14 h-14 sm:w-16 sm:h-16 text-amber-500 fill-amber-500 drop-shadow-[0_0_20px_rgba(255,191,0,0.6)]" />
          </div>
        )}
      </div>

      <div className={`w-28 sm:w-40 lg:w-48 ${heightClass} glass-panel ${rank === 1 ? "rank-gold shadow-[0_0_60px_rgba(255,157,0,0.4)]" : rank === 2 ? "rank-silver shadow-2xl" : "rank-bronze shadow-lg"} rounded-t-[3.5rem] flex flex-col items-center justify-center border-b-0 shadow-2xl relative animation-shine-container animate-fadeIn transition-all duration-700 group-hover:brightness-110 group-hover:-translate-y-3`}>
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000">
          <div className="shine-overlay" />
        </div>
        <span className={`text-6xl sm:text-[100px] font-semibold ${isFirst ? "text-white/20" : "text-white/10"} absolute top-4 tracking-tighter select-none`}>{rank}</span>
        <div className="absolute bottom-8 w-full px-2 sm:px-4 text-center">
          <p className={`font-semibold text-white truncate uppercase tracking-tight drop-shadow-lg ${isFirst ? "text-base sm:text-2xl" : "text-xs sm:text-lg"}`}>{name.split(' ')[0]}</p>
          <p className={`font-semibold text-white/90 tabular drop-shadow-md ${isFirst ? "text-lg sm:text-3xl mt-2 tracking-tighter" : "text-sm sm:text-2xl mt-1"}`}>{mainValue}</p>
        </div>
      </div>
    </div>
  );
}

function RankingSection({ title, subtitle, data, type }: { title: string; subtitle: string; data: any[]; type: 'closer' | 'pv' }) {
  const isCloser = type === 'closer';
  const others = data.slice(3, 10);

  return (
    <div className="space-y-16 animate-fadeIn pb-12">
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-2">
          <Trophy className="w-8 h-8 text-primary" />
        </div>
        <div className="space-y-1">
          <h3 className="text-4xl sm:text-5xl font-semibold tracking-tighter">{title}</h3>
          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-[0.3em] opacity-40">{subtitle}</p>
        </div>
      </div>

      <div className="flex flex-col 2xl:flex-row items-center 2xl:items-end justify-center gap-12 2xl:gap-16 w-full max-w-7xl mx-auto">
        {/* Podium Area - Expanded */}
        <div className="flex justify-center items-end gap-2 sm:gap-6 lg:gap-8 pt-32 px-2 sm:px-4 w-full 2xl:w-auto overflow-x-auto pb-8 hide-scrollbar">
          {data.length >= 2 && data[1] && (
            <PodiumBlock rank={2} name={data[1].fullName} avatarUrl={data[1].avatarUrl} mainValue={isCloser ? formatCurrency(data[1].faturamento) : `${data[1].callsRealizadas} CR`} />
          )}
          {data.length >= 1 && data[0] && (
            <PodiumBlock rank={1} isFirst name={data[0].fullName} avatarUrl={data[0].avatarUrl} mainValue={isCloser ? formatCurrency(data[0].faturamento) : `${data[0].callsRealizadas} CR`} />
          )}
          {data.length >= 3 && data[2] && (
            <PodiumBlock rank={3} name={data[2].fullName} avatarUrl={data[2].avatarUrl} mainValue={isCloser ? formatCurrency(data[2].faturamento) : `${data[2].callsRealizadas} CR`} />
          )}
        </div>

        {/* Honor List Area - Sidebar style */}
        {others.length > 0 && (
          <div className="w-full max-w-[500px] 2xl:w-[420px] shrink-0">
            <div className="group relative glass-panel rounded-[3rem] overflow-hidden border-white/10 shadow-2xl transition-all duration-500 hover:shadow-primary/10 hover:border-primary/20">
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none">
                <div className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-primary/5 to-transparent skew-x-[-20deg] animate-shine" />
              </div>
              <div className="bg-primary/5 px-8 py-6 border-b border-border/10 flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">Quadro de Honra</span>
                <span className="text-[10px] font-bold text-muted-foreground/60">#4 ao #10</span>
              </div>
              <div className="divide-y divide-border/5">
                {others.map((r, i) => (
                  <div key={r.userId} className="flex items-center gap-5 px-8 py-5 hover:bg-white/5 transition-all group/item cursor-pointer">
                    <div className="relative">
                      <span className="text-[10px] font-semibold text-muted-foreground/30 absolute -left-4 top-1/2 -translate-y-1/2">#{i + 4}</span>
                      <MemberAvatar name={r.fullName} avatarUrl={r.avatarUrl} className="w-12 h-12 border-2 border-white/20 shadow-md group-hover/item:scale-110 group-hover/item:border-primary/50 transition-all duration-300" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate group-hover/item:text-primary transition-colors">{r.fullName}</p>
                      <p className="text-[10px] text-muted-foreground/60 font-medium uppercase tracking-tight">
                        {isCloser ? `${r.contratos} contratos` : `${r.callsMarcadas} calls marcadas`}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-semibold tabular text-foreground group-hover/item:text-primary transition-colors">
                        {isCloser ? formatCurrency(r.faturamento) : r.callsRealizadas}
                      </span>
                      <p className="text-[9px] font-semibold uppercase text-primary/40 leading-none">Result.</p>
                    </div>
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
