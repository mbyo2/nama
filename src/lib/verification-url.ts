// Shared helpers for building and validating certificate verification links.
//
// The verification token is the source of truth and is checked server-side via
// the `verify_certificate` SECURITY DEFINER RPC. The checksum here is NOT a
// security control — it is an integrity guard that lets the verify page reject
// an obviously mangled / tampered link (mistyped token, corrupted QR scan,
// truncated URL) BEFORE making a database round-trip, and show a clear message.

/**
 * Token format produced by the database:
 * `encode(gen_random_bytes(24), 'hex')` → 48 lowercase hex characters.
 */
export const VERIFICATION_TOKEN_RE = /^[0-9a-f]{48}$/;

/** True when the token matches the canonical certificate token format. */
export function isValidTokenFormat(token: string): boolean {
  return VERIFICATION_TOKEN_RE.test(token.trim().toLowerCase());
}

/**
 * Deterministic, non-cryptographic checksum (FNV-1a, 32-bit) rendered as 8 hex
 * characters. Stable across server and browser. Used purely as a tamper/typo
 * guard on the verification URL.
 */
export function tokenChecksum(token: string): string {
  const s = token.trim().toLowerCase();
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

export interface BuiltVerificationUrl {
  /** Absolute URL pointing at the `/verify` route with token + checksum. */
  url: string;
  /** The cleaned token that was embedded. */
  token: string;
  /** The checksum that was embedded (query param `c`). */
  checksum: string;
}

/**
 * Build the canonical verification URL for a token. The URL ALWAYS points at
 * the `/verify` route and carries an integrity checksum so the destination
 * page can detect a tampered link.
 */
export function buildVerificationUrl(origin: string, token: string): BuiltVerificationUrl {
  const cleaned = token.trim();
  const checksum = tokenChecksum(cleaned);
  const base = origin.replace(/\/+$/, "");
  const url = `${base}/verify?token=${encodeURIComponent(cleaned)}&c=${checksum}`;
  return { url, token: cleaned, checksum };
}

export type TokenValidationReason = "missing" | "format" | "checksum";

export type TokenValidation =
  | { ok: true; token: string }
  | { ok: false; reason: TokenValidationReason };

/**
 * Validate a token (and optional checksum) coming off a scanned/typed URL.
 * - `missing`  → no token present at all
 * - `format`   → token is not in the canonical certificate token format
 * - `checksum` → a checksum was supplied but does not match the token
 *
 * The checksum is only enforced when present, so older QR codes / manually
 * pasted tokens (no `c` param) still validate on format alone.
 */
export function validateScannedToken(
  token: string | undefined | null,
  checksum?: string | null,
): TokenValidation {
  const cleaned = (token ?? "").trim();
  if (!cleaned) return { ok: false, reason: "missing" };
  if (!isValidTokenFormat(cleaned)) return { ok: false, reason: "format" };
  const suppliedChecksum = (checksum ?? "").trim().toLowerCase();
  if (suppliedChecksum && suppliedChecksum !== tokenChecksum(cleaned)) {
    return { ok: false, reason: "checksum" };
  }
  return { ok: true, token: cleaned.toLowerCase() };
}
