-- Membership categories (public reference data)
CREATE TABLE public.membership_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  annual_fee_zmw INTEGER NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  requires_institution BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.membership_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view membership categories"
  ON public.membership_categories FOR SELECT
  TO anon, authenticated
  USING (true);

INSERT INTO public.membership_categories (id, name, description, annual_fee_zmw, sort_order, requires_institution) VALUES
  ('student', 'Student Member', 'Enrolled in accredited media studies', 100, 1, false),
  ('bronze', 'Individual — Bronze', 'Practitioners with less than 5 years experience', 200, 2, false),
  ('silver', 'Individual — Silver', 'Practitioners with 5–9 years experience', 300, 3, false),
  ('gold', 'Individual — Gold', 'Practitioners with 10+ years experience', 500, 4, false),
  ('institutional', 'Institutional Member', 'Registered media houses or production companies', 2000, 5, true),
  ('associate', 'Associate Member', 'Non-media organisations sharing arts values', 1000, 6, true);

-- Members table
CREATE TABLE public.members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  nrc_number TEXT NOT NULL,
  tpin TEXT,
  phone_number TEXT NOT NULL,
  artistic_discipline TEXT NOT NULL,
  province TEXT NOT NULL,
  city TEXT NOT NULL,
  years_experience INTEGER NOT NULL DEFAULT 0,
  bio TEXT,
  institution_name TEXT,
  membership_category_id TEXT NOT NULL REFERENCES public.membership_categories(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'expired', 'suspended')),
  membership_started_at TIMESTAMPTZ,
  membership_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_members_user_id ON public.members(user_id);
CREATE INDEX idx_members_status ON public.members(status);

ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own member record"
  ON public.members FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users create own member record"
  ON public.members FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own member record"
  ON public.members FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- Payments table
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  member_id UUID REFERENCES public.members(id) ON DELETE CASCADE,
  membership_category_id TEXT NOT NULL REFERENCES public.membership_categories(id),
  amount_zmw INTEGER NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('mtn', 'airtel', 'zamtel', 'card')),
  phone_number TEXT,
  transaction_reference TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'cancelled')),
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_payments_user_id ON public.payments(user_id);
CREATE INDEX idx_payments_member_id ON public.payments(member_id);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own payments"
  ON public.payments FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users create own payments"
  ON public.payments FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own payments"
  ON public.payments FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- Certificates table
CREATE TABLE public.certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  certificate_number TEXT NOT NULL UNIQUE,
  verification_token TEXT NOT NULL UNIQUE,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  revoked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_certificates_user_id ON public.certificates(user_id);
CREATE INDEX idx_certificates_verification_token ON public.certificates(verification_token);

ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own certificates"
  ON public.certificates FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can verify certificate by token"
  ON public.certificates FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Users create own certificates"
  ON public.certificates FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- updated_at trigger for members
CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER members_set_updated_at
  BEFORE UPDATE ON public.members
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();