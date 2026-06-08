CREATE POLICY "Pupils view own lessons"
ON scheduled_lessons FOR SELECT TO authenticated
USING (
  deleted_at IS NULL
  AND pupil_id IN (
    SELECT id FROM pupils WHERE auth_user_id = auth.uid()
  )
);

CREATE POLICY "Pupils view own payment history"
ON payment_history FOR SELECT TO authenticated
USING (
  pupil_id IN (
    SELECT id FROM pupils WHERE auth_user_id = auth.uid()
  )
);