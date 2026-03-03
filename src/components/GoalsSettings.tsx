import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, Save, Plus, Trash2, Building2, Calendar, ChevronLeft, ChevronRight, Copy, Eye, Pencil, X } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency, formatPercent } from "@/data/seedData";
import { useDashboardStore } from "@/data/store";

interface GoalRow {
  id: string;
  unit_id: string | null;
  label: string;
  mes_ref: number;
  ano_ref: number;
  dias_uteis_total: number;
  meta_receita_total: number;
  meta_receita_recorrente: number;
  meta_receita_onetime: number;
  meta_churn_m0_max: number;
  meta_receita_liquida: number;
  meta_caixa_60pct: number;
  booking_medio_meses: number;
  meta_leads: number;
  meta_conexoes: number;
  meta_stake: number;
  meta_rm: number;
  meta_rr: number;
  meta_contratos: number;
  ticket_medio: number;
  investimento_total: number;
  cpl_medio: number;
}

interface Unit {
  id: string;
  name: string;
}

const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

const regionalFields: { key: keyof GoalRow; label: string; type: "number" | "currency" }[] = [
  { key: "dias_uteis_total", label: "Dias Úteis", type: "number" },
  { key: "meta_receita_total", label: "Meta Receita Total", type: "currency" },
  { key: "meta_receita_recorrente", label: "Receita Recorrente", type: "currency" },
  { key: "meta_receita_onetime", label: "Receita One-Time", type: "currency" },
  { key: "meta_churn_m0_max", label: "Churn M0 Máx", type: "currency" },
  { key: "meta_receita_liquida", label: "Receita Líquida", type: "currency" },
  { key: "meta_contratos", label: "Contratos", type: "number" },
];

const unitFields: { key: keyof GoalRow; label: string; type: "number" | "currency" }[] = [
  { key: "dias_uteis_total", label: "Dias Úteis", type: "number" },
  { key: "meta_receita_total", label: "Meta Receita Total", type: "currency" },
  { key: "meta_receita_recorrente", label: "Receita Recorrente", type: "currency" },
  { key: "meta_receita_onetime", label: "Receita One-Time", type: "currency" },
  { key: "meta_churn_m0_max", label: "Churn M0 Máx", type: "currency" },
  { key: "meta_receita_liquida", label: "Receita Líquida", type: "currency" },
  { key: "meta_caixa_60pct", label: "Caixa (60%)", type: "currency" },
  { key: "meta_leads", label: "Leads", type: "number" },
  { key: "meta_conexoes", label: "Conexões", type: "number" },
  { key: "meta_stake", label: "Stake", type: "number" },
  { key: "meta_rm", label: "RM", type: "number" },
  { key: "meta_rr", label: "RR", type: "number" },
  { key: "meta_contratos", label: "Contratos", type: "number" },
  { key: "ticket_medio", label: "Ticket Médio", type: "currency" },
  { key: "investimento_total", label: "Investimento", type: "currency" },
  { key: "cpl_medio", label: "CPL Médio", type: "currency" },
  { key: "booking_medio_meses", label: "Booking (meses)", type: "number" },
];

