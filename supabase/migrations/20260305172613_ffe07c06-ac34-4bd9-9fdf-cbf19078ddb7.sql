
-- Fix 1: Prevent privilege escalation on user_roles
-- Users should only be able to insert a role matching their profile's role
DROP POLICY "Users can insert their own roles" ON public.user_roles;

CREATE POLICY "Users can insert their own registration role"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND role = (SELECT role FROM public.profiles WHERE id = auth.uid())
);

-- Fix 2: Restrict hospital access to only their own uploaded records
DROP POLICY "Approved hospitals can view patient records" ON public.medical_records;

CREATE POLICY "Hospitals can view their own records"
ON public.medical_records FOR SELECT
TO authenticated
USING (
  auth.uid() = hospital_id
  AND is_approved_hospital(auth.uid())
);
