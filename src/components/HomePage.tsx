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

  const displayName = !isAdmin && unitName ? unitName : "MG2";

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
    { id: "ranking", label: "Ranking Closers", desc: "Posição, faturamento e conversão", icon: Trophy },
    { id: "pessoas", label: "Visão por Pessoa", desc: "Performance individual detalhada", icon: Users },
    { id: "canais", label: "Meta por Canal", desc: "Desempenho e ROAS por canal", icon: Layers },
    { id: "analise-propostas", label: "Análise de Propostas", desc: "Temperatura, valor e conversão de propostas", icon: Crosshair },
    { id: "analise-pv", label: "Análise Pré-Venda", desc: "Punch por lead, volume e rastreabilidade", icon: Zap },
    { id: "gestao", label: "Visão Diretoria", desc: "Consolidado executivo da operação", icon: BarChart3 },
  ];


  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* ── Background Effects ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }} />
        {/* Red glow top-right */}
        <div className="absolute -top-32 -right-32 w-[600px] h-[600px] rounded-full opacity-[0.06]"
          style={{ background: `radial-gradient(circle, hsl(var(--primary)), transparent 70%)` }} />
        {/* Green glow bottom-left */}
        <div className="absolute -bottom-48 -left-48 w-[500px] h-[500px] rounded-full opacity-[0.05]"
          style={{ background: `radial-gradient(circle, hsl(var(--accent)), transparent 70%)` }} />
        {/* Diagonal lines */}
        <div className="absolute top-0 left-0 w-full h-full opacity-[0.02]" style={{
          backgroundImage: `repeating-linear-gradient(45deg, hsl(var(--foreground)), hsl(var(--foreground)) 1px, transparent 1px, transparent 80px)`,
        }} />
      </div>

      {/* ── HERO ── */}
      <section className="relative z-10 pt-20 sm:pt-28 pb-16 sm:pb-20 px-4 sm:px-6 lg:px-8 max-w-[1440px] mx-auto">
        <div className="animate-fadeIn">
          {/* Logo + Title */}
          <img src={v4Logo} alt="V4" className="h-16 sm:h-20 mb-6 [filter:brightness(0)_invert(19%)_sepia(97%)_saturate(7404%)_hue-rotate(357deg)_brightness(101%)_contrast(117%)]" />

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-[-0.04em] leading-[0.9] mb-4">
            <span className="text-foreground">Painel Receitas</span>
            <br />
            <span className="text-primary">MG2</span>
            {!isAdmin && unitName && (
              <span className="text-primary/90 text-[0.85em] tracking-tight ml-2">{unitName}</span>
            )}
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base text-muted-foreground max-w-xl leading-relaxed mt-6">
            Painel de performance comercial com pace diário, ranking em tempo real e acompanhamento de meta.
          </p>
        </div>
      </section>

      {/* ── STATUS CARDS (Mission Control) ── */}
      <section className="relative z-10 px-4 sm:px-6 lg:px-8 max-w-[1440px] mx-auto pb-16">
        <p className="section-title mb-5 flex items-center gap-2">
          <Crosshair className="w-3.5 h-3.5" />
          Metas do Mês
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {statusCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.label}
                className="group kpi-card relative overflow-hidden"
              >
                {/* Accent stripe */}
                <div
                  className="absolute top-0 left-0 right-0 h-[2px]"
                  style={{
                    background: card.accent === "primary"
                      ? `hsl(var(--primary))`
                      : card.accent === "accent"
                        ? `hsl(var(--accent))`
                        : card.accent === "destructive"
                          ? `hsl(var(--destructive))`
                          : `hsl(var(--foreground) / 0.2)`,
                  }}
                />
                <div className="flex items-center gap-2 mb-3">
                  <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                  <p className="kpi-label">{card.label}</p>
                </div>
                <p className="kpi-value tabular">{formatCurrency(card.value)}</p>
              </div>
            );
          })}
        </div>
      </section>


      {/* ── QUICK ACCESS ── */}
      <section className="relative z-10 px-4 sm:px-6 lg:px-8 max-w-[1440px] mx-auto pb-24">
        <p className="section-title mb-5 flex items-center gap-2">
          <Zap className="w-3.5 h-3.5" />
          Acesso Rápido
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <button
                key={link.id}
                onClick={() => onNavigate(link.id)}
                className="group kpi-card text-left flex items-start gap-4 hover:border-primary/20 transition-all duration-300"
              >
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors duration-300">
                  <Icon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors duration-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-foreground">{link.label}</h3>
                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all duration-200" />
                  </div>
                  <p className="text-[12px] text-muted-foreground mt-0.5 leading-relaxed">
                    {link.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* ── Footer mark ── */}
      <div className="relative z-10 pb-8 text-center">
        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/40 font-medium">
          V4 Company · Painel Receitas {displayName}
        </p>
      </div>
    </div>
  );
}