export function GoalsSettings() {
  const { isAdmin, profile, roles } = useAuth();
  const isGerente = roles.includes("gerente_unidade");
  const gerenteUnitId = profile?.unit_id || null;
  const { getTotais } = useDashboardStore();
  const totais = getTotais();

  const now = new Date();
  const [mesRef, setMesRef] = useState(now.getMonth() + 1);
  const [anoRef, setAnoRef] = useState(now.getFullYear());
  const [goals, setGoals] = useState<GoalRow[]>([]);
  const [regionalGoal, setRegionalGoal] = useState<GoalRow | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [activeUnitId, setActiveUnitId] = useState<string | null>(
    isGerente && !isAdmin && gerenteUnitId ? gerenteUnitId : "regional"
  );
  const [deleting, setDeleting] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);

    // For gerente: fetch their unit goal + regional goal (read-only)
    if (isGerente && !isAdmin && gerenteUnitId) {
      const [unitGoalsRes, regionalGoalRes, unitsRes] = await Promise.all([
        supabase.from("goals").select("*").eq("mes_ref", mesRef).eq("ano_ref", anoRef).eq("unit_id", gerenteUnitId),
        supabase.from("goals").select("*").eq("mes_ref", mesRef).eq("ano_ref", anoRef).is("unit_id", null).maybeSingle(),
        supabase.from("units").select("*").order("name"),
      ]);

      setGoals((unitGoalsRes.data as GoalRow[]) || []);
      setRegionalGoal((regionalGoalRes.data as GoalRow) || null);
      setUnits((unitsRes.data || []).filter(u => u.id === gerenteUnitId));
    } else {
      const [goalsRes, unitsRes] = await Promise.all([
        supabase.from("goals").select("*").eq("mes_ref", mesRef).eq("ano_ref", anoRef).order("label"),
        supabase.from("units").select("*").order("name"),
      ]);
      setGoals((goalsRes.data as GoalRow[]) || []);
      setRegionalGoal(null);
      setUnits(unitsRes.data || []);
    }

    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [mesRef, anoRef]);

  const navigateMonth = (dir: -1 | 1) => {
    let m = mesRef + dir;
    let a = anoRef;
    if (m < 1) { m = 12; a--; }
    if (m > 12) { m = 1; a++; }
    setMesRef(m);
    setAnoRef(a);
  };

  const handleChange = (goalId: string, key: keyof GoalRow, value: string) => {
    setGoals((prev) =>
      prev.map((g) => g.id === goalId ? { ...g, [key]: value === "" ? 0 : Number(value) } : g)
    );
  };

  const handleSave = async (goal: GoalRow) => {
    setSaving(goal.id);
    const { id, ...data } = goal;
    const { error } = await supabase.from("goals").update(data as any).eq("id", id);
    if (error) toast.error("Erro ao salvar: " + error.message);
    else {
      toast.success(`Salvo com sucesso!`);
      setEditing(null);
    }
    setSaving(null);
  };

  const handleCreateGoal = async (unitId: string | null, unitName: string) => {
    const existing = goals.find((g) =>
      unitId === null ? g.unit_id === null : g.unit_id === unitId
    );
    if (existing) {
      setActiveUnitId(unitId === null ? "regional" : unitId);
      toast.info("Meta já existe para este mês.");
      return;
    }

    const label = unitId === null ? "Meta Regional" : `Meta ${unitName}`;
    const { data, error } = await supabase
      .from("goals")
      .insert({ unit_id: unitId, label, mes_ref: mesRef, ano_ref: anoRef } as any)
      .select()
      .single();

    if (error) toast.error("Erro: " + error.message);
    else if (data) {
      toast.success(`Meta criada para ${MESES[mesRef - 1]}/${anoRef}`);
      setGoals((prev) => [...prev, data as GoalRow]);
      setActiveUnitId(unitId === null ? "regional" : unitId);
    }
  };

  const handleCreateAllForMonth = async () => {
    const toCreate: { unit_id: string | null; label: string }[] = [];

    if (!goals.find((g) => g.unit_id === null)) {
      toCreate.push({ unit_id: null, label: "Meta Regional" });
    }
    for (const u of units) {
      if (!goals.find((g) => g.unit_id === u.id)) {
        toCreate.push({ unit_id: u.id, label: `Meta ${u.name}` });
      }
    }

    if (toCreate.length === 0) {
      toast.info("Todas as metas já existem para este mês.");
      return;
    }

    const inserts = toCreate.map((t) => ({ ...t, mes_ref: mesRef, ano_ref: anoRef }));
    const { error } = await supabase.from("goals").insert(inserts as any);
    if (error) toast.error("Erro: " + error.message);
    else {
      toast.success(`${toCreate.length} metas criadas!`);
      fetchData();
    }
  };

  const handleDelete = async (goalId: string) => {
    const goal = goals.find((g) => g.id === goalId);
    if (!goal || !confirm(`Excluir "${goal.label}"?`)) return;

    setDeleting(goalId);
    const { error } = await supabase.from("goals").delete().eq("id", goalId);
    if (error) toast.error("Erro: " + error.message);
    else {
      toast.success("Excluída.");
      setGoals((prev) => prev.filter((g) => g.id !== goalId));
    }
    setDeleting(null);
  };

  const handleCopyFromPreviousMonth = async () => {
    let prevMonth = mesRef - 1;
    let prevYear = anoRef;
    if (prevMonth < 1) { prevMonth = 12; prevYear--; }

    const { data: prevGoals } = await supabase
      .from("goals")
      .select("*")
      .eq("mes_ref", prevMonth)
      .eq("ano_ref", prevYear);

    if (!prevGoals || prevGoals.length === 0) {
      toast.error(`Nenhuma meta encontrada em ${MESES[prevMonth - 1]}/${prevYear}`);
      return;
    }

    const inserts = prevGoals
      .filter((pg: any) => !goals.find((g) =>
        pg.unit_id === null ? g.unit_id === null : g.unit_id === pg.unit_id
      ))
      .map((pg: any) => {
        const { id, created_at, updated_at, ...rest } = pg;
        return { ...rest, mes_ref: mesRef, ano_ref: anoRef };
      });

    if (inserts.length === 0) {
      toast.info("Todas as metas já existem neste mês.");
      return;
    }

    const { error } = await supabase.from("goals").insert(inserts as any);
    if (error) toast.error("Erro: " + error.message);
    else {
      toast.success(`${inserts.length} metas copiadas de ${MESES[prevMonth - 1]}/${prevYear}!`);
      fetchData();
    }
  };

  // Current selected goal
  const currentGoal = goals.find((g) =>
    activeUnitId === "regional" ? g.unit_id === null : g.unit_id === activeUnitId
  );

  // Units with goals this month
  const unitsWithGoals = units.filter((u) => goals.some((g) => g.unit_id === u.id));
  const hasRegional = goals.some((g) => g.unit_id === null);

  // Gerente contribution calculation
  const gerenteContribution = (regionalGoal: GoalRow, unitGoal: GoalRow) => {
    const fields: { label: string; unitVal: number; regionalVal: number }[] = [
      { label: "Receita Total", unitVal: unitGoal.meta_receita_total, regionalVal: regionalGoal.meta_receita_total },
      { label: "Recorrente", unitVal: unitGoal.meta_receita_recorrente, regionalVal: regionalGoal.meta_receita_recorrente },
      { label: "One-Time", unitVal: unitGoal.meta_receita_onetime, regionalVal: regionalGoal.meta_receita_onetime },
      { label: "Contratos", unitVal: unitGoal.meta_contratos, regionalVal: regionalGoal.meta_contratos },
    ];
    return fields;
  };

  if (loading) return <p className="text-sm text-muted-foreground py-8 text-center">Carregando...</p>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Settings className="w-6 h-6 text-primary" />
            Configuração de Metas
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Defina e gerencie metas mês a mês</p>
        </div>

        {/* Month navigator */}
        <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-2 py-1.5">
          <button onClick={() => navigateMonth(-1)} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-1.5 px-3 min-w-[120px] justify-center">
            <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-sm font-semibold">{MESES[mesRef - 1]} / {anoRef}</span>
          </div>
          <button onClick={() => navigateMonth(1)} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Actions - only for admin */}
      {isAdmin && (
        <div className="flex flex-wrap items-center gap-2">
          {goals.length === 0 && (
            <>
              <Button size="sm" onClick={handleCreateAllForMonth} className="gap-1.5">
                <Plus className="w-3.5 h-3.5" />
                Criar todas as metas para {MESES[mesRef - 1]}
              </Button>
              <Button size="sm" variant="outline" onClick={handleCopyFromPreviousMonth} className="gap-1.5">
                <Copy className="w-3.5 h-3.5" />
                Copiar do mês anterior
              </Button>
            </>
          )}
        </div>
      )}

      {/* Gerente: create unit goal if doesn't exist */}
      {isGerente && !isAdmin && goals.length === 0 && gerenteUnitId && (
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" onClick={() => {
            const u = units.find(u => u.id === gerenteUnitId);
            if (u) handleCreateGoal(u.id, u.name);
          }} className="gap-1.5">
            <Plus className="w-3.5 h-3.5" />
            Criar meta da unidade para {MESES[mesRef - 1]}
          </Button>
        </div>
      )}

      {/* Gerente: Regional goal read-only card */}
      {isGerente && !isAdmin && regionalGoal && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Eye className="w-4 h-4 text-primary" />
              <span>Meta Regional</span>
              <span className="text-xs text-muted-foreground font-normal">
                {MESES[regionalGoal.mes_ref - 1]}/{regionalGoal.ano_ref} · Somente leitura
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {regionalFields.map((f) => {
                const val = Number((regionalGoal as any)[f.key]) || 0;
                return (
                  <div key={f.key} className="space-y-1">
                    <p className="text-[11px] text-muted-foreground">{f.label}</p>
                    <p className="text-sm font-semibold tabular">
                      {f.type === "currency" ? formatCurrency(val) : val}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Contribution breakdown */}
            {currentGoal && currentGoal.unit_id && (
              <div className="mt-5 pt-4 border-t border-border/60">
                <p className="text-[11px] font-semibold text-muted-foreground mb-3">SUA CONTRIBUIÇÃO PARA A REGIONAL</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {gerenteContribution(regionalGoal, currentGoal).map((item) => {
                    const pct = item.regionalVal > 0 ? item.unitVal / item.regionalVal : 0;
                    return (
                      <div key={item.label} className="kpi-card p-3">
                        <p className="text-[10px] text-muted-foreground">{item.label}</p>
                        <p className="text-lg font-bold tabular text-primary">{formatPercent(pct)}</p>
                        <p className="text-[10px] text-muted-foreground tabular">
                          {typeof item.unitVal === "number" && item.unitVal > 100
                            ? formatCurrency(item.unitVal)
                            : item.unitVal} / {typeof item.regionalVal === "number" && item.regionalVal > 100
                            ? formatCurrency(item.regionalVal)
                            : item.regionalVal}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Unit tabs - admin only, no "Adicionar..." dropdown */}
      {goals.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {hasRegional && isAdmin && (
            <button
              onClick={() => setActiveUnitId("regional")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                activeUnitId === "regional"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border hover:border-primary/30"
              }`}
            >
              Regional
            </button>
          )}
          {unitsWithGoals.map((u) => (
            <button
              key={u.id}
              onClick={() => setActiveUnitId(u.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                activeUnitId === u.id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border hover:border-primary/30"
              }`}
            >
              {u.name}
            </button>
          ))}
        </div>
      )}

      {/* Goal card - static or edit mode */}
      {currentGoal && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-muted-foreground" />
                <span>{currentGoal.label}</span>
                <span className="text-xs text-muted-foreground font-normal">
                  {MESES[currentGoal.mes_ref - 1]}/{currentGoal.ano_ref}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {isAdmin && editing === currentGoal.id && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(currentGoal.id)}
                    disabled={deleting === currentGoal.id}
                    className="gap-1 text-destructive hover:text-destructive h-8 text-xs"
                  >
                    <Trash2 className="w-3 h-3" />
                    Excluir
                  </Button>
                )}
                {editing === currentGoal.id ? (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => { setEditing(null); fetchData(); }}
                      className="gap-1 h-8 text-xs"
                    >
                      <X className="w-3 h-3" />
                      Cancelar
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleSave(currentGoal)}
                      disabled={saving === currentGoal.id}
                      className="gap-1 h-8 text-xs"
                    >
                      <Save className="w-3 h-3" />
                      {saving === currentGoal.id ? "Salvando..." : "Salvar"}
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditing(currentGoal.id)}
                    className="gap-1 h-8 text-xs"
                  >
                    <Pencil className="w-3 h-3" />
                    Editar
                  </Button>
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {editing === currentGoal.id ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {(currentGoal.unit_id === null ? regionalFields : unitFields).map((f) => (
                  <div key={f.key} className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">{f.label}</Label>
                    <Input
                      type="number"
                      value={(currentGoal as any)[f.key] || ""}
                      onChange={(e) => handleChange(currentGoal.id, f.key, e.target.value)}
                      className="h-8 text-sm tabular"
                      step={f.type === "currency" ? "0.01" : "1"}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {(currentGoal.unit_id === null ? regionalFields : unitFields).map((f) => {
                  const val = Number((currentGoal as any)[f.key]) || 0;
                  return (
                    <div key={f.key} className="space-y-1">
                      <p className="text-[11px] text-muted-foreground">{f.label}</p>
                      <p className="text-sm font-semibold tabular h-8 flex items-center">
                        {f.type === "currency" ? formatCurrency(val) : val}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {goals.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Calendar className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm font-medium">Nenhuma meta para {MESES[mesRef - 1]}/{anoRef}</p>
          <p className="text-xs mt-1">Crie metas novas ou copie do mês anterior.</p>
        </div>
      )}

      {!currentGoal && goals.length > 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Building2 className="w-8 h-8 mx-auto mb-3 opacity-40" />
          <p className="text-sm">Selecione uma unidade acima para editar a meta.</p>
        </div>
      )}
    </div>
  );
}
