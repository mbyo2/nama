-- Add revoke metadata to certificates
ALTER TABLE public.certificates
  ADD COLUMN IF NOT EXISTS revoke_reason text,
  ADD COLUMN IF NOT EXISTS revoked_at timestamptz;

-- Allow admins to UPDATE certificates (for revoke / manual issue)
DROP POLICY IF EXISTS "Admins update any certificate" ON public.certificates;
CREATE POLICY "Admins update any certificate"
  ON public.certificates FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'superadmin'));

-- Allow admins to INSERT certificates (manual issuance)
DROP POLICY IF EXISTS "Admins insert any certificate" ON public.certificates;
CREATE POLICY "Admins insert any certificate"
  ON public.certificates FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'superadmin'));

-- Admins can view all certificates
DROP POLICY IF EXISTS "Admins view all certificates" ON public.certificates;
CREATE POLICY "Admins view all certificates"
  ON public.certificates FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'superadmin'));

-- Admins can view all payments (for admin reports)
DROP POLICY IF EXISTS "Admins view all payments" ON public.payments;
CREATE POLICY "Admins view all payments"
  ON public.payments FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'superadmin'));

-- Update has_role-based policies on members so superadmin also gets access
DROP POLICY IF EXISTS "Admins view all members" ON public.members;
CREATE POLICY "Admins view all members"
  ON public.members FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'superadmin'));

DROP POLICY IF EXISTS "Admins update any member" ON public.members;
CREATE POLICY "Admins update any member"
  ON public.members FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'superadmin'));

-- user_roles visibility for admins/superadmins
DROP POLICY IF EXISTS "Admins view all roles" ON public.user_roles;
CREATE POLICY "Admins view all roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'superadmin'));

-- ───────── grant_admin / revoke_admin → SUPERADMIN-only
CREATE OR REPLACE FUNCTION public.grant_admin(_target uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'superadmin') THEN
    RAISE EXCEPTION 'Only superadmins can grant admin roles';
  END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (_target, 'admin')
    ON CONFLICT DO NOTHING;
  RETURN true;
END; $$;

CREATE OR REPLACE FUNCTION public.revoke_admin(_target uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE remaining int;
BEGIN
  IF NOT public.has_role(auth.uid(), 'superadmin') THEN
    RAISE EXCEPTION 'Only superadmins can revoke admin roles';
  END IF;
  -- Cannot revoke a superadmin via this function
  IF public.has_role(_target, 'superadmin') THEN
    RAISE EXCEPTION 'Cannot revoke a superadmin via revoke_admin';
  END IF;
  SELECT count(*) INTO remaining FROM public.user_roles
    WHERE role IN ('admin','superadmin') AND user_id <> _target;
  IF remaining < 1 THEN
    RAISE EXCEPTION 'Cannot remove the last admin';
  END IF;
  DELETE FROM public.user_roles WHERE user_id = _target AND role = 'admin';
  RETURN true;
END; $$;

-- Superadmin can grant superadmin role
CREATE OR REPLACE FUNCTION public.grant_superadmin(_target uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'superadmin') THEN
    RAISE EXCEPTION 'Only superadmins can grant superadmin';
  END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (_target, 'superadmin')
    ON CONFLICT DO NOTHING;
  -- ensure they also have admin role
  INSERT INTO public.user_roles (user_id, role) VALUES (_target, 'admin')
    ON CONFLICT DO NOTHING;
  RETURN true;
END; $$;

-- list_admins now also returns whether the row is a superadmin
DROP FUNCTION IF EXISTS public.list_admins();
CREATE OR REPLACE FUNCTION public.list_admins()
RETURNS TABLE(user_id uuid, email text, granted_at timestamptz, is_superadmin boolean)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'superadmin')) THEN
    RAISE EXCEPTION 'Admin only';
  END IF;
  RETURN QUERY
    SELECT
      ur.user_id,
      u.email::text,
      MIN(ur.created_at) AS granted_at,
      bool_or(ur.role = 'superadmin') AS is_superadmin
    FROM public.user_roles ur
    JOIN auth.users u ON u.id = ur.user_id
    WHERE ur.role IN ('admin','superadmin')
    GROUP BY ur.user_id, u.email
    ORDER BY MIN(ur.created_at) ASC;
END; $$;

-- admin_set_member_status: also accept superadmin
CREATE OR REPLACE FUNCTION public.admin_set_member_status(_member_id uuid, _status text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'superadmin')) THEN
    RAISE EXCEPTION 'Admin only';
  END IF;
  IF _status NOT IN ('pending','active','expired','suspended') THEN
    RAISE EXCEPTION 'Invalid status';
  END IF;
  UPDATE public.members SET status = _status, updated_at = now()
   WHERE id = _member_id;
  RETURN true;
END; $$;

-- Admin: revoke a certificate
CREATE OR REPLACE FUNCTION public.admin_revoke_certificate(_cert_id uuid, _reason text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'superadmin')) THEN
    RAISE EXCEPTION 'Admin only';
  END IF;
  UPDATE public.certificates
     SET revoked = true,
         revoke_reason = COALESCE(NULLIF(trim(_reason), ''), 'Revoked by administrator'),
         revoked_at = now()
   WHERE id = _cert_id;
  RETURN true;
END; $$;

-- Admin: manually issue a certificate for a given member (1-year validity)
CREATE OR REPLACE FUNCTION public.admin_issue_certificate(_member_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  m public.members%ROWTYPE;
  new_id uuid;
  cert_no text;
  token text;
  yr int := extract(year from now())::int;
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'superadmin')) THEN
    RAISE EXCEPTION 'Admin only';
  END IF;
  SELECT * INTO m FROM public.members WHERE id = _member_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Member not found'; END IF;

  -- Revoke any existing live certificates for this member
  UPDATE public.certificates
     SET revoked = true,
         revoke_reason = COALESCE(revoke_reason, 'Superseded by re-issue'),
         revoked_at = COALESCE(revoked_at, now())
   WHERE member_id = _member_id AND revoked = false;

  cert_no := 'NAMA/' || yr || '/' || lpad((floor(random()*900000)+100000)::int::text, 6, '0');
  token := encode(gen_random_bytes(24), 'hex');

  INSERT INTO public.certificates (user_id, member_id, certificate_number, verification_token, expires_at)
  VALUES (m.user_id, m.id, cert_no, token, COALESCE(m.membership_expires_at, now() + interval '1 year'))
  RETURNING id INTO new_id;

  -- ensure member is active
  UPDATE public.members
     SET status = 'active',
         membership_started_at = COALESCE(membership_started_at, now()),
         membership_expires_at = COALESCE(membership_expires_at, now() + interval '1 year')
   WHERE id = _member_id;

  RETURN new_id;
END; $$;

-- Auto-expire members whose membership has lapsed (idempotent helper)
CREATE OR REPLACE FUNCTION public.expire_lapsed_memberships()
RETURNS int LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n int;
BEGIN
  UPDATE public.members
     SET status = 'expired', updated_at = now()
   WHERE status = 'active'
     AND membership_expires_at IS NOT NULL
     AND membership_expires_at < now();
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END; $$;

-- ───────── Promote founding superadmin
DO $$
DECLARE uid uuid;
BEGIN
  SELECT id INTO uid FROM auth.users WHERE lower(email) = lower('mbyotwo2@gmail.com') LIMIT 1;
  IF uid IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (uid, 'superadmin')
      ON CONFLICT DO NOTHING;
    INSERT INTO public.user_roles (user_id, role) VALUES (uid, 'admin')
      ON CONFLICT DO NOTHING;
  END IF;
END $$;
