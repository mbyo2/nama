import { forwardRef } from "react";
import { ShieldCheck, Loader2 } from "lucide-react";
import namaLogo from "@/assets/nama-logo.jpg";

/**
 * The certificate is a SINGLE shared template. The design is identical for
 * every member — only the fields below ever change between certificates.
 * Keep this list in sync with the `data-cert-field` attributes rendered
 * below; the consistency check (e2e) relies on it.
 */
export const CERTIFICATE_VARIABLE_FIELDS = ["name", "number", "tier"] as const;
export type CertificateVariableField = (typeof CERTIFICATE_VARIABLE_FIELDS)[number];

export interface CertificateTemplateData {
  /** Member full name (varies per certificate). */
  fullName: string;
  /** Certificate number, e.g. NAMA/2026/123456 (varies per certificate). */
  certificateNumber: string;
  /** Subscription tier / membership category name (varies per certificate). */
  tier: string;
  /** Artistic discipline. */
  discipline: string;
  /** Pre-formatted issued date string. */
  issued: string;
  /** Pre-formatted expiry date string. */
  expires: string;
  /** Data-URL of the verification QR code, or empty while generating. */
  qrSrc: string;
  /** Name printed on the signature line. */
  presidentName?: string;
}

/**
 * Presentational, props-driven certificate. This is the single source of
 * truth for the certificate's branding/layout — both the member-facing
 * certificate page and the branding preview studio render it, so the design
 * can never drift between users.
 */
export const CertificateTemplate = forwardRef<HTMLDivElement, CertificateTemplateData>(
  function CertificateTemplate(
    { fullName, certificateNumber, tier, discipline, issued, expires, qrSrc, presidentName = "Morgan Mbulo" },
    ref,
  ) {
    return (
      <div
        ref={ref}
        data-cert-template=""
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
              <p data-cert-field="number" className="font-mono text-[13px] text-foreground mt-1">
                {certificateNumber}
              </p>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
            <p className="text-[11px] uppercase tracking-[0.3em] text-brass">— Certificate of Membership</p>
            <p className="mt-6 text-[13px] text-muted-foreground">This certifies that</p>
            <p
              data-cert-field="name"
              className="mt-3 font-serif text-4xl sm:text-5xl text-foreground tracking-tight"
              style={{ lineHeight: "1.1" }}
            >
              {fullName}
            </p>
            <div className="mt-3 w-24 h-px bg-brass" />
            <p className="mt-5 text-[14px] text-muted-foreground max-w-md">
              is a registered{" "}
              <strong data-cert-field="tier" className="text-foreground">
                {tier}
              </strong>{" "}
              member of the National Association for Media Arts of Zambia, recognised in the discipline of{" "}
              <strong className="text-foreground">{discipline}</strong>.
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
              {qrSrc ? (
                <img
                  src={qrSrc}
                  alt="Verification QR code"
                  width={120}
                  height={120}
                  className="bg-white p-1.5 rounded-sm"
                />
              ) : (
                <div className="w-[120px] h-[120px] bg-white p-1.5 rounded-sm flex items-center justify-center">
                  <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
                </div>
              )}
              <p className="mt-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Scan to verify</p>
            </div>

            <div className="text-right space-y-1">
              <div className="font-serif italic text-2xl text-foreground border-b border-foreground/40 pb-1 px-2">
                {presidentName}
              </div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">President · NAMA</p>
            </div>
          </div>
        </div>
      </div>
    );
  },
);
