import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/verify")({
  component: VerifyPage,
  head: () => ({
    meta: [
      { title: "Verify a NAMA certificate" },
      { name: "description", content: "Verify the authenticity of a NAMA digital membership certificate." },
    ],
  }),
});

function VerifyPage() {
  return (
    <div className="min-h-screen bg-paper text-foreground">
      <div className="max-w-2xl mx-auto px-6 py-20">
        <Link to="/" className="inline-flex items-center gap-2 text-[13px] text-muted-foreground hover:text-foreground transition-colors mb-10">
          <ArrowLeft className="w-3.5 h-3.5" /> Back home
        </Link>
        <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-brass">— Certificate verification</p>
        <h1 className="mt-4 font-serif text-4xl text-foreground tracking-tight" style={{ lineHeight: "1.1" }}>
          Verify a NAMA certificate
        </h1>
        <p className="mt-4 text-muted-foreground">
          Paste a verification token or scan a certificate QR code. Public verification is coming with the next release of the member portal.
        </p>
        <div className="mt-10 rounded-sm border border-border bg-card p-6 text-[13px] text-muted-foreground">
          Certificate lookup will appear here once member certificates are issued.
        </div>
      </div>
    </div>
  );
}
