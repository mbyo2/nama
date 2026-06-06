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
