
-- Allow admins to delete goals
DROP POLICY IF EXISTS "Admins can manage goals" ON public.goals;
CREATE POLICY "Admins can manage goals" ON public.goals FOR ALL USING (
  public.has_role(auth.uid(), 'admin')
) WITH CHECK (
  public.has_role(auth.uid(), 'admin')
);
