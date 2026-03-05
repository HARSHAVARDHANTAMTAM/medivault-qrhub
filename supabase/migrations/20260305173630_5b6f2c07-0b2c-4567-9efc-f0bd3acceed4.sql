
-- medical_records: Fix policies targeting public role
DROP POLICY "Admins can view all records" ON public.medical_records;
CREATE POLICY "Admins can view all records" ON public.medical_records FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));

DROP POLICY "Approved hospitals can insert records" ON public.medical_records;
CREATE POLICY "Approved hospitals can insert records" ON public.medical_records FOR INSERT TO authenticated WITH CHECK (is_approved_hospital(auth.uid()) AND auth.uid() = hospital_id);

DROP POLICY "Approved hospitals can update their own records" ON public.medical_records;
CREATE POLICY "Approved hospitals can update their own records" ON public.medical_records FOR UPDATE TO authenticated USING (auth.uid() = hospital_id AND is_approved_hospital(auth.uid()));

DROP POLICY "Patients can view their own records" ON public.medical_records;
CREATE POLICY "Patients can view their own records" ON public.medical_records FOR SELECT TO authenticated USING (auth.uid() = patient_id);

-- profiles: Fix policies targeting public role
DROP POLICY "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles" ON public.profiles FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));

DROP POLICY "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));

DROP POLICY "Approved hospitals can view patient profiles" ON public.profiles;
CREATE POLICY "Approved hospitals can view patient profiles" ON public.profiles FOR SELECT TO authenticated USING (is_approved_hospital(auth.uid()) AND role = 'patient');

DROP POLICY "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

DROP POLICY "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);

-- user_roles: Fix policies targeting public role
DROP POLICY "Admins can view all roles" ON public.user_roles;
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));

DROP POLICY "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
