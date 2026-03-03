import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { useDashboardStore } from "@/data/store";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  LayoutDashboard,
  Trophy,
  Users,
  Layers,
  FileText,
  BarChart3,
  ClipboardCheck,
  Menu,
  X,
  ChevronRight,
  Home,
  Thermometer,
  Zap,
  UserCheck,
  Target,
  LogOut,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { AuthPage } from "@/components/AuthPage";
import { PendingApproval } from "@/components/PendingApproval";
import { AdminApproval } from "@/components/AdminApproval";
import HomePage from "@/components/HomePage";
import Dashboard from "@/components/Dashboard";
import { RankingClosers, RankingPreVendas } from "@/components/Rankings";
import { ChannelView } from "@/components/ChannelView";
import { PersonView } from "@/components/PersonView";
import { DailyFormCloser, DailyFormPreVendas } from "@/components/DailyForms";
import { ManagementView } from "@/components/ManagementView";
import { SubmissionAudit } from "@/components/SubmissionAudit";
import { ProposalAnalysis } from "@/components/ProposalAnalysis";
import { PreSalesAnalysis } from "@/components/PreSalesAnalysis";
import { GoalsSettings } from "@/components/GoalsSettings";
import { UnitView } from "@/components/UnitView";
import v4Logo from "@/assets/v4logo.png";

const queryClient = new QueryClient();

type Tab = "home" | "dashboard" | "ranking" | "pessoas" | "canais" | "formulario" | "conferencia" | "gestao" | "analise-propostas" | "analise-pv" | "aprovacao" | "metas" | "unidades";

