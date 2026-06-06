import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Search, ShieldCheck, ShieldAlert, Loader2, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { validateScannedToken } from "@/lib/verification-url";

export const Route = createFileRoute("/verify")({
  component: VerifyPage,
  validateSearch: (search: Record<string, unknown>): { token?: string; c?: string } => ({
    token: typeof search.token === "string" ? search.token : undefined,
    c: typeof search.c === "string" ? search.c : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Verify a NAMA certificate" },
      { name: "description", content: "Verify the authenticity of a NAMA digital membership certificate." },
    ],
  }),
});

interface VerifyResult {
  certificate_number: string;
  issued_at: string;
  expires_at: string;
  revoked: boolean;
  full_name: string;
  artistic_discipline: string;
  province: string;
  membership_category_id: string;
  status: string;
}

type ErrorKind = "format" | "checksum" | "notfound" | "service" | "timeout";
interface VerifyError {
  kind: ErrorKind;
  title: string;
  message: string;
  /** Whether a retry against the same token could plausibly succeed. */
  retryable: boolean;
}

const LOOKUP_TIMEOUT_MS = 12_000;

/** Reject if the wrapped promise has not settled within `ms`. */
function withTimeout<T>(promise: PromiseLike<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("lookup-timeout")), ms);
    Promise.resolve(promise).then(
      (value) => { clearTimeout(timer); resolve(value); },
      (err) => { clearTimeout(timer); reject(err); },
    );
  });
}

