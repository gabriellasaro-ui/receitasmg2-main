import { useState, useEffect } from "react";
import { useDashboardStore } from "@/data/store";
import {
  channels,
  getDiaUtilAtual,
  calcIdealDia,
  calcPctIdeal,
  getSemaforoStatus,
  getSemaforoColorClass,
  getSemaforoBgClass,
  formatCurrency,
  formatPercent,
  Channel,
} from "@/data/seedData";
import { SemaforoBadge } from "./SemaforoBadge";
import { Layers, Settings2, Save, X, Plus, Trash2, ChevronDown, ChevronRight, Building2, Filter } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const channelFields: { key: keyof Channel; label: string; type: "currency" | "number" }[] = [
  { key: "metaReceitaTotal", label: "Meta Receita Total", type: "currency" },
  { key: "metaReceitaRecorrente", label: "Meta Recorrente", type: "currency" },
  { key: "metaReceitaOnetime", label: "Meta One-Time", type: "currency" },
  { key: "metaContratos", label: "Meta Contratos", type: "number" },
  { key: "metaLeads", label: "Meta Leads", type: "number" },
  { key: "metaRM", label: "Meta RM", type: "number" },
  { key: "metaRR", label: "Meta RR", type: "number" },
  { key: "investimentoFixo", label: "Investimento", type: "currency" },
  { key: "metaROAS", label: "Meta ROAS", type: "number" },
];

