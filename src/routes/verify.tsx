import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Search, ShieldCheck, ShieldAlert, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/verify")({
  component: VerifyPage,
  validateSearch: (search: Record<string, unknown>): { token?: string } => ({
    token: typeof search.token === "string" ? search.token : undefined,
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

function VerifyPage() {
  const { token: initialToken } = Route.useSearch();
  const [token, setToken] = useState(initialToken ?? "");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const runLookup = async (lookupToken: string) => {
    const cleaned = lookupToken.trim();
    if (!cleaned) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setSearched(true);
    try {
      const { data, error } = await supabase.rpc("verify_certificate", { _token: cleaned });
      if (error) throw error;
      const row = (data ?? [])[0] as VerifyResult | undefined;
      if (!row) {
        setError("No certificate matches that token.");
      } else {
        setResult(row);
      }
    } catch (e) {
      console.error(e);
      setError("Verification service is unavailable. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Auto-verify when arriving from a QR scan / deep link. Runs exactly once as
  // soon as a token is available, whether it comes from the parsed search params
  // or (as a fallback) directly from the URL query string.
  const autoRan = useRef(false);
  useEffect(() => {
    if (autoRan.current) return;
    let urlToken: string | undefined;
    if (typeof window !== "undefined") {
      urlToken = new URLSearchParams(window.location.search).get("token") ?? undefined;
    }
    const candidate = (initialToken ?? urlToken ?? "").trim();
    if (candidate) {
      autoRan.current = true;
      setToken(candidate);
      runLookup(candidate);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialToken]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    runLookup(token);
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
            className="flex-1 rounded-sm border border-input bg-background px-4 py-3 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brass focus:border-transparent"
          />
          <button
            type="submit"
            disabled={!token.trim() || loading}
            className="inline-flex items-center justify-center gap-2 rounded-sm bg-brass text-ink px-6 py-3 text-sm font-semibold hover:bg-brass/90 disabled:opacity-40 disabled:pointer-events-none"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Verify
          </button>
        </form>

        {/* Result panel */}
        {searched && (
          <div className="mt-8">
            {loading && (
              <div className="rounded-sm border border-border bg-card p-6 text-[13px] text-muted-foreground">
                Looking up certificate…
              </div>
            )}

            {!loading && error && (
              <div className="rounded-sm border border-destructive/30 bg-destructive/5 p-6 flex items-start gap-4">
                <ShieldAlert className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-serif text-base text-foreground">Could not verify</p>
                  <p className="text-[13px] text-muted-foreground mt-1">{error}</p>
                </div>
              </div>
            )}

            {!loading && result && (
              <ResultCard result={result} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ResultCard({ result }: { result: VerifyResult }) {
  const isExpired = new Date(result.expires_at) < new Date();
  const isValid = !result.revoked && !isExpired && result.status === "active";
  const issued = new Date(result.issued_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const expires = new Date(result.expires_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className={`rounded-sm border ${isValid ? "border-success/40 bg-success/5" : "border-destructive/40 bg-destructive/5"}`}>
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
            <p className="text-[11px] uppercase tracking-[0.2em] text-brass">
              {isValid ? "Verified · valid certificate" : result.revoked ? "Revoked" : isExpired ? "Expired" : "Inactive"}
            </p>
            <p className="font-serif text-2xl text-foreground mt-1">{result.full_name}</p>
            <p className="text-[13px] text-muted-foreground mt-1">
              {result.artistic_discipline} · {result.province}, Zambia
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
