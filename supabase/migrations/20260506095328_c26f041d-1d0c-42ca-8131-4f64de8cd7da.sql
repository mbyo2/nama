CREATE OR REPLACE FUNCTION public.claim_first_admin()
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Must be signed in';
  END IF;
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE role IN ('admin','superadmin')) THEN
    RETURN false;
  END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (uid, 'superadmin')
    ON CONFLICT DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (uid, 'admin')
    ON CONFLICT DO NOTHING;
  RETURN true;
END; $$;
