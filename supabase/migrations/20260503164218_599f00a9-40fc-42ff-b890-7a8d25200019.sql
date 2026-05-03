-- User roles (admin) for NAMA portal
CREATE TYPE public.app_role AS ENUM ('admin', 'member');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users view own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins view all roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to read all member records (for the registry)
CREATE POLICY "Admins view all members"
  ON public.members FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update any member"
  ON public.members FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Public registry function: returns sanitized list of active members (no PII)
CREATE OR REPLACE FUNCTION public.public_member_registry()
RETURNS TABLE (
  certificate_number TEXT,
  full_name TEXT,
  artistic_discipline TEXT,
  province TEXT,
  membership_category_id TEXT,
  issued_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.certificate_number, m.full_name, m.artistic_discipline,
         m.province, m.membership_category_id, c.issued_at, c.expires_at
  FROM public.certificates c
  JOIN public.members m ON m.id = c.member_id
  WHERE c.revoked = false
    AND m.status = 'active'
    AND c.expires_at > now()
  ORDER BY c.issued_at DESC
  LIMIT 500;
$$;