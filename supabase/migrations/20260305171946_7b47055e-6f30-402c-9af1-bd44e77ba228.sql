
-- profiles: Users can delete their own profile
CREATE POLICY "Users can delete their own profile"
ON public.profiles FOR DELETE
TO authenticated
USING (auth.uid() = id);

-- profiles: Admins can delete any profile
CREATE POLICY "Admins can delete profiles"
ON public.profiles FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- user_roles: Admins can delete user roles
CREATE POLICY "Admins can delete user roles"
ON public.user_roles FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- medical_records: Hospitals can delete their own records within 1 hour
CREATE POLICY "Hospitals can delete recent own records"
ON public.medical_records FOR DELETE
TO authenticated
USING (
  auth.uid() = hospital_id
  AND is_approved_hospital(auth.uid())
  AND created_at > NOW() - INTERVAL '1 hour'
);

-- medical_records: Admins can delete any record
CREATE POLICY "Admins can delete medical records"
ON public.medical_records FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
