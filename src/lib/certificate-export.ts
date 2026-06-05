// Reusable, browser-only certificate export helpers (PNG + PDF).
// Browser-only libraries are imported dynamically so the route stays SSR-safe.

/** Raised when the verification QR code never becomes ready in time. */
export class QrTimeoutError extends Error {
  constructor(message = "Verification QR code timed out") {
    super(message);
    this.name = "QrTimeoutError";
  }
}

/** Raised when the certificate could not be rendered/exported. */
export class CertificateExportError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message);
    this.name = "CertificateExportError";
    if (options?.cause !== undefined) {
      (this as { cause?: unknown }).cause = options.cause;
    }
  }
}

/**
 * Wait until `isReady()` returns true, polling until `timeoutMs` elapses.
 * Throws {@link QrTimeoutError} if the deadline passes first.
 */
export async function waitForReady(
  isReady: () => boolean,
  { timeoutMs = 8000, intervalMs = 150 }: { timeoutMs?: number; intervalMs?: number } = {},
): Promise<void> {
  const start = Date.now();
  while (!isReady()) {
    if (Date.now() - start > timeoutMs) {
      throw new QrTimeoutError();
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
}

/** Render a DOM node to a PNG data URL. */
export async function renderNodeToPng(node: HTMLElement): Promise<string> {
  try {
    const { toPng } = await import("html-to-image");
    const opts = { pixelRatio: 2, cacheBust: true, backgroundColor: "#ffffff" } as const;
    // First pass warms the cloned styles/fonts; the second captures reliably.
    await toPng(node, opts);
    return await toPng(node, opts);
  } catch (cause) {
    throw new CertificateExportError("Failed to render the certificate to an image", { cause });
  }
}

/** Trigger a browser download from a data URL. */
export function triggerDownload(filename: string, dataUrl: string): void {
  const link = document.createElement("a");
  link.download = filename;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

/** Build a safe file base name from a certificate number. */
export function certificateFileBase(certificateNumber: string): string {
  return `NAMA-Certificate-${certificateNumber.replace(/[^a-zA-Z0-9]+/g, "-")}`;
}

/** Export the certificate node as a PNG download. */
export async function downloadCertificatePng(node: HTMLElement, fileBase: string): Promise<void> {
  const dataUrl = await renderNodeToPng(node);
  triggerDownload(`${fileBase}.png`, dataUrl);
}

/** Export the certificate node as a PDF download. */
export async function downloadCertificatePdf(node: HTMLElement, fileBase: string): Promise<void> {
  const dataUrl = await renderNodeToPng(node);
  const w = node.offsetWidth;
  const h = node.offsetHeight;
  const orientation = w >= h ? "landscape" : "portrait";
  try {
    const { jsPDF } = await import("jspdf");
    const pdf = new jsPDF({ orientation, unit: "px", format: [w, h] });
    pdf.addImage(dataUrl, "PNG", 0, 0, w, h);
    pdf.save(`${fileBase}.pdf`);
  } catch (cause) {
    throw new CertificateExportError("Failed to assemble the certificate PDF", { cause });
  }
}
