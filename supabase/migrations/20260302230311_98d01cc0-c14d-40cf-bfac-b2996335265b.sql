
-- Goals configuration table (per unit or regional)
CREATE TABLE public.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID REFERENCES public.units(id) ON DELETE CASCADE,
  label TEXT NOT NULL DEFAULT 'Meta Regional',
  mes_ref INTEGER NOT NULL DEFAULT 3,
  ano_ref INTEGER NOT NULL DEFAULT 2026,
  dias_uteis_total INTEGER NOT NULL DEFAULT 22,
  meta_receita_total NUMERIC NOT NULL DEFAULT 0,
  meta_receita_recorrente NUMERIC NOT NULL DEFAULT 0,
  meta_receita_onetime NUMERIC NOT NULL DEFAULT 0,
  meta_churn_m0_max NUMERIC NOT NULL DEFAULT 0,
  meta_receita_liquida NUMERIC NOT NULL DEFAULT 0,
  meta_caixa_60pct NUMERIC NOT NULL DEFAULT 0,
  booking_medio_meses INTEGER NOT NULL DEFAULT 6,
  meta_leads INTEGER NOT NULL DEFAULT 0,
  meta_conexoes INTEGER NOT NULL DEFAULT 0,
  meta_stake INTEGER NOT NULL DEFAULT 0,
  meta_rm INTEGER NOT NULL DEFAULT 0,
  meta_rr INTEGER NOT NULL DEFAULT 0,
  meta_contratos INTEGER NOT NULL DEFAULT 0,
  ticket_medio NUMERIC NOT NULL DEFAULT 0,
  investimento_total NUMERIC NOT NULL DEFAULT 0,
  cpl_medio NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (unit_id, mes_ref, ano_ref)
);

ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

-- Everyone can read goals
CREATE POLICY "Goals are viewable by authenticated users" ON public.goals FOR SELECT TO authenticated USING (true);

-- Only admins can manage goals
CREATE POLICY "Admins can manage goals" ON public.goals FOR ALL TO authenticated USING (
  public.has_role(auth.uid(), 'admin')
) WITH CHECK (
  public.has_role(auth.uid(), 'admin')
);

-- Gerentes can update their own unit's goals
CREATE POLICY "Gerentes can update own unit goals" ON public.goals FOR UPDATE TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.user_roles ur ON ur.user_id = p.user_id
    WHERE p.user_id = auth.uid() AND ur.role = 'gerente_unidade' AND p.unit_id = goals.unit_id
  )
);

CREATE TRIGGER update_goals_updated_at
  BEFORE UPDATE ON public.goals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert a default regional goal (unit_id = NULL means regional)
INSERT INTO public.goals (unit_id, label, mes_ref, ano_ref) VALUES (NULL, 'Meta Regional MG2', 3, 2026);
