import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner, toast } from "sonner";
import { useDashboardStore } from "@/data/store";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Bell, Menu, Send, Settings, User } from "lucide-react";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { AuthPage } from "@/components/AuthPage";
import { PendingApproval } from "@/components/PendingApproval";
import { AdminApproval } from "@/components/AdminApproval";
import { AppSidebar } from "@/components/AppSidebar";
import HomePage from "@/components/HomePage";
import Dashboard from "@/components/Dashboard";
import { RankingClosers } from "@/components/Rankings";
import { ChannelView } from "@/components/ChannelView";
import { PersonView } from "@/components/PersonView";
import { DailyFormCloser, DailyFormPreVendas } from "@/components/DailyForms";
import { ManagementView } from "@/components/ManagementView";
import { SubmissionAudit } from "@/components/SubmissionAudit";
import { ProposalAnalysis } from "@/components/ProposalAnalysis";
import { PreSalesAnalysis } from "@/components/PreSalesAnalysis";
import { ContractsView } from "@/components/ContractsView";
import { GoalsSettings } from "@/components/GoalsSettings";
import { UnitView } from "@/components/UnitView";
import { ProfileView } from "@/components/ProfileView";
import { useUnitData } from "@/hooks/useUnitData";

const queryClient = new QueryClient();

type Tab =
  | "home" | "dashboard" | "ranking" | "pessoas" | "canais"
  | "formulario" | "conferencia" | "gestao" | "analise-propostas"
  | "analise-pv" | "contratos" | "aprovacao" | "metas" | "unidades" | "perfil";

