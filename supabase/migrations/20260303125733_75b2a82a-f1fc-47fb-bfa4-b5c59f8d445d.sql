
-- Add unit_id to pv_submissions
ALTER TABLE public.pv_submissions ADD COLUMN IF NOT EXISTS unit_id uuid REFERENCES public.units(id);

-- Add unit_id to closer_submissions
ALTER TABLE public.closer_submissions ADD COLUMN IF NOT EXISTS unit_id uuid REFERENCES public.units(id);

-- Add unit_id to closer_proposals_detail
ALTER TABLE public.closer_proposals_detail ADD COLUMN IF NOT EXISTS unit_id uuid REFERENCES public.units(id);

-- Add unit_id to pv_booked_calls_detail
ALTER TABLE public.pv_booked_calls_detail ADD COLUMN IF NOT EXISTS unit_id uuid REFERENCES public.units(id);

-- Add unit_id to pv_realized_calls_detail
ALTER TABLE public.pv_realized_calls_detail ADD COLUMN IF NOT EXISTS unit_id uuid REFERENCES public.units(id);

-- Indexes for filtering
CREATE INDEX IF NOT EXISTS idx_pv_submissions_unit ON public.pv_submissions(unit_id);
CREATE INDEX IF NOT EXISTS idx_closer_submissions_unit ON public.closer_submissions(unit_id);
CREATE INDEX IF NOT EXISTS idx_closer_proposals_unit ON public.closer_proposals_detail(unit_id);
CREATE INDEX IF NOT EXISTS idx_pv_booked_unit ON public.pv_booked_calls_detail(unit_id);
CREATE INDEX IF NOT EXISTS idx_pv_realized_unit ON public.pv_realized_calls_detail(unit_id);
