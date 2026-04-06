
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $fn$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $fn$;

CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $fn$ SELECT role FROM public.profiles WHERE id = _user_id $fn$;

CREATE OR REPLACE FUNCTION public.generate_patient_id()
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $fn$
DECLARE new_id TEXT; id_exists BOOLEAN;
BEGIN
  LOOP
    new_id := 'MED' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE patient_id = new_id) INTO id_exists;
    EXIT WHEN NOT id_exists;
  END LOOP;
  RETURN new_id;
END;
$fn$;

CREATE OR REPLACE FUNCTION public.is_approved_hospital(_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $fn$ SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = _user_id AND role = 'hospital' AND is_approved = true) $fn$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $fn$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $fn$;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_medical_records_updated_at ON public.medical_records;
CREATE TRIGGER update_medical_records_updated_at BEFORE UPDATE ON public.medical_records FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Hospitals can view patient profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id AND role = (SELECT p.role FROM profiles p WHERE p.id = auth.uid()) AND is_approved = (SELECT p.is_approved FROM profiles p WHERE p.id = auth.uid()));
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Hospitals can view patient profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'hospital') AND role = 'patient');
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update all profiles" ON public.profiles FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can insert their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;

CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own roles" ON public.user_roles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Patients can view their own records" ON public.medical_records;
DROP POLICY IF EXISTS "Approved hospitals can view patient records" ON public.medical_records;
DROP POLICY IF EXISTS "Approved hospitals can insert records" ON public.medical_records;
DROP POLICY IF EXISTS "Hospitals can update their own records" ON public.medical_records;
DROP POLICY IF EXISTS "Admins can view all records" ON public.medical_records;

CREATE POLICY "Patients can view their own records" ON public.medical_records FOR SELECT USING (auth.uid() = patient_id);
CREATE POLICY "Approved hospitals can view patient records" ON public.medical_records FOR SELECT USING (public.is_approved_hospital(auth.uid()));
CREATE POLICY "Approved hospitals can insert records" ON public.medical_records FOR INSERT WITH CHECK (public.is_approved_hospital(auth.uid()) AND auth.uid() = hospital_id);
CREATE POLICY "Hospitals can update their own records" ON public.medical_records FOR UPDATE USING (auth.uid() = hospital_id);
CREATE POLICY "Admins can view all records" ON public.medical_records FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

INSERT INTO storage.buckets (id, name, public) VALUES ('medical-files', 'medical-files', false) ON CONFLICT (id) DO UPDATE SET public = false;

DROP POLICY IF EXISTS "Authenticated users can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view files" ON storage.objects;
DROP POLICY IF EXISTS "Patients can view their medical files" ON storage.objects;
DROP POLICY IF EXISTS "Hospitals can view files they uploaded" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all medical files" ON storage.objects;
DROP POLICY IF EXISTS "Hospitals can upload medical files" ON storage.objects;
DROP POLICY IF EXISTS "Hospitals can update their uploaded files" ON storage.objects;
DROP POLICY IF EXISTS "Hospitals can delete their uploaded files" ON storage.objects;

CREATE POLICY "Patients can view their medical files" ON storage.objects FOR SELECT USING (bucket_id = 'medical-files' AND auth.role() = 'authenticated' AND EXISTS (SELECT 1 FROM public.medical_records WHERE file_url LIKE '%' || storage.objects.name || '%' AND patient_id = auth.uid()));
CREATE POLICY "Hospitals can view files they uploaded" ON storage.objects FOR SELECT USING (bucket_id = 'medical-files' AND auth.role() = 'authenticated' AND EXISTS (SELECT 1 FROM public.medical_records WHERE file_url LIKE '%' || storage.objects.name || '%' AND hospital_id = auth.uid()));
CREATE POLICY "Admins can view all medical files" ON storage.objects FOR SELECT USING (bucket_id = 'medical-files' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Hospitals can upload medical files" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'medical-files' AND public.has_role(auth.uid(), 'hospital'));
CREATE POLICY "Hospitals can update their uploaded files" ON storage.objects FOR UPDATE USING (bucket_id = 'medical-files' AND public.has_role(auth.uid(), 'hospital'));
CREATE POLICY "Hospitals can delete their uploaded files" ON storage.objects FOR DELETE USING (bucket_id = 'medical-files' AND public.has_role(auth.uid(), 'hospital'));
