import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Download, ShieldCheck, Loader2, Printer, Eye } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import {
  fetchMyMember, fetchMyCertificate, fetchCategories,
} from "@/lib/nama-api";
import type { Member, MembershipCategory, Certificate } from "@/lib/nama";
import { CertificateTemplate } from "@/components/certificate-template";
import {
  downloadCertificatePng, downloadCertificatePdf, certificateFileBase,
  waitForReady, QrTimeoutError,
} from "@/lib/certificate-export";
import { toast } from "sonner";
import { buildVerificationUrl } from "@/lib/verification-url";

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
  const [categories, setCategories] = useState<MembershipCategory[]>([]);
  const [previewCategoryId, setPreviewCategoryId] = useState<string | null>(null);
  const [bootstrapped, setBootstrapped] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [downloading, setDownloading] = useState(false);
  const certRef = useRef<HTMLDivElement>(null);
  // Mirror QR state in a ref so async export handlers can read the latest value.
  const qrRef = useRef<string>("");

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate({ to: "/login" }); return; }
    let cancelled = false;
    (async () => {
      try {
        const [m, cert, cats] = await Promise.all([
          fetchMyMember(user.id),
          fetchMyCertificate(user.id),
          fetchCategories(),
        ]);
        if (cancelled) return;
        if (!m) {
          toast.error("Please complete your registration first");
          navigate({ to: "/register" });
          return;
        }
        if (!cert) {
          toast.error("No certificate found. Please complete your payment to receive your certificate.");
          navigate({ to: "/pay" });
          return;
        }
        setMember(m);
        setCertificate(cert);
        setCategories(cats);
        setPreviewCategoryId(m.membership_category_id);
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

  // Generate the verification QR locally so it embeds cleanly in downloads (no CORS taint).
  useEffect(() => {
    if (!certificate) return;
    let cancelled = false;
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    // Always points at /verify with a tamper-detection checksum on the token.
    const { url } = buildVerificationUrl(origin, certificate.verification_token);
    import("qrcode")
      .then(({ default: QRCode }) =>
        QRCode.toDataURL(url, { margin: 0, width: 240, errorCorrectionLevel: "M" }),
      )
      .then((dataUrl) => {
        if (cancelled) return;
        qrRef.current = dataUrl;
        setQrDataUrl(dataUrl);
      })
      .catch((e: unknown) => {
        console.error("Certificate QR generation failed:", e);
        if (!cancelled) toast.error("Could not generate the verification QR code. Please refresh the page.");
      });
    return () => { cancelled = true; };
  }, [certificate]);

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

  const realCategory = categories.find((c) => c.id === member.membership_category_id) ?? null;
  const previewCategory = categories.find((c) => c.id === previewCategoryId) ?? realCategory;
  const tierName = previewCategory?.name ?? "Member";
  const isPreviewingOtherTier = previewCategoryId !== member.membership_category_id;

  const issued = new Date(certificate.issued_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const expires = new Date(certificate.expires_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const fileBase = certificateFileBase(certificate.certificate_number);

  const reportExportError = (kind: "PNG" | "PDF", error: unknown) => {
    console.error(`Certificate ${kind} export failed`, error);
    if (error instanceof QrTimeoutError) {
      toast.error("The verification QR code didn't finish generating. Please refresh the page and try again.");
    } else {
      toast.error(`Could not generate the ${kind}. Please try again.`);
    }
  };

  const handleDownloadImage = async () => {
    setDownloading(true);
    try {
      await waitForReady(() => !!qrRef.current);
      const node = certRef.current;
      if (!node) throw new Error("Certificate element is not mounted");
      await downloadCertificatePng(node, fileBase);
      toast.success("Certificate PNG downloaded");
    } catch (error) {
      reportExportError("PNG", error);
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadPdf = async () => {
    setDownloading(true);
    try {
      await waitForReady(() => !!qrRef.current);
      const node = certRef.current;
      if (!node) throw new Error("Certificate element is not mounted");
      await downloadCertificatePdf(node, fileBase);
      toast.success("Certificate PDF downloaded");
    } catch (error) {
      reportExportError("PDF", error);
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    try {
      window.print();
    } catch (error) {
      console.error("Certificate print failed:", error);
      toast.error("Could not open the print dialog. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-paper text-foreground">
      {/* Header — hidden on print */}
      <div className="print:hidden border-b border-border">
        <div className="max-w-4xl mx-auto px-6 py-5 flex flex-wrap items-center justify-between gap-3">
          <Link to="/app" className="inline-flex items-center gap-2 text-[12px] text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to dashboard
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              disabled={downloading}
              className="inline-flex items-center gap-2 rounded-sm border border-border bg-transparent text-foreground px-4 py-2.5 text-[13px] font-semibold hover:bg-foreground/5 disabled:opacity-50"
            >
              <Printer className="w-3.5 h-3.5" /> Print
            </button>
            <button
              data-testid="download-png"
              onClick={handleDownloadImage}
              disabled={downloading || !qrDataUrl}
              className="inline-flex items-center gap-2 rounded-sm border border-border bg-transparent text-foreground px-4 py-2.5 text-[13px] font-semibold hover:bg-foreground/5 disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" /> PNG
            </button>
            <button
              data-testid="download-pdf"
              onClick={handleDownloadPdf}
              disabled={downloading || !qrDataUrl}
              className="inline-flex items-center gap-2 rounded-sm bg-foreground text-paper px-5 py-2.5 text-[13px] font-semibold hover:bg-foreground/90 disabled:opacity-50"
            >
              {downloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />} Download PDF
            </button>
          </div>
        </div>
      </div>

      {/* Tier preview selector */}
      <div className="print:hidden border-b border-border bg-card/40">
        <div className="max-w-4xl mx-auto px-6 py-3 flex flex-wrap items-center gap-3">
          <label htmlFor="tier-preview" className="inline-flex items-center gap-2 text-[12px] text-muted-foreground">
            <Eye className="w-3.5 h-3.5 text-brass" /> Preview tier
          </label>
          <select
            id="tier-preview"
            data-testid="tier-preview"
            value={previewCategoryId ?? ""}
            onChange={(e) => setPreviewCategoryId(e.target.value)}
            className="rounded-sm border border-input bg-background px-3 py-1.5 text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-brass"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          {isPreviewingOtherTier && (
            <span className="text-[12px] text-brass">
              Preview only — your actual tier is {realCategory?.name ?? "—"}.
            </span>
          )}
        </div>
      </div>

      {/* Certificate */}
      <div className="max-w-4xl mx-auto px-6 py-10 print:p-0 print:max-w-none">
        <CertificateTemplate
          ref={certRef}
          fullName={member.full_name}
          certificateNumber={certificate.certificate_number}
          tier={tierName}
          discipline={member.artistic_discipline}
          issued={issued}
          expires={expires}
          qrSrc={qrDataUrl}
        />

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
