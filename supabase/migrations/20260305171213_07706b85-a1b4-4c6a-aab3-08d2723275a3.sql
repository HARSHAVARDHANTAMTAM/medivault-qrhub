
-- Create helper function to check if hospital is approved
CREATE OR REPLACE FUNCTION public.is_approved_hospital(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = _user_id
      AND role = 'hospital'
      AND is_approved = true
  )
$$;

-- Update medical_records policies for hospitals
DROP POLICY IF EXISTS "Hospitals can view patient records" ON medical_records;
CREATE POLICY "Approved hospitals can view patient records"
ON medical_records FOR SELECT
USING (public.is_approved_hospital(auth.uid()));

DROP POLICY IF EXISTS "Hospitals can insert records" ON medical_records;
CREATE POLICY "Approved hospitals can insert records"
ON medical_records FOR INSERT
WITH CHECK (public.is_approved_hospital(auth.uid()) AND auth.uid() = hospital_id);

DROP POLICY IF EXISTS "Hospitals can update their own records" ON medical_records;
CREATE POLICY "Approved hospitals can update their own records"
ON medical_records FOR UPDATE
USING (auth.uid() = hospital_id AND public.is_approved_hospital(auth.uid()));

-- Update profiles policy for hospitals
DROP POLICY IF EXISTS "Hospitals can view patient profiles" ON profiles;
CREATE POLICY "Approved hospitals can view patient profiles"
ON profiles FOR SELECT
USING (public.is_approved_hospital(auth.uid()) AND role = 'patient');
