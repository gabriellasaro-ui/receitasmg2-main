import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface UnitMember {
  userId: string;
  fullName: string;
  email: string;
  unitId: string | null;
  role: "closer" | "sdr" | "gerente_unidade" | "admin";
  avatarUrl?: string;
}

export function useUnitData(overrideUnitId?: string | null) {
  const { profile, isAdmin } = useAuth();
  const [members, setMembers] = useState<UnitMember[]>([]);
  const [loading, setLoading] = useState(true);
  const userUnitId = profile?.unit_id || null;

  // If admin passes an override, use it. "all" or undefined = no filter for admin.
  const effectiveUnitId = isAdmin
    ? (overrideUnitId && overrideUnitId !== "all" ? overrideUnitId : null)
    : userUnitId;
  const isUnitScoped = isAdmin ? !!effectiveUnitId : !!userUnitId;

  useEffect(() => {
    if (!profile) return;

    const fetchMembers = async () => {
      setLoading(true);
      let query = supabase.from("profiles").select("*").eq("status", "approved" as any);
      if (isUnitScoped && effectiveUnitId) {
        query = query.eq("unit_id", effectiveUnitId);
      }
      const { data: profiles } = await query;
      if (!profiles || profiles.length === 0) {
        setMembers([]);
        setLoading(false);
        return;
      }

      const userIds = profiles.map((p: any) => p.user_id);
      const { data: rolesData } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("user_id", userIds);

      const roleMap = new Map<string, string>();
      rolesData?.forEach((r: any) => roleMap.set(r.user_id, r.role));

      const result: UnitMember[] = profiles.map((p: any) => ({
        userId: p.user_id,
        fullName: p.full_name,
        email: p.email,
        unitId: p.unit_id,
        role: (roleMap.get(p.user_id) || "closer") as any,
        avatarUrl: p.avatar_url,
      }));

      setMembers(result);
      setLoading(false);
    };

    fetchMembers();
  }, [profile?.id, isAdmin, effectiveUnitId]);

  const closers = members.filter((m) => m.role === "closer");
  const preVendas = members.filter((m) => m.role === "sdr");
  const gerentes = members.filter((m) => m.role === "gerente_unidade");

  return { members, closers, preVendas, gerentes, userUnitId: effectiveUnitId, isUnitScoped, loading };
}
