-- Founding-admin self-claim. Succeeds only if no admin exists yet.
CREATE OR REPLACE FUNCTION public.claim_first_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Must be signed in';
  END IF;
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    RETURN false;
  END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (uid, 'admin')
  ON CONFLICT DO NOTHING;
  RETURN true;
END;
$$;

-- Admin-only: promote a user to admin.
CREATE OR REPLACE FUNCTION public.grant_admin(_target uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin only';
  END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (_target, 'admin')
  ON CONFLICT DO NOTHING;
  RETURN true;
END;
$$;

-- Admin-only: demote an admin (cannot demote the last remaining admin).
CREATE OR REPLACE FUNCTION public.revoke_admin(_target uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  remaining int;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin only';
  END IF;
  SELECT count(*) INTO remaining FROM public.user_roles
   WHERE role = 'admin' AND user_id <> _target;
  IF remaining < 1 THEN
    RAISE EXCEPTION 'Cannot remove the last admin';
  END IF;
  DELETE FROM public.user_roles WHERE user_id = _target AND role = 'admin';
  RETURN true;
END;
$$;

-- Admin-only: list admins with email.
CREATE OR REPLACE FUNCTION public.list_admins()
RETURNS TABLE(user_id uuid, email text, granted_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin only';
  END IF;
  RETURN QUERY
    SELECT ur.user_id, u.email::text, ur.created_at
    FROM public.user_roles ur
    JOIN auth.users u ON u.id = ur.user_id
    WHERE ur.role = 'admin'
    ORDER BY ur.created_at ASC;
END;
$$;

-- Admin-only: change a member's status (active / suspended / pending).
CREATE OR REPLACE FUNCTION public.admin_set_member_status(_member_id uuid, _status text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin only';
  END IF;
  IF _status NOT IN ('pending','active','expired','suspended') THEN
    RAISE EXCEPTION 'Invalid status';
  END IF;
  UPDATE public.members SET status = _status, updated_at = now()
   WHERE id = _member_id;
  RETURN true;
END;
$$;