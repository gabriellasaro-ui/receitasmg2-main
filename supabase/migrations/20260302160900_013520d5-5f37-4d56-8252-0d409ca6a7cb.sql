
-- Enums
CREATE TYPE public.temperatura AS ENUM ('frio', 'morno', 'quente');
CREATE TYPE public.resultado_call AS ENUM ('avancou_proposta', 'follow_up', 'sem_fit', 'perdido');
CREATE TYPE public.status_proposta AS ENUM ('aberta', 'fechada', 'perdida');

-- ── Closer Submissions (aggregate) ──
CREATE TABLE public.closer_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  data_referencia DATE NOT NULL,
  closer_id TEXT NOT NULL,
  calls_realizadas INTEGER NOT NULL DEFAULT 0,
  no_show INTEGER NOT NULL DEFAULT 0,
  propostas_realizadas INTEGER NOT NULL DEFAULT 0,
  contratos_assinados INTEGER NOT NULL DEFAULT 0,
  valor_contrato_total NUMERIC(12,2) NOT NULL DEFAULT 0,
  valor_recorrente NUMERIC(12,2) NOT NULL DEFAULT 0,
  valor_onetime NUMERIC(12,2) NOT NULL DEFAULT 0,
  churn_m0 NUMERIC(12,2) NOT NULL DEFAULT 0,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ── Closer Proposals Detail ──
CREATE TABLE public.closer_proposals_detail (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  submission_id UUID NOT NULL REFERENCES public.closer_submissions(id) ON DELETE CASCADE,
  data_referencia DATE NOT NULL,
  closer_id TEXT NOT NULL,
  lead_nome TEXT NOT NULL,
  canal_proposta TEXT,
  temperatura_proposta public.temperatura NOT NULL DEFAULT 'morno',
  valor_proposta NUMERIC(12,2) NOT NULL DEFAULT 0,
  status_proposta public.status_proposta DEFAULT 'aberta',
  observacao TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ── Closer Sales Detail ──
CREATE TABLE public.closer_sales_detail (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  submission_id UUID NOT NULL REFERENCES public.closer_submissions(id) ON DELETE CASCADE,
  data_referencia DATE NOT NULL,
  closer_id TEXT NOT NULL,
  lead_nome TEXT NOT NULL,
  canal_venda TEXT NOT NULL,
  valor_total NUMERIC(12,2) NOT NULL DEFAULT 0,
  valor_recorrente NUMERIC(12,2) NOT NULL DEFAULT 0,
  valor_onetime NUMERIC(12,2) NOT NULL DEFAULT 0,
  churn_m0 NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ── Closer Calls Detail ──
CREATE TABLE public.closer_calls_detail (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  submission_id UUID NOT NULL REFERENCES public.closer_submissions(id) ON DELETE CASCADE,
  data_referencia DATE NOT NULL,
  closer_id TEXT NOT NULL,
  lead_nome TEXT,
  temperatura_call public.temperatura NOT NULL DEFAULT 'morno',
  resultado_call public.resultado_call,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ── Pre-sales Submissions (aggregate) ──
CREATE TABLE public.pv_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  data_referencia DATE NOT NULL,
  pv_id TEXT NOT NULL,
  calls_marcadas INTEGER NOT NULL DEFAULT 0,
  calls_realizadas INTEGER NOT NULL DEFAULT 0,
  no_show INTEGER NOT NULL DEFAULT 0,
  reagendamentos INTEGER NOT NULL DEFAULT 0,
  contratos_assinados INTEGER NOT NULL DEFAULT 0,
  valor_contrato_total NUMERIC(12,2) NOT NULL DEFAULT 0,
  valor_recorrente NUMERIC(12,2) NOT NULL DEFAULT 0,
  valor_onetime NUMERIC(12,2) NOT NULL DEFAULT 0,
  churn_m0 NUMERIC(12,2) NOT NULL DEFAULT 0,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ── Pre-sales Booked Calls Detail (with punch) ──
CREATE TABLE public.pv_booked_calls_detail (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  submission_id UUID NOT NULL REFERENCES public.pv_submissions(id) ON DELETE CASCADE,
  data_referencia DATE NOT NULL,
  pv_id TEXT NOT NULL,
  lead_nome TEXT NOT NULL,
  tipo_lead TEXT,
  punch TEXT,
  canal TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ── Pre-sales Realized Calls Detail ──
CREATE TABLE public.pv_realized_calls_detail (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  submission_id UUID NOT NULL REFERENCES public.pv_submissions(id) ON DELETE CASCADE,
  data_referencia DATE NOT NULL,
  pv_id TEXT NOT NULL,
  lead_nome TEXT NOT NULL,
  tipo_lead TEXT,
  observacao TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ── Pre-sales Contracts Detail ──
CREATE TABLE public.pv_contracts_detail (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  submission_id UUID NOT NULL REFERENCES public.pv_submissions(id) ON DELETE CASCADE,
  data_referencia DATE NOT NULL,
  pv_id TEXT NOT NULL,
  lead_nome TEXT NOT NULL,
  canal TEXT,
  valor_total NUMERIC(12,2) NOT NULL DEFAULT 0,
  valor_recorrente NUMERIC(12,2) NOT NULL DEFAULT 0,
  valor_onetime NUMERIC(12,2) NOT NULL DEFAULT 0,
  churn_m0 NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ── Enable RLS on all tables ──
ALTER TABLE public.closer_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.closer_proposals_detail ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.closer_sales_detail ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.closer_calls_detail ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pv_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pv_booked_calls_detail ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pv_realized_calls_detail ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pv_contracts_detail ENABLE ROW LEVEL SECURITY;

-- ── Permissive policies (no auth yet – operational dashboard) ──
CREATE POLICY "Allow all access to closer_submissions" ON public.closer_submissions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to closer_proposals_detail" ON public.closer_proposals_detail FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to closer_sales_detail" ON public.closer_sales_detail FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to closer_calls_detail" ON public.closer_calls_detail FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to pv_submissions" ON public.pv_submissions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to pv_booked_calls_detail" ON public.pv_booked_calls_detail FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to pv_realized_calls_detail" ON public.pv_realized_calls_detail FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to pv_contracts_detail" ON public.pv_contracts_detail FOR ALL USING (true) WITH CHECK (true);

-- ── Indexes for common queries ──
CREATE INDEX idx_closer_submissions_date ON public.closer_submissions(data_referencia);
CREATE INDEX idx_closer_submissions_closer ON public.closer_submissions(closer_id);
CREATE INDEX idx_closer_proposals_submission ON public.closer_proposals_detail(submission_id);
CREATE INDEX idx_closer_proposals_closer ON public.closer_proposals_detail(closer_id);
CREATE INDEX idx_closer_sales_submission ON public.closer_sales_detail(submission_id);
CREATE INDEX idx_closer_calls_submission ON public.closer_calls_detail(submission_id);
CREATE INDEX idx_pv_submissions_date ON public.pv_submissions(data_referencia);
CREATE INDEX idx_pv_submissions_pv ON public.pv_submissions(pv_id);
CREATE INDEX idx_pv_booked_calls_submission ON public.pv_booked_calls_detail(submission_id);
CREATE INDEX idx_pv_realized_calls_submission ON public.pv_realized_calls_detail(submission_id);
CREATE INDEX idx_pv_contracts_submission ON public.pv_contracts_detail(submission_id);
