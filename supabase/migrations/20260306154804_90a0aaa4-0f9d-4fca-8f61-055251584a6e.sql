
DROP POLICY "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile"
ON profiles FOR UPDATE TO authenticated
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id
  AND role = (SELECT p.role FROM profiles p WHERE p.id = auth.uid())
  AND is_approved = (SELECT p.is_approved FROM profiles p WHERE p.id = auth.uid())
);
