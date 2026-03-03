import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useDashboardStore } from "@/data/store";
import { useUnitData, UnitMember } from "@/hooks/useUnitData";
import { useAuth } from "@/hooks/useAuth";
import { getBusinessDaysInMarch, getDiaUtilAtual } from "@/data/seedData";
import { CheckCircle2, XCircle, Clock, AlertTriangle, ClipboardCheck, Filter } from "lucide-react";
import { SemaforoBadge } from "./SemaforoBadge";
import { SubmissionHistory } from "./SubmissionHistory";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

function MemberAvatar({ name, className }: { name: string; className?: string }) {
  const initials = name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  return (
    <div className={`rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-[10px] ${className}`}>
      {initials}
    </div>
  );
}

export function SubmissionAudit() {
  const { isAdmin } = useAuth();
  const [unitsList, setUnitsList] = useState<{ id: string; name: string }[]>([]);
  const [selectedUnitId, setSelectedUnitId] = useState<string>("all");

  // Fetch units for admin filter
  useEffect(() => {
    if (!isAdmin) return;
    supabase.from("units").select("id, name").order("name").then(({ data }) => {
      if (data) setUnitsList(data);
    });
  }, [isAdmin]);

  // Pass the selected unit to useUnitData so members are filtered
  const { closers, preVendas, members } = useUnitData(isAdmin ? selectedUnitId : undefined);
  const { closerSubmissions, pvSubmissions, loadFromDB } = useDashboardStore();

  // Reload store when admin changes unit filter
  useEffect(() => {
    if (!isAdmin) return;
    loadFromDB(selectedUnitId !== "all" ? selectedUnitId : null);
  }, [selectedUnitId, isAdmin]);

  const businessDays = getBusinessDaysInMarch();
  const today = new Date().toISOString().split("T")[0];
  const diaAtual = getDiaUtilAtual();

  const pastDays = businessDays.filter((d) => d <= today);

  function hasSubmission(userId: string, date: string, funcao: "closer" | "sdr"): boolean {
    if (funcao === "closer") return closerSubmissions.some((s) => s.userId === userId && s.dataReferencia === date);
    return pvSubmissions.some((s) => s.userId === userId && s.dataReferencia === date);
  }

  function getSubmissionTime(userId: string, date: string, funcao: "closer" | "sdr"): string | null {
    const sub = funcao === "closer"
      ? closerSubmissions.find((s) => s.userId === userId && s.dataReferencia === date)
      : pvSubmissions.find((s) => s.userId === userId && s.dataReferencia === date);
    return sub?.submittedAt || null;
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + "T12:00:00");
    return { day: d.getDate(), weekday: d.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "") };
  };

  const allMembers = [...closers, ...preVendas];
  const totalExpected = pastDays.length * allMembers.length;
  const totalSubmitted = pastDays.reduce((acc, date) =>
    acc + allMembers.filter((m) => hasSubmission(m.userId, date, m.role as any)).length, 0);
  const pendingToday = allMembers.filter((m) => !hasSubmission(m.userId, today, m.role as any));
  const completionRate = totalExpected > 0 ? totalSubmitted / totalExpected : 0;

  function AuditTable({ unitMembers, funcao, title }: { unitMembers: UnitMember[]; funcao: "closer" | "sdr"; title: string }) {
    return (
      <div>
        <p className="section-title mb-3">{title}</p>
        {unitMembers.length === 0 ? (
          <div className="kpi-card text-center py-6">
            <p className="text-sm text-muted-foreground">Nenhum membro cadastrado.</p>
          </div>
        ) : (
          <div className="kpi-card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="table-header-v4">
                    <th className="text-left p-3 sticky left-0 bg-secondary/50 z-10 min-w-[140px]">Nome</th>
                    {pastDays.map((d) => {
                      const { day, weekday } = formatDate(d);
                      return (
                        <th key={d} className="text-center p-2 min-w-[44px]">
                          <div className="text-[9px] opacity-50">{weekday}</div>
                          <div className="tabular">{day}</div>
                        </th>
                      );
                    })}
                    <th className="text-center p-3 min-w-[60px]">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {unitMembers.map((m) => {
                    const total = pastDays.filter((d) => hasSubmission(m.userId, d, funcao)).length;
                    const allDone = total === pastDays.length;
                    return (
                      <tr key={m.userId} className="table-row-v4">
                        <td className="p-3 sticky left-0 bg-card z-10">
                          <div className="flex items-center gap-2">
                            <MemberAvatar name={m.fullName} className="w-6 h-6" />
                            <span className="font-medium text-[12px]">{m.fullName}</span>
                          </div>
                        </td>
                        {pastDays.map((d) => {
                          const submitted = hasSubmission(m.userId, d, funcao);
                          const time = getSubmissionTime(m.userId, d, funcao);
                          const isToday = d === today;
                          return (
                            <td key={d} className="text-center p-2">
                              {submitted ? (
                                <div className="flex flex-col items-center">
                                  <CheckCircle2 className="w-4 h-4 semaforo-verde" />
                                  {time && (
                                    <span className="text-[8px] text-muted-foreground mt-0.5 tabular">
                                      {new Date(time).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                                    </span>
                                  )}
                                </div>
                              ) : isToday ? (
                                <Clock className="w-4 h-4 text-muted-foreground mx-auto opacity-30" />
                              ) : (
                                <XCircle className="w-4 h-4 semaforo-vermelho mx-auto opacity-50" />
                              )}
                            </td>
                          );
                        })}
                        <td className="text-center p-3">
                          <span className={`tabular font-bold text-[12px] ${allDone ? "semaforo-verde" : "semaforo-vermelho"}`}>
                            {total}/{pastDays.length}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <ClipboardCheck className="w-6 h-6 text-primary" />
            Conferência de Lançamentos
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Dia {diaAtual} — Março 2026</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
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
          <div className="kpi-card py-2 px-4 flex items-center gap-2">
            <span className="text-[11px] text-muted-foreground">Completude</span>
            <span className={`text-[13px] font-bold tabular ${completionRate >= 1 ? "semaforo-verde" : completionRate >= 0.8 ? "semaforo-amarelo" : "semaforo-vermelho"}`}>
              {(completionRate * 100).toFixed(0)}%
            </span>
          </div>
        </div>
      </div>

      {/* Pending today */}
      {pendingToday.length > 0 && (
        <div className="kpi-card border-destructive/20 bg-destructive/5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-destructive" />
            <p className="text-[13px] font-semibold text-destructive">Pendentes Hoje ({pendingToday.length})</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {pendingToday.map((m) => (
              <span key={m.userId} className="px-2.5 py-1 rounded-lg bg-destructive/10 text-[11px] font-medium text-destructive">
                {m.fullName}
              </span>
            ))}
          </div>
        </div>
      )}

      <AuditTable unitMembers={closers} funcao="closer" title="Closers" />
      <AuditTable unitMembers={preVendas} funcao="sdr" title="Pré-Vendas" />

      <SubmissionHistory />
    </div>
  );
}
