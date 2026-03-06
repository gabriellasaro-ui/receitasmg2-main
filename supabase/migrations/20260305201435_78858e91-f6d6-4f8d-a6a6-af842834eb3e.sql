
-- Drop the old permissive SELECT policy that lets everyone see all channels
DROP POLICY IF EXISTS "Channel goals are viewable by authenticated" ON public.channel_goals;

-- Admins can see all channel_goals (already covered by ALL policy, but add explicit SELECT)
CREATE POLICY "Admins can view all channel_goals"
  ON public.channel_goals FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Unit members can view their own unit's channel_goals
CREATE POLICY "Unit members can view own unit channel_goals"
  ON public.channel_goals FOR SELECT
  USING (unit_id = get_user_unit_id(auth.uid()));
