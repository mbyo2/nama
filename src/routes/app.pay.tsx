import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, Smartphone } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import {
  fetchMyMember, fetchCategories, createPayment, completePayment,
  activateMembership, issueCertificate, fetchMyCertificate,
} from "@/lib/nama-api";
import {
  formatZmw, detectMobileProvider, isValidZmPhone,
} from "@/lib/nama";
import type { Member, MembershipCategory, PaymentProvider } from "@/lib/nama";
import { toast } from "sonner";

export const Route = createFileRoute("/app/pay")({
  component: PayPage,
  head: () => ({
    meta: [
      { title: "Pay — NAMA member portal" },
      { name: "description", content: "Pay your annual NAMA membership via mobile money." },
    ],
  }),
});

type Phase = "form" | "processing" | "success";

function PayPage() {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [member, setMember] = useState<Member | null>(null);
  const [category, setCategory] = useState<MembershipCategory | null>(null);
  const [phone, setPhone] = useState("");
  const [provider, setProvider] = useState<PaymentProvider>("mtn");
  const [phase, setPhase] = useState<Phase>("form");
  const [bootstrapped, setBootstrapped] = useState(false);
  const [reference, setReference] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate({ to: "/login" }); return; }
    let cancelled = false;
    (async () => {
      try {
        const m = await fetchMyMember(user.id);
        if (cancelled) return;
        if (!m) { navigate({ to: "/app/register" }); return; }
        setMember(m);
        setPhone(m.phone_number);
        const detected = detectMobileProvider(m.phone_number);
        if (detected) setProvider(detected);
        const cats = await fetchCategories();
        if (cancelled) return;
        const cat = cats.find((c) => c.id === m.membership_category_id) ?? null;
        setCategory(cat);
        // No auto-redirect — renewals & re-issues are allowed any time.
      } catch (e) {
        console.error(e);
        toast.error("Could not load payment details");
      } finally {
        if (!cancelled) setBootstrapped(true);
      }
    })();
    return () => { cancelled = true; };
  }, [user, authLoading, navigate]);

  const phoneValid = useMemo(() => isValidZmPhone(phone), [phone]);

  const handlePhoneChange = (val: string) => {
    setPhone(val);
    const detected = detectMobileProvider(val);
    if (detected) setProvider(detected);
  };

  const handleSubmit = async () => {
    if (!user || !member || !category || !phoneValid) return;
    setPhase("processing");
    try {
      const payment = await createPayment({
        userId: user.id,
        memberId: member.id,
        categoryId: category.id,
        amountZmw: category.annual_fee_zmw,
        provider,
        phone,
      });
      setReference(payment.transaction_reference);

      // Simulated mobile-money settlement delay
      await new Promise((r) => setTimeout(r, 2400));

      await completePayment(payment.id);
      await activateMembership(member.id);

      // Issue certificate (1-year validity)
      const expires = new Date();
      expires.setFullYear(expires.getFullYear() + 1);
      await issueCertificate({
        userId: user.id,
        memberId: member.id,
        expiresAt: expires.toISOString(),
      });

      setPhase("success");
      toast.success("Payment confirmed — your certificate is live");
    } catch (e) {
      console.error(e);
      toast.error("Payment could not be completed. Please try again.");
      setPhase("form");
    }
  };

  if (authLoading || !bootstrapped) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <Loader2 className="w-5 h-5 text-brass animate-spin" />
      </div>
    );
  }

  if (!member || !category) return null;

  return (
    <div className="min-h-screen bg-paper text-foreground">
      <div className="max-w-xl mx-auto px-6 py-12">
        <Link to="/app" className="inline-flex items-center gap-2 text-[12px] text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to dashboard
        </Link>

        <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-brass">— Membership payment</p>
        <h1 className="mt-3 font-serif text-3xl sm:text-4xl text-foreground tracking-tight" style={{ lineHeight: "1.1" }}>
          Activate your <em className="italic">{category.name}</em> membership.
        </h1>

        {/* Summary */}
        <div className="mt-8 grid grid-cols-3 gap-px bg-border">
          <div className="bg-paper p-4">
            <p className="text-[10px] uppercase tracking-[0.2em] text-brass mb-1">Tier</p>
            <p className="font-serif text-lg text-foreground">{category.name}</p>
          </div>
          <div className="bg-paper p-4">
            <p className="text-[10px] uppercase tracking-[0.2em] text-brass mb-1">Term</p>
            <p className="font-serif text-lg text-foreground">12 months</p>
          </div>
          <div className="bg-paper p-4">
            <p className="text-[10px] uppercase tracking-[0.2em] text-brass mb-1">Total</p>
            <p className="font-serif text-lg text-foreground">{formatZmw(category.annual_fee_zmw)}</p>
          </div>
        </div>

        {/* Phase content */}
        {phase === "form" && (
          <div className="mt-8 bg-card border border-border rounded-sm p-6 sm:p-8 space-y-5">
            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-3">Mobile money provider</p>
              <div className="grid grid-cols-3 gap-2">
                {(["mtn", "airtel", "zamtel"] as PaymentProvider[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setProvider(p)}
                    className={`rounded-sm border py-3 text-[12px] uppercase tracking-[0.15em] transition-colors ${
                      provider === p
                        ? "border-brass bg-brass/10 text-foreground"
                        : "border-border bg-paper text-muted-foreground hover:bg-card"
                    }`}
                  >
                    {providerLabel(p)}
                  </button>
                ))}
              </div>
            </div>

            <label className="block">
              <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Mobile number</span>
              <input
                value={phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder="+260 977 123 456"
                className={`mt-2 w-full rounded-sm border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brass focus:border-transparent transition-all ${
                  phone && !phoneValid ? "border-destructive" : "border-input"
                }`}
              />
              <span className="block text-[11px] text-muted-foreground/70 mt-1.5">
                You'll receive an STK prompt on this number to authorise the payment.
              </span>
            </label>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={!phoneValid}
              className="w-full inline-flex items-center justify-center gap-2 rounded-sm bg-brass text-ink px-7 py-4 text-sm font-semibold hover:bg-brass/90 disabled:opacity-40 disabled:pointer-events-none transition-all active:scale-[0.99]"
            >
              <Smartphone className="w-4 h-4" />
              Pay {formatZmw(category.annual_fee_zmw)} via {providerLabel(provider)}
            </button>

            <p className="text-[11px] text-muted-foreground/70 text-center">
              Demo flow — no real money is charged. Production will integrate the official MNO STK push APIs.
            </p>
          </div>
        )}

        {phase === "processing" && (
          <div className="mt-8 bg-card border border-border rounded-sm p-10 text-center">
            <Loader2 className="w-8 h-8 text-brass animate-spin mx-auto" />
            <p className="mt-5 font-serif text-2xl text-foreground">Awaiting your authorisation…</p>
            <p className="mt-2 text-[13px] text-muted-foreground max-w-sm mx-auto">
              Check your {providerLabel(provider)} STK prompt on <strong className="text-foreground">{phone}</strong> and approve the payment of {formatZmw(category.annual_fee_zmw)}.
            </p>
            {reference && (
              <p className="mt-6 text-[11px] font-mono text-muted-foreground/70">Ref · {reference}</p>
            )}
          </div>
        )}

        {phase === "success" && (
          <div className="mt-8 bg-card border border-border rounded-sm p-10 text-center">
            <div className="w-12 h-12 rounded-full bg-success/15 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6 text-success" strokeWidth={2} />
            </div>
            <p className="mt-5 font-serif text-2xl text-foreground">Payment confirmed</p>
            <p className="mt-2 text-[13px] text-muted-foreground max-w-sm mx-auto">
              Your NAMA membership is active and your certificate has been issued.
            </p>
            <Link
              to="/app/certificate"
              className="mt-7 inline-flex items-center gap-2 rounded-sm bg-foreground text-paper px-6 py-3 text-sm font-semibold hover:bg-foreground/90"
            >
              View certificate <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function providerLabel(p: PaymentProvider): string {
  switch (p) {
    case "mtn": return "MTN MoMo";
    case "airtel": return "Airtel Money";
    case "zamtel": return "Zamtel Kwacha";
    case "card": return "Card";
  }
}
