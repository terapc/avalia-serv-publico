
CREATE POLICY "Enable delete for all users"
ON public.avaliacoes
FOR DELETE
TO public
USING (true);
