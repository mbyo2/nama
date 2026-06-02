import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ArrowLeft, Smartphone, Loader2, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { fetchMyMember, fetchCategories, createPayment, completePayment, activateMembership, issueCertificate } from "@/lib/nama-api";
import { formatZmw, detectMobileProvider, isValidZmPhone } from "@/lib/nama";
import { toast } from "sonner";

export const Route = createFileRoute("/pay")({
  component: PayPage,
  head: () => ({
    meta: [
      { title: "Pay — NAMA member portal" },
    ],
  }),
});

function PayPage() {
  const { user } = useAuth();
  const [member, setMember] = useState<any>(null);
  const [category, setCategory] = useState<any>(null);
  const [phone, setPhone] = useState("");
  const [provider, setProvider] = useState<any>("mtn");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!user) return;
    
    const loadData = async () => {
      try {
        const [m, categories] = await Promise.all([
          fetchMyMember(user.id),
          fetchCategories()
        ]);
        
        if (!m) {
          navigate({ to: "/register" });
          return;
        }
        
        const cat = categories.find((c: any) => c.id === m.membership_category_id);
        setMember(m);
        setCategory(cat);
        setPhone(m.phone_number || "");
        
        if (m.phone_number) {
          const detected = detectMobileProvider(m.phone_number);
          if (detected) setProvider(detected);
        }
      } catch (error) {
        console.error("Error loading payment data:", error);
        toast.error("Could not load payment information");
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [user]);

  const phoneValid = isValidZmPhone(phone);

  const handleSubmit = async () => {
    if (!user || !member || !category || !phoneValid) {
      toast.error("Please check your information");
      return;
    }

    setSubmitting(true);
    try {
      console.log("Creating payment...");
      const payment = await createPayment({
        userId: user.id,
        memberId: member.id,
        categoryId: category.id,
        amountZmw: category.annual_fee_zmw,
        provider,
        phone,
      });

      // Simulate payment processing
      await new Promise((r) => setTimeout(r, 2000));

      await completePayment(payment.id);
      await activateMembership(member.id);

      // Issue certificate
      const expires = new Date();
      expires.setFullYear(expires.getFullYear() + 1);
      console.log("Attempting to issue certificate for user:", user.id, "member:", member.id);
      try {
        const certificate = await issueCertificate({
          userId: user.id,
          memberId: member.id,
          expiresAt: expires.toISOString(),
        });
        console.log("Certificate issued successfully:", certificate);
        console.log("Certificate ID:", certificate.id);
        console.log("Certificate number:", certificate.certificate_number);
      } catch (certError: any) {
        console.error("Certificate issuance failed:", certError);
        console.error("Error details:", certError.message, certError.code, certError.hint);
        toast.error("Payment successful but certificate issuance failed. Please contact support.");
        throw certError;
      }

      setSuccess(true);
      toast.success("Payment completed successfully!");
    } catch (error: any) {
      console.error("Payment error:", error);
      toast.error(error.message || "Payment failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <Loader2 className="w-5 h-5 text-brass animate-spin" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-paper text-foreground">
        <div className="max-w-xl mx-auto px-6 py-12 text-center">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-6" />
          <h1 className="text-3xl font-bold mb-4">Payment Complete!</h1>
          <p className="text-muted-foreground mb-8">
            Your membership is now active and your certificate has been issued.
          </p>
          <button
            onClick={() => navigate({ to: "/app" })}
            className="inline-flex items-center gap-2 rounded-sm bg-brass text-ink px-7 py-4 text-sm font-semibold hover:bg-brass/90"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!member || !category) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Member information not found</p>
          <button
            onClick={() => navigate({ to: "/app" })}
            className="mt-4 text-brass hover:text-brass/80"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper text-foreground">
      <div className="max-w-xl mx-auto px-6 py-12">
        <button
          onClick={() => navigate({ to: "/app" })}
          className="inline-flex items-center gap-2 text-[12px] text-muted-foreground hover:text-foreground mb-8"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to dashboard
        </button>

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

        {/* Payment Form */}
        <div className="mt-8 bg-card border border-border rounded-sm p-6 sm:p-8 space-y-5">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-3">Mobile money provider</p>
            <div className="grid grid-cols-3 gap-2">
              {["mtn", "airtel", "zamtel"].map((p) => (
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
                  {p.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block">
              <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Mobile number</span>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+260 977 123 456"
                className={`mt-2 w-full rounded-sm border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brass focus:border-transparent ${
                  phone && !phoneValid ? "border-destructive" : "border-input"
                }`}
              />
              <span className="block text-[11px] text-muted-foreground/70 mt-1.5">
                You'll receive an STK prompt on this number to authorise the payment.
              </span>
            </label>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!phoneValid || submitting}
            className="w-full inline-flex items-center justify-center gap-2 rounded-sm bg-brass text-ink px-7 py-4 text-sm font-semibold hover:bg-brass/90 disabled:opacity-40 disabled:pointer-events-none transition-all"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Smartphone className="w-4 h-4" />
                Pay {formatZmw(category.annual_fee_zmw)} via {provider.toUpperCase()}
              </>
            )}
          </button>

          <p className="text-[11px] text-muted-foreground/70 text-center">
            Demo flow — no real money is charged.
          </p>
        </div>
      </div>
    </div>
  );
}