function VerifyPage() {
  const { token: initialToken, c: initialChecksum } = Route.useSearch();
  const [token, setToken] = useState(initialToken ?? "");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [error, setError] = useState<VerifyError | null>(null);
  const [searched, setSearched] = useState(false);
  // Remember the last token actually looked up, so "Try again" can replay it.
  const lastTokenRef = useRef<string>("");

  const runLookup = async (rawToken: string, checksum?: string | null) => {
    const validation = validateScannedToken(rawToken, checksum);

    if (!validation.ok) {
      if (validation.reason === "missing") {
        // Nothing to look up yet — just show the empty form.
        setSearched(false);
        setError(null);
        setResult(null);
        return;
      }
      setResult(null);
      setLoading(false);
      setSearched(true);
      setError(
        validation.reason === "checksum"
          ? {
              kind: "checksum",
              title: "This verification link looks altered",
              message:
                "The link's integrity check failed, which usually means the URL was edited or copied incorrectly. Scan the QR code directly from the certificate, or paste the token exactly as shown.",
              retryable: false,
            }
          : {
              kind: "format",
              title: "That doesn't look like a valid token",
              message:
                "A NAMA verification token is 48 characters long. Check for missing or extra characters, then try again.",
              retryable: false,
            },
      );
      return;
    }

    lastTokenRef.current = validation.token;
    setToken(validation.token);
    setLoading(true);
    setError(null);
    setResult(null);
    setSearched(true);

    try {
      const { data, error: rpcError } = await withTimeout(
        supabase.rpc("verify_certificate", { _token: validation.token }),
        LOOKUP_TIMEOUT_MS,
      );
      if (rpcError) throw rpcError;
      const row = (data ?? [])[0] as VerifyResult | undefined;
      if (!row) {
        setError({
          kind: "notfound",
          title: "No matching certificate",
          message:
            "We couldn't find a certificate for this token. It may be mistyped, or the certificate may have been withdrawn. Double-check the token and try again.",
          retryable: true,
        });
      } else {
        setResult(row);
      }
    } catch (e) {
      const timedOut = e instanceof Error && e.message === "lookup-timeout";
      console.error("Certificate verification failed:", e);
      setError(
        timedOut
          ? {
              kind: "timeout",
              title: "Verification timed out",
              message:
                "The verification service took too long to respond. Please check your connection and try again.",
              retryable: true,
            }
          : {
              kind: "service",
              title: "Verification service unavailable",
              message:
                "Something went wrong while verifying this certificate. Please try again in a moment.",
              retryable: true,
            },
      );
    } finally {
      // Always clear loading — guarantees the page never gets stuck spinning,
      // including on a hard refresh that auto-triggers a lookup.
      setLoading(false);
    }
  };

  // Auto-verify when arriving from a QR scan / deep link. Runs exactly once as
  // soon as a token is available, whether it comes from the parsed search params
  // or (as a fallback) directly from the URL query string.
  const autoRan = useRef(false);
  useEffect(() => {
    if (autoRan.current) return;
    let urlToken = initialToken;
    let urlChecksum = initialChecksum;
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      urlToken = urlToken ?? params.get("token") ?? undefined;
      urlChecksum = urlChecksum ?? params.get("c") ?? undefined;
    }
    if ((urlToken ?? "").trim()) {
      autoRan.current = true;
      runLookup(urlToken!, urlChecksum);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialToken, initialChecksum]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Manual submissions are format-validated (no checksum required).
    runLookup(token);
  };

  const handleRetry = () => {
    const replay = lastTokenRef.current || token;
    runLookup(replay);
  };

  return (
    <div className="min-h-screen bg-paper text-foreground">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <Link to="/" className="inline-flex items-center gap-2 text-[13px] text-muted-foreground hover:text-foreground transition-colors mb-10">
          <ArrowLeft className="w-3.5 h-3.5" /> Back home
        </Link>
        <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-brass">— Certificate verification</p>
        <h1 className="mt-4 font-serif text-4xl text-foreground tracking-tight" style={{ lineHeight: "1.1" }}>
          Verify a NAMA certificate
        </h1>
        <p className="mt-4 text-muted-foreground max-w-lg">
          Paste the verification token from a certificate, or scan the QR code with your phone camera. Verification is free and public.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col sm:flex-row gap-3">
          <input
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Paste verification token"
            aria-label="Verification token"
            className="flex-1 rounded-sm border border-input bg-background px-4 py-3 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brass focus:border-transparent"
          />
          <button
            type="submit"
            disabled={!token.trim() || loading}
            data-testid="verify-submit"
            className="inline-flex items-center justify-center gap-2 rounded-sm bg-brass text-ink px-6 py-3 text-sm font-semibold hover:bg-brass/90 disabled:opacity-40 disabled:pointer-events-none"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Verify
          </button>
        </form>

        {/* Result panel */}
        {searched && (
          <div className="mt-8" aria-live="polite">
            {loading && <VerifySkeleton />}

            {!loading && error && (
              <div
                data-testid="verify-error"
                data-error-kind={error.kind}
                className="rounded-sm border border-destructive/30 bg-destructive/5 p-6"
              >
                <div className="flex items-start gap-4">
                  <ShieldAlert className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-serif text-base text-foreground">{error.title}</p>
                    <p className="text-[13px] text-muted-foreground mt-1">{error.message}</p>
                    {error.retryable && (
                      <button
                        onClick={handleRetry}
                        data-testid="verify-retry"
                        className="mt-4 inline-flex items-center gap-2 rounded-sm border border-border bg-background px-4 py-2 text-[13px] font-semibold text-foreground hover:bg-foreground/5"
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> Try again
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {!loading && result && <ResultCard result={result} />}
          </div>
        )}
      </div>
    </div>
  );
}

/** Animated skeleton + indeterminate progress bar shown during a lookup. */
function VerifySkeleton() {
  return (
    <div data-testid="verify-skeleton" className="rounded-sm border border-border bg-card overflow-hidden">
      <div className="h-1 w-full bg-brass/15 overflow-hidden">
        <div className="h-full w-1/3 bg-brass rounded-full verify-progress-bar" />
      </div>
      <div className="p-6 sm:p-8 flex items-start gap-4">
        <div className="w-11 h-11 rounded-full bg-foreground/10 animate-pulse flex-shrink-0" />
        <div className="flex-1 space-y-3">
          <div className="h-2.5 w-40 bg-foreground/10 rounded animate-pulse" />
          <div className="h-6 w-56 bg-foreground/10 rounded animate-pulse" />
          <div className="h-2.5 w-32 bg-foreground/10 rounded animate-pulse" />
        </div>
      </div>
      <div className="grid sm:grid-cols-3 gap-px bg-border">
        {[0, 1, 2].map((i) => (
          <div key={i} className="bg-paper p-4 space-y-2">
            <div className="h-2 w-16 bg-foreground/10 rounded animate-pulse" />
            <div className="h-3 w-24 bg-foreground/10 rounded animate-pulse" />
          </div>
        ))}
      </div>
      <p className="px-6 pb-5 text-[12px] text-muted-foreground">Verifying certificate…</p>
    </div>
  );
}

function ResultCard({ result }: { result: VerifyResult }) {
  const isExpired = new Date(result.expires_at) < new Date();
  const isValid = !result.revoked && !isExpired && result.status === "active";
  const issued = new Date(result.issued_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const expires = new Date(result.expires_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  const verdict = isValid
    ? "Verified · valid certificate"
    : result.revoked
      ? "Revoked"
      : isExpired
        ? "Expired"
        : "Inactive";

  return (
    <div
      data-testid="verify-result"
      data-valid={isValid ? "true" : "false"}
      className={`rounded-sm border ${isValid ? "border-success/40 bg-success/5" : "border-destructive/40 bg-destructive/5"}`}
    >
      <div className="p-6 sm:p-8 border-b border-border/60">
        <div className="flex items-start gap-4">
          {isValid ? (
            <div className="w-11 h-11 rounded-full bg-success/15 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-6 h-6 text-success" />
            </div>
          ) : (
            <div className="w-11 h-11 rounded-full bg-destructive/15 flex items-center justify-center flex-shrink-0">
              <ShieldAlert className="w-6 h-6 text-destructive" />
            </div>
          )}
          <div>
            <p data-testid="verify-verdict" className="text-[11px] uppercase tracking-[0.2em] text-brass">
              {verdict}
            </p>
            <p className="font-serif text-2xl text-foreground mt-1">{result.full_name}</p>
            <p className="text-[13px] text-muted-foreground mt-1">
              {[result.artistic_discipline, result.province].filter(Boolean).join(" · ")}
              {result.province ? ", Zambia" : ""}
            </p>
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-px bg-border">
        <Stat label="Certificate №" value={result.certificate_number} mono />
        <Stat label="Issued" value={issued} />
        <Stat label="Valid until" value={expires} />
      </div>
    </div>
  );
}

function Stat({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="bg-paper p-4">
      <p className="text-[10px] uppercase tracking-[0.2em] text-brass mb-1">{label}</p>
      <p className={`text-[13px] text-foreground ${mono ? "font-mono" : ""}`}>{value}</p>
    </div>
  );
}