function AppContent() {
  const { user, isLoading, isApproved, isAdmin, profile, roles, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { loadFromDB } = useDashboardStore();
  const isGerente = roles.includes("gerente_unidade");

  useEffect(() => {
    if (!isApproved || !user) return;
    const unitId = isAdmin ? null : profile?.unit_id || null;
    loadFromDB(unitId);
  }, [isApproved, isAdmin, profile?.unit_id, user]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <img src={v4Logo} alt="V4" className="h-10 animate-pulse [filter:brightness(0)_invert(19%)_sepia(97%)_saturate(7404%)_hue-rotate(357deg)_brightness(101%)_contrast(117%)]" />
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  // Not logged in
  if (!user) return <AuthPage />;

  // Pending or rejected
  if (!isApproved) return <PendingApproval />;

  const handleNavigate = (tab: string) => {
    setActiveTab(tab as Tab);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode; adminOnly?: boolean; hideForAdmin?: boolean }[] = [
    { id: "home", label: "Home", icon: <Home className="w-4 h-4" /> },
    { id: "dashboard", label: "Painel", icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: "ranking", label: "Ranking", icon: <Trophy className="w-4 h-4" /> },
    { id: "pessoas", label: "Pessoas", icon: <Users className="w-4 h-4" /> },
    { id: "canais", label: "Canais", icon: <Layers className="w-4 h-4" /> },
    { id: "formulario", label: "Lançar Dia", icon: <FileText className="w-4 h-4" />, hideForAdmin: true },
    { id: "conferencia", label: "Conferência", icon: <ClipboardCheck className="w-4 h-4" /> },
    { id: "analise-propostas", label: "Propostas", icon: <Thermometer className="w-4 h-4" /> },
    { id: "analise-pv", label: "Pré-Venda", icon: <Zap className="w-4 h-4" /> },
    { id: "gestao", label: "Gestão", icon: <BarChart3 className="w-4 h-4" />, hideForAdmin: true },
    { id: "unidades", label: "Unidades", icon: <LayoutDashboard className="w-4 h-4" />, adminOnly: true },
    { id: "metas", label: "Metas", icon: <Target className="w-4 h-4" /> },
    { id: "aprovacao", label: "Aprovação", icon: <UserCheck className="w-4 h-4" />, adminOnly: true },
  ];

  const visibleTabs = tabs.filter((t) => {
    if (t.adminOnly && !isAdmin) return false;
    if (t.hideForAdmin && isAdmin) return false;
    if (t.id === "metas" && !isAdmin && !isGerente) return false;
    return true;
  });

  // Home page is full-bleed
  if (activeTab === "home") {
    return (
      <div className="min-h-screen bg-background">
        <header className="fixed top-0 right-0 z-50 p-4 flex items-center gap-2">
          <ThemeToggle />
          <nav className="hidden md:flex items-center gap-1 bg-card/80 backdrop-blur-xl border border-border/60 rounded-xl px-2 py-1.5 shadow-lg">
            {visibleTabs.filter(t => t.id !== "home").map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleNavigate(tab.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all duration-200 text-muted-foreground hover:text-foreground hover:bg-secondary/80"
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
          <button onClick={signOut} className="p-2 rounded-lg bg-card/80 backdrop-blur-xl border border-border/60 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors" title="Sair">
            <LogOut className="w-4 h-4" />
          </button>
          <button
            className="md:hidden p-2 rounded-lg bg-card/80 backdrop-blur-xl border border-border/60 hover:bg-secondary transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </header>

        {mobileMenuOpen && (
          <div className="fixed inset-0 z-40 bg-background/95 backdrop-blur-xl md:hidden">
            <div className="pt-20 px-4 space-y-1">
              {visibleTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => { handleNavigate(tab.id); setMobileMenuOpen(false); }}
                  className="flex items-center justify-between w-full px-4 py-3.5 rounded-xl text-sm font-medium transition-colors text-muted-foreground hover:bg-secondary hover:text-foreground"
                >
                  <div className="flex items-center gap-3">{tab.icon}{tab.label}</div>
                  <ChevronRight className="w-4 h-4 opacity-40" />
                </button>
              ))}
              <button onClick={signOut} className="flex items-center gap-3 w-full px-4 py-3.5 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors">
                <LogOut className="w-4 h-4" /> Sair
              </button>
            </div>
          </div>
        )}

        <HomePage onNavigate={handleNavigate} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/90 backdrop-blur-2xl">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <button onClick={() => handleNavigate("home")} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <img src={v4Logo} alt="V4" className="h-7 [filter:brightness(0)_invert(19%)_sepia(97%)_saturate(7404%)_hue-rotate(357deg)_brightness(101%)_contrast(117%)]" />
            </button>
            <div className="hidden sm:flex items-center gap-2">
              <span className="font-semibold text-sm text-foreground">MG2</span>
              <span className="text-[11px] text-muted-foreground bg-secondary px-2 py-0.5 rounded-md font-medium">Mar/2026</span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-1">
            <nav className="flex items-center gap-1">
              {visibleTabs.filter(t => t.id !== "home").map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleNavigate(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all duration-200 ${
                    activeTab === tab.id
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/80"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </nav>
            <div className="w-px h-5 bg-border mx-1" />
            <ThemeToggle />
            <button onClick={signOut} className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors" title="Sair">
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          <button
            className="md:hidden p-2 rounded-lg hover:bg-secondary transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-background/98 backdrop-blur-2xl p-2">
            {visibleTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => { handleNavigate(tab.id); setMobileMenuOpen(false); }}
                className={`flex items-center justify-between w-full px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-secondary"
                }`}
              >
                <div className="flex items-center gap-3">{tab.icon}{tab.label}</div>
                <ChevronRight className="w-4 h-4 opacity-40" />
              </button>
            ))}
            <button onClick={signOut} className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors">
              <LogOut className="w-4 h-4" /> Sair
            </button>
          </div>
        )}
      </header>

      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="animate-fadeIn">
          {activeTab === "dashboard" && <Dashboard />}
          {activeTab === "ranking" && (
            <div className="space-y-8">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Rankings</h1>
                <p className="text-sm text-muted-foreground mt-1">Performance em tempo real por membro da equipe</p>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <RankingClosers />
                <RankingPreVendas />
              </div>
            </div>
          )}
          {activeTab === "pessoas" && <PersonView />}
          {activeTab === "canais" && <ChannelView />}
          {activeTab === "formulario" && (
            <div className="space-y-8">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Lançamento Diário</h1>
                <p className="text-sm text-muted-foreground mt-1">Preencha até às 20h com os dados do dia</p>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <DailyFormCloser />
                <DailyFormPreVendas />
              </div>
            </div>
          )}
          {activeTab === "conferencia" && <SubmissionAudit />}
          {activeTab === "analise-propostas" && <ProposalAnalysis />}
          {activeTab === "analise-pv" && <PreSalesAnalysis />}
          {activeTab === "gestao" && <ManagementView />}
          {activeTab === "unidades" && isAdmin && <UnitView />}
          {activeTab === "metas" && (isAdmin || isGerente) && <GoalsSettings />}
          {activeTab === "aprovacao" && isAdmin && <AdminApproval />}
        </div>
      </main>
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider delayDuration={300}>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
