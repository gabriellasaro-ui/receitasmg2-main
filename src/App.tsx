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
  User,
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
import { ProfileView } from "@/components/ProfileView";
import v4Logo from "@/assets/v4logo.png";

const queryClient = new QueryClient();

type Tab = "home" | "dashboard" | "ranking" | "pessoas" | "canais" | "formulario" | "conferencia" | "gestao" | "analise-propostas" | "analise-pv" | "aprovacao" | "metas" | "unidades" | "perfil";

function AppContent() {
  const { user, isLoading, isApproved, isAdmin, profile, roles, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { loadFromDB } = useDashboardStore();
  const isGerente = roles.includes("gerente_unidade");

  useEffect(() => {
    if (!isApproved || !user) return;
    // Garantir que ao logar, caia na Home
    setActiveTab("home");
    const unitId = isAdmin ? null : profile?.unit_id || null;
    loadFromDB(unitId);
  }, [isApproved, isAdmin, profile?.unit_id, user]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-6">
          <div className="relative flex items-center justify-center">
            <div className="absolute w-24 h-24 border-2 border-primary/20 rounded-full animate-loader-spin border-t-primary" />
            <h1 className="text-4xl font-semibold tracking-tighter text-primary animate-pulse-logo">MG2</h1>
          </div>
          <div className="flex flex-col items-center gap-1">
            <p className="text-sm font-bold tracking-[0.2em] uppercase text-muted-foreground animate-fadeIn">Regional</p>
            <p className="text-[10px] font-medium text-muted-foreground/50 tabular">Carregando painel de elite...</p>
          </div>
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
    { id: "formulario", label: "Lançamento", icon: <FileText className="w-4 h-4" />, hideForAdmin: true },
    { id: "conferencia", label: "Audit", icon: <ClipboardCheck className="w-4 h-4" /> },
    { id: "analise-propostas", label: "Propostas", icon: <Thermometer className="w-4 h-4" /> },
    { id: "analise-pv", label: "PV", icon: <Zap className="w-4 h-4" /> },
    { id: "gestao", label: "Gestão", icon: <BarChart3 className="w-4 h-4" />, hideForAdmin: true },
    { id: "unidades", label: "Unidades", icon: <LayoutDashboard className="w-4 h-4" />, adminOnly: true },
    { id: "metas", label: "Metas", icon: <Target className="w-4 h-4" /> },
    { id: "aprovacao", label: "Aprovação", icon: <UserCheck className="w-4 h-4" />, adminOnly: true },
    { id: "perfil", label: "Perfil", icon: <User className="w-4 h-4" /> },
  ];

  const visibleTabs = tabs.filter((t) => {
    if (t.adminOnly && !isAdmin) return false;
    if (t.hideForAdmin && isAdmin) return false;
    if (t.id === "metas" && !isAdmin && !isGerente) return false;
    if (t.id === "gestao" && !isGerente) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/90 backdrop-blur-2xl">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <button onClick={() => handleNavigate("home")} className="flex items-center gap-3 group transition-all">
              <img
                src={v4Logo}
                alt="V4 Company"
                className="h-8 group-hover:scale-105 transition-transform [filter:brightness(0)_invert(13%)_sepia(93%)_saturate(6144%)_hue-rotate(356deg)_brightness(89%)_contrast(117%)]"
              />
            </button>
          </div>

          <div className="hidden lg:flex items-center gap-1">
            <nav className="flex items-center gap-1">
              {visibleTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleNavigate(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-semibold transition-all duration-300 relative group/nav ${activeTab === tab.id
                    ? "bg-primary text-primary-foreground shadow-[0_0_20px_rgba(var(--primary),0.4)] ring-2 ring-white/20 scale-105"
                    : "text-muted-foreground hover:text-primary hover:bg-primary/5"
                    }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </nav>
            <div className="w-px h-5 bg-border mx-2" />
            <ThemeToggle />
            <button onClick={signOut} className="p-2.5 rounded-xl hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors ml-1" title="Sair">
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          <button
            className="lg:hidden p-2 rounded-xl hover:bg-secondary transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 top-16 z-40 bg-background/98 backdrop-blur-2xl">
            <div className="p-4 space-y-2">
              {visibleTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => { handleNavigate(tab.id); setMobileMenuOpen(false); }}
                  className={`flex items-center justify-between w-full px-6 py-4 rounded-2xl text-sm font-semibold transition-all duration-300 ${activeTab === tab.id
                    ? "bg-primary text-primary-foreground shadow-[0_0_25px_rgba(var(--primary),0.3)] scale-[1.02] translate-x-1"
                    : "text-muted-foreground hover:bg-primary/5 hover:text-primary"
                    }`}
                >
                  <div className="flex items-center gap-4">{tab.icon}{tab.label}</div>
                  <ChevronRight className="w-4 h-4 opacity-40" />
                </button>
              ))}
              <div className="h-px bg-border my-4" />
              <button
                onClick={signOut}
                className="flex items-center gap-4 w-full px-5 py-4 rounded-2xl text-sm font-bold text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut className="w-4 h-4" /> Sair da Conta
              </button>
            </div>
          </div>
        )}
      </header>

      <main className={`flex-1 ${activeTab === "home" ? "" : "max-w-[1440px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-8"}`}>
        <div key={activeTab} className="animate-fadeIn">
          {activeTab === "home" && <HomePage onNavigate={handleNavigate} />}
          {activeTab === "dashboard" && <Dashboard />}
          {activeTab === "ranking" && (
            <div className="space-y-8">
              <div>
                <h1 className="text-3xl font-semibold tracking-tighter">Ranking de Performance</h1>
                <p className="text-sm text-muted-foreground mt-1">Liderança em faturamento e conexões em tempo real</p>
              </div>
              <RankingClosers />
            </div>
          )}
          {activeTab === "pessoas" && <PersonView />}
          {activeTab === "canais" && <ChannelView />}
          {activeTab === "formulario" && (
            <div className="space-y-8">
              <div>
                <h1 className="text-3xl font-semibold tracking-tighter">Lançamento Diário</h1>
                <p className="text-sm text-muted-foreground mt-1">Preencha seus números corporativos até as 20h</p>
              </div>
              <div className={`grid grid-cols-1 ${(isAdmin || isGerente) ? "lg:grid-cols-2" : "max-w-3xl mx-auto"} gap-8`}>
                {(isAdmin || isGerente || roles.includes("closer")) && <DailyFormCloser />}
                {(isAdmin || isGerente || roles.includes("sdr")) && <DailyFormPreVendas />}
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
          {activeTab === "perfil" && <ProfileView />}
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
