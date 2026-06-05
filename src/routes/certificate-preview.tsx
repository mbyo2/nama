import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Download, Loader2, Printer } from "lucide-react";
import { fetchCategories } from "@/lib/nama-api";
import type { MembershipCategory } from "@/lib/nama";
import { CertificateTemplate } from "@/components/certificate-template";
import {
  downloadCertificatePng, downloadCertificatePdf, certificateFileBase,
  waitForReady, QrTimeoutError,
} from "@/lib/certificate-export";
import { toast } from "sonner";

export const Route = createFileRoute("/certificate-preview")({
  component: CertificatePreviewStudio,
  head: () => ({
    meta: [
      { title: "Certificate preview studio — NAMA" },
      { name: "description", content: "Preview and review the NAMA membership certificate design across every subscription tier." },
    ],
  }),
});

// Fallback tiers so the studio is usable even before categories load.
const FALLBACK_TIERS: Pick<MembershipCategory, "id" | "name">[] = [
  { id: "individual", name: "Individual" },
  { id: "professional", name: "Professional" },
  { id: "institutional", name: "Institutional" },
];

function CertificatePreviewStudio() {
  const [categories, setCategories] = useState<Pick<MembershipCategory, "id" | "name">[]>(FALLBACK_TIERS);
  const [tierId, setTierId] = useState<string>(FALLBACK_TIERS[0].id);
  const [fullName, setFullName] = useState("Chanda Mwale");
  const [certificateNumber, setCertificateNumber] = useState("NAMA/2026/000123");
  const [discipline, setDiscipline] = useState("Film & Television");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [downloading, setDownloading] = useState(false);
  const certRef = useRef<HTMLDivElement>(null);
  const qrRef = useRef("");

  useEffect(() => {
    let cancelled = false;
    fetchCategories()
      .then((cats) => {
        if (cancelled || cats.length === 0) return;
        setCategories(cats);
        setTierId((prev) => (cats.some((c) => c.id === prev) ? prev : cats[0].id));
      })
      .catch((e: unknown) => console.error("Preview studio: could not load tiers", e));
    return () => { cancelled = true; };
  }, []);

  // Generate a sample verification QR locally (no CORS taint).
  useEffect(() => {
    let cancelled = false;
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const url = `${origin}/verify?token=PREVIEW-SAMPLE-TOKEN`;
    import("qrcode")
      .then(({ default: QRCode }) => QRCode.toDataURL(url, { margin: 0, width: 240, errorCorrectionLevel: "M" }))
      .then((dataUrl) => {
        if (cancelled) return;
        qrRef.current = dataUrl;
        setQrDataUrl(dataUrl);
      })
      .catch((e: unknown) => {
        console.error("Preview studio: QR generation failed", e);
        if (!cancelled) toast.error("Could not generate the sample QR code.");
      });
    return () => { cancelled = true; };
  }, []);

  const tierName = useMemo(
    () => categories.find((c) => c.id === tierId)?.name ?? "Member",
    [categories, tierId],
  );
  const fileBase = certificateFileBase(certificateNumber || "preview");

  const reportExportError = (kind: "PNG" | "PDF", error: unknown) => {
    console.error(`Preview ${kind} export failed`, error);
    if (error instanceof QrTimeoutError) {
      toast.error("The sample QR code didn't finish generating. Please wait a moment and try again.");
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
      toast.success("Preview PNG downloaded");
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
      toast.success("Preview PDF downloaded");
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
      console.error("Preview print failed:", error);
      toast.error("Could not open the print dialog. Please try again.");
    }
  };

  const issued = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="min-h-screen bg-paper text-foreground">
      <div className="print:hidden border-b border-border">
        <div className="max-w-4xl mx-auto px-6 py-5 flex flex-wrap items-center justify-between gap-3">
          <Link to="/" className="inline-flex items-center gap-2 text-[12px] text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-3.5 h-3.5" /> Home
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

      {/* Review controls */}
      <div className="print:hidden border-b border-border bg-card/40">
        <div className="max-w-4xl mx-auto px-6 py-4 grid sm:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="tier" className="text-[11px] uppercase tracking-[0.2em] text-brass">Subscription tier</label>
            <select
              id="tier"
              data-testid="tier-preview"
              value={tierId}
              onChange={(e) => setTierId(e.target.value)}
              className="rounded-sm border border-input bg-background px-3 py-2 text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-brass"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="name" className="text-[11px] uppercase tracking-[0.2em] text-brass">Member name</label>
            <input
              id="name"
              data-testid="preview-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="rounded-sm border border-input bg-background px-3 py-2 text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-brass"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="number" className="text-[11px] uppercase tracking-[0.2em] text-brass">Certificate №</label>
            <input
              id="number"
              data-testid="preview-number"
              value={certificateNumber}
              onChange={(e) => setCertificateNumber(e.target.value)}
              className="rounded-sm border border-input bg-background px-3 py-2 text-[13px] font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-brass"
            />
          </div>
        </div>
        <div className="max-w-4xl mx-auto px-6 pb-4">
          <div className="flex flex-col gap-1.5 sm:max-w-xs">
            <label htmlFor="discipline" className="text-[11px] uppercase tracking-[0.2em] text-brass">Discipline</label>
            <input
              id="discipline"
              value={discipline}
              onChange={(e) => setDiscipline(e.target.value)}
              className="rounded-sm border border-input bg-background px-3 py-2 text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-brass"
            />
          </div>
          <p className="mt-3 text-[12px] text-muted-foreground">
            This is a sample certificate for branding review. The design is identical for every member — only the name, certificate number, and subscription tier change.
          </p>
        </div>
      </div>

      {/* Certificate */}
      <div className="max-w-4xl mx-auto px-6 py-10 print:p-0 print:max-w-none">
        <CertificateTemplate
          ref={certRef}
          fullName={fullName}
          certificateNumber={certificateNumber}
          tier={tierName}
          discipline={discipline}
          issued={issued}
          expires={expires}
          qrSrc={qrDataUrl}
        />
      </div>

      <style>{`
        @media print {
          body { background: white !important; }
          @page { size: A4 landscape; margin: 0; }
          .min-h-screen { min-height: auto !important; }
          .max-w-4xl { max-width: 100% !important; }
        }
      `}</style>
    </div>
  );
}
