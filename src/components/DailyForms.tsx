import { useState, useCallback, useMemo } from "react";
import { useDashboardStore } from "@/data/store";
import { channels } from "@/data/seedData";
import { useUnitData } from "@/hooks/useUnitData";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { toast } from "sonner";
import { CheckCircle, Send, AlertCircle, ChevronDown, Plus, Trash2 } from "lucide-react";

/* ── Shared helpers ── */

function FormField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[12px] font-medium text-muted-foreground flex items-center gap-1">
        {label}
        {required && <span className="text-primary text-[10px]">*</span>}
      </label>
      {children}
    </div>
  );
}

function FormSection({ title, children, cols }: { title: string; children: React.ReactNode; cols?: string }) {
  return (
    <div className="space-y-3">
      <p className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground font-medium border-b border-border/50 pb-2">{title}</p>
      <div className={`grid grid-cols-1 ${cols || "sm:grid-cols-2"} gap-4`}>
        {children}
      </div>
    </div>
  );
}

function DetailBlockHeader({ title, index, filled }: { title: string; index: number; filled: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-bold ${filled ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground"}`}>
        {index + 1}
      </div>
      <span className="text-[13px] font-medium">{title} {index + 1}</span>
      {filled && <CheckCircle className="w-3 h-3 text-primary" />}
    </div>
  );
}

function CompletionCounter({ label, filled, total }: { label: string; filled: number; total: number }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/60 border border-border/40">
      <span className="text-[11px] text-muted-foreground">{label}:</span>
      <span className={`text-[12px] font-bold tabular ${filled === total ? "text-primary" : "text-muted-foreground"}`}>
        {filled}/{total} preenchidas
      </span>
    </div>
  );
}

const tipoLeadOptions = ["broker", "indicação", "recomendação", "outbound", "evento", "parceiro", "recovery"];

/* ══════════════════════════════════════════════ */
/* ── CLOSER FORM                              ── */
/* ══════════════════════════════════════════════ */

interface ProposalDetail {
  leadNome: string;
  canalProposta: string;
  temperatura: "frio" | "morno" | "quente";
  valorProposta: number;
  observacao: string;
}

interface SaleDetail {
  leadNome: string;
  canalVenda: string;
  valorTotal: number;
  valorRecorrente: number;
  valorOnetime: number;
  churnM0: number;
}

interface CallDetail {
  leadNome: string;
  temperatura: "frio" | "morno" | "quente";
  resultado: string;
}

const emptyProposal = (): ProposalDetail => ({ leadNome: "", canalProposta: "", temperatura: "morno", valorProposta: 0, observacao: "" });
const emptySale = (): SaleDetail => ({ leadNome: "", canalVenda: "", valorTotal: 0, valorRecorrente: 0, valorOnetime: 0, churnM0: 0 });
const emptyCall = (): CallDetail => ({ leadNome: "", temperatura: "morno", resultado: "" });

