// Data access helpers for the NAMA membership system.
import { supabase } from "@/integrations/supabase/client";
import type {
  Member, MembershipCategory, Certificate, PaymentProvider, MembershipStatus,
} from "@/lib/nama";
import {
  generateCertificateNumber, generateVerificationToken, generateTransactionRef,
} from "@/lib/nama";

export async function fetchCategories(): Promise<MembershipCategory[]> {
  const { data, error } = await supabase
    .from("membership_categories")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as MembershipCategory[];
}

export async function fetchMyMember(userId: string): Promise<Member | null> {
  const { data, error } = await supabase
    .from("members")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data as Member | null;
}

export interface CreateMemberInput {
  full_name: string;
  nrc_number: string;
  tpin: string | null;
  phone_number: string;
  artistic_discipline: string;
  province: string;
  city: string;
  years_experience: number;
  bio: string | null;
  institution_name: string | null;
  membership_category_id: string;
}

export async function createMember(userId: string, input: CreateMemberInput): Promise<Member> {
  const { data, error } = await supabase
    .from("members")
    .insert({
      user_id: userId,
      ...input,
      status: "pending" as MembershipStatus,
    })
    .select()
    .single();
  if (error) throw error;
  return data as Member;
}

export async function updateMemberCategory(memberId: string, categoryId: string): Promise<void> {
  const { error } = await supabase
    .from("members")
    .update({ membership_category_id: categoryId })
    .eq("id", memberId);
  if (error) throw error;
}

// Member self-service: update editable profile fields (NRC + full name locked)
export interface UpdateMemberInput {
  tpin: string | null;
  phone_number: string;
  artistic_discipline: string;
  province: string;
  city: string;
  years_experience: number;
  bio: string | null;
  institution_name: string | null;
}

export async function updateMyMember(memberId: string, patch: UpdateMemberInput): Promise<void> {
  const { error } = await supabase
    .from("members")
    .update(patch)
    .eq("id", memberId);
  if (error) throw error;
}

// Payment history for the signed-in user
export async function fetchMyPayments(userId: string) {
  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

// Admin: revoke a certificate
export async function adminRevokeCertificate(certificateId: string, reason: string): Promise<void> {
  const { error } = await supabase.rpc("admin_revoke_certificate", {
    _cert_id: certificateId,
    _reason: reason,
  });
  if (error) throw error;
}

// Admin: manually issue / re-issue a certificate
export async function adminIssueCertificate(memberId: string): Promise<string> {
  const { data, error } = await supabase.rpc("admin_issue_certificate", {
    _member_id: memberId,
  });
  if (error) throw error;
  return data as unknown as string;
}

// Admin: fetch all certificates (RLS allows admins SELECT all)
export async function adminFetchCertificates() {
  const { data, error } = await supabase
    .from("certificates")
    .select("*")
    .order("issued_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

// ── Payments ──────────────────────────────────────────────────────

export async function createPayment(opts: {
  userId: string;
  memberId: string;
  categoryId: string;
  amountZmw: number;
  provider: PaymentProvider;
  phone: string | null;
}) {
  const reference = generateTransactionRef(opts.provider);
  const { data, error } = await supabase
    .from("payments")
    .insert({
      user_id: opts.userId,
      member_id: opts.memberId,
      membership_category_id: opts.categoryId,
      amount_zmw: opts.amountZmw,
      provider: opts.provider,
      phone_number: opts.phone,
      transaction_reference: reference,
      status: "pending",
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function completePayment(paymentId: string): Promise<void> {
  const { error } = await supabase
    .from("payments")
    .update({ status: "success", paid_at: new Date().toISOString() })
    .eq("id", paymentId);
  if (error) throw error;
}

export async function activateMembership(memberId: string): Promise<void> {
  const now = new Date();
  const expires = new Date(now);
  expires.setFullYear(expires.getFullYear() + 1);
  const { error } = await supabase
    .from("members")
    .update({
      status: "active",
      membership_started_at: now.toISOString(),
      membership_expires_at: expires.toISOString(),
    })
    .eq("id", memberId);
  if (error) throw error;
}

// ── Certificates ──────────────────────────────────────────────────

export async function fetchMyCertificate(userId: string): Promise<Certificate | null> {
  const { data, error } = await supabase
    .from("certificates")
    .select("*")
    .eq("user_id", userId)
    .eq("revoked", false)
    .order("issued_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data as Certificate | null;
}

export async function issueCertificate(opts: {
  userId: string;
  memberId: string;
  expiresAt: string;
}): Promise<Certificate> {
  const { data, error } = await supabase
    .from("certificates")
    .insert({
      user_id: opts.userId,
      member_id: opts.memberId,
      certificate_number: generateCertificateNumber(),
      verification_token: generateVerificationToken(),
      expires_at: opts.expiresAt,
    })
    .select()
    .single();
  if (error) throw error;
  return data as Certificate;
}

// Public verification — anyone (anon allowed) can look up by token.
export async function verifyCertificate(token: string): Promise<{
  certificate: Certificate;
  member: Pick<Member, "full_name" | "artistic_discipline" | "province" | "membership_category_id">;
} | null> {
  const cleaned = token.trim();
  if (!cleaned) return null;

  const { data: cert, error: certErr } = await supabase
    .from("certificates")
    .select("*")
    .eq("verification_token", cleaned)
    .maybeSingle();
  if (certErr) throw certErr;
  if (!cert) return null;

  // Public read on members is restricted by RLS, so we only return data
  // already on the certificate plus what RLS allows. We expose a thin slice.
  const { data: member } = await supabase
    .from("members")
    .select("full_name, artistic_discipline, province, membership_category_id")
    .eq("id", (cert as Certificate).member_id)
    .maybeSingle();

  return {
    certificate: cert as Certificate,
    member: (member ?? {
      full_name: "Verified member",
      artistic_discipline: "—",
      province: "—",
      membership_category_id: "—",
    }) as never,
  };
}
