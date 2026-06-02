-- Audit log table
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid,
  actor_email text,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view audit logs"
ON public.audit_logs FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'superadmin'));

CREATE INDEX idx_audit_logs_created_at ON public.audit_logs (created_at DESC);

-- Central logging helper (definer bypasses RLS for inserts)
CREATE OR REPLACE FUNCTION public.log_audit(_action text, _entity_type text, _entity_id text, _details jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE _email text;
BEGIN
  SELECT email INTO _email FROM auth.users WHERE id = auth.uid();
  INSERT INTO public.audit_logs (actor_id, actor_email, action, entity_type, entity_id, details)
  VALUES (auth.uid(), _email, _action, _entity_type, _entity_id, COALESCE(_details, '{}'::jsonb));
END; $$;

-- Role change logging
CREATE OR REPLACE FUNCTION public.grant_admin(_target uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE _email text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'superadmin') THEN
    RAISE EXCEPTION 'Only superadmins can grant admin roles';
  END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (_target, 'admin')
    ON CONFLICT DO NOTHING;
  SELECT email INTO _email FROM auth.users WHERE id = _target;
  PERFORM public.log_audit('role_granted', 'user_role', _target::text,
    jsonb_build_object('role', 'admin', 'target_email', _email));
  RETURN true;
END; $$;

CREATE OR REPLACE FUNCTION public.revoke_admin(_target uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE remaining int; _email text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'superadmin') THEN
    RAISE EXCEPTION 'Only superadmins can revoke admin roles';
  END IF;
  IF public.has_role(_target, 'superadmin') THEN
    RAISE EXCEPTION 'Cannot revoke a superadmin via revoke_admin';
  END IF;
  SELECT count(*) INTO remaining FROM public.user_roles
    WHERE role IN ('admin','superadmin') AND user_id <> _target;
  IF remaining < 1 THEN
    RAISE EXCEPTION 'Cannot remove the last admin';
  END IF;
  DELETE FROM public.user_roles WHERE user_id = _target AND role = 'admin';
  SELECT email INTO _email FROM auth.users WHERE id = _target;
  PERFORM public.log_audit('role_revoked', 'user_role', _target::text,
    jsonb_build_object('role', 'admin', 'target_email', _email));
  RETURN true;
END; $$;

CREATE OR REPLACE FUNCTION public.grant_superadmin(_target uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE _email text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'superadmin') THEN
    RAISE EXCEPTION 'Only superadmins can grant superadmin';
  END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (_target, 'superadmin')
    ON CONFLICT DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (_target, 'admin')
    ON CONFLICT DO NOTHING;
  SELECT email INTO _email FROM auth.users WHERE id = _target;
  PERFORM public.log_audit('role_granted', 'user_role', _target::text,
    jsonb_build_object('role', 'superadmin', 'target_email', _email));
  RETURN true;
END; $$;

-- Certificate logging
CREATE OR REPLACE FUNCTION public.admin_issue_certificate(_member_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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

  UPDATE public.members
     SET status = 'active',
         membership_started_at = COALESCE(membership_started_at, now()),
         membership_expires_at = COALESCE(membership_expires_at, now() + interval '1 year')
   WHERE id = _member_id;

  PERFORM public.log_audit('certificate_issued', 'certificate', new_id::text,
    jsonb_build_object('certificate_number', cert_no, 'member_id', _member_id, 'member_name', m.full_name));

  RETURN new_id;
END; $$;

CREATE OR REPLACE FUNCTION public.admin_revoke_certificate(_cert_id uuid, _reason text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE _cert_no text;
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'superadmin')) THEN
    RAISE EXCEPTION 'Admin only';
  END IF;
  UPDATE public.certificates
     SET revoked = true,
         revoke_reason = COALESCE(NULLIF(trim(_reason), ''), 'Revoked by administrator'),
         revoked_at = now()
   WHERE id = _cert_id
   RETURNING certificate_number INTO _cert_no;
  PERFORM public.log_audit('certificate_revoked', 'certificate', _cert_id::text,
    jsonb_build_object('certificate_number', _cert_no, 'reason', COALESCE(NULLIF(trim(_reason), ''), 'Revoked by administrator')));
  RETURN true;
END; $$;

-- Blog publish/unpublish/archive logging via trigger
CREATE OR REPLACE FUNCTION public.tg_blog_audit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE _email text;
BEGIN
  SELECT email INTO _email FROM auth.users WHERE id = auth.uid();
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs(actor_id, actor_email, action, entity_type, entity_id, details)
    VALUES (auth.uid(), _email, 'blog_created', 'blog_post', NEW.id::text,
            jsonb_build_object('title', NEW.title, 'status', NEW.status));
  ELSIF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.audit_logs(actor_id, actor_email, action, entity_type, entity_id, details)
    VALUES (auth.uid(), _email,
            CASE WHEN NEW.status = 'published' THEN 'blog_published'
                 WHEN NEW.status = 'draft' THEN 'blog_unpublished'
                 WHEN NEW.status = 'archived' THEN 'blog_archived'
                 ELSE 'blog_status_changed' END,
            'blog_post', NEW.id::text,
            jsonb_build_object('title', NEW.title, 'from', OLD.status, 'to', NEW.status));
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_blog_audit ON public.blog_posts;
CREATE TRIGGER trg_blog_audit
AFTER INSERT OR UPDATE ON public.blog_posts
FOR EACH ROW EXECUTE FUNCTION public.tg_blog_audit();