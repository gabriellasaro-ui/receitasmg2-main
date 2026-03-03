
-- Allow admins to manage units
CREATE POLICY "Admins can manage units" ON public.units FOR ALL USING (
  public.has_role(auth.uid(), 'admin')
) WITH CHECK (
  public.has_role(auth.uid(), 'admin')
);
