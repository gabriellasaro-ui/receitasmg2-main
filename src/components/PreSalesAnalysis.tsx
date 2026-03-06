import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { channels, formatCurrency, formatPercent } from "@/data/seedData";
import { useAuth } from "@/hooks/useAuth";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Phone, PhoneCall, PhoneOff, RefreshCw, FileSignature, Zap, Users, Filter } from "lucide-react";

interface BookedCallRow {
  id: string;
  data_referencia: string;
  pv_id: string;
  lead_nome: string;
  tipo_lead: string | null;
  punch: string | null;
  canal: string | null;
  unit_id: string | null;
}

interface RealizedCallRow {
  id: string;
  data_referencia: string;
  pv_id: string;
  lead_nome: string;
  tipo_lead: string | null;
  observacao: string | null;
  unit_id: string | null;
}

interface PvSubmissionRow {
  pv_id: string;
  calls_marcadas: number;
  calls_realizadas: number;
  no_show: number;
  reagendamentos: number;
  contratos_assinados: number;
  unit_id: string | null;
}

interface ProfileOption {
  user_id: string;
  full_name: string;
}

export function PreSalesAnalysis() {
  const { isAdmin, profile } = useAuth();
  const [bookedCalls, setBookedCalls] = useState<BookedCallRow[]>([]);
  const [realizedCalls, setRealizedCalls] = useState<RealizedCallRow[]>([]);
  const [submissions, setSubmissions] = useState<PvSubmissionRow[]>([]);
  const [members, setMembers] = useState<ProfileOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterPv, setFilterPv] = useState("todos");
  const [filterTipoLead, setFilterTipoLead] = useState("todos");
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

      let bookedQuery = supabase.from("pv_booked_calls_detail").select("*").order("data_referencia", { ascending: false });
      let realizedQuery = supabase.from("pv_realized_calls_detail").select("*").order("data_referencia", { ascending: false });
      let subsQuery = supabase.from("pv_submissions").select("pv_id, calls_marcadas, calls_realizadas, no_show, reagendamentos, contratos_assinados, unit_id");

      if (effectiveUnitId) {
        bookedQuery = bookedQuery.eq("unit_id", effectiveUnitId);
        realizedQuery = realizedQuery.eq("unit_id", effectiveUnitId);
        subsQuery = subsQuery.eq("unit_id", effectiveUnitId);
      }

      let profilesQuery = supabase.from("profiles").select("user_id, full_name").eq("status", "approved" as any);
      if (effectiveUnitId) {
        profilesQuery = profilesQuery.eq("unit_id", effectiveUnitId);
      }

      const [bookedRes, realizedRes, subsRes, profilesRes] = await Promise.all([
        bookedQuery, realizedQuery, subsQuery, profilesQuery,
      ]);
      if (bookedRes.data) setBookedCalls(bookedRes.data);
      if (realizedRes.data) setRealizedCalls(realizedRes.data);
      if (subsRes.data) setSubmissions(subsRes.data);
      if (profilesRes.data) setMembers(profilesRes.data);
      setLoading(false);
    }
    load();
  }, [effectiveUnitId]);

  const filteredBooked = useMemo(() => {
    return bookedCalls.filter(b => {
      if (filterPv !== "todos" && b.pv_id !== filterPv) return false;
      if (filterTipoLead !== "todos" && b.tipo_lead !== filterTipoLead) return false;
      return true;
    });
  }, [bookedCalls, filterPv, filterTipoLead]);

  const filteredRealized = useMemo(() => {
    return realizedCalls.filter(r => {
      if (filterPv !== "todos" && r.pv_id !== filterPv) return false;
      if (filterTipoLead !== "todos" && r.tipo_lead !== filterTipoLead) return false;
      return true;
    });
  }, [realizedCalls, filterPv, filterTipoLead]);

  const filteredSubs = useMemo(() => {
    return submissions.filter(s => {
      if (filterPv !== "todos" && s.pv_id !== filterPv) return false;
      return true;
    });
  }, [submissions, filterPv]);

  const totalMarcadas = filteredSubs.reduce((a, s) => a + s.calls_marcadas, 0);
  const totalRealizadas = filteredSubs.reduce((a, s) => a + s.calls_realizadas, 0);
  const totalNoShow = filteredSubs.reduce((a, s) => a + s.no_show, 0);
  const totalReagendamentos = filteredSubs.reduce((a, s) => a + s.reagendamentos, 0);
  const totalContratos = filteredSubs.reduce((a, s) => a + s.contratos_assinados, 0);
  const showRate = totalMarcadas > 0 ? totalRealizadas / totalMarcadas : 0;

  const punchFreq = useMemo(() => {
    const freq: Record<string, number> = {};
    filteredBooked.forEach(b => {
      if (b.punch && b.punch.trim()) {
        const key = b.punch.trim().toLowerCase();
        freq[key] = (freq[key] || 0) + 1;
      }
    });
    return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 10);
  }, [filteredBooked]);

  const tipoLeadValues = useMemo(() => {
    const set = new Set<string>();
    bookedCalls.forEach(b => { if (b.tipo_lead) set.add(b.tipo_lead); });
    realizedCalls.forEach(r => { if (r.tipo_lead) set.add(r.tipo_lead); });
    return Array.from(set).sort();
  }, [bookedCalls, realizedCalls]);

  const volumeByPv = useMemo(() => {
    const map: Record<string, number> = {};
    filteredBooked.forEach(b => { map[b.pv_id] = (map[b.pv_id] || 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [filteredBooked]);

  const pvName = (id: string) => members.find(m => m.user_id === id)?.full_name || id;
  const canalName = (id: string | null) => channels.find(c => c.id === id)?.nome || id || "—";

  return (
    <div className="space-y-8 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Análise de Pré-Venda</h1>
        <p className="text-sm text-muted-foreground mt-1">Punch por lead, volume por dia e rastreabilidade por pessoa</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        {isAdmin && (
          <Select value={selectedUnitId} onValueChange={setSelectedUnitId}>
            <SelectTrigger className="filter-pill w-[240px] border-none shadow-xl">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-full bg-primary/10">
                  <Filter className="w-3.5 h-3.5 text-primary" />
                </div>
                <SelectValue placeholder="Todas Unidades" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas Unidades</SelectItem>
              {unitsList.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
        <Select value={filterPv} onValueChange={setFilterPv}>
          <SelectTrigger className="filter-pill w-[200px] border-none shadow-xl">
            <div className="flex items-center gap-2">
              <SelectValue placeholder="Todos Pré-Vendas" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos Pré-Vendas</SelectItem>
            {members.map(m => <SelectItem key={m.user_id} value={m.user_id}>{m.full_name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterTipoLead} onValueChange={setFilterTipoLead}>
          <SelectTrigger className="filter-pill w-[180px] border-none shadow-xl">
            <div className="flex items-center gap-2">
              <SelectValue placeholder="Qualquer Lead" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos Tipos</SelectItem>
            {tipoLeadValues.map(t => <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="kpi-card text-center py-16">
          <p className="text-muted-foreground">Carregando dados...</p>
        </div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
            {[
              { label: "Calls Marcadas", value: totalMarcadas, icon: Phone },
              { label: "Calls Realizadas", value: totalRealizadas, icon: PhoneCall },
              { label: "No Show", value: totalNoShow, icon: PhoneOff },
              { label: "Reagendamentos", value: totalReagendamentos, icon: RefreshCw },
              { label: "Contratos", value: totalContratos, icon: FileSignature },
              { label: "Show Rate", value: formatPercent(showRate), icon: Zap, isText: true },
              { label: "Volume PV", value: filteredBooked.length, icon: Users },
            ].map((kpi) => {
              const Icon = kpi.icon;
              return (
                <div key={kpi.label} className="kpi-card p-5">
                  <div className="flex items-center gap-1.5 mb-2"><Icon className="w-3.5 h-3.5 text-muted-foreground" /><p className="kpi-label">{kpi.label}</p></div>
                  <p className="kpi-value-sm tabular">{kpi.value}</p>
                </div>
              );
            })}
          </div>

          {/* Punch frequency + Volume by PV */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="kpi-card p-5">
              <p className="text-[12px] font-semibold mb-4">Top Punches Mais Usados</p>
              {punchFreq.length === 0 ? (
                <p className="text-[12px] text-muted-foreground">Nenhum punch registrado ainda.</p>
              ) : (
                <div className="space-y-2">
                  {punchFreq.map(([punch, count], i) => (
                    <div key={i} className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-secondary/40">
                      <span className="text-[12px] truncate max-w-[80%]">{punch}</span>
                      <span className="text-[11px] font-bold tabular text-primary">{count}x</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="kpi-card p-5">
              <p className="text-[12px] font-semibold mb-4">Volume por Pré-Vendas</p>
              {volumeByPv.length === 0 ? (
                <p className="text-[12px] text-muted-foreground">Nenhum dado registrado.</p>
              ) : (
                <div className="space-y-2">
                  {volumeByPv.map(([pvId, count]) => (
                    <div key={pvId} className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-secondary/40">
                      <span className="text-[12px] font-medium">{pvName(pvId)}</span>
                      <span className="text-[11px] font-bold tabular">{count} calls marcadas</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Booked Calls Table */}
          <div className="kpi-card p-0 overflow-hidden">
            <div className="px-5 pt-5 pb-3">
              <p className="text-[12px] font-semibold">Calls Marcadas Detalhadas</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="table-header-v4">
                    <th className="px-4 py-2.5 text-left">Data</th>
                    <th className="px-4 py-2.5 text-left">Pré-Vendas</th>
                    <th className="px-4 py-2.5 text-left">Lead/Projeto</th>
                    <th className="px-4 py-2.5 text-left">Tipo Lead</th>
                    <th className="px-4 py-2.5 text-left">Punch</th>
                    <th className="px-4 py-2.5 text-left">Canal</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBooked.length === 0 ? (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Nenhuma call marcada detalhada encontrada.</td></tr>
                  ) : (
                    filteredBooked.map(b => (
                      <tr key={b.id} className="table-row-v4">
                        <td className="px-4 py-2.5 tabular">{b.data_referencia}</td>
                        <td className="px-4 py-2.5 font-medium">{pvName(b.pv_id)}</td>
                        <td className="px-4 py-2.5">{b.lead_nome}</td>
                        <td className="px-4 py-2.5">{b.tipo_lead || "—"}</td>
                        <td className="px-4 py-2.5 max-w-[200px] truncate">{b.punch || "—"}</td>
                        <td className="px-4 py-2.5">{canalName(b.canal)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Realized Calls Table */}
          <div className="kpi-card p-0 overflow-hidden">
            <div className="px-5 pt-5 pb-3">
              <p className="text-[12px] font-semibold">Calls Realizadas Detalhadas</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="table-header-v4">
                    <th className="px-4 py-2.5 text-left">Data</th>
                    <th className="px-4 py-2.5 text-left">Pré-Vendas</th>
                    <th className="px-4 py-2.5 text-left">Lead/Projeto</th>
                    <th className="px-4 py-2.5 text-left">Tipo Lead</th>
                    <th className="px-4 py-2.5 text-left">Observação</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRealized.length === 0 ? (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Nenhuma call realizada detalhada encontrada.</td></tr>
                  ) : (
                    filteredRealized.map(r => (
                      <tr key={r.id} className="table-row-v4">
                        <td className="px-4 py-2.5 tabular">{r.data_referencia}</td>
                        <td className="px-4 py-2.5 font-medium">{pvName(r.pv_id)}</td>
                        <td className="px-4 py-2.5">{r.lead_nome}</td>
                        <td className="px-4 py-2.5">{r.tipo_lead || "—"}</td>
                        <td className="px-4 py-2.5 max-w-[200px] truncate">{r.observacao || "—"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
