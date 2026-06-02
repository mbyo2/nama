import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ArrowLeft, Loader2, Receipt, Calendar, DollarSign } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { fetchMyPayments } from "@/lib/nama-api";
import { formatZmw } from "@/lib/nama";
import { toast } from "sonner";

export const Route = createFileRoute("/payments")({
  component: PaymentsPage,
  head: () => ({
    meta: [
      { title: "Payment History — NAMA" },
    ],
  }),
});

function PaymentsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    const loadPayments = async () => {
      try {
        const p = await fetchMyPayments(user.id);
        setPayments(p);
      } catch (error) {
        console.error("Error loading payments:", error);
        toast.error("Could not load payment history");
      } finally {
        setLoading(false);
      }
    };
    
    loadPayments();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <Loader2 className="w-5 h-5 text-brass animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper text-foreground">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <button
          onClick={() => navigate({ to: "/app" })}
          className="inline-flex items-center gap-2 text-[12px] text-muted-foreground hover:text-foreground mb-8"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to dashboard
        </button>

        <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-brass">— Payment History</p>
        <h1 className="mt-3 font-serif text-3xl sm:text-4xl text-foreground tracking-tight" style={{ lineHeight: "1.1" }}>
          Your payment records.
        </h1>

        {payments.length === 0 ? (
          <div className="mt-8 text-center py-12">
            <Receipt className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No payment records found</p>
            <button
              onClick={() => navigate({ to: "/pay" })}
              className="mt-4 inline-flex items-center gap-2 rounded-sm bg-brass text-ink px-6 py-3 text-sm font-semibold hover:bg-brass/90"
            >
              Make a Payment
            </button>
          </div>
        ) : (
          <div className="mt-8 space-y-4">
            {payments.map((payment) => (
              <div key={payment.id} className="border border-border bg-card rounded-sm p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-brass/15 flex items-center justify-center flex-shrink-0">
                      <Receipt className="w-5 h-5 text-brass" strokeWidth={1.8} />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {payment.membership_category?.name || "Membership"} Payment
                      </p>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(payment.created_at).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric"
                          })}
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          {formatZmw(payment.amount_zmw)}
                        </span>
                        <span className="flex items-center gap-1">
                          Provider: {payment.provider?.toUpperCase()}
                        </span>
                      </div>
                      {payment.transaction_reference && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Ref: {payment.transaction_reference}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                      payment.status === "success"
                        ? "bg-green-100 text-green-800"
                        : payment.status === "pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                    }`}>
                      {payment.status === "success" && "✓"}
                      {payment.status === "pending" && "⏳"}
                      {payment.status === "failed" && "✗"}
                      {payment.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 p-4 border border-brass/30 bg-brass/5 rounded-sm">
          <p className="text-sm text-muted-foreground">
            <strong>Note:</strong> This is your payment history. For any payment inquiries or issues, please contact NAMA administration.
          </p>
        </div>
      </div>
    </div>
  );
}
