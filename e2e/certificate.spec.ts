import { test, expect } from "../playwright-fixture";
import { buildVerificationUrl } from "../src/lib/verification-url";



/**
 * Every reachable route. Auth-gated routes redirect to /login — that is fine;
 * the point of this list is that NO route throws an uncaught runtime error,
 * either on first load or after a hard refresh (full SSR round-trip).
 */
const ROUTES = [
  "/",
  "/login",
  "/registry",
  "/verify",
  "/blog",
  "/help",
  "/register",
  "/pay",
  "/payments",
  "/profile",
  "/messages",
  "/admin",
  "/app",
  "/app/certificate",
  "/certificate-preview",
];

/** Minimal shape so we don't depend on @playwright/test type resolution here. */
type ErrorEmitter = { on(event: "pageerror", listener: (err: Error) => void): void };

/** Attach a collector for uncaught page errors. */
function trackRuntimeErrors(page: ErrorEmitter): string[] {
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(err.message));
  return errors;
}

test.describe("route runtime safety", () => {
  for (const route of ROUTES) {
    test(`no runtime errors on ${route} (load + hard refresh)`, async ({ page }) => {
      const errors = trackRuntimeErrors(page);

      const res = await page.goto(route, { waitUntil: "networkidle" });
      // The server must not 5xx (SSR crash) for any route.
      expect(res, `no response for ${route}`).not.toBeNull();
      expect(res!.status(), `5xx on first load of ${route}`).toBeLessThan(500);

      // Hard refresh — re-runs SSR for the resolved URL.
      const reload = await page.reload({ waitUntil: "networkidle" });
      expect(reload!.status(), `5xx on hard refresh of ${route}`).toBeLessThan(500);

      expect(errors, `runtime errors on ${route}: ${errors.join(" | ")}`).toHaveLength(0);
    });
  }
});

test.describe("certificate preview studio", () => {
  test.setTimeout(90_000);

  test("PNG and PDF downloads complete after a hard refresh", async ({ page }) => {
    const errors = trackRuntimeErrors(page);

    await page.goto("/certificate-preview", { waitUntil: "networkidle" });
    await page.reload({ waitUntil: "networkidle" });

    // The certificate template must be present.
    await expect(page.locator("[data-cert-template]")).toBeVisible();

    // Buttons enable once the QR data URL is ready.
    const pngBtn = page.getByTestId("download-png");
    const pdfBtn = page.getByTestId("download-pdf");
    await expect(pngBtn).toBeEnabled({ timeout: 15_000 });
    await expect(pdfBtn).toBeEnabled({ timeout: 15_000 });

    // PNG download completes.
    const pngDownload = page.waitForEvent("download", { timeout: 30_000 });
    await pngBtn.click();
    const png = await pngDownload;
    expect(png.suggestedFilename()).toMatch(/\.png$/);

    // PDF download completes.
    const pdfDownload = page.waitForEvent("download", { timeout: 30_000 });
    await pdfBtn.click();
    const pdf = await pdfDownload;
    expect(pdf.suggestedFilename()).toMatch(/\.pdf$/);

    expect(errors, `runtime errors during export: ${errors.join(" | ")}`).toHaveLength(0);
  });

  test("template stays identical across tiers — only the variable fields change", async ({ page }) => {
    await page.goto("/certificate-preview", { waitUntil: "networkidle" });
    await expect(page.locator("[data-cert-template]")).toBeVisible();

    // Structural signature = tag + class skeleton of the template, ignoring text.
    const signature = () =>
      page.evaluate(() => {
        const root = document.querySelector("[data-cert-template]");
        if (!root) return "";
        return Array.from(root.querySelectorAll("*"))
          .map((el) => `${el.tagName}.${(el.getAttribute("class") || "").trim()}`)
          .join("|");
      });

    const fieldText = (field: string) =>
      page.locator(`[data-cert-field="${field}"]`).innerText();

    const select = page.getByTestId("tier-preview");
    const options = await select.locator("option").all();
    expect(options.length, "need at least two tiers to compare").toBeGreaterThan(1);

    const firstValue = await options[0].getAttribute("value");
    const secondValue = await options[1].getAttribute("value");

    await select.selectOption(firstValue!);
    const sigA = await signature();
    const tierA = await fieldText("tier");

    await select.selectOption(secondValue!);
    const sigB = await signature();
    const tierB = await fieldText("tier");

    // Branding/layout must be byte-for-byte identical between tiers...
    expect(sigB).toBe(sigA);
    // ...while the tier field genuinely changes.
    expect(tierB).not.toBe(tierA);
  });
});

