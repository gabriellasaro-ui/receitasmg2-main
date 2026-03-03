import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, UserCheck, Clock, Users, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface PendingUser {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  unit_id: string | null;
  status: string;
  created_at: string;
  role: string | null;
  unit_name: string | null;
}

export function AdminApproval() {
  const [users, setUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPending = async () => {
    setLoading(true);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (!profiles) { setLoading(false); return; }

    // Fetch roles and unit names for each profile
    const enriched = await Promise.all(
      profiles.map(async (p) => {
        const { data: rolesData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", p.user_id)
          .limit(1);
        const { data: unitData } = p.unit_id
          ? await supabase.from("units").select("name").eq("id", p.unit_id).single()
          : { data: null };
        return {
          ...p,
          role: rolesData?.[0]?.role ?? null,
          unit_name: unitData?.name ?? null,
        } as PendingUser;
      })
    );

    setUsers(enriched);
    setLoading(false);
  };

  useEffect(() => { fetchPending(); }, []);

  const handleAction = async (userId: string, action: "approved" | "rejected") => {
    const { error } = await supabase
      .from("profiles")
      .update({ status: action })
      .eq("user_id", userId);

    if (error) {
      toast.error("Erro ao atualizar: " + error.message);
    } else {
      toast.success(action === "approved" ? "Usuário aprovado!" : "Usuário recusado.");
      fetchPending();
    }
  };

  const handleDelete = async (userId: string, name: string) => {
    if (!confirm(`Tem certeza que deseja excluir a conta de "${name}"? Esta ação é irreversível.`)) return;
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-user`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ user_id: userId }),
    });
    const result = await res.json();
    if (result.error) {
      toast.error("Erro ao excluir: " + result.error);
    } else {
      toast.success("Conta excluída com sucesso.");
      fetchPending();
    }
  };

  const roleLabel: Record<string, string> = {
    admin: "Admin",
    closer: "Closer",
    sdr: "SDR",
    gerente_unidade: "Gerente",
  };

  const statusBadge = (status: string) => {
    const map: Record<string, { label: string; className: string }> = {
      pending: { label: "Pendente", className: "bg-[hsl(43,96%,56%,0.12)] text-[hsl(43,96%,56%)] border-[hsl(43,96%,56%,0.2)]" },
      approved: { label: "Aprovado", className: "bg-[hsl(152,56%,42%,0.12)] text-[hsl(152,56%,42%)] border-[hsl(152,56%,42%,0.2)]" },
      rejected: { label: "Recusado", className: "bg-[hsl(0,72%,51%,0.12)] text-[hsl(0,72%,51%)] border-[hsl(0,72%,51%,0.2)]" },
    };
    const s = map[status] ?? map.pending;
    return <Badge variant="outline" className={`text-[11px] font-semibold ${s.className}`}>{s.label}</Badge>;
  };

  const pending = users.filter((u) => u.status === "pending");
  const others = users.filter((u) => u.status !== "pending");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <UserCheck className="w-6 h-6 text-primary" />
          Aprovação de Usuários
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Gerencie os acessos ao sistema MG2</p>
      </div>

      {/* Pending section */}
      <Card className="border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="w-4 h-4 text-[hsl(var(--v4-yellow))]" />
            Pendentes ({pending.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : pending.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum usuário pendente.</p>
          ) : (
            <div className="space-y-3">
              {pending.map((u) => (
                <div key={u.id} className="flex items-center justify-between gap-4 p-3 rounded-xl bg-secondary/30 border border-border/40">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{u.full_name}</p>
                    <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      {u.role && <Badge variant="secondary" className="text-[10px]">{roleLabel[u.role] ?? u.role}</Badge>}
                      {u.unit_name && <span className="text-[10px] text-muted-foreground">{u.unit_name}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button size="sm" onClick={() => handleAction(u.user_id, "approved")} className="h-8 gap-1.5">
                      <Check className="w-3.5 h-3.5" /> Aprovar
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleAction(u.user_id, "rejected")} className="h-8 gap-1.5 text-destructive hover:text-destructive">
                      <X className="w-3.5 h-3.5" /> Recusar
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(u.user_id, u.full_name)} className="h-8 px-2 text-muted-foreground hover:text-destructive">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* All users section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="w-4 h-4" />
            Todos os Usuários ({others.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {others.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum usuário registrado ainda.</p>
          ) : (
            <div className="space-y-2">
              {others.map((u) => (
                <div key={u.id} className="flex items-center justify-between gap-4 p-3 rounded-xl border border-border/30">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{u.full_name}</p>
                    <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {u.role && <Badge variant="secondary" className="text-[10px]">{roleLabel[u.role] ?? u.role}</Badge>}
                      {u.unit_name && <span className="text-[10px] text-muted-foreground">{u.unit_name}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {statusBadge(u.status)}
                    {u.status === "approved" && (
                      <Button size="sm" variant="ghost" onClick={() => handleAction(u.user_id, "rejected")} className="h-7 text-xs text-muted-foreground hover:text-destructive">
                        Revogar
                      </Button>
                    )}
                    {u.status === "rejected" && (
                      <Button size="sm" variant="ghost" onClick={() => handleAction(u.user_id, "approved")} className="h-7 text-xs text-muted-foreground hover:text-primary">
                        Reaprovar
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(u.user_id, u.full_name)} className="h-7 px-2 text-muted-foreground hover:text-destructive">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
