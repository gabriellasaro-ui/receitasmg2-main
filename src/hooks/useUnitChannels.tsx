import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { Channel } from "@/data/seedData";

export function useUnitChannels() {
  const { profile, isAdmin } = useAuth();
  const [unitChannels, setUnitChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;

    const load = async () => {
      setLoading(true);
      const now = new Date();
      const mesRef = now.getMonth() + 1;
      const anoRef = now.getFullYear();

      let query = supabase
        .from("channel_goals")
        .select("channel_id, channel_name")
        .eq("mes_ref", mesRef)
        .eq("ano_ref", anoRef);

      if (!isAdmin && profile.unit_id) {
        query = query.eq("unit_id", profile.unit_id);
      }

      const { data } = await query.order("channel_name");

      if (data && data.length > 0) {
        // Deduplicate by channel_id
        const seen = new Map<string, Channel>();
        data.forEach((row: any) => {
          if (!seen.has(row.channel_id)) {
            seen.set(row.channel_id, {
              id: row.channel_id,
              nome: row.channel_name,
              tipo: row.channel_id,
              ativo: true,
              metaLeads: 0, metaRM: 0, metaRR: 0, metaContratos: 0,
              metaReceitaTotal: 0, metaReceitaRecorrente: 0, metaReceitaOnetime: 0,
              investimentoFixo: 0, metaROAS: 0,
            });
          }
        });
        setUnitChannels(Array.from(seen.values()));
      } else {
        setUnitChannels([]);
      }
      setLoading(false);
    };

    load();
  }, [profile?.id, profile?.unit_id, isAdmin]);

  return { unitChannels, loading };
}
