-- Public RPC to look up a certificate by verification token without exposing the whole members table.
CREATE OR REPLACE FUNCTION public.verify_certificate(_token text)
RETURNS TABLE (
  certificate_number text,
  issued_at timestamptz,
  expires_at timestamptz,
  revoked boolean,
  full_name text,
  artistic_discipline text,
  province text,
  membership_category_id text,
  status text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    c.certificate_number,
    c.issued_at,
    c.expires_at,
    c.revoked,
    m.full_name,
    m.artistic_discipline,
    m.province,
    m.membership_category_id,
    m.status
  FROM public.certificates c
  JOIN public.members m ON m.id = c.member_id
  WHERE c.verification_token = _token
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.verify_certificate(text) TO anon, authenticated;