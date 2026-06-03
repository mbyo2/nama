import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Download, ShieldCheck, Loader2, Printer } from "lucide-react";
import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import { useAuth } from "@/hooks/use-auth";
import namaLogo from "@/assets/nama-logo.jpg";
import {
  fetchMyMember, fetchMyCertificate, fetchCategories,
} from "@/lib/nama-api";
import type { Member, MembershipCategory, Certificate } from "@/lib/nama";
import { toast } from "sonner";

export const Route = createFileRoute("/app/certificate")({
  component: CertificatePage,
  head: () => ({
    meta: [
      { title: "Your certificate — NAMA" },
      { name: "description", content: "Your NAMA membership certificate, ready to share or print." },
    ],
  }),
});

function CertificatePage() {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [member, setMember] = useState<Member | null>(null);
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [category, setCategory] = useState<MembershipCategory | null>(null);
  const [bootstrapped, setBootstrapped] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [downloading, setDownloading] = useState(false);
  const certRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate({ to: "/login" }); return; }
    let cancelled = false;
    (async () => {
      try {
        console.log("Certificate page: Loading data for user:", user.id);
        const [m, cert, cats] = await Promise.all([
          fetchMyMember(user.id),
          fetchMyCertificate(user.id),
          fetchCategories(),
        ]);
        if (cancelled) return;
        console.log("Certificate page: Member data:", m);
        console.log("Certificate page: Certificate data:", cert);
        console.log("Certificate page: Categories:", cats);
        if (!m) {
          console.log("Certificate page: No member found");
          toast.error("Please complete your registration first");
          navigate({ to: "/register" });
          return;
        }
        if (!cert) {
          console.log("Certificate page: No certificate found");
          toast.error("No certificate found. Please complete your payment to receive your certificate.");
          navigate({ to: "/pay" });
          return;
        }
        setMember(m);
        setCertificate(cert);
        setCategory(cats.find((c) => c.id === m.membership_category_id) ?? null);
        console.log("Certificate page: All data loaded successfully");
      } catch (e) {
        console.error("Certificate page: Error loading data:", e);
        toast.error("Could not load your certificate. Please try again.");
        navigate({ to: "/app" });
      } finally {
        if (!cancelled) setBootstrapped(true);
      }
    })();
    return () => { cancelled = true; };
  }, [user, authLoading, navigate]);

  if (authLoading || !bootstrapped) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <Loader2 className="w-5 h-5 text-brass animate-spin" />
      </div>
    );
  }

  if (!member || !certificate) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <ShieldCheck className="w-16 h-16 text-brass/30 mx-auto mb-6" />
          <h1 className="text-2xl font-serif text-foreground mb-4">Certificate Not Found</h1>
          <p className="text-muted-foreground mb-8">
            {!member ? "Please complete your registration first." : "No certificate has been issued yet. Please complete your payment to receive your certificate."}
          </p>
          <button
            onClick={() => navigate({ to: member ? "/pay" : "/register" })}
            className="inline-flex items-center gap-2 rounded-sm bg-brass text-ink px-7 py-4 text-sm font-semibold hover:bg-brass/90"
          >
            {!member ? 'Complete Registration' : 'Complete Payment'}
          </button>
        </div>
      </div>
    );
  }

  const verifyUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/verify?token=${certificate.verification_token}`;
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=0&data=${encodeURIComponent(verifyUrl)}`;
  const issued = new Date(certificate.issued_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const expires = new Date(certificate.expires_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  const handlePrint = () => {
    try {
      window.print();
    } catch (error) {
      console.error("Print failed:", error);
      toast.error("Could not open print dialog. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-paper text-foreground">
      {/* Header — hidden on print */}
      <div className="print:hidden border-b border-border">
        <div className="max-w-4xl mx-auto px-6 py-5 flex items-center justify-between">
          <Link to="/app" className="inline-flex items-center gap-2 text-[12px] text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to dashboard
          </Link>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 rounded-sm bg-foreground text-paper px-5 py-2.5 text-[13px] font-semibold hover:bg-foreground/90"
          >
            <Download className="w-3.5 h-3.5" /> Print / Save PDF
          </button>
        </div>
      </div>

      {/* Certificate */}
      <div className="max-w-4xl mx-auto px-6 py-10 print:p-0 print:max-w-none">
        <div
          className="relative bg-card border border-ink/15 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.25)] print:shadow-none print:border-0"
          style={{ aspectRatio: "1.414 / 1" }}
        >
          {/* Inner border */}
          <div className="absolute inset-4 border border-brass/40 pointer-events-none" />
          <div className="absolute inset-6 border border-brass/20 pointer-events-none" />

          <div className="relative h-full flex flex-col p-10 sm:p-14">
            {/* Top */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <img src={namaLogo} alt="NAMA logo" className="w-12 h-12 rounded-full object-cover" />
                <div>
                  <p className="font-serif text-foreground text-lg font-semibold">NAMA</p>
                  <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                    National Association for Media Arts · Zambia
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-[0.25em] text-brass">Certificate №</p>
                <p className="font-mono text-[13px] text-foreground mt-1">{certificate.certificate_number}</p>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
              <p className="text-[11px] uppercase tracking-[0.3em] text-brass">— Certificate of Membership</p>
              <p className="mt-6 text-[13px] text-muted-foreground">This certifies that</p>
              <p className="mt-3 font-serif text-4xl sm:text-5xl text-foreground tracking-tight" style={{ lineHeight: "1.1" }}>
                {member.full_name}
              </p>
              <div className="mt-3 w-24 h-px bg-brass" />
              <p className="mt-5 text-[14px] text-muted-foreground max-w-md">
                is a registered <strong className="text-foreground">{category?.name ?? "Member"}</strong> member of the National Association for Media Arts of Zambia, recognised in the discipline of <strong className="text-foreground">{member.artistic_discipline}</strong>.
              </p>
            </div>

            {/* Bottom */}
            <div className="flex items-end justify-between gap-8">
              <div className="space-y-2 text-[11px] text-muted-foreground">
                <div>
                  <p className="uppercase tracking-[0.2em] text-brass">Issued</p>
                  <p className="text-foreground text-[13px] mt-0.5">{issued}</p>
                </div>
                <div>
                  <p className="uppercase tracking-[0.2em] text-brass">Valid until</p>
                  <p className="text-foreground text-[13px] mt-0.5">{expires}</p>
                </div>
                <div className="pt-2 flex items-center gap-1.5">
                  <ShieldCheck className="w-3 h-3 text-brass" />
                  <span>ECT Act 2021 · Advanced electronic signature</span>
                </div>
              </div>

              <div className="flex flex-col items-center">
                <img
                  src={qrSrc}
                  alt="Verification QR code"
                  width={120}
                  height={120}
                  className="bg-white p-1.5 rounded-sm"
                />
                <p className="mt-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Scan to verify</p>
              </div>

              <div className="text-right space-y-1">
                <div className="font-serif italic text-2xl text-foreground border-b border-foreground/40 pb-1 px-2">
                  Morgan Mbulo
                </div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">President · NAMA</p>
              </div>
            </div>
          </div>
        </div>

        <p className="print:hidden mt-6 text-center text-[12px] text-muted-foreground">
          Verify at <Link to="/verify" search={{ token: certificate.verification_token }} className="text-foreground underline">{`${typeof window !== "undefined" ? window.location.host : ""}/verify`}</Link>
        </p>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body { background: white !important; }
          @page { size: A4 landscape; margin: 0; }
          .min-h-screen { min-height: auto !important; }
          .max-w-4xl { max-width: 100% !important; }
          .px-6 { padding-left: 0 !important; padding-right: 0 !important; }
          .py-10 { padding-top: 0 !important; padding-bottom: 0 !important; }
          .shadow-\\[0_30px_80px_-30px_rgba\\(0\\,0\\,0\\,0\\.25\\)\\] { box-shadow: none !important; }
          .border-ink\\/15 { border: none !important; }
        }
      `}</style>
    </div>
  );
}
