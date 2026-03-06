CREATE POLICY "Unit members can view unit profiles"
ON public.profiles
FOR SELECT
USING (
  unit_id = get_user_unit_id(auth.uid())
);