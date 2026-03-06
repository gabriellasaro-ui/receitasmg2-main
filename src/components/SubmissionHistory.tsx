import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUnitData } from "@/hooks/useUnitData";
import { useDashboardStore } from "@/data/store";
import { formatCurrency } from "@/data/seedData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Trash2, Pencil, History, Loader2 } from "lucide-react";

interface CloserSub {
  id: string;
  data_referencia: string;
  closer_id: string;
  calls_realizadas: number;
  no_show: number;
  propostas_realizadas: number;
  contratos_assinados: number;
  valor_contrato_total: number;
  valor_recorrente: number;
  valor_onetime: number;
  churn_m0: number;
  observacoes: string | null;
  created_at: string;
}

interface PvSub {
  id: string;
  data_referencia: string;
  pv_id: string;
  calls_marcadas: number;
  calls_realizadas: number;
  no_show: number;
  reagendamentos: number;
  contratos_assinados: number;
  valor_contrato_total: number;
  valor_recorrente: number;
  valor_onetime: number;
  churn_m0: number;
  observacoes: string | null;
  created_at: string;
}

function MemberAvatar({ name, avatarUrl, className }: { name: string; avatarUrl?: string | null; className?: string }) {
  const [error, setError] = useState(false);

  if (avatarUrl && !error) {
    return (
      <div className={`rounded-full overflow-hidden flex items-center justify-center bg-secondary/50 border border-border/40 shrink-0 ${className}`}>
        <img
          src={avatarUrl}
          alt={name}
          className="w-full h-full object-cover"
          onError={() => setError(true)}
        />
      </div>
    );
  }

  const initials = name.split(" ").filter(n => n).map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  return (
    <div className={`rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-[10px] shrink-0 ${className}`}>
      {initials}
    </div>
  );
}

