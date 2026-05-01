// NAMA — National Association for Media Arts: shared types and helpers.

export type MembershipStatus = "pending" | "active" | "expired" | "suspended";
export type PaymentProvider = "mtn" | "airtel" | "zamtel" | "card";
export type PaymentStatus = "pending" | "success" | "failed" | "cancelled";

export interface MembershipCategory {
  id: string;
  name: string;
  description: string;
  annual_fee_zmw: number;
  sort_order: number;
  requires_institution: boolean;
}

export interface Member {
  id: string;
  user_id: string;
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
  status: MembershipStatus;
  membership_started_at: string | null;
  membership_expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Certificate {
  id: string;
  user_id: string;
  member_id: string;
  certificate_number: string;
  verification_token: string;
  issued_at: string;
  expires_at: string;
  revoked: boolean;
}

// NRC format: 6 digits / 2 digits / 1 digit, e.g. 123456/10/1
export const NRC_PATTERN = /^\d{6}\/\d{2}\/\d{1}$/;
export function isValidNrc(nrc: string): boolean {
  return NRC_PATTERN.test(nrc.trim());
}

// TPIN: ZRA Taxpayer Identification Number — 10 digits
export const TPIN_PATTERN = /^\d{10}$/;
export function isValidTpin(tpin: string): boolean {
  return TPIN_PATTERN.test(tpin.trim());
}

// Zambian mobile numbers: +260 followed by 9 digits, or 09/07/76/95 etc.
export const ZM_PHONE_PATTERN = /^(?:\+?260|0)?(?:9[5-7]|76)\d{7}$/;
export function isValidZmPhone(phone: string): boolean {
  return ZM_PHONE_PATTERN.test(phone.replace(/\s+/g, ""));
}

export function detectMobileProvider(phone: string): PaymentProvider | null {
  const digits = phone.replace(/\D/g, "");
  // Last 9 digits (drop country code if present)
  const local = digits.slice(-9);
  if (!local) return null;
  const prefix = local.slice(0, 2);
  // MTN: 96, 76 (also 67); Airtel: 97, 77; Zamtel: 95, 75
  if (["96", "76", "67"].includes(prefix)) return "mtn";
  if (["97", "77"].includes(prefix)) return "airtel";
  if (["95", "75"].includes(prefix)) return "zamtel";
  return null;
}

export const ARTISTIC_DISCIPLINES = [
  "Film acting",
  "Scriptwriting",
  "Film directing",
  "Cinematography",
  "Film editing",
  "Sound design",
  "Animation",
  "Documentary",
  "Television production",
  "Voice acting",
  "Media journalism",
  "Producing",
] as const;

export const ZM_PROVINCES = [
  "Lusaka",
  "Copperbelt",
  "Central",
  "Eastern",
  "Luapula",
  "Muchinga",
  "Northern",
  "North-Western",
  "Southern",
  "Western",
] as const;

export function formatZmw(amount: number): string {
  return `K${amount.toLocaleString("en-ZM")}`;
}

export function generateCertificateNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 900000) + 100000;
  return `NAMA/${year}/${random}`;
}

export function generateVerificationToken(): string {
  // 32-char URL-safe token
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function generateTransactionRef(provider: PaymentProvider): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${provider.toUpperCase()}-${ts}-${rand}`;
}

export function membershipStatusLabel(status: MembershipStatus): string {
  switch (status) {
    case "active": return "Active";
    case "pending": return "Pending payment";
    case "expired": return "Expired";
    case "suspended": return "Suspended";
  }
}
