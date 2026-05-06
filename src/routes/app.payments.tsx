import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, Receipt, CheckCircle2, Clock, XCircle, Printer } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { fetchMyPayments } from "@/lib/nama-api";
import { formatZmw } from "@/lib/nama";
import type { PaymentProvider, PaymentStatus } from "@/lib/nama";

export const Route = createFileRoute("/app/payments")({
  component: PaymentsPage,
  head: () => ({
    meta: [
      { title: "Payment history — NAMA member portal" },
      { name: "description", content: "Your NAMA membership payment history and receipts." },
      { name: "robots", content: "noindex" },
    ],
  }),
});

interface PaymentRow {
  id: string;
  amount_zmw: number;
  provider: PaymentProvider;
  phone_number: string | null;
  transaction_reference: string;
  status: PaymentStatus;
  paid_at: string | null;
  created_at: string;
  membership_category_id: string;
}

function PaymentsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate({ to: "/login" }); return; }
    (async () => {
      try {
        const data = await fetchMyPayments(user.id);
        setRows(data as PaymentRow[]);
      } finally {
        setLoading(false);
      }
    })();
  }, [user, authLoading, navigate]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <Loader2 className="w-5 h-5 text-brass animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper text-foreground">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link to="/app" className="inline-flex items-center gap-2 text-[12px] text-muted-foreground hover:text-foreground mb-8 print:hidden">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to dashboard
        </Link>

        <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-brass">— Payment history</p>
        <h1 className="mt-3 font-serif text-3xl sm:text-4xl text-foreground tracking-tight" style={{ lineHeight: "1.1" }}>
          Every transaction, on the record.
        </h1>

        {rows.length === 0 ? (
          <div className="mt-10 border border-dashed border-border rounded-sm p-12 text-center">
            <Receipt className="w-8 h-8 text-muted-foreground mx-auto" strokeWidth={1.4} />
            <p className="mt-4 font-serif text-lg text-foreground">No payments yet</p>
            <p className="text-[13px] text-muted-foreground mt-1">Your membership payments will appear here.</p>
            <Link
              to="/app/pay"
              className="mt-6 inline-flex items-center gap-2 rounded-sm bg-brass text-ink px-5 py-3 text-sm font-semibold hover:bg-brass/90"
            >
              Make a payment
            </Link>
          </div>
        ) : (
          <div className="mt-10 space-y-3">
            {rows.map((p) => <PaymentCard key={p.id} payment={p} />)}
          </div>
        )}
      </div>
    </div>
  );
}

function PaymentCard({ payment }: { payment: PaymentRow }) {
  const date = new Date(payment.paid_at ?? payment.created_at).toLocaleString("en-GB", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });

  return (
    <div className="border border-border bg-card rounded-sm p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:break-inside-avoid">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <StatusBadge status={payment.status} />
          <span className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
            {providerLabel(payment.provider)}
          </span>
        </div>
        <p className="mt-2 font-serif text-2xl text-foreground">{formatZmw(payment.amount_zmw)}</p>
        <p className="text-[12px] text-muted-foreground">{date}</p>
        <p className="mt-2 text-[11px] font-mono text-muted-foreground/80 truncate">
          Ref · {payment.transaction_reference}
        </p>
      </div>
      {payment.status === "success" && (
        <button
          type="button"
          onClick={() => window.print()}
          className="print:hidden self-start sm:self-center inline-flex items-center gap-2 rounded-sm border border-border bg-paper px-4 py-2.5 text-[12px] text-foreground hover:bg-background whitespace-nowrap"
        >
          <Printer className="w-3.5 h-3.5" /> Print receipt
        </button>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: PaymentStatus }) {
  const map: Record<PaymentStatus, { label: string; cls: string; icon: typeof CheckCircle2 }> = {
    success: { label: "Paid", cls: "bg-success/15 text-success", icon: CheckCircle2 },
    pending: { label: "Pending", cls: "bg-brass/15 text-brass", icon: Clock },
    failed: { label: "Failed", cls: "bg-destructive/15 text-destructive", icon: XCircle },
    cancelled: { label: "Cancelled", cls: "bg-muted text-muted-foreground", icon: XCircle },
  };
  const { label, cls, icon: Icon } = map[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-sm px-2 py-1 text-[11px] font-medium ${cls}`}>
      <Icon className="w-3 h-3" />
      {label}
    </span>
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
