-- Verify policies are correct on pupil_swap_checklist
SELECT policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'pupil_swap_checklist';