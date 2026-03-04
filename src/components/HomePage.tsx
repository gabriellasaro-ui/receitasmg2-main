import { useState, useEffect } from "react";
import { useDashboardStore } from "@/data/store";
import { formatCurrency } from "@/data/seedData";
import {
  Target,
  TrendingUp,
  Shield,
  DollarSign,
  RefreshCw,
  LayoutDashboard,
  FileText,
  Trophy,
  Users,
  Layers,
  BarChart3,
  ArrowRight,
  Crosshair,
  Zap,
  CheckCircle2,
} from "lucide-react";
import v4Logo from "@/assets/v4logo.png";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface HomePageProps {
  onNavigate: (tab: string) => void;
}

export default function HomePage({ onNavigate }: HomePageProps) {
  const { goals } = useDashboardStore();
  const { isAdmin, profile } = useAuth();
  const [unitName, setUnitName] = useState<string | null>(null);

  useEffect(() => {
    if (isAdmin || !profile?.unit_id) return;
    const fetchUnit = async () => {
      const { data } = await supabase.from("units").select("name").eq("id", profile.unit_id!).single();
      if (data) setUnitName(data.name);
    };
    fetchUnit();
  }, [isAdmin, profile?.unit_id]);

  const firstName = profile?.full_name?.split(' ')[0] || "Líder";

  const MESES_CURTO = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  const mesLabel = MESES_CURTO[(goals.mesRef || new Date().getMonth() + 1) - 1] || "Mês";

  const statusCards = [
    { label: "Meta Total", value: goals.metaReceitaTotal, icon: Target, accent: "primary" },
    { label: "Recorrente", value: goals.metaReceitaRecorrente, icon: RefreshCw, accent: "accent" },
    { label: "One-Time", value: goals.metaReceitaOnetime, icon: TrendingUp, accent: "foreground" },
    { label: "Churn M0 Máx", value: goals.metaChurnM0Max, icon: Shield, accent: "destructive" },
    { label: `Caixa ${mesLabel} (60%)`, value: goals.metaCaixaMarco60pct, icon: DollarSign, accent: "accent" },
  ];

  const quickLinks = [
    { id: "dashboard", label: "Painel Geral", desc: "KPIs, projeção e pace em tempo real", icon: LayoutDashboard },
    { id: "formulario", label: "Lançar Meu Dia", desc: "Registre os números do dia até 20h", icon: FileText },
    { id: "ranking", label: "Ranking de Performance", desc: "Posição, faturamento e conversão", icon: Trophy },
    { id: "pessoas", label: "Visão por Pessoa", desc: "Performance individual detalhada", icon: Users },
    { id: "canais", label: "Meta por Canal", desc: "Desempenho e ROAS por canal", icon: Layers },
    { id: "analise-propostas", label: "Análise de Propostas", desc: "Temperatura, valor e conversão de propostas", icon: Crosshair },
    { id: "analise-pv", label: "Análise Pré-Venda", desc: "Punch por lead, volume e rastreabilidade", icon: Zap },
    { id: "gestao", label: "Visão Diretoria", desc: "Consolidado executivo da operação", icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
      {/* ── Background Effects (Refined) ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[800px] h-[800px] bg-primary/5 rounded-full blur-[140px] opacity-40 animate-pulse" style={{ animationDuration: '10s' }} />
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-accent/5 rounded-full blur-[120px] opacity-30 animate-pulse" style={{ animationDuration: '15s', animationDelay: '3s' }} />

        {/* Fine grid */}
        <div className="absolute inset-0 opacity-[0.015]" style={{
          backgroundImage: `linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }} />
      </div>

      {/* ── HERO SECTION (Refined Layout) ── */}
      <section className="relative z-10 pt-28 sm:pt-36 pb-16 px-4 sm:px-6 lg:px-8 max-w-[1440px] mx-auto w-full">
        <div className="animate-fadeIn grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

          <div className="lg:col-span-8 space-y-6">
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-6xl lg:text-[80px] font-semibold tracking-[-0.06em] leading-[0.9] text-foreground transition-all duration-700">
                Painel de Receitas <span className="text-primary italic">MG2.</span><br />
                {unitName ? (
                  <span className="text-primary/80 italic text-2xl sm:text-4xl lg:text-[50px] tracking-tight">"{unitName}"</span>
                ) : (
                  <span className="text-muted-foreground/40 text-sm sm:text-lg uppercase tracking-[0.4em] font-semibold">Gestão Regional</span>
                )}
              </h1>

              <p className="text-base sm:text-lg text-muted-foreground/70 max-w-2xl leading-relaxed font-medium pt-4 border-l-2 border-primary/20 pl-6">
                Gestão comercial de alta performance. Acompanhe em tempo real o faturamento, metas e rankings da sua unidade na Regional MG2.
              </p>
            </div>
          </div>

          {/* Right Column: Branded Metric/Stat (Fills space) */}
          <div className="lg:col-span-4 flex justify-end lg:justify-center">
            <div className="relative group">
              {/* Outer Glow - Intensified */}
              <div className="absolute inset-0 bg-primary/40 blur-[80px] rounded-full scale-110 group-hover:scale-150 transition-all duration-1000 opacity-60 animate-pulse" />
              <div className="absolute inset-0 bg-primary/20 blur-[40px] rounded-full scale-100 group-hover:scale-110 transition-all duration-700 opacity-80" />

              {/* MG2 Block Shield */}
              <div className="relative w-40 h-40 sm:w-56 sm:h-56 bg-primary rounded-[3rem] flex flex-col items-center justify-center shadow-[0_20px_50px_rgba(var(--primary),0.5)] transition-all duration-500 hover:rotate-2 hover:scale-105 border-4 border-white/20">
                <span className="text-white text-6xl sm:text-8xl font-semibold italic tracking-tighter mb-1 drop-shadow-2xl">MG2</span>
                <p className="text-white/80 text-[10px] sm:text-[12px] font-semibold uppercase tracking-[0.4em]">Regional</p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── METRICS ── */}
      <section className="relative z-10 px-4 sm:px-6 lg:px-8 max-w-[1440px] mx-auto w-full pb-16">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Monitoramento de Metas · {mesLabel}/26</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {statusCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div
                key={card.label}
                className="group relative glass-panel rounded-3xl p-6 border-white/10 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 overflow-hidden animate-fadeIn"
                style={{ animationDelay: `${idx * 0.05}s` }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-colors duration-500 ${card.accent === 'primary' ? 'bg-primary shadow-[0_0_15px_rgba(var(--primary),0.3)] text-white' : 'bg-secondary/50 text-muted-foreground'}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <p className="kpi-label opacity-60">{card.label}</p>
                </div>

                <p className={`text-2xl sm:text-3xl tabular ${card.accent === 'primary' ? 'text-primary font-semibold' : 'text-foreground/80 font-semibold'}`}>
                  {formatCurrency(card.value)}
                </p>

                {/* Decorative Indicator - Red Focus */}
                <div className={`absolute bottom-0 left-0 w-full h-1 ${card.accent === 'primary' ? 'bg-primary/20' : 'bg-transparent'}`}>
                  <div className={`h-full bg-primary transition-all duration-700 w-0 group-hover:w-full shadow-[0_0_10px_rgba(var(--primary),1)]`} />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── ACTIONS ── */}
      <section className="relative z-10 px-4 sm:px-6 lg:px-8 max-w-[1440px] mx-auto w-full pb-24">
        <div className="flex items-center gap-2 mb-8">
          <Zap className="w-4 h-4 text-primary" />
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Acessos Rápidos de Gestão</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickLinks.map((link, idx) => {
            const Icon = link.icon;
            return (
              <button
                key={link.id}
                onClick={() => onNavigate(link.id)}
                className="group relative glass-panel text-left p-6 rounded-3xl border-white/5 hover:border-primary/40 hover:shadow-[0_0_30px_rgba(var(--primary),0.1)] transition-all duration-500 animate-fadeIn"
                style={{ animationDelay: `${(idx + 5) * 0.04}s` }}
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white group-hover:shadow-[0_0_20px_rgba(var(--primary),0.4)] transition-all duration-500">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0 pr-6">
                    <h3 className="text-base font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">{link.label}</h3>
                    <p className="text-[12px] text-muted-foreground font-semibold leading-snug opacity-70">
                      {link.desc}
                    </p>
                  </div>
                  <ArrowRight className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-primary opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* ── Footer ── */}
      <div className="relative z-10 py-12 text-center mt-auto border-t border-border/10">
        <p className="text-[10px] uppercase font-semibold tracking-[0.4em] text-muted-foreground opacity-30">
          V4 Company · Regional MG2 · Gestão de Performance
        </p>
      </div>
    </div>
  );
}
