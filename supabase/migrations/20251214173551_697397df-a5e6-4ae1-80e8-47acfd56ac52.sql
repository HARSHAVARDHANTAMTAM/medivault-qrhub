-- Create app roles enum
CREATE TYPE public.app_role AS ENUM ('patient', 'hospital', 'admin');

-- Create profiles table for all users
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  full_name TEXT,
  mobile_number TEXT,
  patient_id TEXT UNIQUE,
  hospital_name TEXT,
  hospital_address TEXT,
  hospital_license TEXT,
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create user_roles table for role management
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Create medical_records table
CREATE TABLE public.medical_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  hospital_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  diagnosis TEXT,
  doctor_name TEXT,
  doctor_notes TEXT,
  file_url TEXT,
  record_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;

-- Function to check user role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to get user role from profiles
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = _user_id
$$;

-- Generate unique patient ID
CREATE OR REPLACE FUNCTION public.generate_patient_id()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  new_id TEXT;
  id_exists BOOLEAN;
BEGIN
  LOOP
    new_id := 'MED' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE patient_id = new_id) INTO id_exists;
    EXIT WHEN NOT id_exists;
  END LOOP;
  RETURN new_id;
END;
$$;

-- Profiles RLS policies
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY "Hospitals can view patient profiles"
ON public.profiles FOR SELECT
USING (
  public.has_role(auth.uid(), 'hospital') AND role = 'patient'
);

CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all profiles"
ON public.profiles FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- User roles RLS policies
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own roles"
ON public.user_roles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Medical records RLS policies
CREATE POLICY "Patients can view their own records"
ON public.medical_records FOR SELECT
USING (auth.uid() = patient_id);

CREATE POLICY "Hospitals can view patient records"
ON public.medical_records FOR SELECT
USING (public.has_role(auth.uid(), 'hospital'));

CREATE POLICY "Hospitals can insert records"
ON public.medical_records FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'hospital') AND auth.uid() = hospital_id);

CREATE POLICY "Hospitals can update their own records"
ON public.medical_records FOR UPDATE
USING (auth.uid() = hospital_id);

CREATE POLICY "Admins can view all records"
ON public.medical_records FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Create storage bucket for medical files
INSERT INTO storage.buckets (id, name, public) VALUES ('medical-files', 'medical-files', true);

-- Storage policies
CREATE POLICY "Authenticated users can upload files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'medical-files' AND auth.role() = 'authenticated');

CREATE POLICY "Anyone can view files"
ON storage.objects FOR SELECT
USING (bucket_id = 'medical-files');

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_medical_records_updated_at
BEFORE UPDATE ON public.medical_records
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();