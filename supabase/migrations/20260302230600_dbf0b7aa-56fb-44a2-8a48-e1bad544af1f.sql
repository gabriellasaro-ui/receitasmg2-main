
-- Drop the problematic recursive policy
DROP POLICY IF EXISTS "Gerentes can view unit profiles" ON public.profiles;

-- Create a SECURITY DEFINER function to check gerente's unit
CREATE OR REPLACE FUNCTION public.get_user_unit_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT unit_id FROM public.profiles WHERE user_id = _user_id LIMIT 1
$$;

-- Recreate gerente policy without recursion
CREATE POLICY "Gerentes can view unit profiles" ON public.profiles FOR SELECT USING (
  public.has_role(auth.uid(), 'gerente_unidade') AND unit_id = public.get_user_unit_id(auth.uid())
);