export function SubmissionHistory() {
  const { isAdmin, profile } = useAuth();
  const { members, userUnitId } = useUnitData();
  const { loadFromDB } = useDashboardStore();
  const [closerSubs, setCloserSubs] = useState<CloserSub[]>([]);
  const [pvSubs, setPvSubs] = useState<PvSub[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; type: "closer" | "pv" } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editTarget, setEditTarget] = useState<{ sub: any; type: "closer" | "pv" } | null>(null);
  const [editForm, setEditForm] = useState<Record<string, any>>({});
  const [originalForm, setOriginalForm] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [detailsForm, setDetailsForm] = useState<any[]>([]);
  const [originalDetails, setOriginalDetails] = useState<any[]>([]);

  const fetchSubs = async () => {
    setLoading(true);
    const now = new Date();
    const startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
    const endDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-31`;

    let csQ = supabase.from("closer_submissions").select("*").gte("data_referencia", startDate).lte("data_referencia", endDate).order("data_referencia", { ascending: false });
    let pvQ = supabase.from("pv_submissions").select("*").gte("data_referencia", startDate).lte("data_referencia", endDate).order("data_referencia", { ascending: false });

    if (!isAdmin && userUnitId) {
      csQ = csQ.eq("unit_id", userUnitId);
      pvQ = pvQ.eq("unit_id", userUnitId);
    }

    const [csRes, pvRes] = await Promise.all([csQ, pvQ]);
    setCloserSubs((csRes.data as CloserSub[]) || []);
    setPvSubs((pvRes.data as PvSub[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    if (profile) fetchSubs();
  }, [profile?.id, isAdmin, userUnitId]);

  const getMemberName = (userId: string) => {
    const m = members.find((m) => m.userId === userId);
    return m?.fullName || userId.slice(0, 8);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const { id, type } = deleteTarget;
      if (type === "closer") {
        // Delete details first, then main
        await Promise.all([
          supabase.from("closer_calls_detail").delete().eq("submission_id", id),
          supabase.from("closer_proposals_detail").delete().eq("submission_id", id),
          supabase.from("closer_sales_detail").delete().eq("submission_id", id),
        ]);
        const { error } = await supabase.from("closer_submissions").delete().eq("id", id);
        if (error) throw error;
      } else {
        await Promise.all([
          supabase.from("pv_booked_calls_detail").delete().eq("submission_id", id),
          supabase.from("pv_realized_calls_detail").delete().eq("submission_id", id),
          supabase.from("pv_contracts_detail").delete().eq("submission_id", id),
        ]);
        const { error } = await supabase.from("pv_submissions").delete().eq("id", id);
        if (error) throw error;
      }
      toast.success("Lançamento excluído com sucesso!");
      setDeleteTarget(null);
      await fetchSubs();
      // Reload dashboard store
      const unitId = isAdmin ? null : userUnitId;
      loadFromDB(unitId);
    } catch (err: any) {
      toast.error("Erro ao excluir: " + (err.message || "tente novamente"));
    } finally {
      setDeleting(false);
    }
  };

  const openEdit = async (sub: any, type: "closer" | "pv") => {
    setEditTarget({ sub, type });
    const formData = type === "closer" ? {
      data_referencia: sub.data_referencia,
      calls_realizadas: sub.calls_realizadas,
      no_show: sub.no_show,
      propostas_realizadas: sub.propostas_realizadas,
      contratos_assinados: sub.contratos_assinados,
      valor_contrato_total: Number(sub.valor_contrato_total),
      valor_recorrente: Number(sub.valor_recorrente),
      valor_onetime: Number(sub.valor_onetime),
      churn_m0: Number(sub.churn_m0),
    } : {
      data_referencia: sub.data_referencia,
      calls_marcadas: sub.calls_marcadas,
      calls_realizadas: sub.calls_realizadas,
      no_show: sub.no_show,
      reagendamentos: sub.reagendamentos,
      contratos_assinados: sub.contratos_assinados,
      valor_contrato_total: Number(sub.valor_contrato_total),
      valor_recorrente: Number(sub.valor_recorrente),
      valor_onetime: Number(sub.valor_onetime),
      churn_m0: Number(sub.churn_m0),
    };
    setEditForm({ ...formData });
    setOriginalForm({ ...formData });

    const table = type === "closer" ? "closer_sales_detail" : "pv_contracts_detail";
    const { data } = await supabase.from(table).select("*").eq("submission_id", sub.id);
    if (data) {
      setDetailsForm(data);
      setOriginalDetails(JSON.parse(JSON.stringify(data)));
    } else {
      setDetailsForm([]);
      setOriginalDetails([]);
    }
  };

  const handleSaveEdit = async () => {
    if (!editTarget) return;
    setSaving(true);
    try {
      const { sub, type } = editTarget;
      const table = type === "closer" ? "closer_submissions" : "pv_submissions";
      const { error } = await supabase.from(table).update(editForm).eq("id", sub.id);
      if (error) throw error;

      // Update details
      for (const d of detailsForm) {
        const orig = originalDetails.find(o => o.id === d.id);
        if (JSON.stringify(orig) !== JSON.stringify(d)) {
          const detTable = type === "closer" ? "closer_sales_detail" : "pv_contracts_detail";
          await supabase.from(detTable).update({
            lead_nome: d.lead_nome,
            data_referencia: editForm.data_referencia,
            faixa_faturamento: d.faixa_faturamento
          }).eq("id", d.id);
        }
      }

      // Update call details date if needed
      if (editForm.data_referencia !== originalForm.data_referencia) {
        if (type === "closer") {
          await supabase.from("closer_calls_detail").update({ data_referencia: editForm.data_referencia }).eq("submission_id", sub.id);
          await supabase.from("closer_proposals_detail").update({ data_referencia: editForm.data_referencia }).eq("submission_id", sub.id);
        } else {
          await supabase.from("pv_booked_calls_detail").update({ data_referencia: editForm.data_referencia }).eq("submission_id", sub.id);
          await supabase.from("pv_realized_calls_detail").update({ data_referencia: editForm.data_referencia }).eq("submission_id", sub.id);
        }
      }

      toast.success("Lançamento e detalhes atualizados!");
      setEditTarget(null);
      await fetchSubs();
      const unitId = isAdmin ? null : userUnitId;
      loadFromDB(unitId);
    } catch (err: any) {
      toast.error("Erro ao atualizar: " + (err.message || "tente novamente"));
    } finally {
      setSaving(false);
    }
  };



  const formatDate = (d: string) => {
    const date = new Date(d + "T12:00:00");
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  };

  const formatTime = (d: string) => {
    return new Date(d).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  };

  if (loading) {
    return (
      <div className="kpi-card flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const allSubs = [
    ...closerSubs.map((s) => ({ ...s, _type: "closer" as const, _userId: s.closer_id })),
    ...pvSubs.map((s) => ({ ...s, _type: "pv" as const, _userId: s.pv_id })),
  ].sort((a, b) => b.data_referencia.localeCompare(a.data_referencia) || b.created_at.localeCompare(a.created_at));

  if (allSubs.length === 0) {
    return (
      <div className="kpi-card text-center py-10">
        <History className="w-6 h-6 text-muted-foreground mx-auto mb-2 opacity-30" />
        <p className="text-sm text-muted-foreground">Nenhum lançamento encontrado neste mês.</p>
      </div>
    );
  }

  const closerFields = [
    { key: "calls_realizadas", label: "Calls" },
    { key: "no_show", label: "No Show" },
    { key: "propostas_realizadas", label: "Propostas" },
    { key: "contratos_assinados", label: "Contratos" },
    { key: "valor_contrato_total", label: "Receita Total (R$)", currency: true },
    { key: "valor_recorrente", label: "Recorrente (R$)", currency: true },
    { key: "valor_onetime", label: "One-Time (R$)", currency: true },
    { key: "churn_m0", label: "Churn M0 (R$)", currency: true },
  ];

  const pvFields = [
    { key: "calls_marcadas", label: "Calls Marcadas" },
    { key: "calls_realizadas", label: "Calls Realizadas" },
    { key: "no_show", label: "No Show" },
    { key: "reagendamentos", label: "Reagendamentos" },
    { key: "contratos_assinados", label: "Contratos" },
    { key: "valor_contrato_total", label: "Receita Total (R$)", currency: true },
    { key: "valor_recorrente", label: "Recorrente (R$)", currency: true },
    { key: "valor_onetime", label: "One-Time (R$)", currency: true },
    { key: "churn_m0", label: "Churn M0 (R$)", currency: true },
  ];

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-primary" />
          <p className="text-[13px] font-semibold">Histórico de Lançamentos ({allSubs.length})</p>
        </div>

        <div className="kpi-card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="table-header-v4">
                  <th className="text-left p-3">Data</th>
                  <th className="text-left p-3">Membro</th>
                  <th className="text-left p-3">Tipo</th>
                  <th className="text-right p-3">Receita</th>
                  <th className="text-right p-3">Contratos</th>
                  <th className="text-center p-3">Hora</th>
                  <th className="text-center p-3 w-[100px]">Ações</th>
                </tr>
              </thead>
              <tbody>
                {allSubs.map((sub) => (
                  <tr key={sub.id} className="table-row-v4">
                    <td className="p-3 tabular font-medium">{formatDate(sub.data_referencia)}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        {(() => {
                          const m = members.find(m => m.userId === sub._userId);
                          return <MemberAvatar name={m?.fullName || "Membro"} avatarUrl={m?.avatarUrl} className="w-6 h-6" />;
                        })()}
                        <span className="truncate max-w-[120px]">{getMemberName(sub._userId)}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${sub._type === "closer" ? "bg-primary/10 text-primary" : "bg-accent/10 text-accent"}`}>
                        {sub._type === "closer" ? "Closer" : "Pré-Venda"}
                      </span>
                    </td>
                    <td className="p-3 text-right tabular">{formatCurrency(Number(sub.valor_contrato_total))}</td>
                    <td className="p-3 text-right tabular">{sub.contratos_assinados}</td>
                    <td className="p-3 text-center text-muted-foreground tabular">{formatTime(sub.created_at)}</td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 hover:bg-primary/10 hover:text-primary"
                          onClick={() => openEdit(sub, sub._type)}
                          title="Editar"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => setDeleteTarget({ id: sub.id, type: sub._type })}
                          title="Excluir"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Lançamento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este lançamento? Todos os detalhes (propostas, vendas, calls) vinculados também serão removidos. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Dialog */}
      <Dialog open={!!editTarget} onOpenChange={(open) => !open && setEditTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Lançamento</DialogTitle>
            <DialogDescription>
              {editTarget && `${getMemberName(editTarget.sub._userId || editTarget.sub.closer_id || editTarget.sub.pv_id)} — ${formatDate(editTarget.sub.data_referencia)}`}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            {(editTarget?.type === "closer" ? closerFields : pvFields).map((f) => {
              const isChanged = editForm[f.key] !== originalForm[f.key];
              return (
                <div key={f.key} className="space-y-1">
                  <label className="text-[11px] font-medium text-muted-foreground">{f.label}</label>
                  <div className="relative">
                    <Input
                      type="number"
                      min={0}
                      step={f.currency ? "0.01" : "1"}
                      value={editForm[f.key] ?? ""}
                      onChange={(e) => setEditForm({ ...editForm, [f.key]: f.currency ? parseFloat(e.target.value) || 0 : parseInt(e.target.value) || 0 })}
                      className={`tabular h-9 transition-colors ${isChanged ? "border-primary bg-primary/5 ring-1 ring-primary/20" : ""}`}
                    />
                    {isChanged && (
                      <span className="absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full bg-primary animate-pulse" />
                    )}
                  </div>
                  {isChanged && (
                    <p className="text-[10px] text-primary tabular">
                      Anterior: {f.currency ? formatCurrency(originalForm[f.key]) : originalForm[f.key]}
                    </p>
                  )}
                </div>
              );
            })}
            <div className="space-y-1 col-span-2">
              <label className="text-[11px] font-medium text-muted-foreground">Data Referência</label>
              <Input
                type="date"
                value={editForm.data_referencia ?? ""}
                onChange={(e) => setEditForm({ ...editForm, data_referencia: e.target.value })}
                className={`tabular h-9 transition-colors ${editForm.data_referencia !== originalForm.data_referencia ? "border-primary bg-primary/5 ring-1 ring-primary/20" : ""}`}
              />
            </div>

            {/* Contract details (if they exist) */}
            {detailsForm.length > 0 && (
              <div className="col-span-2 space-y-3 mt-2 border-t border-border pt-3">
                <p className="text-[11px] font-bold text-muted-foreground uppercase">Detalhes de Contratos Vinculados</p>
                {detailsForm.map((det, idx) => (
                  <div key={det.id} className="grid grid-cols-2 gap-2 bg-muted/40 p-2 rounded-lg border border-border/50 relative">
                    <div className="space-y-1">
                      <label className="text-[10px] text-muted-foreground">Lead Nome</label>
                      <Input value={det.lead_nome || ""} onChange={(e) => setDetailsForm(prev => prev.map((d, i) => i === idx ? { ...d, lead_nome: e.target.value } : d))} className="h-7 text-xs" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-muted-foreground">Faturamento (GMV)</label>
                      <select value={det.faixa_faturamento || ""} onChange={(e) => setDetailsForm(prev => prev.map((d, i) => i === idx ? { ...d, faixa_faturamento: e.target.value } : d))} className="h-7 text-xs w-full bg-background border border-input rounded-md px-1">
                        <option value="">Selecione...</option>
                        <option value="ate_50k">Até R$ 50 mil</option>
                        <option value="51k_70k">51k a 70k</option>
                        <option value="71k_100k">71k a 100k</option>
                        <option value="101k_200k">101k a 200k (Small)</option>
                        <option value="201k_400k">201k a 400k (Small)</option>
                        <option value="401k_1mm">401k a 1mm (Medium)</option>
                        <option value="1mm_4mm">1mm a 4mm (Medium)</option>
                        <option value="4mm_16mm">4mm a 16mm (Large)</option>
                        <option value="16mm_40mm">16mm a 40mm (Large)</option>
                        <option value="mais_40mm">Mais de 40mm (Ent.)</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {(Object.keys(editForm).some(k => editForm[k] !== originalForm[k]) || JSON.stringify(detailsForm) !== JSON.stringify(originalDetails)) && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/15">
              <Pencil className="w-3.5 h-3.5 text-primary shrink-0" />
              <p className="text-[11px] text-primary/80">
                Há alterações pendentes para salvar
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTarget(null)} disabled={saving}>Cancelar</Button>
            <Button onClick={handleSaveEdit} disabled={saving || !(Object.keys(editForm).some(k => editForm[k] !== originalForm[k]) || JSON.stringify(detailsForm) !== JSON.stringify(originalDetails))}>
              {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
