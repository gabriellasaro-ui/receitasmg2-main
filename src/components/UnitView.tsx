import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Users, FileText, TrendingUp, Phone, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { formatCurrency, formatPercent } from "@/data/seedData";

interface Unit {
  id: string;
  name: string;
}

const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export function UnitView() {
  const now = new Date();
  const [mesRef, setMesRef] = useState(now.getMonth() + 1);
  const [anoRef, setAnoRef] = useState(now.getFullYear());
  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [goal, setGoal] = useState<any>(null);
  const [closerSubs, setCloserSubs] = useState<any[]>([]);
  const [pvSubs, setPvSubs] = useState<any[]>([]);
  const [proposals, setProposals] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);

  useEffect(() => {
    supabase.from("units").select("*").order("name").then(({ data }) => {
      if (data) {
        setUnits(data);
        if (data.length > 0 && !selectedUnit) setSelectedUnit(data[0].id);
      }
      setLoading(false);
    });
  }, []);

  const navigateMonth = (dir: -1 | 1) => {
    let m = mesRef + dir;
    let a = anoRef;
    if (m < 1) { m = 12; a--; }
    if (m > 12) { m = 1; a++; }
    setMesRef(m);
    setAnoRef(a);
  };

  useEffect(() => {
    if (!selectedUnit) return;

    const startDate = `${anoRef}-${String(mesRef).padStart(2, "0")}-01`;
    const endDate = `${anoRef}-${String(mesRef).padStart(2, "0")}-31`;

    const fetchAll = async () => {
      // Get profiles in this unit
      const { data: unitProfiles } = await supabase
        .from("profiles")
        .select("*")
        .eq("unit_id", selectedUnit);

      setProfiles(unitProfiles || []);

      const userIds = (unitProfiles || []).map((p: any) => p.user_id);
      const closerIds = (unitProfiles || []).map((p: any) => p.email);

      // Get goal for this unit & month
      const { data: goalData } = await supabase
        .from("goals")
        .select("*")
        .eq("unit_id", selectedUnit)
        .eq("mes_ref", mesRef)
        .eq("ano_ref", anoRef)
        .maybeSingle();
      setGoal(goalData);

      // Closer submissions
      const { data: csData } = await supabase
        .from("closer_submissions")
        .select("*")
        .eq("unit_id", selectedUnit)
        .gte("data_referencia", startDate)
        .lte("data_referencia", endDate);
      setCloserSubs(csData || []);

      // PV submissions
      const { data: pvData } = await supabase
        .from("pv_submissions")
        .select("*")
        .eq("unit_id", selectedUnit)
        .gte("data_referencia", startDate)
        .lte("data_referencia", endDate);
      setPvSubs(pvData || []);

      // Proposals
      const { data: propData } = await supabase
        .from("closer_proposals_detail")
        .select("*, profiles!inner(unit_id)")
        .eq("profiles.unit_id", selectedUnit)
        .gte("data_referencia", startDate)
        .lte("data_referencia", endDate);
      setProposals(propData || []);

      // Sales
      const { data: salesData } = await supabase
        .from("closer_sales_detail")
        .select("*, profiles!inner(unit_id)")
        .eq("profiles.unit_id", selectedUnit)
        .gte("data_referencia", startDate)
        .lte("data_referencia", endDate);
      setSales(salesData || []);
    };

    fetchAll();
  }, [selectedUnit, mesRef, anoRef]);

  const unitName = units.find((u) => u.id === selectedUnit)?.name || "";

  // Totals
  const totalReceita = closerSubs.reduce((a, s) => a + Number(s.valor_contrato_total || 0), 0);
  const totalRecorrente = closerSubs.reduce((a, s) => a + Number(s.valor_recorrente || 0), 0);
  const totalOnetime = closerSubs.reduce((a, s) => a + Number(s.valor_onetime || 0), 0);
  const totalChurn = closerSubs.reduce((a, s) => a + Number(s.churn_m0 || 0), 0);
  const totalContratos = closerSubs.reduce((a, s) => a + Number(s.contratos_assinados || 0), 0);
  const totalPropostas = closerSubs.reduce((a, s) => a + Number(s.propostas_realizadas || 0), 0);
  const totalCalls = closerSubs.reduce((a, s) => a + Number(s.calls_realizadas || 0), 0);
  const totalNoShow = closerSubs.reduce((a, s) => a + Number(s.no_show || 0), 0);

  const pvCallsMarcadas = pvSubs.reduce((a, s) => a + Number(s.calls_marcadas || 0), 0);
  const pvCallsRealizadas = pvSubs.reduce((a, s) => a + Number(s.calls_realizadas || 0), 0);
  const pvNoShow = pvSubs.reduce((a, s) => a + Number(s.no_show || 0), 0);
  const pvContratos = pvSubs.reduce((a, s) => a + Number(s.contratos_assinados || 0), 0);

  const totalPropostasDetail = proposals.length;
  const propostasAbertas = proposals.filter((p) => p.status_proposta === "aberta").length;
  const propostasFechadas = proposals.filter((p) => p.status_proposta === "fechada").length;
  const propostasPerdidas = proposals.filter((p) => p.status_proposta === "perdida").length;
  const valorPropostas = proposals.reduce((a, p) => a + Number(p.valor_proposta || 0), 0);

  const totalVendas = sales.length;
  const valorVendas = sales.reduce((a, s) => a + Number(s.valor_total || 0), 0);

  const metaReceita = goal?.meta_receita_total || 0;
  const pctMeta = metaReceita > 0 ? totalReceita / metaReceita : 0;

  if (loading) return <p className="text-sm text-muted-foreground py-8 text-center">Carregando...</p>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Building2 className="w-6 h-6 text-primary" />
            Visão por Unidade
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Acompanhamento detalhado por unidade</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Month nav */}
          <div className="flex items-center gap-1 bg-card border border-border rounded-xl px-2 py-1.5">
            <button onClick={() => navigateMonth(-1)} className="p-1 rounded-lg hover:bg-secondary">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-semibold px-2 min-w-[80px] text-center">
              {MESES[mesRef - 1]}/{anoRef}
            </span>
            <button onClick={() => navigateMonth(1)} className="p-1 rounded-lg hover:bg-secondary">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Unit selector */}
          <Select value={selectedUnit} onValueChange={setSelectedUnit}>
            <SelectTrigger className="h-9 min-w-[200px]">
              <SelectValue placeholder="Selecione a unidade" />
            </SelectTrigger>
            <SelectContent>
              {units.map((u) => (
                <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiMini label="Receita Total" value={formatCurrency(totalReceita)} sub={metaReceita > 0 ? `Meta: ${formatCurrency(metaReceita)}` : undefined} />
        <KpiMini label="Recorrente" value={formatCurrency(totalRecorrente)} />
        <KpiMini label="One-Time" value={formatCurrency(totalOnetime)} />
        <KpiMini label="Churn M0" value={formatCurrency(totalChurn)} />
        <KpiMini label="Contratos" value={String(totalContratos)} sub={goal?.meta_contratos ? `Meta: ${goal.meta_contratos}` : undefined} />
        <KpiMini label="% Meta" value={metaReceita > 0 ? formatPercent(pctMeta) : "—"} />
      </div>

      {/* Closer details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Phone className="w-4 h-4 text-muted-foreground" />
              Closer — Calls & Vendas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <KpiMini label="Calls Realizadas" value={String(totalCalls)} compact />
              <KpiMini label="No Show" value={String(totalNoShow)} compact />
              <KpiMini label="Propostas" value={String(totalPropostas)} compact />
              <KpiMini label="Contratos" value={String(totalContratos)} compact />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
              Propostas Detalhadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <KpiMini label="Total Propostas" value={String(totalPropostasDetail)} compact />
              <KpiMini label="Valor Total" value={formatCurrency(valorPropostas)} compact />
              <KpiMini label="Abertas" value={String(propostasAbertas)} compact />
              <KpiMini label="Fechadas" value={String(propostasFechadas)} compact />
              <KpiMini label="Perdidas" value={String(propostasPerdidas)} compact />
              <KpiMini label="Vendas" value={`${totalVendas} — ${formatCurrency(valorVendas)}`} compact />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              Pré-Venda
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <KpiMini label="Calls Marcadas" value={String(pvCallsMarcadas)} compact />
              <KpiMini label="Calls Realizadas" value={String(pvCallsRealizadas)} compact />
              <KpiMini label="No Show" value={String(pvNoShow)} compact />
              <KpiMini label="Contratos PV" value={String(pvContratos)} compact />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              Equipe ({profiles.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {profiles.length === 0 ? (
              <p className="text-xs text-muted-foreground">Nenhum membro cadastrado nesta unidade.</p>
            ) : (
              <div className="space-y-2">
                {profiles.map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-secondary/40 text-xs">
                    <span className="font-medium">{p.full_name}</span>
                    <span className="text-muted-foreground">{p.email}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function KpiMini({ label, value, sub, compact }: { label: string; value: string; sub?: string; compact?: boolean }) {
  return (
    <div className={`rounded-xl border border-border bg-card ${compact ? "p-3" : "p-4"}`}>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1">{label}</p>
      <p className={`font-bold tabular ${compact ? "text-sm" : "text-lg"}`}>{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}
