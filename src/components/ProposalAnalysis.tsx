import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { channels, formatCurrency, formatPercent } from "@/data/seedData";
import { useAuth } from "@/hooks/useAuth";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Search, Thermometer, FileText, DollarSign, Target, Filter } from "lucide-react";

interface ProposalRow {
  id: string;
  data_referencia: string;
  closer_id: string;
  lead_nome: string;
  canal_proposta: string | null;
  temperatura_proposta: "frio" | "morno" | "quente";
  valor_proposta: number;
  status_proposta: string | null;
  observacao: string | null;
  unit_id: string | null;
}

interface SaleRow {
  closer_id: string;
  lead_nome: string;
  valor_total: number;
}

interface ProfileOption {
  user_id: string;
  full_name: string;
}

const TEMP_COLORS = { frio: "hsl(210, 70%, 55%)", morno: "hsl(43, 96%, 56%)", quente: "hsl(0, 80%, 48%)" };
const TEMP_LABELS = { frio: "🔵 Frio", morno: "🟡 Morno", quente: "🔴 Quente" };

export function ProposalAnalysis() {
  const { isAdmin, profile } = useAuth();
  const [proposals, setProposals] = useState<ProposalRow[]>([]);
  const [sales, setSales] = useState<SaleRow[]>([]);
  const [members, setMembers] = useState<ProfileOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCloser, setFilterCloser] = useState("todos");
  const [filterCanal, setFilterCanal] = useState("todos");
  const [filterTemp, setFilterTemp] = useState("todos");
  const [unitsList, setUnitsList] = useState<{ id: string; name: string }[]>([]);
  const [selectedUnitId, setSelectedUnitId] = useState<string>("all");

  const effectiveUnitId = isAdmin
    ? (selectedUnitId !== "all" ? selectedUnitId : null)
    : (profile?.unit_id || null);

  // Fetch units for admin filter
  useEffect(() => {
    if (!isAdmin) return;
    supabase.from("units").select("id, name").order("name").then(({ data }) => {
      if (data) setUnitsList(data);
    });
  }, [isAdmin]);

  useEffect(() => {
    async function load() {
      setLoading(true);

      let propQuery = supabase.from("closer_proposals_detail").select("*").order("data_referencia", { ascending: false });
      let salesQuery = supabase.from("closer_sales_detail").select("closer_id, lead_nome, valor_total");

      if (effectiveUnitId) {
        propQuery = propQuery.eq("unit_id", effectiveUnitId);
      }

      let profilesQuery = supabase.from("profiles").select("user_id, full_name").eq("status", "approved" as any);
      if (effectiveUnitId) {
        profilesQuery = profilesQuery.eq("unit_id", effectiveUnitId);
      }

      const [propRes, salesRes, profilesRes] = await Promise.all([propQuery, salesQuery, profilesQuery]);
      if (propRes.data) setProposals(propRes.data);
      if (salesRes.data) setSales(salesRes.data);
      if (profilesRes.data) setMembers(profilesRes.data);
      setLoading(false);
    }
    load();
  }, [effectiveUnitId]);

  const filtered = useMemo(() => {
    return proposals.filter(p => {
      if (filterCloser !== "todos" && p.closer_id !== filterCloser) return false;
      if (filterCanal !== "todos" && p.canal_proposta !== filterCanal) return false;
      if (filterTemp !== "todos" && p.temperatura_proposta !== filterTemp) return false;
      return true;
    });
  }, [proposals, filterCloser, filterCanal, filterTemp]);

  // KPIs
  const totalPropostas = filtered.length;
  const valorTotal = filtered.reduce((a, p) => a + Number(p.valor_proposta), 0);
  const ticketMedio = totalPropostas > 0 ? valorTotal / totalPropostas : 0;

  const tempCounts = { frio: 0, morno: 0, quente: 0 };
  const tempValues = { frio: 0, morno: 0, quente: 0 };
  filtered.forEach(p => {
    tempCounts[p.temperatura_proposta]++;
    tempValues[p.temperatura_proposta] += Number(p.valor_proposta);
  });

  const salesLookup = new Set(sales.map(s => `${s.closer_id}|${s.lead_nome.toLowerCase()}`));
  const matchedSales = filtered.filter(p => salesLookup.has(`${p.closer_id}|${p.lead_nome.toLowerCase()}`));
  const taxaFechamento = totalPropostas > 0 ? matchedSales.length / totalPropostas : 0;

  // Chart data
  const barDataQty = Object.entries(tempCounts).map(([k, v]) => ({ temp: TEMP_LABELS[k as keyof typeof TEMP_LABELS], count: v, fill: TEMP_COLORS[k as keyof typeof TEMP_COLORS] }));
  const barDataVal = Object.entries(tempValues).map(([k, v]) => ({ temp: TEMP_LABELS[k as keyof typeof TEMP_LABELS], value: v, fill: TEMP_COLORS[k as keyof typeof TEMP_COLORS] }));
  const pieData = Object.entries(tempCounts).filter(([, v]) => v > 0).map(([k, v]) => ({ name: TEMP_LABELS[k as keyof typeof TEMP_LABELS], value: v, fill: TEMP_COLORS[k as keyof typeof TEMP_COLORS] }));

  const closerName = (id: string) => members.find(m => m.user_id === id)?.full_name || id;
  const canalName = (id: string | null) => channels.find(c => c.id === id)?.nome || id || "—";

  return (
    <div className="space-y-8 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Análise de Propostas & Temperatura</h1>
        <p className="text-sm text-muted-foreground mt-1">Propostas registradas, temperatura e conversão por closer</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        {isAdmin && unitsList.length > 0 && (
          <Select value={selectedUnitId} onValueChange={setSelectedUnitId}>
            <SelectTrigger className="filter-pill w-[240px] border-none shadow-xl">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-full bg-primary/10">
                  <Filter className="w-3.5 h-3.5 text-primary" />
                </div>
                <SelectValue placeholder="Todas unidades" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas Unidades</SelectItem>
              {unitsList.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
        <Select value={filterCloser} onValueChange={setFilterCloser}>
          <SelectTrigger className="filter-pill w-[200px] border-none shadow-xl">
            <div className="flex items-center gap-2">
              <SelectValue placeholder="Closer" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos Closers</SelectItem>
            {members.map(m => <SelectItem key={m.user_id} value={m.user_id}>{m.full_name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterCanal} onValueChange={setFilterCanal}>
          <SelectTrigger className="filter-pill w-[200px] border-none shadow-xl">
            <div className="flex items-center gap-2">
              <SelectValue placeholder="Canal" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos Canais</SelectItem>
            {channels.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterTemp} onValueChange={setFilterTemp}>
          <SelectTrigger className="filter-pill w-[180px] border-none shadow-xl">
            <div className="flex items-center gap-2">
              <SelectValue placeholder="Temperatura" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas</SelectItem>
            <SelectItem value="frio">🔵 Frio</SelectItem>
            <SelectItem value="morno">🟡 Morno</SelectItem>
            <SelectItem value="quente">🔴 Quente</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="kpi-card text-center py-16">
          <p className="text-muted-foreground">Carregando dados...</p>
        </div>
      ) : totalPropostas === 0 ? (
        <div className="kpi-card text-center py-16">
          <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-base font-semibold mb-2">Nenhuma proposta registrada</h3>
          <p className="text-sm text-muted-foreground">Propostas aparecerão aqui conforme forem lançadas no formulário de Closer.</p>
        </div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="kpi-card p-5">
              <div className="flex items-center gap-1.5 mb-2"><FileText className="w-3.5 h-3.5 text-muted-foreground" /><p className="kpi-label">Total Propostas</p></div>
              <p className="kpi-value-sm tabular">{totalPropostas}</p>
            </div>
            <div className="kpi-card p-5">
              <div className="flex items-center gap-1.5 mb-2"><DollarSign className="w-3.5 h-3.5 text-muted-foreground" /><p className="kpi-label">Valor Total</p></div>
              <p className="kpi-value-sm tabular">{formatCurrency(valorTotal)}</p>
            </div>
            <div className="kpi-card p-5">
              <div className="flex items-center gap-1.5 mb-2"><Target className="w-3.5 h-3.5 text-muted-foreground" /><p className="kpi-label">Ticket Médio</p></div>
              <p className="kpi-value-sm tabular">{formatCurrency(ticketMedio)}</p>
            </div>
            {(["frio", "morno", "quente"] as const).map(t => (
              <div key={t} className="kpi-card p-5">
                <div className="flex items-center gap-1.5 mb-2"><Thermometer className="w-3.5 h-3.5 text-muted-foreground" /><p className="kpi-label">{TEMP_LABELS[t]}</p></div>
                <p className="kpi-value-sm tabular">{tempCounts[t]} <span className="text-[11px] text-muted-foreground font-normal">({totalPropostas > 0 ? formatPercent(tempCounts[t] / totalPropostas) : "0%"})</span></p>
              </div>
            ))}
          </div>

          {/* Taxa de fechamento */}
          <div className="kpi-card p-5">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-primary" />
              <p className="text-sm font-semibold">Taxa de Fechamento por Temperatura</p>
            </div>
            <p className="text-[28px] font-bold tabular text-primary">{formatPercent(taxaFechamento)}</p>
            <p className="text-[11px] text-muted-foreground mt-1">{matchedSales.length} de {totalPropostas} propostas viraram venda</p>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="kpi-card p-5">
              <p className="text-[12px] font-semibold mb-4">Propostas por Temperatura (Qtd)</p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={barDataQty}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="temp" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" name="Quantidade" radius={[4, 4, 0, 0]}>
                    {barDataQty.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="kpi-card p-5">
              <p className="text-[12px] font-semibold mb-4">Valor Proposto por Temperatura</p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={barDataVal}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="temp" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Bar dataKey="value" name="Valor" radius={[4, 4, 0, 0]}>
                    {barDataVal.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="kpi-card p-5">
              <p className="text-[12px] font-semibold mb-4">Distribuição de Temperatura</p>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={40} paddingAngle={2}>
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Table */}
          <div className="kpi-card p-0 overflow-hidden">
            <div className="px-5 pt-5 pb-3">
              <p className="text-[12px] font-semibold">Propostas Detalhadas</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="table-header-v4">
                    <th className="px-4 py-2.5 text-left">Data</th>
                    <th className="px-4 py-2.5 text-left">Closer</th>
                    <th className="px-4 py-2.5 text-left">Lead/Projeto</th>
                    <th className="px-4 py-2.5 text-left">Canal</th>
                    <th className="px-4 py-2.5 text-center">Temperatura</th>
                    <th className="px-4 py-2.5 text-right">Valor</th>
                    <th className="px-4 py-2.5 text-center">Virou Venda?</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(p => {
                    const isVenda = salesLookup.has(`${p.closer_id}|${p.lead_nome.toLowerCase()}`);
                    return (
                      <tr key={p.id} className="table-row-v4">
                        <td className="px-4 py-2.5 tabular">{p.data_referencia}</td>
                        <td className="px-4 py-2.5 font-medium">{closerName(p.closer_id)}</td>
                        <td className="px-4 py-2.5">{p.lead_nome}</td>
                        <td className="px-4 py-2.5">{canalName(p.canal_proposta)}</td>
                        <td className="px-4 py-2.5 text-center">{TEMP_LABELS[p.temperatura_proposta]}</td>
                        <td className="px-4 py-2.5 text-right tabular">{formatCurrency(Number(p.valor_proposta))}</td>
                        <td className="px-4 py-2.5 text-center">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold ${isVenda ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"}`}>
                            {isVenda ? "✓ Sim" : "Não"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