function NotificationBell() {
  const { user, isAdmin, profile } = useAuth();
  const { members } = useUnitData();
  const [units, setUnits] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Broadcast states
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [bcTitle, setBcTitle] = useState("");
  const [bcMsg, setBcMsg] = useState("");
  const [bcTargetType, setBcTargetType] = useState("all");
  const [bcTargetValue, setBcTargetValue] = useState("");
  const [sendingBc, setSendingBc] = useState(false);

  const fetchNotifs = async () => {
    if (!user) return;
    const anySupabase = supabase as any;

    if (isAdmin && units.length === 0) {
      const { data: uData } = await supabase.from('units').select('*');
      if (uData) setUnits(uData);
    }

    // DB Notifications
    const { data: dbNotifs } = await anySupabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20);

    // Dynamic Notifications
    const { data: missingFaixa } = await supabase.from('closer_sales_detail').select('id, data_referencia, lead_nome').eq('closer_id', user.id).is('faixa_faturamento', null);

    let allNotifs = dbNotifs || [];
    let extraUnread = 0;

    if (missingFaixa && missingFaixa.length > 0) {
      const dynamicNotifs = missingFaixa.map((m: any) => ({
        id: `missing-${m.id}`,
        title: "Ação Necessária: Faturamento",
        message: `O contrato "${m.lead_nome}" (${new Date(m.data_referencia + "T12:00:00").toLocaleDateString('pt-BR')}) não tem "Faixa Faturamento". Acesse Gestão > Auditoria para preencher.`,
        is_read: false,
        created_at: new Date().toISOString(),
        is_dynamic: true
      }));
      allNotifs = [...dynamicNotifs, ...allNotifs];
      extraUnread += dynamicNotifs.length;
    }

    if (!profile?.avatar_url) {
      allNotifs = [
        {
          id: 'missing-avatar',
          title: "Foto do Time Obrigatória",
          message: "Você ainda não subiu sua foto de perfil. Acesse 'Perfil' para adicionar uma agora.",
          is_read: false,
          created_at: new Date().toISOString(),
          is_dynamic: true
        },
        ...allNotifs
      ];
      extraUnread += 1;
    }

    setNotifications(allNotifs);
    setUnreadCount((dbNotifs?.filter((n: any) => !n.is_read).length || 0) + extraUnread);
  };

  useEffect(() => {
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 10000);
    return () => clearInterval(interval);
  }, [user]);

  const markAsRead = async (id: string) => {
    if (id.startsWith('missing-')) {
      if (id === 'missing-avatar') {
        window.dispatchEvent(new CustomEvent('navigate', { detail: 'perfil' }));
      } else {
        toast.info("Acesse o menu Gestão > Auditoria de Envios para preencher o faturamento.", { duration: 5000 });
      }
      return;
    }
    const anySupabase = supabase as any;
    await anySupabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const handleBroadcast = async () => {
    if (!bcTitle.trim() || !bcMsg.trim()) return;
    setSendingBc(true);
    try {
      let targets: string[] = [];
      if (bcTargetType === "all") {
        targets = members.map(m => m.userId);
      } else if (bcTargetType === "unit") {
        targets = members.filter(m => m.unitId === bcTargetValue).map(m => m.userId);
      } else if (bcTargetType === "role") {
        targets = members.filter(m => m.role === bcTargetValue).map(m => m.userId);
      } else if (bcTargetType === "user") {
        targets = [bcTargetValue];
      }

      if (targets.length > 0) {
        const inserts = targets.map(uid => ({
          user_id: uid,
          title: bcTitle,
          message: bcMsg,
        }));
        const anySupabase = supabase as any;
        await anySupabase.from('notifications').insert(inserts);
        toast.success(`Notificação enviada para ${targets.length} membro(s)!`);
        setShowBroadcast(false);
        setBcTitle("");
        setBcMsg("");
      } else {
        toast.error("Nenhum usuário encontrado para esse filtro.");
      }
    } catch (err: any) {
      toast.error("Erro ao enviar notificação.");
    } finally {
      setSendingBc(false);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full ml-auto hover:bg-muted/30">
          <Bell className="w-5 h-5 text-muted-foreground" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-2 w-2 h-2 bg-destructive rounded-full animate-pulse shadow-[0_0_5px_rgba(239,68,68,0.8)]" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[320px] p-0 shadow-xl border-border/50 rounded-2xl overflow-hidden mt-2 z-50">
        <div className="p-3.5 border-b border-border/50 bg-muted/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold tracking-tight">Notificações</h3>
            {unreadCount > 0 && <span className="text-[10px] uppercase font-bold text-destructive bg-destructive/10 px-2 py-0.5 rounded-full">{unreadCount} Novas</span>}
          </div>
          {isAdmin && (
            <Dialog open={showBroadcast} onOpenChange={setShowBroadcast}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 flex-shrink-0 hover:bg-primary/20 hover:text-primary transition-all rounded-full" title="Emitir Comunicado Global">
                  <Send className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md z-[100]">
                <DialogHeader>
                  <DialogTitle>Novo Comunicado Local</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-3">
                  <p className="text-[12px] text-muted-foreground leading-relaxed -mt-2 mb-2">
                    Gere uma notificação que será entregue imediatamente no sino dos membros selecionados.
                  </p>
                  <div className="space-y-2">
                    <label className="text-[12px] font-semibold text-foreground">Público Alvo</label>
                    <Select value={bcTargetType} onValueChange={v => { setBcTargetType(v); setBcTargetValue(""); }}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent className="z-[200]">
                        <SelectItem value="all">Todos os Membros</SelectItem>
                        <SelectItem value="unit">Por Unidade</SelectItem>
                        <SelectItem value="role">Por Cargo</SelectItem>
                        <SelectItem value="user">Membro Específico</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {bcTargetType === "unit" && (
                    <div className="space-y-2">
                      <label className="text-[12px] font-semibold text-foreground">Unidade</label>
                      <Select value={bcTargetValue} onValueChange={setBcTargetValue}>
                        <SelectTrigger><SelectValue placeholder="Selecione a unidade" /></SelectTrigger>
                        <SelectContent className="z-[200]">
                          {units.map((u: any) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  {bcTargetType === "role" && (
                    <div className="space-y-2">
                      <label className="text-[12px] font-semibold text-foreground">Cargo</label>
                      <Select value={bcTargetValue} onValueChange={setBcTargetValue}>
                        <SelectTrigger><SelectValue placeholder="Selecione o cargo" /></SelectTrigger>
                        <SelectContent className="z-[200]">
                          <SelectItem value="closer">Closer</SelectItem>
                          <SelectItem value="sdr">SDR (Pré-Venda)</SelectItem>
                          <SelectItem value="gerente_unidade">Gerente</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  {bcTargetType === "user" && (
                    <div className="space-y-2">
                      <label className="text-[12px] font-semibold text-foreground">Membro</label>
                      <Select value={bcTargetValue} onValueChange={setBcTargetValue}>
                        <SelectTrigger><SelectValue placeholder="Selecione o membro" /></SelectTrigger>
                        <SelectContent className="z-[200]">
                          {members.map(m => <SelectItem key={m.userId} value={m.userId}>{m.fullName}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div className="space-y-2">
                    <label className="text-[12px] font-semibold text-foreground">Título Resumido</label>
                    <Input placeholder="Ex: Aviso Importante..." value={bcTitle} onChange={e => setBcTitle(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[12px] font-semibold text-foreground">Aviso Completo</label>
                    <Textarea placeholder="Mensagem do comunicado..." className="min-h-[80px]" value={bcMsg} onChange={e => setBcMsg(e.target.value)} />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowBroadcast(false)} disabled={sendingBc}>Cancelar</Button>
                  <Button onClick={handleBroadcast} disabled={sendingBc || !bcTitle || !bcMsg || (bcTargetType !== 'all' && !bcTargetValue)}>
                    {sendingBc ? "Disparando..." : "Disparar Comunicado"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
        <div className="max-h-[350px] overflow-auto">
          {notifications.length === 0 ? (
            <div className="p-6 text-center">
              <Bell className="w-8 h-8 text-muted-foreground opacity-20 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground font-medium">Você não tem notificações.</p>
            </div>
          ) : (
            notifications.map(n => (
              <div key={n.id} className={`p-4 border-b border-border/30 last:border-0 hover:bg-muted/20 transition-colors cursor-pointer ${!n.is_read ? 'bg-primary/5' : ''}`} onClick={() => markAsRead(n.id)}>
                <div className="flex items-start gap-3">
                  <div className={`p-1.5 rounded-full mt-0.5 shrink-0 ${!n.is_read ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                    <Bell className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className={`text-[13px] mb-1 leading-tight ${!n.is_read ? 'font-bold text-foreground' : 'font-semibold text-muted-foreground'}`}>{n.title}</p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">{n.message}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function AppContent() {
  const { user, isLoading, isApproved, isAdmin, profile, roles, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>(() => {
    const saved = sessionStorage.getItem("activeTab");
    return (saved as Tab) || "home";
  });
  const { loadFromDB } = useDashboardStore();
  const isGerente = roles.includes("gerente_unidade");

  useEffect(() => {
    sessionStorage.setItem("activeTab", activeTab);
  }, [activeTab]);

  useEffect(() => {
    if (!isApproved || !user) return;
    const unitId = isAdmin ? null : profile?.unit_id || null;
    loadFromDB(unitId);
  }, [isApproved, isAdmin, profile?.unit_id, user]);

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

  if (!user) return <AuthPage />;
  if (!isApproved) return <PendingApproval />;

  const handleNavigate = (tab: string) => {
    setActiveTab(tab as Tab);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar activeTab={activeTab} onNavigate={handleNavigate} />

        <div className="flex-1 flex flex-col min-w-0">
          {/* Compact top bar with sidebar trigger */}
          <header className="sticky top-0 z-50 h-12 flex items-center justify-between border-b border-border/60 bg-background/90 backdrop-blur-2xl px-4">
            <div className="flex items-center">
              <SidebarTrigger className="mr-3" />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">
                {activeTab === "home" ? "Home" :
                  activeTab === "dashboard" ? "Painel" :
                    activeTab === "ranking" ? "Ranking" :
                      activeTab === "pessoas" ? "Pessoas" :
                        activeTab === "canais" ? "Canais" :
                          activeTab === "formulario" ? "Lançamento" :
                            activeTab === "conferencia" ? "Auditoria" :
                              activeTab === "analise-propostas" ? "Propostas" :
                                activeTab === "analise-pv" ? "Pré-Vendas" :
                                  activeTab === "contratos" ? "Contratos" :
                                    activeTab === "gestao" ? "Gestão" :
                                      activeTab === "unidades" ? "Unidades" :
                                        activeTab === "metas" ? "Metas" :
                                          activeTab === "perfil" ? "Perfil" : ""}
              </span>
            </div>
            <NotificationBell />
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
                    {(isAdmin || isGerente || roles.includes("closer") || roles.includes("sdr")) && <DailyFormCloser />}
                    {(isAdmin || isGerente || roles.includes("closer") || roles.includes("sdr")) && <DailyFormPreVendas />}
                  </div>
                </div>
              )}
              {activeTab === "conferencia" && <SubmissionAudit />}
              {activeTab === "analise-propostas" && <ProposalAnalysis />}
              {activeTab === "analise-pv" && <PreSalesAnalysis />}
              {activeTab === "contratos" && <ContractsView />}
              {activeTab === "gestao" && (isAdmin || isGerente) && <ManagementView />}
              {activeTab === "unidades" && isAdmin && <UnitView />}
              {activeTab === "metas" && (isAdmin || isGerente) && <GoalsSettings />}
              {activeTab === "aprovacao" && isAdmin && <AdminApproval />}
              {activeTab === "perfil" && <ProfileView />}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
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
