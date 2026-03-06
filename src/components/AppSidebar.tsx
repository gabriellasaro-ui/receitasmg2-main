import {
  LayoutDashboard,
  Trophy,
  Users,
  Layers,
  FileText,
  BarChart3,
  ClipboardCheck,
  Home,
  Thermometer,
  Zap,
  UserCheck,
  Target,
  LogOut,
  User,
  Settings,
  Moon,
  Sun,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useDashboardStore } from "@/data/store";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ThemeToggle";
import v4Logo from "@/assets/v4logo.png";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";

type Tab =
  | "home" | "dashboard" | "ranking" | "pessoas" | "canais"
  | "formulario" | "conferencia" | "gestao" | "analise-propostas"
  | "analise-pv" | "contratos" | "aprovacao" | "metas" | "unidades" | "perfil";

interface AppSidebarProps {
  activeTab: Tab;
  onNavigate: (tab: string) => void;
}

export function AppSidebar({ activeTab, onNavigate }: AppSidebarProps) {
  const { isAdmin, roles, signOut } = useAuth();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const isGerente = roles.includes("gerente_unidade");

  const mainItems: { id: Tab; label: string; icon: React.ElementType; adminOnly?: boolean; hideForAdmin?: boolean; gerenteOnly?: boolean }[] = [
    { id: "home", label: "Home", icon: Home },
    { id: "dashboard", label: "Painel", icon: LayoutDashboard },
    { id: "ranking", label: "Ranking", icon: Trophy },
    { id: "pessoas", label: "Pessoas", icon: Users },
    { id: "canais", label: "Canais", icon: Layers },
  ];

  const operationItems: { id: Tab; label: string; icon: React.ElementType; adminOnly?: boolean; hideForAdmin?: boolean; gerenteOnly?: boolean }[] = [
    { id: "formulario", label: "Lançamento", icon: FileText, hideForAdmin: true },
    { id: "conferencia", label: "Auditoria", icon: ClipboardCheck },
    { id: "analise-propostas", label: "Propostas", icon: Thermometer },
    { id: "analise-pv", label: "Pré-Vendas", icon: Zap },
    { id: "contratos", label: "Contratos", icon: FileText },
    { id: "gestao", label: "Gestão", icon: BarChart3, gerenteOnly: false },
  ];

  const adminItems: { id: Tab; label: string; icon: React.ElementType; adminOnly?: boolean }[] = [
    { id: "unidades", label: "Unidades", icon: LayoutDashboard, adminOnly: true },
    { id: "metas", label: "Metas", icon: Target },
    { id: "aprovacao", label: "Aprovação", icon: UserCheck, adminOnly: true },
  ];

  const filterItems = (items: typeof mainItems) =>
    items.filter((t) => {
      if (t.adminOnly && !isAdmin) return false;
      if (t.hideForAdmin && isAdmin) return false;
      if (t.id === "metas" && !isAdmin && !isGerente) return false;
      if (t.gerenteOnly && !isGerente && !isAdmin) return false;
      if (t.id === "gestao" && !isGerente && !isAdmin) return false;
      return true;
    });

  const { pendingApprovalsCount } = useDashboardStore();

  const renderGroup = (label: string, items: typeof mainItems) => {
    const visible = filterItems(items);
    if (visible.length === 0) return null;
    return (
      <SidebarGroup>
        <SidebarGroupLabel className="text-[10px] uppercase tracking-[0.15em] font-bold text-muted-foreground/70">
          {label}
        </SidebarGroupLabel>

        <SidebarGroupContent>
          <SidebarMenu>
            {visible.map((item) => (
              <SidebarMenuItem key={item.id}>
                <SidebarMenuButton
                  onClick={() => onNavigate(item.id)}
                  isActive={activeTab === item.id}
                  tooltip={item.label}
                  className="transition-all duration-200"
                >
                  <div className="relative">
                    <item.icon className="w-4 h-4" />
                    {item.id === "aprovacao" && pendingApprovalsCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-destructive rounded-full border-2 border-sidebar-background animate-pulse" />
                    )}
                  </div>
                  <span>{item.label}</span>
                  {item.id === "aprovacao" && pendingApprovalsCount > 0 && !collapsed && (
                    <span className="ml-auto bg-destructive/10 text-destructive text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      {pendingApprovalsCount}
                    </span>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup >
    );
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className={cn("p-4 transition-all duration-200", collapsed && "p-2 items-center")}>
        <button
          onClick={() => onNavigate("home")}
          className={cn(
            "flex items-center gap-3 group transition-all",
            collapsed && "justify-center"
          )}
        >
          <img
            src={v4Logo}
            alt="V4 Company"
            className="h-7 w-auto shrink-0 group-hover:scale-105 transition-transform [filter:brightness(0)_invert(13%)_sepia(93%)_saturate(6144%)_hue-rotate(356deg)_brightness(89%)_contrast(117%)]"
          />
          {!collapsed && (
            <span className="text-xs font-bold tracking-[0.15em] uppercase text-muted-foreground">
              MG2
            </span>
          )}
        </button>
      </SidebarHeader>

      <SidebarContent>
        {renderGroup("Principal", mainItems)}
        <SidebarSeparator />
        {renderGroup("Operacional", operationItems)}
        <SidebarSeparator />
        {renderGroup("Administração", adminItems)}
      </SidebarContent>

      <SidebarFooter className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => onNavigate("perfil")}
              isActive={activeTab === "perfil"}
              tooltip="Perfil"
            >
              <User className="w-4 h-4" />
              <span>Perfil</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <div className="flex items-center px-2 py-1">
              <ThemeToggle />
            </div>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={signOut}
              tooltip="Sair"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className="w-4 h-4" />
              <span>Sair</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
