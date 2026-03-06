import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUnitData } from "@/hooks/useUnitData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { FileText, DollarSign, TrendingUp, Repeat, Zap, Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { formatCurrency, formatPercent, GoalSettings, defaultGoalSettings } from "@/data/seedData";

interface ContractRow {
  id: string;
  leadNome: string;
  canal: string;
  valorTotal: number;
  valorRecorrente: number;
  valorOnetime: number;
  churnM0: number;
  dataReferencia: string;
  responsavelId: string;
  responsavelNome: string;
  tipo: "closer" | "sdr";
  observacoes: string | null;
  unitId: string | null;
}

export function ContractsView() {
  const { isAdmin, profile } = useAuth();
  const [selectedUnit, setSelectedUnit] = useState<string>("all");
  const { members } = useUnitData(isAdmin ? selectedUnit : undefined);
  const [contracts, setContracts] = useState<ContractRow[]>([]);
  const [units, setUnits] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [goals, setGoals] = useState<GoalSettings>(defaultGoalSettings);

  // Load goals for meta display
  useEffect(() => {
    const now = new Date();
    const mesRef = now.getMonth() + 1;
    const anoRef = now.getFullYear();

    let query = supabase
      .from("goals")
      .select("*")
      .eq("mes_ref", mesRef)
      .eq("ano_ref", anoRef);

    if (isAdmin) {
      if (selectedUnit !== "all") {
        query = query.eq("unit_id", selectedUnit);
      } else {
        query = query.is("unit_id", null);
      }
    } else if (profile?.unit_id) {
      query = query.eq("unit_id", profile.unit_id);
    } else {
      query = query.is("unit_id", null);
    }

    query.maybeSingle().then(({ data }) => {
      if (data) {
        setGoals({
          mesRef: data.mes_ref,
          anoRef: data.ano_ref,
          diasUteisTotal: data.dias_uteis_total,
          metaReceitaTotal: Number(data.meta_receita_total),
          metaReceitaRecorrente: Number(data.meta_receita_recorrente),
          metaReceitaOnetime: Number(data.meta_receita_onetime),
          metaChurnM0Max: Number(data.meta_churn_m0_max),
          metaReceitaLiquida: Number(data.meta_receita_liquida),
          metaCaixaMarco60pct: Number(data.meta_caixa_60pct),
          bookingMedioMeses: data.booking_medio_meses,
          metaLeads: data.meta_leads,
          metaConexoes: data.meta_conexoes,
          metaStake: data.meta_stake,
          metaRM: data.meta_rm,
          metaRR: data.meta_rr,
          metaContratos: data.meta_contratos,
          ticketMedio: Number(data.ticket_medio),
          investimentoTotal: Number(data.investimento_total),
          cplMedio: Number(data.cpl_medio),
        });
      } else {
        setGoals(defaultGoalSettings);
      }
    });
  }, [selectedUnit, isAdmin, profile?.unit_id]);

  // Load units for admin filter
  useEffect(() => {
    if (!isAdmin) return;
    supabase.from("units").select("id, name").then(({ data }) => {
      if (data) setUnits(data);
    });
  }, [isAdmin]);

  // Load contracts
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const now = new Date();
      const mesRef = now.getMonth() + 1;
      const anoRef = now.getFullYear();
      const startDate = `${anoRef}-${String(mesRef).padStart(2, "0")}-01`;
      const endDate = `${anoRef}-${String(mesRef).padStart(2, "0")}-31`;

      // Fetch closer sales
      let closerQ = supabase
        .from("closer_sales_detail")
        .select("*")
        .gte("data_referencia", startDate)
        .lte("data_referencia", endDate);

      // Fetch pv contracts
      let pvQ = supabase
        .from("pv_contracts_detail")
        .select("*")
        .gte("data_referencia", startDate)
        .lte("data_referencia", endDate);

      // Unit filtering for non-admins is handled by getting submission unit_ids
      // For closer_sales_detail we need to join with closer_submissions to get unit_id
      const [closerRes, pvRes] = await Promise.all([closerQ, pvQ]);

      // Get unit_ids from submissions for filtering
      let closerSubIds = (closerRes.data || []).map((r: any) => r.submission_id);
      let pvSubIds = (pvRes.data || []).map((r: any) => r.submission_id);

      // Fetch submission unit_ids
      const [csSubRes, pvSubRes] = await Promise.all([
        closerSubIds.length > 0
          ? supabase.from("closer_submissions").select("id, unit_id").in("id", closerSubIds)
          : Promise.resolve({ data: [] }),
        pvSubIds.length > 0
          ? supabase.from("pv_submissions").select("id, unit_id").in("id", pvSubIds)
          : Promise.resolve({ data: [] }),
      ]);

      const csUnitMap = new Map<string, string | null>();
      (csSubRes.data || []).forEach((s: any) => csUnitMap.set(s.id, s.unit_id));
      const pvUnitMap = new Map<string, string | null>();
      (pvSubRes.data || []).forEach((s: any) => pvUnitMap.set(s.id, s.unit_id));

      const userUnitId = profile?.unit_id || null;
      const filterUnit = isAdmin && selectedUnit !== "all" ? selectedUnit : (!isAdmin ? userUnitId : null);

      // Build member name map
      const allUserIds = new Set<string>();
      (closerRes.data || []).forEach((r: any) => allUserIds.add(r.closer_id));
      (pvRes.data || []).forEach((r: any) => allUserIds.add(r.pv_id));

      const { data: profilesData } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", Array.from(allUserIds));

      const nameMap = new Map<string, string>();
      (profilesData || []).forEach((p: any) => nameMap.set(p.user_id, p.full_name));

      const result: ContractRow[] = [];

      // Closer sales
      (closerRes.data || []).forEach((r: any) => {
        const unitId = csUnitMap.get(r.submission_id) || null;
        if (filterUnit && unitId !== filterUnit) return;
        result.push({
          id: r.id,
          leadNome: r.lead_nome,
          canal: r.canal_venda,
          valorTotal: Number(r.valor_total),
          valorRecorrente: Number(r.valor_recorrente),
          valorOnetime: Number(r.valor_onetime),
          churnM0: Number(r.churn_m0),
          dataReferencia: r.data_referencia,
          responsavelId: r.closer_id,
          responsavelNome: nameMap.get(r.closer_id) || "—",
          tipo: "closer",
          observacoes: r.observacoes,
          unitId,
        });
      });

      // PV contracts
      (pvRes.data || []).forEach((r: any) => {
        const unitId = pvUnitMap.get(r.submission_id) || null;
        if (filterUnit && unitId !== filterUnit) return;
        result.push({
          id: r.id,
          leadNome: r.lead_nome,
          canal: r.canal || "—",
          valorTotal: Number(r.valor_total),
          valorRecorrente: Number(r.valor_recorrente),
          valorOnetime: Number(r.valor_onetime),
          churnM0: Number(r.churn_m0),
          dataReferencia: r.data_referencia,
          responsavelId: r.pv_id,
          responsavelNome: nameMap.get(r.pv_id) || "—",
          tipo: "sdr",
          observacoes: r.observacoes,
          unitId,
        });
      });

      // Sort by date desc
      result.sort((a, b) => b.dataReferencia.localeCompare(a.dataReferencia));
      setContracts(result);
      setLoading(false);
    };

    load();
  }, [isAdmin, profile?.unit_id, selectedUnit]);

  const filteredContracts = search
    ? contracts.filter(
      (c) =>
        c.leadNome.toLowerCase().includes(search.toLowerCase()) ||
        c.responsavelNome.toLowerCase().includes(search.toLowerCase()) ||
        c.canal.toLowerCase().includes(search.toLowerCase())
    )
    : contracts;

  const totalContratos = filteredContracts.length;
  const totalValor = filteredContracts.reduce((a, c) => a + c.valorTotal, 0);
  const totalRecorrente = filteredContracts.reduce((a, c) => a + c.valorRecorrente, 0);
  const totalOnetime = filteredContracts.reduce((a, c) => a + c.valorOnetime, 0);

  const fmt = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const kpis = [
    { label: "Contratos Fechados", value: String(totalContratos), meta: goals.metaContratos, icon: FileText, color: "text-primary" },
    { label: "Valor Total", value: fmt(totalValor), meta: goals.metaReceitaTotal, icon: DollarSign, color: "text-accent" },
    { label: "Recorrente", value: fmt(totalRecorrente), meta: goals.metaReceitaRecorrente, icon: Repeat, color: "text-primary" },
    { label: "One-time", value: fmt(totalOnetime), meta: goals.metaReceitaOnetime, icon: Zap, color: "text-primary" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tighter">Contratos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Visão consolidada de todos os contratos fechados no mês
          </p>
        </div>
        {isAdmin && units.length > 0 && (
          <Select value={selectedUnit} onValueChange={setSelectedUnit}>
            <SelectTrigger className="filter-pill w-[240px] border-none shadow-xl">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-full bg-primary/10">
                  <Filter className="w-3.5 h-3.5 text-primary" />
                </div>
                <SelectValue placeholder="Filtrar por unidade" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas Unidades</SelectItem>
              {units.map((u) => (
                <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => {
          const numVal = typeof kpi.value === "string" ? parseFloat(kpi.value.replace(/[^\d,-]/g, "").replace(",", ".")) || 0 : Number(kpi.value);
          const pct = kpi.meta > 0 ? numVal / kpi.meta : 0;
          return (
            <Card key={kpi.label}>
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2.5 rounded-xl bg-muted/50 ${kpi.color}`}>
                    <kpi.icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider truncate">{kpi.label}</p>
                    <p className="text-xl font-bold tracking-tight mt-0.5">{kpi.value}</p>
                  </div>
                </div>
                {kpi.meta > 0 && (
                  <div className="space-y-1.5 pt-2 border-t border-border/40">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-medium text-muted-foreground">
                        Meta: {kpi.label === "Contratos Fechados" ? kpi.meta : fmt(kpi.meta)}
                      </span>
                      <span className={`text-[10px] font-bold tabular ${pct >= 1 ? "text-accent" : "text-destructive"}`}>
                        {(pct * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="h-1 w-full bg-secondary/30 rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all duration-700" style={{ width: `${Math.min(pct * 100, 100)}%` }} />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Search + Table */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="text-lg">Lista de Contratos</CardTitle>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar lead, responsável ou canal..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-primary/20 rounded-full animate-spin border-t-primary" />
            </div>
          ) : filteredContracts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Nenhum contrato encontrado</p>
              <p className="text-xs mt-1">Os contratos lançados aparecerão aqui</p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Lead</th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Responsável</th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Tipo</th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Canal</th>
                    <th className="text-right px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Valor Total</th>
                    <th className="text-right px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Recorrente</th>
                    <th className="text-right px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">One-time</th>
                    <th className="text-right px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Churn M0</th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredContracts.map((c, i) => (
                    <tr key={c.id} className={`border-b border-border/30 hover:bg-muted/30 transition-colors ${i % 2 === 0 ? "" : "bg-muted/10"}`}>
                      <td className="px-6 py-3.5 font-medium">{c.leadNome}</td>
                      <td className="px-4 py-3.5">{c.responsavelNome}</td>
                      <td className="px-4 py-3.5">
                        <Badge variant={c.tipo === "closer" ? "default" : "secondary"} className="text-[10px]">
                          {c.tipo === "closer" ? "Closer" : "SDR"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5 text-muted-foreground">{c.canal}</td>
                      <td className="px-4 py-3.5 text-right font-semibold text-emerald-600 dark:text-emerald-400">{fmt(c.valorTotal)}</td>
                      <td className="px-4 py-3.5 text-right text-blue-600 dark:text-blue-400">{fmt(c.valorRecorrente)}</td>
                      <td className="px-4 py-3.5 text-right text-amber-600 dark:text-amber-400">{fmt(c.valorOnetime)}</td>
                      <td className="px-4 py-3.5 text-right text-destructive">{fmt(c.churnM0)}</td>
                      <td className="px-4 py-3.5 text-muted-foreground">{new Date(c.dataReferencia + "T12:00:00").toLocaleDateString("pt-BR")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
