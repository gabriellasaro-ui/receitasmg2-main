CREATE POLICY "Unit members can view unit roles"
ON public.user_roles
FOR SELECT
USING (
  user_id IN (
    SELECT p2.user_id FROM public.profiles p2
    WHERE p2.unit_id = get_user_unit_id(auth.uid())
  )
);