test.describe("QR verification auto-load", () => {
  // A well-formed but (statistically) unknown token: 48 hex chars. Produces a
  // deterministic "no matching certificate" verdict — perfect for asserting the
  // page auto-verifies and resolves to an expected result without any click.
  const UNKNOWN_TOKEN = "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4";

  test("scanning the QR link auto-verifies without clicking Verify", async ({ page }) => {
    // Build the exact URL the exported certificate's QR encodes (token + checksum).
    const { url } = buildVerificationUrl("http://localhost", UNKNOWN_TOKEN);
    const path = url.replace(/^https?:\/\/[^/]+/, "");

    await page.goto(path);

    // The verdict (result OR error) must appear on its own — we never click Verify.
    const verdict = page.locator('[data-testid="verify-result"], [data-testid="verify-error"]');
    await expect(verdict.first()).toBeVisible({ timeout: 15_000 });

    // The loading skeleton must NOT still be on screen (never stuck spinning).
    await expect(page.getByTestId("verify-skeleton")).toHaveCount(0);

    // For an unknown-but-valid token the expected result is a "no match" notice.
    const errorPanel = page.getByTestId("verify-error");
    await expect(errorPanel).toBeVisible();
    await expect(errorPanel).toHaveAttribute("data-error-kind", "notfound");
  });

  test("auto-verify still resolves after a hard refresh (never stuck)", async ({ page }) => {
    const { url } = buildVerificationUrl("http://localhost", UNKNOWN_TOKEN);
    const path = url.replace(/^https?:\/\/[^/]+/, "");

    await page.goto(path, { waitUntil: "networkidle" });
    await page.reload({ waitUntil: "networkidle" });

    const verdict = page.locator('[data-testid="verify-result"], [data-testid="verify-error"]');
    await expect(verdict.first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("verify-skeleton")).toHaveCount(0);
  });

  test("tampered checksum is rejected with a clear message", async ({ page }) => {
    // Same token, deliberately wrong checksum → integrity failure before any DB hit.
    await page.goto(`/verify?token=${UNKNOWN_TOKEN}&c=deadbeef`);

    const errorPanel = page.getByTestId("verify-error");
    await expect(errorPanel).toBeVisible({ timeout: 10_000 });
    await expect(errorPanel).toHaveAttribute("data-error-kind", "checksum");
    // A tampered link is not retryable as-is, so no "Try again" button.
    await expect(page.getByTestId("verify-retry")).toHaveCount(0);
  });

  test("malformed token shows a format error, not a server error", async ({ page }) => {
    await page.goto("/verify?token=not-a-valid-token");

    const errorPanel = page.getByTestId("verify-error");
    await expect(errorPanel).toBeVisible({ timeout: 10_000 });
    await expect(errorPanel).toHaveAttribute("data-error-kind", "format");
  });

  test("unknown token offers a retry option", async ({ page }) => {
    await page.goto(`/verify?token=${UNKNOWN_TOKEN}`);
    await expect(page.getByTestId("verify-error")).toBeVisible({ timeout: 15_000 });
    // The not-found case is retryable.
    await expect(page.getByTestId("verify-retry")).toBeVisible();
  });
});

