
-- Create channel_goals table to persist channel metas
CREATE TABLE public.channel_goals (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id text NOT NULL,
  channel_name text NOT NULL,
  unit_id uuid REFERENCES public.units(id) ON DELETE CASCADE,
  mes_ref integer NOT NULL DEFAULT 3,
  ano_ref integer NOT NULL DEFAULT 2026,
  meta_leads integer NOT NULL DEFAULT 0,
  meta_rm integer NOT NULL DEFAULT 0,
  meta_rr integer NOT NULL DEFAULT 0,
  meta_contratos integer NOT NULL DEFAULT 0,
  meta_receita_total numeric NOT NULL DEFAULT 0,
  meta_receita_recorrente numeric NOT NULL DEFAULT 0,
  meta_receita_onetime numeric NOT NULL DEFAULT 0,
  investimento_fixo numeric NOT NULL DEFAULT 0,
  meta_roas numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(channel_id, unit_id, mes_ref, ano_ref)
);

-- Enable RLS
ALTER TABLE public.channel_goals ENABLE ROW LEVEL SECURITY;

-- Admins can manage all channel goals
CREATE POLICY "Admins can manage channel_goals"
  ON public.channel_goals FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- All authenticated users can view channel goals
CREATE POLICY "Channel goals are viewable by authenticated"
  ON public.channel_goals FOR SELECT
  TO authenticated
  USING (true);

-- Gerentes can manage their own unit channel goals
CREATE POLICY "Gerentes can manage own unit channel_goals"
  ON public.channel_goals FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'gerente_unidade') 
    AND unit_id = public.get_user_unit_id(auth.uid())
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'gerente_unidade') 
    AND unit_id = public.get_user_unit_id(auth.uid())
  );

-- Trigger for updated_at
CREATE TRIGGER update_channel_goals_updated_at
  BEFORE UPDATE ON public.channel_goals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
