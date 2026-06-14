
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;

-- Storage policies: meal-photos
CREATE POLICY "meal_photos_select_own" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'meal-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "meal_photos_insert_own" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'meal-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "meal_photos_update_own" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'meal-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "meal_photos_delete_own" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'meal-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies: progress-photos
CREATE POLICY "progress_photos_select_own" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'progress-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "progress_photos_insert_own" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'progress-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "progress_photos_update_own" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'progress-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "progress_photos_delete_own" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'progress-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