export function ChannelView() {
  const { goals, closerSubmissions } = useDashboardStore();
  const { isAdmin, profile } = useAuth();
  const diaAtual = getDiaUtilAtual();
  const [open, setOpen] = useState(false);
  const [dbChannels, setDbChannels] = useState<Channel[]>([]);
  const [editChannels, setEditChannels] = useState<Channel[]>([]);
  const [activeChannelId, setActiveChannelId] = useState<string>("");
  const [newChannelName, setNewChannelName] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [expandedChannels, setExpandedChannels] = useState<Set<string>>(new Set());
  const [unitBreakdown, setUnitBreakdown] = useState<Record<string, { unitName: string; receita: number; contratos: number }[]>>({});
  const [loading, setLoading] = useState(true);
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

  // Load channel goals from DB
  useEffect(() => {
    const loadChannels = async () => {
      const now = new Date();
      const mesRef = now.getMonth() + 1;
      const anoRef = now.getFullYear();

      let query = supabase
        .from("channel_goals")
        .select("*")
        .eq("mes_ref", mesRef)
        .eq("ano_ref", anoRef);

      if (effectiveUnitId) {
        // Admin filtrando uma unidade específica OU não-admin com unidade
        query = query.or(`unit_id.eq.${effectiveUnitId},unit_id.is.null`);
      } else if (isAdmin) {
        // Admin com "Todas Unidades" → buscar TODOS os registros para somar
        // Não adicionar filtro de unit_id — buscar tudo
      } else {
        // não-admin sem unidade
        query = query.is("unit_id", null);
      }

      const { data } = await query.order("channel_name");

      if (data && data.length > 0) {
        // Se admin na visão regional (todas unidades), agrupar por canal e somar valores
        if (isAdmin && !effectiveUnitId) {
          const channelMap = new Map<string, Channel>();

          data.forEach((row: any) => {
            const existing = channelMap.get(row.channel_id);
            if (existing) {
              // Somar valores
              existing.metaLeads += row.meta_leads || 0;
              existing.metaRM += row.meta_rm || 0;
              existing.metaRR += row.meta_rr || 0;
              existing.metaContratos += row.meta_contratos || 0;
              existing.metaReceitaTotal += Number(row.meta_receita_total) || 0;
              existing.metaReceitaRecorrente += Number(row.meta_receita_recorrente) || 0;
              existing.metaReceitaOnetime += Number(row.meta_receita_onetime) || 0;
              existing.investimentoFixo += Number(row.investimento_fixo) || 0;
              existing.metaROAS += Number(row.meta_roas) || 0;
            } else {
              channelMap.set(row.channel_id, {
                id: row.channel_id,
                nome: row.channel_name,
                tipo: row.channel_id,
                ativo: true,
                metaLeads: row.meta_leads || 0,
                metaRM: row.meta_rm || 0,
                metaRR: row.meta_rr || 0,
                metaContratos: row.meta_contratos || 0,
                metaReceitaTotal: Number(row.meta_receita_total) || 0,
                metaReceitaRecorrente: Number(row.meta_receita_recorrente) || 0,
                metaReceitaOnetime: Number(row.meta_receita_onetime) || 0,
                investimentoFixo: Number(row.investimento_fixo) || 0,
                metaROAS: Number(row.meta_roas) || 0,
              });
            }
          });

          const loaded = Array.from(channelMap.values());
          setDbChannels(loaded);
          channels.length = 0;
          loaded.forEach(ch => channels.push({ ...ch }));
        } else {
          // Visão normal (unidade específica)
          const loaded: Channel[] = data.map((row: any) => ({
            id: row.channel_id,
            nome: row.channel_name,
            tipo: row.channel_id,
            ativo: true,
            metaLeads: row.meta_leads,
            metaRM: row.meta_rm,
            metaRR: row.meta_rr,
            metaContratos: row.meta_contratos,
            metaReceitaTotal: Number(row.meta_receita_total),
            metaReceitaRecorrente: Number(row.meta_receita_recorrente),
            metaReceitaOnetime: Number(row.meta_receita_onetime),
            investimentoFixo: Number(row.investimento_fixo),
            metaROAS: Number(row.meta_roas),
          }));
          setDbChannels(loaded);
          channels.length = 0;
          loaded.forEach(ch => channels.push({ ...ch }));
        }
      } else {
        setDbChannels([...channels]);
      }
      setLoading(false);
    };
    loadChannels();
  }, [isAdmin, effectiveUnitId]);

  // Fetch unit breakdown for admin
  useEffect(() => {
    if (!isAdmin) return;
    const fetchUnitBreakdown = async () => {
      const now = new Date();
      const startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
      const endDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-31`;

      const { data: sales } = await supabase
        .from("closer_sales_detail")
        .select("canal_venda, valor_total, closer_id, submission_id")
        .gte("data_referencia", startDate)
        .lte("data_referencia", endDate);

      const { data: subs } = await supabase
        .from("closer_submissions")
        .select("id, unit_id")
        .gte("data_referencia", startDate)
        .lte("data_referencia", endDate);

      const { data: pvBooked } = await supabase
        .from("pv_booked_calls_detail")
        .select("canal, unit_id")
        .gte("data_referencia", startDate)
        .lte("data_referencia", endDate);

      const { data: units } = await supabase.from("units").select("id, name");

      if (!units) return;
      const unitMap = new Map(units.map((u: any) => [u.id, u.name]));
      const subUnitMap = new Map((subs || []).map((s: any) => [s.id, s.unit_id]));

      const breakdown: Record<string, Map<string, { receita: number; contratos: number }>> = {};

      (sales || []).forEach((sale: any) => {
        const canal = sale.canal_venda;
        const unitId = subUnitMap.get(sale.submission_id);
        if (!canal || !unitId) return;
        if (!breakdown[canal]) breakdown[canal] = new Map();
        const existing = breakdown[canal].get(unitId) || { receita: 0, contratos: 0 };
        existing.receita += Number(sale.valor_total);
        existing.contratos += 1;
        breakdown[canal].set(unitId, existing);
      });

      (pvBooked || []).forEach((bc: any) => {
        if (!bc.canal || !bc.unit_id) return;
        if (!breakdown[bc.canal]) breakdown[bc.canal] = new Map();
        const existing = breakdown[bc.canal].get(bc.unit_id) || { receita: 0, contratos: 0 };
        breakdown[bc.canal].set(bc.unit_id, existing);
      });

      const result: Record<string, { unitName: string; receita: number; contratos: number }[]> = {};
      Object.entries(breakdown).forEach(([canal, unitData]) => {
        result[canal] = Array.from(unitData.entries()).map(([unitId, data]) => ({
          unitName: unitMap.get(unitId) || "Sem unidade",
          ...data,
        })).sort((a, b) => b.receita - a.receita);
      });

      setUnitBreakdown(result);
    };
    fetchUnitBreakdown();
  }, [isAdmin, closerSubmissions]);

  const toggleExpand = (channelId: string) => {
    setExpandedChannels(prev => {
      const next = new Set(prev);
      if (next.has(channelId)) next.delete(channelId);
      else next.add(channelId);
      return next;
    });
  };

  const handleOpenEditor = () => {
    setEditChannels(dbChannels.map((c) => ({ ...c })));
    setActiveChannelId(dbChannels[0]?.id || "");
    setShowAddForm(false);
    setNewChannelName("");
    setOpen(true);
  };

  const handleFieldChange = (channelId: string, key: keyof Channel, value: string) => {
    setEditChannels((prev) =>
      prev.map((ch) =>
        ch.id === channelId ? { ...ch, [key]: value === "" ? 0 : Number(value) } : ch
      )
    );
  };

  const handleAddChannel = () => {
    const name = newChannelName.trim();
    if (!name) {
      toast.error("Informe o nome do canal.");
      return;
    }
    const id = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    if (editChannels.some((c) => c.id === id)) {
      toast.error("Já existe um canal com esse nome.");
      return;
    }
    const newChannel: Channel = {
      id,
      nome: name,
      tipo: id,
      ativo: true,
      metaLeads: 0,
      metaRM: 0,
      metaRR: 0,
      metaContratos: 0,
      metaReceitaTotal: 0,
      metaReceitaRecorrente: 0,
      metaReceitaOnetime: 0,
      investimentoFixo: 0,
      metaROAS: 0,
    };
    setEditChannels((prev) => [...prev, newChannel]);
    setActiveChannelId(id);
    setNewChannelName("");
    setShowAddForm(false);
    toast.success(`Canal "${name}" adicionado!`);
  };

  const handleRemoveChannel = (channelId: string) => {
    setEditChannels((prev) => prev.filter((c) => c.id !== channelId));
    if (activeChannelId === channelId) {
      setActiveChannelId(editChannels.find((c) => c.id !== channelId)?.id || "");
    }
  };

  const handleSaveAll = async () => {
    const now = new Date();
    const mesRef = now.getMonth() + 1;
    const anoRef = now.getFullYear();

    const unitId = isAdmin ? null : (profile?.unit_id || null);

    let deleteQuery = supabase
      .from("channel_goals")
      .delete()
      .eq("mes_ref", mesRef)
      .eq("ano_ref", anoRef);

    if (unitId) {
      deleteQuery = deleteQuery.eq("unit_id", unitId);
    } else {
      deleteQuery = deleteQuery.is("unit_id", null);
    }

    await deleteQuery;

    const rows = editChannels.map((ch) => ({
      channel_id: ch.id,
      channel_name: ch.nome,
      unit_id: unitId,
      mes_ref: mesRef,
      ano_ref: anoRef,
      meta_leads: ch.metaLeads,
      meta_rm: ch.metaRM,
      meta_rr: ch.metaRR,
      meta_contratos: ch.metaContratos,
      meta_receita_total: ch.metaReceitaTotal,
      meta_receita_recorrente: ch.metaReceitaRecorrente,
      meta_receita_onetime: ch.metaReceitaOnetime,
      investimento_fixo: ch.investimentoFixo,
      meta_roas: ch.metaROAS,
    }));

    const { error } = await supabase.from("channel_goals").insert(rows);

    if (error) {
      toast.error("Erro ao salvar canais: " + error.message);
      return;
    }

    setDbChannels(editChannels.map(ch => ({ ...ch })));
    channels.length = 0;
    editChannels.forEach((ch) => channels.push({ ...ch }));
    toast.success("Canais salvos com sucesso!");
    setOpen(false);
  };

  const activeEditChannel = editChannels.find((c) => c.id === activeChannelId);

  const channelData = dbChannels.map((ch) => {
    const clSubs = closerSubmissions.filter((s) => s.channelId === ch.id);
    const realizadoReceita = clSubs.reduce((a, s) => a + s.valorContratoTotal, 0);
    const realizadoContratos = clSubs.reduce((a, s) => a + s.contratosAssinados, 0);
    const idealReceita = calcIdealDia(ch.metaReceitaTotal, diaAtual, goals.diasUteisTotal);
    const pctIdeal = calcPctIdeal(realizadoReceita, idealReceita);
    const semaforo = realizadoReceita > 0 ? getSemaforoStatus(pctIdeal) : null;
    const roas = ch.investimentoFixo > 0 ? realizadoReceita / ch.investimentoFixo : 0;
    const pctMeta = ch.metaReceitaTotal > 0 ? realizadoReceita / ch.metaReceitaTotal : 0;
    return { ...ch, realizadoReceita, realizadoContratos, idealReceita, pctIdeal, semaforo, roasReal: roas, pctMeta };
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Meta por Canal</h1>
          <p className="text-sm text-muted-foreground mt-1">Acompanhamento de receita e pace por canal de aquisição</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {isAdmin && unitsList.length > 0 && (
            <Select value={selectedUnitId} onValueChange={setSelectedUnitId}>
              <SelectTrigger className="w-[200px] h-9 text-sm">
                <div className="flex items-center gap-2">
                  <Filter className="w-3.5 h-3.5 text-muted-foreground" />
                  <SelectValue placeholder="Todas unidades" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas Unidades</SelectItem>
                {unitsList.map((u) => (
                  <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setShowAddForm(true)}>
            <Plus className="w-3.5 h-3.5" />
            Novo Canal
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="gap-1.5" onClick={handleOpenEditor}>
                <Settings2 className="w-3.5 h-3.5" />
                Definir Metas
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-base">
                  <Settings2 className="w-4 h-4 text-primary" />
                  Metas por Canal
                </DialogTitle>
              </DialogHeader>

              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                {editChannels.map((ch) => (
                  <div key={ch.id} className="relative group">
                    <button
                      onClick={() => setActiveChannelId(ch.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${activeChannelId === ch.id
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-card text-muted-foreground border-border hover:border-primary/30"
                        }`}
                    >
                      {ch.nome}
                    </button>
                    <button
                      onClick={() => handleRemoveChannel(ch.id)}
                      className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Remover canal"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-medium border border-dashed border-primary/40 text-primary hover:bg-primary/5 transition-colors flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  Novo Canal
                </button>
              </div>

              {showAddForm && (
                <div className="flex items-end gap-2 mt-2 p-3 rounded-lg bg-secondary/50 border border-border/60">
                  <div className="flex-1 space-y-1">
                    <Label className="text-[11px] text-muted-foreground">Nome do novo canal</Label>
                    <Input
                      value={newChannelName}
                      onChange={(e) => setNewChannelName(e.target.value)}
                      placeholder="Ex: Tráfego Pago, Eventos..."
                      className="h-8 text-sm"
                      onKeyDown={(e) => e.key === "Enter" && handleAddChannel()}
                    />
                  </div>
                  <Button size="sm" className="h-8 gap-1" onClick={handleAddChannel}>
                    <Plus className="w-3 h-3" />
                    Adicionar
                  </Button>
                </div>
              )}

              {activeEditChannel && (
                <div className="mt-4 space-y-4">
                  <p className="text-sm font-semibold">{activeEditChannel.nome}</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {channelFields.map((f) => (
                      <div key={f.key} className="space-y-1">
                        <Label className="text-[11px] text-muted-foreground">{f.label}</Label>
                        <Input
                          type="number"
                          value={(activeEditChannel as any)[f.key] || ""}
                          onChange={(e) => handleFieldChange(activeEditChannel.id, f.key, e.target.value)}
                          className="h-8 text-sm tabular"
                          step={f.type === "currency" ? "0.01" : "1"}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 mt-6">
                <Button size="sm" variant="outline" onClick={() => setOpen(false)} className="gap-1">
                  <X className="w-3 h-3" />
                  Cancelar
                </Button>
                <Button size="sm" onClick={handleSaveAll} className="gap-1">
                  <Save className="w-3 h-3" />
                  Salvar Tudo
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Add channel inline form */}
      {showAddForm && (
        <div className="flex items-end gap-2 p-3 rounded-xl bg-secondary/50 border border-border/60">
          <div className="flex-1 space-y-1">
            <Label className="text-[11px] text-muted-foreground">Nome do novo canal</Label>
            <Input
              value={newChannelName}
              onChange={(e) => setNewChannelName(e.target.value)}
              placeholder="Ex: Tráfego Pago, Eventos..."
              className="h-8 text-sm"
              onKeyDown={async (e) => {
                if (e.key === "Enter") {
                  const name = newChannelName.trim();
                  if (!name) return;
                  const id = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
                  if (dbChannels.some((c) => c.id === id)) { toast.error("Canal já existe."); return; }
                  const now = new Date();
                  const unitId = isAdmin ? null : (profile?.unit_id || null);
                  await supabase.from("channel_goals").insert({
                    channel_id: id, channel_name: name, unit_id: unitId,
                    mes_ref: now.getMonth() + 1, ano_ref: now.getFullYear(),
                  });
                  const newCh: Channel = { id, nome: name, tipo: id, ativo: true, metaLeads: 0, metaRM: 0, metaRR: 0, metaContratos: 0, metaReceitaTotal: 0, metaReceitaRecorrente: 0, metaReceitaOnetime: 0, investimentoFixo: 0, metaROAS: 0 };
                  setDbChannels(prev => [...prev, newCh]);
                  channels.push(newCh);
                  toast.success(`Canal "${name}" adicionado!`);
                  setNewChannelName("");
                  setShowAddForm(false);
                }
              }}
            />
          </div>
          <Button size="sm" className="h-8 gap-1" onClick={async () => {
            const name = newChannelName.trim();
            if (!name) { toast.error("Informe o nome."); return; }
            const id = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
            if (dbChannels.some((c) => c.id === id)) { toast.error("Canal já existe."); return; }
            const now = new Date();
            const unitId = isAdmin ? null : (profile?.unit_id || null);
            await supabase.from("channel_goals").insert({
              channel_id: id, channel_name: name, unit_id: unitId,
              mes_ref: now.getMonth() + 1, ano_ref: now.getFullYear(),
            });
            const newCh: Channel = { id, nome: name, tipo: id, ativo: true, metaLeads: 0, metaRM: 0, metaRR: 0, metaContratos: 0, metaReceitaTotal: 0, metaReceitaRecorrente: 0, metaReceitaOnetime: 0, investimentoFixo: 0, metaROAS: 0 };
            setDbChannels(prev => [...prev, newCh]);
            channels.push(newCh);
            toast.success(`Canal "${name}" adicionado!`);
            setNewChannelName("");
            setShowAddForm(false);
          }}>
            <Plus className="w-3 h-3" />
            Adicionar
          </Button>
          <Button size="sm" variant="ghost" className="h-8" onClick={() => { setShowAddForm(false); setNewChannelName(""); }}>
            <X className="w-3 h-3" />
          </Button>
        </div>
      )}

      <div className="kpi-card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="table-header-v4">
                <th className="text-left p-4 min-w-[200px]">Canal</th>
                <th className="text-right p-4">Meta</th>
                <th className="text-right p-4">Realizado</th>
                <th className="text-right p-4">Ideal</th>
                <th className="text-right p-4 min-w-[120px]">Pace</th>
                <th className="text-right p-4">Contratos</th>
                <th className="text-right p-4">Invest.</th>
                <th className="text-right p-4">ROAS</th>
                <th className="text-center p-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {channelData.map((ch) => {
                const unitData = unitBreakdown[ch.id] || [];
                const isExpanded = expandedChannels.has(ch.id);
                const hasUnits = isAdmin && unitData.length > 0;
                return (
                  <>
                    <tr key={ch.id} className={`table-row-v4 ${hasUnits ? "cursor-pointer" : ""}`} onClick={() => hasUnits && toggleExpand(ch.id)}>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {isAdmin && (
                            <span className="w-4 flex items-center justify-center">
                              {hasUnits ? (
                                isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-primary" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                              ) : <Layers className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
                            </span>
                          )}
                          {!isAdmin && <Layers className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
                          <span className="font-medium text-[12px]">{ch.nome}</span>
                          {isAdmin && hasUnits && (
                            <span className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded-md">
                              {unitData.length} {unitData.length === 1 ? "unidade" : "unidades"}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-right tabular text-muted-foreground">{formatCurrency(ch.metaReceitaTotal)}</td>
                      <td className="p-4 text-right tabular font-semibold">{formatCurrency(ch.realizadoReceita)}</td>
                      <td className="p-4 text-right tabular text-muted-foreground">{formatCurrency(ch.idealReceita)}</td>
                      <td className="p-4 text-right">
                        {ch.realizadoReceita > 0 ? (
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-16 progress-track">
                              <div className={`progress-fill ${getSemaforoBgClass(ch.semaforo || "vermelho")}`}
                                style={{ width: `${Math.min(ch.pctIdeal * 100, 100)}%` }} />
                            </div>
                            <span className={`tabular font-semibold text-[12px] ${getSemaforoColorClass(ch.semaforo || "vermelho")}`}>
                              {formatPercent(ch.pctIdeal)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="p-4 text-right tabular">{ch.realizadoContratos}<span className="text-muted-foreground">/{ch.metaContratos}</span></td>
                      <td className="p-4 text-right tabular text-muted-foreground">{formatCurrency(ch.investimentoFixo)}</td>
                      <td className="p-4 text-right tabular">{ch.realizadoReceita > 0 ? `${ch.roasReal.toFixed(2)}x` : "—"}</td>
                      <td className="p-4 text-center">
                        {ch.semaforo ? <SemaforoBadge status={ch.semaforo} compact /> : <span className="text-muted-foreground text-[11px]">—</span>}
                      </td>
                    </tr>
                    {isAdmin && isExpanded && unitData.map((u, idx) => (
                      <tr key={`${ch.id}-unit-${idx}`} className="bg-secondary/30 border-t border-border/30">
                        <td className="p-3 pl-12">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-3 h-3 text-primary/60" />
                            <span className="text-[11px] font-medium text-foreground/80">{u.unitName}</span>
                          </div>
                        </td>
                        <td className="p-3" />
                        <td className="p-3 text-right tabular text-[11px] font-medium">{formatCurrency(u.receita)}</td>
                        <td className="p-3" />
                        <td className="p-3" />
                        <td className="p-3 text-right tabular text-[11px]">{u.contratos}</td>
                        <td className="p-3" />
                        <td className="p-3" />
                        <td className="p-3" />
                      </tr>
                    ))}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
