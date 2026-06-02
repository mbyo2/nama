import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Mail, Phone, MapPin, Clock, HelpCircle, Users, CreditCard, FileText } from "lucide-react";

export const Route = createFileRoute("/help")({
  component: HelpPage,
  head: () => ({
    meta: [
      { title: "Help & Support — NAMA" },
    ],
  }),
});

function HelpPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-paper text-foreground">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <button
          onClick={() => navigate({ to: "/app" })}
          className="inline-flex items-center gap-2 text-[12px] text-muted-foreground hover:text-foreground mb-8"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to dashboard
        </button>

        <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-brass">— Help Center</p>
        <h1 className="mt-3 font-serif text-3xl sm:text-4xl text-foreground tracking-tight" style={{ lineHeight: "1.1" }}>
          How can we help you?
        </h1>

        <div className="mt-8 grid lg:grid-cols-3 gap-8">
          {/* Quick Help */}
          <div className="lg:col-span-2 space-y-8">
            {/* Registration Help */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-brass/15 flex items-center justify-center">
                  <Users className="w-5 h-5 text-brass" />
                </div>
                <h2 className="text-xl font-semibold text-foreground">Registration & Membership</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-foreground mb-2">How do I register as a NAMA member?</h3>
                  <p className="text-sm text-muted-foreground">
                    Click "Begin Registration" on your dashboard, fill in your personal details, artistic discipline, and select your membership category. After registration, proceed to payment to activate your membership.
                  </p>
                </div>
                <div>
                  <h3 className="font-medium text-foreground mb-2">What are the membership categories?</h3>
                  <p className="text-sm text-muted-foreground">
                    NAMA offers different membership tiers with varying benefits and fees. Categories include Student, Professional, and Institutional memberships. Choose the one that best fits your status.
                  </p>
                </div>
                <div>
                  <h3 className="font-medium text-foreground mb-2">What documents do I need?</h3>
                  <p className="text-sm text-muted-foreground">
                    You'll need your NRC number, valid phone number, and details about your artistic discipline. No additional documents are required for initial registration.
                  </p>
                </div>
              </div>
            </section>

            {/* Payment Help */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-brass/15 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-brass" />
                </div>
                <h2 className="text-xl font-semibold text-foreground">Payments & Billing</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-foreground mb-2">What payment methods are accepted?</h3>
                  <p className="text-sm text-muted-foreground">
                    We accept mobile money payments from MTN, Airtel, and Zamtel. Select your provider and enter your mobile number to receive an STK prompt for payment authorization.
                  </p>
                </div>
                <div>
                  <h3 className="font-medium text-foreground mb-2">Is my payment secure?</h3>
                  <p className="text-sm text-muted-foreground">
                    Yes, all payments are processed through secure mobile money networks. We do not store your payment details, and transactions are encrypted.
                  </p>
                </div>
                <div>
                  <h3 className="font-medium text-foreground mb-2">Can I get a refund?</h3>
                  <p className="text-sm text-muted-foreground">
                    Membership fees are generally non-refundable once processed. However, if you believe there was an error, please contact NAMA administration immediately.
                  </p>
                </div>
              </div>
            </section>

            {/* Certificate Help */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-brass/15 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-brass" />
                </div>
                <h2 className="text-xl font-semibold text-foreground">Certificates & Verification</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-foreground mb-2">When do I receive my certificate?</h3>
                  <p className="text-sm text-muted-foreground">
                    Your NAMA certificate is issued immediately after successful payment completion. You can view and download it from your dashboard.
                  </p>
                </div>
                <div>
                  <h3 className="font-medium text-foreground mb-2">How can people verify my membership?</h3>
                  <p className="text-sm text-muted-foreground">
                    Anyone can verify your NAMA membership using your certificate number on our public verification page at namazambia.org/verify.
                  </p>
                </div>
                <div>
                  <h3 className="font-medium text-foreground mb-2">What if my certificate is lost?</h3>
                  <p className="text-sm text-muted-foreground">
                    You can always access your certificate from your dashboard. If you need a physical copy, contact NAMA administration for assistance.
                  </p>
                </div>
              </div>
            </section>
          </div>

          {/* Contact Info */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              <div className="bg-card border border-border rounded-sm p-6">
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-brass" />
                  Need More Help?
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Mail className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Email Support</p>
                      <p className="text-xs text-muted-foreground">info@namazambia.org</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Phone Support</p>
                      <p className="text-xs text-muted-foreground">+260 211 123456</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Office Hours</p>
                      <p className="text-xs text-muted-foreground">Mon-Fri: 9:00 AM - 5:00 PM</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Response Time</p>
                      <p className="text-xs text-muted-foreground">Usually within 24 hours</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-card border border-border rounded-sm p-6">
                <h3 className="font-semibold text-foreground mb-3">Quick Links</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => navigate({ to: "/register" })}
                    className="block w-full text-left text-sm text-brass hover:text-brass/80"
                  >
                    → Register as Member
                  </button>
                  <button
                    onClick={() => navigate({ to: "/verify" })}
                    className="block w-full text-left text-sm text-brass hover:text-brass/80"
                  >
                    → Verify Membership
                  </button>
                  <button
                    onClick={() => navigate({ to: "/app" })}
                    className="block w-full text-left text-sm text-brass hover:text-brass/80"
                  >
                    → Member Dashboard
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