export function DailyFormCloser() {
  const { addCloserSubmission } = useDashboardStore();
  const { closers: unitClosers, userUnitId } = useUnitData();
  const { profile, roles } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showCallDetail, setShowCallDetail] = useState(false);

  const [form, setForm] = useState({
    userId: "",
    callsRealizadas: 0,
    noShow: 0,
    propostasRealizadas: 0,
    contratosAssinados: 0,
    valorContratoTotal: 0,
    valorRecorrente: 0,
    valorOnetime: 0,
    churnM0: 0,
    observacoes: "",
  });

  const [proposals, setProposals] = useState<ProposalDetail[]>([]);
  const [sales, setSales] = useState<SaleDetail[]>([]);
  const [calls, setCalls] = useState<CallDetail[]>([]);

  // Sync dynamic blocks with counts
  const syncProposals = useCallback((count: number) => {
    setProposals(prev => {
      if (count > prev.length) return [...prev, ...Array(count - prev.length).fill(null).map(() => emptyProposal())];
      return prev.slice(0, count);
    });
  }, []);

  const syncSales = useCallback((count: number) => {
    setSales(prev => {
      if (count > prev.length) return [...prev, ...Array(count - prev.length).fill(null).map(() => emptySale())];
      return prev.slice(0, count);
    });
  }, []);

  const syncCalls = useCallback((count: number) => {
    setCalls(prev => {
      if (count > prev.length) return [...prev, ...Array(count - prev.length).fill(null).map(() => emptyCall())];
      return prev.slice(0, count);
    });
  }, []);

  // Auto-calculate financials from sales details
  const salesTotals = useMemo(() => {
    if (sales.length === 0) return null;
    return {
      valorTotal: sales.reduce((a, s) => a + s.valorTotal, 0),
      valorRecorrente: sales.reduce((a, s) => a + s.valorRecorrente, 0),
      valorOnetime: sales.reduce((a, s) => a + s.valorOnetime, 0),
      churnM0: sales.reduce((a, s) => a + s.churnM0, 0),
    };
  }, [sales]);

  const autoCalcActive = sales.length > 0 && sales.some(s => s.valorTotal > 0);

  const effectiveFinancials = autoCalcActive && salesTotals ? salesTotals : {
    valorTotal: form.valorContratoTotal,
    valorRecorrente: form.valorRecorrente,
    valorOnetime: form.valorOnetime,
    churnM0: form.churnM0,
  };

  const totalMismatch = !autoCalcActive && form.valorContratoTotal > 0 && (form.valorRecorrente + form.valorOnetime) > 0 &&
    Math.abs((form.valorRecorrente + form.valorOnetime) - form.valorContratoTotal) > 1;

  const proposalsFilled = proposals.filter(p => p.leadNome.trim()).length;
  const salesFilled = sales.filter(s => s.leadNome.trim() && s.canalVenda).length;
  const callsFilled = calls.filter(c => c.leadNome.trim()).length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.userId) {
      toast.error("Selecione o closer.", { icon: <AlertCircle className="w-4 h-4" /> });
      return;
    }
    if (form.propostasRealizadas > 0 && proposalsFilled < form.propostasRealizadas) {
      toast.error("Preencha todos os blocos de proposta.");
      return;
    }
    if (form.contratosAssinados > 0 && salesFilled < form.contratosAssinados) {
      toast.error("Preencha todos os blocos de venda (nome + canal).");
      return;
    }

    setSubmitting(true);
    const dataRef = new Date().toISOString().split("T")[0];

    try {
      // 1. Insert main submission
      const { data: sub, error: subErr } = await supabase
        .from("closer_submissions")
        .insert({
          data_referencia: dataRef,
          closer_id: form.userId,
          unit_id: userUnitId,
          calls_realizadas: Math.max(form.callsRealizadas, form.contratosAssinados > 0 ? 1 : 0),
          no_show: form.noShow,
          propostas_realizadas: form.propostasRealizadas,
          contratos_assinados: form.contratosAssinados,
          valor_contrato_total: effectiveFinancials.valorTotal,
          valor_recorrente: effectiveFinancials.valorRecorrente,
          valor_onetime: effectiveFinancials.valorOnetime,
          churn_m0: effectiveFinancials.churnM0,
          observacoes: form.observacoes || null,
        })
        .select("id")
        .single();

      if (subErr) throw subErr;

      // 2. Insert proposal details
      if (proposals.length > 0) {
        const { error } = await supabase.from("closer_proposals_detail").insert(
          proposals.map(p => ({
            submission_id: sub.id,
            data_referencia: dataRef,
            closer_id: form.userId,
            lead_nome: p.leadNome,
            canal_proposta: p.canalProposta || null,
            temperatura_proposta: p.temperatura as "frio" | "morno" | "quente",
            valor_proposta: p.valorProposta,
            observacao: p.observacao || null,
          }))
        );
        if (error) throw error;
      }

      // 3. Insert sales details
      if (sales.length > 0) {
        const { error } = await supabase.from("closer_sales_detail").insert(
          sales.map(s => ({
            submission_id: sub.id,
            data_referencia: dataRef,
            closer_id: form.userId,
            lead_nome: s.leadNome,
            canal_venda: s.canalVenda,
            valor_total: s.valorTotal,
            valor_recorrente: s.valorRecorrente,
            valor_onetime: s.valorOnetime,
            churn_m0: s.churnM0,
          }))
        );
        if (error) throw error;
      }

      // 4. Insert call details (if detailed)
      if (showCallDetail && calls.length > 0) {
        const filledCalls = calls.filter(c => c.leadNome.trim());
        if (filledCalls.length > 0) {
          const { error } = await supabase.from("closer_calls_detail").insert(
            filledCalls.map(c => ({
              submission_id: sub.id,
              data_referencia: dataRef,
              closer_id: form.userId,
              lead_nome: c.leadNome || null,
              temperatura_call: c.temperatura as "frio" | "morno" | "quente",
              resultado_call: c.resultado ? c.resultado as any : null,
            }))
          );
          if (error) throw error;
        }
      }

      // Also update zustand store for dashboard
      addCloserSubmission({
        id: sub.id,
        dataReferencia: dataRef,
        submittedAt: new Date().toISOString(),
        userId: form.userId,
        channelId: sales[0]?.canalVenda || "",
        callsRealizadas: Math.max(form.callsRealizadas, form.contratosAssinados > 0 ? 1 : 0),
        no_show: form.noShow,
        contratosAssinados: form.contratosAssinados,
        propostasRealizadas: form.propostasRealizadas,
        valorContratoTotal: effectiveFinancials.valorTotal,
        valorRecorrente: effectiveFinancials.valorRecorrente,
        valorOnetime: effectiveFinancials.valorOnetime,
        churnM0: effectiveFinancials.churnM0,
        temperaturaCall: "morno",
        temperaturaProposta: "morno",
        observacoes: form.observacoes,
      });

      setSubmitted(true);
      toast.success("Lançamento registrado com sucesso!", { icon: <CheckCircle className="w-4 h-4" /> });
      setTimeout(() => setSubmitted(false), 3000);

      // Reset
      setForm({ userId: "", callsRealizadas: 0, noShow: 0, propostasRealizadas: 0, contratosAssinados: 0, valorContratoTotal: 0, valorRecorrente: 0, valorOnetime: 0, churnM0: 0, observacoes: "" });
      setProposals([]);
      setSales([]);
      setCalls([]);
      setShowCallDetail(false);
    } catch (err: any) {
      console.error(err);
      toast.error("Erro ao salvar: " + (err.message || "tente novamente"));
    } finally {
      setSubmitting(false);
    }
  };

  const updateProposal = (i: number, field: keyof ProposalDetail, value: any) => {
    setProposals(prev => prev.map((p, idx) => idx === i ? { ...p, [field]: value } : p));
  };

  const updateSale = (i: number, field: keyof SaleDetail, value: any) => {
    setSales(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: value } : s));
  };

  const updateCall = (i: number, field: keyof CallDetail, value: any) => {
    setCalls(prev => prev.map((c, idx) => idx === i ? { ...c, [field]: value } : c));
  };

  return (
    <form onSubmit={handleSubmit} className="kpi-card space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-1.5 h-6 bg-primary rounded-full" />
        <div>
          <h3 className="text-[14px] font-semibold">Formulário Closer</h3>
          <p className="text-[11px] text-muted-foreground">Preencha até às 20h</p>
        </div>
      </div>

      {/* ── Identificação ── */}
      <FormSection title="Identificação">
        <FormField label="Closer" required>
          <Select value={form.userId} onValueChange={(v) => setForm({ ...form, userId: v })}>
            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>{unitClosers.map((c) => <SelectItem key={c.userId} value={c.userId}>{c.fullName}</SelectItem>)}</SelectContent>
          </Select>
        </FormField>
      </FormSection>

      {/* ── Atividade ── */}
      <FormSection title="Atividade">
        <FormField label="Calls Realizadas">
          <Input type="number" min={0} value={form.callsRealizadas || ""} onChange={(e) => { const v = +e.target.value; setForm({ ...form, callsRealizadas: v }); if (showCallDetail) syncCalls(v); }} placeholder="0" className="tabular" />
        </FormField>
        <FormField label="No Show">
          <Input type="number" min={0} value={form.noShow || ""} onChange={(e) => setForm({ ...form, noShow: +e.target.value })} placeholder="0" className="tabular" />
        </FormField>
        <FormField label="Propostas Realizadas">
          <Input type="number" min={0} value={form.propostasRealizadas || ""} onChange={(e) => { const v = +e.target.value; setForm({ ...form, propostasRealizadas: v }); syncProposals(v); }} placeholder="0" className="tabular" />
        </FormField>
        <FormField label="Contratos Assinados">
          <Input type="number" min={0} value={form.contratosAssinados || ""} onChange={(e) => { const v = +e.target.value; setForm({ ...form, contratosAssinados: v }); syncSales(v); }} placeholder="0" className="tabular" />
        </FormField>
      </FormSection>

      {/* ── Calls Detail (optional) ── */}
      {form.callsRealizadas > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground font-medium">Detalhar Calls</p>
            <Button type="button" variant="outline" size="sm" className="h-7 text-[11px] gap-1" onClick={() => { setShowCallDetail(!showCallDetail); if (!showCallDetail) syncCalls(form.callsRealizadas); }}>
              {showCallDetail ? "Ocultar detalhes" : "Detalhar calls realizadas"}
            </Button>
          </div>
          {showCallDetail && (
            <>
              <CompletionCounter label="Calls detalhadas" filled={callsFilled} total={form.callsRealizadas} />
              <Accordion type="multiple" className="space-y-2">
                {calls.map((call, i) => (
                  <AccordionItem key={i} value={`call-${i}`} className="border border-border/60 rounded-xl overflow-hidden">
                    <AccordionTrigger className="px-4 py-3 hover:no-underline">
                      <DetailBlockHeader title="Call" index={i} filled={!!call.leadNome.trim()} />
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <FormField label="Lead/Projeto">
                          <Input value={call.leadNome} onChange={(e) => updateCall(i, "leadNome", e.target.value)} placeholder="Nome do lead" />
                        </FormField>
                        <FormField label="Temperatura da Call">
                          <Select value={call.temperatura} onValueChange={(v) => updateCall(i, "temperatura", v)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="frio">🔵 Frio</SelectItem>
                              <SelectItem value="morno">🟡 Morno</SelectItem>
                              <SelectItem value="quente">🔴 Quente</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormField>
                        <FormField label="Resultado">
                          <Select value={call.resultado} onValueChange={(v) => updateCall(i, "resultado", v)}>
                            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="avancou_proposta">Avançou p/ Proposta</SelectItem>
                              <SelectItem value="follow_up">Follow-up</SelectItem>
                              <SelectItem value="sem_fit">Sem Fit</SelectItem>
                              <SelectItem value="perdido">Perdido</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormField>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </>
          )}
        </div>
      )}

      {/* ── Propostas Detail (required when > 0) ── */}
      {form.propostasRealizadas > 0 && (
        <div className="space-y-3">
          <p className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground font-medium border-b border-border/50 pb-2">Detalhamento de Propostas</p>
          <CompletionCounter label="Propostas detalhadas" filled={proposalsFilled} total={form.propostasRealizadas} />
          <Accordion type="multiple" defaultValue={proposals.map((_, i) => `prop-${i}`)} className="space-y-2">
            {proposals.map((prop, i) => (
              <AccordionItem key={i} value={`prop-${i}`} className="border border-border/60 rounded-xl overflow-hidden">
                <AccordionTrigger className="px-4 py-3 hover:no-underline">
                  <DetailBlockHeader title="Proposta" index={i} filled={!!prop.leadNome.trim()} />
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <FormField label="Lead/Projeto" required>
                      <Input value={prop.leadNome} onChange={(e) => updateProposal(i, "leadNome", e.target.value)} placeholder="Nome do lead" />
                    </FormField>
                    <FormField label="Temperatura da Proposta" required>
                      <Select value={prop.temperatura} onValueChange={(v) => updateProposal(i, "temperatura", v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="frio">🔵 Frio</SelectItem>
                          <SelectItem value="morno">🟡 Morno</SelectItem>
                          <SelectItem value="quente">🔴 Quente</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormField>
                    <FormField label="Valor da Proposta (R$)">
                      <Input type="number" min={0} value={prop.valorProposta || ""} onChange={(e) => updateProposal(i, "valorProposta", +e.target.value)} placeholder="0,00" className="tabular" />
                    </FormField>
                    <FormField label="Canal da Proposta">
                      <Select value={prop.canalProposta} onValueChange={(v) => updateProposal(i, "canalProposta", v)}>
                        <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>{channels.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
                      </Select>
                    </FormField>
                    <div className="sm:col-span-2">
                      <FormField label="Observação">
                        <Input value={prop.observacao} onChange={(e) => updateProposal(i, "observacao", e.target.value)} placeholder="Observação (opcional)" />
                      </FormField>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      )}

      {/* ── Vendas Detail (required when > 0) ── */}
      {form.contratosAssinados > 0 && (
        <div className="space-y-3">
          <p className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground font-medium border-b border-border/50 pb-2">Detalhamento de Vendas</p>
          <CompletionCounter label="Vendas detalhadas" filled={salesFilled} total={form.contratosAssinados} />
          <Accordion type="multiple" defaultValue={sales.map((_, i) => `sale-${i}`)} className="space-y-2">
            {sales.map((sale, i) => (
              <AccordionItem key={i} value={`sale-${i}`} className="border border-border/60 rounded-xl overflow-hidden">
                <AccordionTrigger className="px-4 py-3 hover:no-underline">
                  <DetailBlockHeader title="Venda" index={i} filled={!!sale.leadNome.trim() && !!sale.canalVenda} />
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <FormField label="Lead/Projeto" required>
                      <Input value={sale.leadNome} onChange={(e) => updateSale(i, "leadNome", e.target.value)} placeholder="Nome do lead vendido" />
                    </FormField>
                    <FormField label="Canal da Venda" required>
                      <Select value={sale.canalVenda} onValueChange={(v) => updateSale(i, "canalVenda", v)}>
                        <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>{channels.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
                      </Select>
                    </FormField>
                    <FormField label="Valor da Venda (R$)">
                      <Input type="number" min={0} value={sale.valorTotal || ""} onChange={(e) => updateSale(i, "valorTotal", +e.target.value)} placeholder="0,00" className="tabular" />
                    </FormField>
                    <FormField label="Recorrente (R$)">
                      <Input type="number" min={0} value={sale.valorRecorrente || ""} onChange={(e) => updateSale(i, "valorRecorrente", +e.target.value)} placeholder="0,00" className="tabular" />
                    </FormField>
                    <FormField label="One-Time (R$)">
                      <Input type="number" min={0} value={sale.valorOnetime || ""} onChange={(e) => updateSale(i, "valorOnetime", +e.target.value)} placeholder="0,00" className="tabular" />
                    </FormField>
                    <FormField label="Churn M0 (R$)">
                      <Input type="number" min={0} value={sale.churnM0 || ""} onChange={(e) => updateSale(i, "churnM0", +e.target.value)} placeholder="0,00" className="tabular" />
                    </FormField>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      )}

      {/* ── Financeiro (auto-calculated or manual) ── */}
      <FormSection title={autoCalcActive ? "Financeiro (auto-calculado das vendas)" : "Financeiro"}>
        <FormField label="Valor Total (R$)">
          <Input type="number" min={0} value={effectiveFinancials.valorTotal || ""} onChange={(e) => !autoCalcActive && setForm({ ...form, valorContratoTotal: +e.target.value })} placeholder="0,00" className="tabular" disabled={autoCalcActive} />
        </FormField>
        <FormField label="Recorrente (R$)">
          <Input type="number" min={0} value={effectiveFinancials.valorRecorrente || ""} onChange={(e) => !autoCalcActive && setForm({ ...form, valorRecorrente: +e.target.value })} placeholder="0,00" className="tabular" disabled={autoCalcActive} />
        </FormField>
        <FormField label="One-Time (R$)">
          <Input type="number" min={0} value={effectiveFinancials.valorOnetime || ""} onChange={(e) => !autoCalcActive && setForm({ ...form, valorOnetime: +e.target.value })} placeholder="0,00" className="tabular" disabled={autoCalcActive} />
        </FormField>
        <FormField label="Churn M0 (R$)">
          <Input type="number" min={0} value={effectiveFinancials.churnM0 || ""} onChange={(e) => !autoCalcActive && setForm({ ...form, churnM0: +e.target.value })} placeholder="0,00" className="tabular" disabled={autoCalcActive} />
        </FormField>
      </FormSection>

      {autoCalcActive && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/15">
          <CheckCircle className="w-3.5 h-3.5 text-primary shrink-0" />
          <p className="text-[11px] text-primary/80">Valores financeiros calculados automaticamente a partir dos blocos de venda.</p>
        </div>
      )}

      {totalMismatch && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-v4-orange/10 border border-v4-orange/20">
          <AlertCircle className="w-4 h-4 semaforo-laranja shrink-0" />
          <p className="text-[11px] semaforo-laranja">Recorrente + One-Time difere do Total</p>
        </div>
      )}

      {/* ── Observações ── */}
      <FormField label="Observações gerais">
        <Textarea value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} placeholder="Observações do dia (opcional)" className="min-h-[60px]" />
      </FormField>

      <Button type="submit" className="w-full gap-2 h-11" disabled={submitted || submitting}>
        {submitted ? <CheckCircle className="w-4 h-4" /> : <Send className="w-4 h-4" />}
        {submitting ? "Salvando..." : submitted ? "Registrado ✓" : "Registrar Lançamento"}
      </Button>
    </form>
  );
}

/* ══════════════════════════════════════════════ */
/* ── PRÉ-VENDAS FORM                         ── */
/* ══════════════════════════════════════════════ */

interface BookedCallDetail {
  leadNome: string;
  tipoLead: string;
  punch: string;
  canal: string;
}

interface RealizedCallDetail {
  leadNome: string;
  tipoLead: string;
  observacao: string;
}

interface PvContractDetail {
  leadNome: string;
  canal: string;
  valorTotal: number;
  valorRecorrente: number;
  valorOnetime: number;
  churnM0: number;
}

const emptyBookedCall = (): BookedCallDetail => ({ leadNome: "", tipoLead: "", punch: "", canal: "" });
const emptyRealizedCall = (): RealizedCallDetail => ({ leadNome: "", tipoLead: "", observacao: "" });
const emptyPvContract = (): PvContractDetail => ({ leadNome: "", canal: "", valorTotal: 0, valorRecorrente: 0, valorOnetime: 0, churnM0: 0 });

export function DailyFormPreVendas() {
  const { addPvSubmission } = useDashboardStore();
  const { preVendas: unitPreVendas, userUnitId } = useUnitData();
  const { profile, roles } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [form, setForm] = useState({
    userId: "",
    callsMarcadas: 0,
    callsRealizadas: 0,
    noShow: 0,
    reagendamentos: 0,
    contratosAssinados: 0,
    valorContratoTotal: 0,
    valorRecorrente: 0,
    valorOnetime: 0,
    churnM0: 0,
    observacoes: "",
  });

  const [bookedCalls, setBookedCalls] = useState<BookedCallDetail[]>([]);
  const [realizedCalls, setRealizedCalls] = useState<RealizedCallDetail[]>([]);
  const [pvContracts, setPvContracts] = useState<PvContractDetail[]>([]);

  const syncBookedCalls = useCallback((count: number) => {
    setBookedCalls(prev => {
      if (count > prev.length) return [...prev, ...Array(count - prev.length).fill(null).map(() => emptyBookedCall())];
      return prev.slice(0, count);
    });
  }, []);

  const syncRealizedCalls = useCallback((count: number) => {
    setRealizedCalls(prev => {
      if (count > prev.length) return [...prev, ...Array(count - prev.length).fill(null).map(() => emptyRealizedCall())];
      return prev.slice(0, count);
    });
  }, []);

  const syncContracts = useCallback((count: number) => {
    setPvContracts(prev => {
      if (count > prev.length) return [...prev, ...Array(count - prev.length).fill(null).map(() => emptyPvContract())];
      return prev.slice(0, count);
    });
  }, []);

  const contractTotals = useMemo(() => {
    if (pvContracts.length === 0) return null;
    return {
      valorTotal: pvContracts.reduce((a, c) => a + c.valorTotal, 0),
      valorRecorrente: pvContracts.reduce((a, c) => a + c.valorRecorrente, 0),
      valorOnetime: pvContracts.reduce((a, c) => a + c.valorOnetime, 0),
      churnM0: pvContracts.reduce((a, c) => a + c.churnM0, 0),
    };
  }, [pvContracts]);

  const autoCalcActive = pvContracts.length > 0 && pvContracts.some(c => c.valorTotal > 0);

  const effectiveFinancials = autoCalcActive && contractTotals ? contractTotals : {
    valorTotal: form.valorContratoTotal,
    valorRecorrente: form.valorRecorrente,
    valorOnetime: form.valorOnetime,
    churnM0: form.churnM0,
  };

  const bookedFilled = bookedCalls.filter(b => b.leadNome.trim()).length;
  const realizedFilled = realizedCalls.filter(r => r.leadNome.trim()).length;
  const contractsFilled = pvContracts.filter(c => c.leadNome.trim()).length;

  const updateBooked = (i: number, field: keyof BookedCallDetail, value: string) => {
    setBookedCalls(prev => prev.map((b, idx) => idx === i ? { ...b, [field]: value } : b));
  };

  const updateRealized = (i: number, field: keyof RealizedCallDetail, value: string) => {
    setRealizedCalls(prev => prev.map((r, idx) => idx === i ? { ...r, [field]: value } : r));
  };

  const updateContract = (i: number, field: keyof PvContractDetail, value: any) => {
    setPvContracts(prev => prev.map((c, idx) => idx === i ? { ...c, [field]: value } : c));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.userId) {
      toast.error("Selecione o pré-vendas.", { icon: <AlertCircle className="w-4 h-4" /> });
      return;
    }
    if (form.callsMarcadas > 0 && bookedFilled < form.callsMarcadas) {
      toast.error("Preencha todos os blocos de calls marcadas.");
      return;
    }
    if (form.callsRealizadas > 0 && realizedFilled < form.callsRealizadas) {
      toast.error("Preencha todos os blocos de calls realizadas.");
      return;
    }

    setSubmitting(true);
    const dataRef = new Date().toISOString().split("T")[0];

    try {
      const { data: sub, error: subErr } = await supabase
        .from("pv_submissions")
        .insert({
          data_referencia: dataRef,
          pv_id: form.userId,
          unit_id: userUnitId,
          calls_marcadas: form.callsMarcadas,
          calls_realizadas: form.callsRealizadas,
          no_show: form.noShow,
          reagendamentos: form.reagendamentos,
          contratos_assinados: form.contratosAssinados,
          valor_contrato_total: effectiveFinancials.valorTotal,
          valor_recorrente: effectiveFinancials.valorRecorrente,
          valor_onetime: effectiveFinancials.valorOnetime,
          churn_m0: effectiveFinancials.churnM0,
          observacoes: form.observacoes || null,
        })
        .select("id")
        .single();

      if (subErr) throw subErr;

      if (bookedCalls.length > 0) {
        const { error } = await supabase.from("pv_booked_calls_detail").insert(
          bookedCalls.map(b => ({
            submission_id: sub.id,
            data_referencia: dataRef,
            pv_id: form.userId,
            lead_nome: b.leadNome,
            tipo_lead: b.tipoLead || null,
            punch: b.punch || null,
            canal: b.canal || null,
          }))
        );
        if (error) throw error;
      }

      if (realizedCalls.length > 0) {
        const { error } = await supabase.from("pv_realized_calls_detail").insert(
          realizedCalls.map(r => ({
            submission_id: sub.id,
            data_referencia: dataRef,
            pv_id: form.userId,
            lead_nome: r.leadNome,
            tipo_lead: r.tipoLead || null,
            observacao: r.observacao || null,
          }))
        );
        if (error) throw error;
      }

      if (pvContracts.length > 0) {
        const { error } = await supabase.from("pv_contracts_detail").insert(
          pvContracts.map(c => ({
            submission_id: sub.id,
            data_referencia: dataRef,
            pv_id: form.userId,
            lead_nome: c.leadNome,
            canal: c.canal || null,
            valor_total: c.valorTotal,
            valor_recorrente: c.valorRecorrente,
            valor_onetime: c.valorOnetime,
            churn_m0: c.churnM0,
          }))
        );
        if (error) throw error;
      }

      addPvSubmission({
        id: sub.id,
        dataReferencia: dataRef,
        submittedAt: new Date().toISOString(),
        userId: form.userId,
        callsMarcadas: form.callsMarcadas,
        callsRealizadas: form.callsRealizadas,
        noShow: form.noShow,
        reagendamentos: form.reagendamentos,
        contratosAssinados: form.contratosAssinados,
        valorContratoTotal: effectiveFinancials.valorTotal,
        valorRecorrente: effectiveFinancials.valorRecorrente,
        valorOnetime: effectiveFinancials.valorOnetime,
        churnM0: effectiveFinancials.churnM0,
        observacoes: form.observacoes,
      });

      setSubmitted(true);
      toast.success("Lançamento registrado com sucesso!", { icon: <CheckCircle className="w-4 h-4" /> });
      setTimeout(() => setSubmitted(false), 3000);

      setForm({ userId: "", callsMarcadas: 0, callsRealizadas: 0, noShow: 0, reagendamentos: 0, contratosAssinados: 0, valorContratoTotal: 0, valorRecorrente: 0, valorOnetime: 0, churnM0: 0, observacoes: "" });
      setBookedCalls([]);
      setRealizedCalls([]);
      setPvContracts([]);
    } catch (err: any) {
      console.error(err);
      toast.error("Erro ao salvar: " + (err.message || "tente novamente"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="kpi-card space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-1.5 h-6 bg-accent rounded-full" />
        <div>
          <h3 className="text-[14px] font-semibold">Formulário Pré-Vendas</h3>
          <p className="text-[11px] text-muted-foreground">Preencha até às 20h</p>
        </div>
      </div>

      <FormSection title="Identificação">
        <FormField label="Pré-Vendas" required>
          <Select value={form.userId} onValueChange={(v) => setForm({ ...form, userId: v })}>
            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>{unitPreVendas.map((p) => <SelectItem key={p.userId} value={p.userId}>{p.fullName}</SelectItem>)}</SelectContent>
          </Select>
        </FormField>
      </FormSection>

      <FormSection title="Atividade">
        <FormField label="Calls Marcadas">
          <Input type="number" min={0} value={form.callsMarcadas || ""} onChange={(e) => { const v = +e.target.value; setForm({ ...form, callsMarcadas: v }); syncBookedCalls(v); }} placeholder="0" className="tabular" />
        </FormField>
        <FormField label="Calls Realizadas">
          <Input type="number" min={0} value={form.callsRealizadas || ""} onChange={(e) => { const v = +e.target.value; setForm({ ...form, callsRealizadas: v }); syncRealizedCalls(v); }} placeholder="0" className="tabular" />
        </FormField>
        <FormField label="No Show">
          <Input type="number" min={0} value={form.noShow || ""} onChange={(e) => setForm({ ...form, noShow: +e.target.value })} placeholder="0" className="tabular" />
        </FormField>
        <FormField label="Reagendamentos">
          <Input type="number" min={0} value={form.reagendamentos || ""} onChange={(e) => setForm({ ...form, reagendamentos: +e.target.value })} placeholder="0" className="tabular" />
        </FormField>
      </FormSection>

      {/* ── Calls Marcadas Detail ── */}
      {form.callsMarcadas > 0 && (
        <div className="space-y-3">
          <p className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground font-medium border-b border-border/50 pb-2">Detalhamento de Calls Marcadas (com Punch)</p>
          <CompletionCounter label="Calls marcadas detalhadas" filled={bookedFilled} total={form.callsMarcadas} />
          <Accordion type="multiple" defaultValue={bookedCalls.map((_, i) => `booked-${i}`)} className="space-y-2">
            {bookedCalls.map((bc, i) => (
              <AccordionItem key={i} value={`booked-${i}`} className="border border-border/60 rounded-xl overflow-hidden">
                <AccordionTrigger className="px-4 py-3 hover:no-underline">
                  <DetailBlockHeader title="Call Marcada" index={i} filled={!!bc.leadNome.trim()} />
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <FormField label="Lead/Projeto" required>
                      <Input value={bc.leadNome} onChange={(e) => updateBooked(i, "leadNome", e.target.value)} placeholder="Nome do lead" />
                    </FormField>
                    <FormField label="Tipo de Lead">
                      <Select value={bc.tipoLead} onValueChange={(v) => updateBooked(i, "tipoLead", v)}>
                        <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>
                          {tipoLeadOptions.map(t => <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </FormField>
                    <div className="sm:col-span-2">
                      <FormField label="Punch Aplicado">
                        <Textarea value={bc.punch} onChange={(e) => updateBooked(i, "punch", e.target.value)} placeholder="Argumento/abordagem/gatilho usado" className="min-h-[50px]" />
                      </FormField>
                    </div>
                    <FormField label="Canal">
                      <Select value={bc.canal} onValueChange={(v) => updateBooked(i, "canal", v)}>
                        <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
                        <SelectContent>{channels.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
                      </Select>
                    </FormField>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      )}

      {/* ── Calls Realizadas Detail ── */}
      {form.callsRealizadas > 0 && (
        <div className="space-y-3">
          <p className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground font-medium border-b border-border/50 pb-2">Detalhamento de Calls Realizadas</p>
          <CompletionCounter label="Calls realizadas detalhadas" filled={realizedFilled} total={form.callsRealizadas} />
          <Accordion type="multiple" defaultValue={realizedCalls.map((_, i) => `realized-${i}`)} className="space-y-2">
            {realizedCalls.map((rc, i) => (
              <AccordionItem key={i} value={`realized-${i}`} className="border border-border/60 rounded-xl overflow-hidden">
                <AccordionTrigger className="px-4 py-3 hover:no-underline">
                  <DetailBlockHeader title="Call Realizada" index={i} filled={!!rc.leadNome.trim()} />
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <FormField label="Lead/Projeto" required>
                      <Input value={rc.leadNome} onChange={(e) => updateRealized(i, "leadNome", e.target.value)} placeholder="Nome do lead" />
                    </FormField>
                    <FormField label="Tipo de Lead">
                      <Select value={rc.tipoLead} onValueChange={(v) => updateRealized(i, "tipoLead", v)}>
                        <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>
                          {tipoLeadOptions.map(t => <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </FormField>
                    <div className="sm:col-span-2">
                      <FormField label="Observação">
                        <Input value={rc.observacao} onChange={(e) => updateRealized(i, "observacao", e.target.value)} placeholder="Observação (opcional)" />
                      </FormField>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      )}

      {/* ── Contratos Detail ── */}
      <FormSection title="Contratos">
        <FormField label="Contratos Assinados">
          <Input type="number" min={0} value={form.contratosAssinados || ""} onChange={(e) => { const v = +e.target.value; setForm({ ...form, contratosAssinados: v }); syncContracts(v); }} placeholder="0" className="tabular" />
        </FormField>
      </FormSection>

      {form.contratosAssinados > 0 && (
        <div className="space-y-3">
          <p className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground font-medium border-b border-border/50 pb-2">Detalhamento de Contratos</p>
          <CompletionCounter label="Contratos detalhados" filled={contractsFilled} total={form.contratosAssinados} />
          <Accordion type="multiple" defaultValue={pvContracts.map((_, i) => `contract-${i}`)} className="space-y-2">
            {pvContracts.map((ct, i) => (
              <AccordionItem key={i} value={`contract-${i}`} className="border border-border/60 rounded-xl overflow-hidden">
                <AccordionTrigger className="px-4 py-3 hover:no-underline">
                  <DetailBlockHeader title="Contrato" index={i} filled={!!ct.leadNome.trim()} />
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <FormField label="Lead/Projeto" required>
                      <Input value={ct.leadNome} onChange={(e) => updateContract(i, "leadNome", e.target.value)} placeholder="Nome do lead" />
                    </FormField>
                    <FormField label="Canal">
                      <Select value={ct.canal} onValueChange={(v) => updateContract(i, "canal", v)}>
                        <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>{channels.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
                      </Select>
                    </FormField>
                    <FormField label="Valor Total (R$)">
                      <Input type="number" min={0} value={ct.valorTotal || ""} onChange={(e) => updateContract(i, "valorTotal", +e.target.value)} placeholder="0,00" className="tabular" />
                    </FormField>
                    <FormField label="Recorrente (R$)">
                      <Input type="number" min={0} value={ct.valorRecorrente || ""} onChange={(e) => updateContract(i, "valorRecorrente", +e.target.value)} placeholder="0,00" className="tabular" />
                    </FormField>
                    <FormField label="One-Time (R$)">
                      <Input type="number" min={0} value={ct.valorOnetime || ""} onChange={(e) => updateContract(i, "valorOnetime", +e.target.value)} placeholder="0,00" className="tabular" />
                    </FormField>
                    <FormField label="Churn M0 (R$)">
                      <Input type="number" min={0} value={ct.churnM0 || ""} onChange={(e) => updateContract(i, "churnM0", +e.target.value)} placeholder="0,00" className="tabular" />
                    </FormField>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      )}

      {/* ── Financeiro ── */}
      <FormSection title={autoCalcActive ? "Financeiro (auto-calculado dos contratos)" : "Financeiro"}>
        <FormField label="Valor Total (R$)">
          <Input type="number" min={0} value={effectiveFinancials.valorTotal || ""} onChange={(e) => !autoCalcActive && setForm({ ...form, valorContratoTotal: +e.target.value })} placeholder="0,00" className="tabular" disabled={autoCalcActive} />
        </FormField>
        <FormField label="Recorrente (R$)">
          <Input type="number" min={0} value={effectiveFinancials.valorRecorrente || ""} onChange={(e) => !autoCalcActive && setForm({ ...form, valorRecorrente: +e.target.value })} placeholder="0,00" className="tabular" disabled={autoCalcActive} />
        </FormField>
        <FormField label="One-Time (R$)">
          <Input type="number" min={0} value={effectiveFinancials.valorOnetime || ""} onChange={(e) => !autoCalcActive && setForm({ ...form, valorOnetime: +e.target.value })} placeholder="0,00" className="tabular" disabled={autoCalcActive} />
        </FormField>
        <FormField label="Churn M0 (R$)">
          <Input type="number" min={0} value={effectiveFinancials.churnM0 || ""} onChange={(e) => !autoCalcActive && setForm({ ...form, churnM0: +e.target.value })} placeholder="0,00" className="tabular" disabled={autoCalcActive} />
        </FormField>
      </FormSection>

      {autoCalcActive && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-accent/10 border border-accent/20">
          <CheckCircle className="w-3.5 h-3.5 text-accent shrink-0" />
          <p className="text-[11px] text-accent">Valores financeiros calculados automaticamente a partir dos blocos de contrato.</p>
        </div>
      )}

      <FormField label="Observações gerais">
        <Textarea value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} placeholder="Observações do dia (opcional)" className="min-h-[60px]" />
      </FormField>

      <Button type="submit" className="w-full gap-2 h-11" disabled={submitted || submitting}>
        {submitted ? <CheckCircle className="w-4 h-4" /> : <Send className="w-4 h-4" />}
        {submitting ? "Salvando..." : submitted ? "Registrado ✓" : "Registrar Lançamento"}
      </Button>
    </form>
  );
}
