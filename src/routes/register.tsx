import { createFileRoute, useNavigate } from "@tanstack/react-router";
import React, { useState } from "react";
import { ArrowLeft, ArrowRight, User, ShieldCheck, FileText, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { createMember, fetchCategories } from "@/lib/nama-api";
import { toast } from "sonner";

export const Route = createFileRoute("/register")({
  component: RegisterPage,
  head: () => ({
    meta: [
      { title: "Registration — NAMA" },
    ],
  }),
});

function RegisterPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    full_name: "",
    nrc_number: "",
    phone_number: "",
    artistic_discipline: "",
    province: "",
    city: "",
    years_experience: "0",
    membership_category_id: ""
  });

  // Load categories on mount
  React.useEffect(() => {
    fetchCategories().then(setCategories).catch(console.error);
  }, []);

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error("You must be logged in to register");
      return;
    }

    if (!formData.membership_category_id) {
      toast.error("Please select a membership category");
      return;
    }

    setSubmitting(true);
    try {
      await createMember(user.id, {
        full_name: formData.full_name,
        nrc_number: formData.nrc_number,
        tpin: null,
        phone_number: formData.phone_number,
        artistic_discipline: formData.artistic_discipline,
        province: formData.province,
        city: formData.city,
        years_experience: parseInt(formData.years_experience),
        bio: null,
        institution_name: null,
        membership_category_id: formData.membership_category_id
      });

      toast.success("Registration submitted successfully!");
      setTimeout(() => {
        window.location.href = '/pay';
      }, 2000);
    } catch (error: any) {
      console.error("Registration error:", error);
      toast.error(error.message || "Registration failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const steps = [
    { title: "Identity", icon: User },
    { title: "Practice", icon: ShieldCheck },
    { title: "Tier", icon: FileText }
  ];

  return (
    <div className="min-h-screen bg-paper text-foreground">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <button
          onClick={() => window.location.href = '/app'}
          className="inline-flex items-center gap-2 text-[12px] text-muted-foreground hover:text-foreground mb-8"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to dashboard
        </button>

        <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-brass">— Simple Registration</p>
        <h1 className="mt-3 font-serif text-3xl sm:text-4xl text-foreground tracking-tight" style={{ lineHeight: "1.1" }}>
          Tell us who you are.
        </h1>
        <p className="mt-5 text-muted-foreground">
          This simplified form will get you registered without the complex checks.
        </p>

        {/* Step indicator */}
        <div className="mt-8 flex items-center gap-2">
          {steps.map((s, i) => (
            <div key={s.title} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                i <= step ? "bg-brass text-ink" : "bg-border text-muted-foreground"
              }`}>
                {i < step ? "✓" : i + 1}
              </div>
              <span className={`ml-2 text-xs ${i <= step ? `text-foreground` : `text-muted-foreground`}`}>
                {s.title}
              </span>
              {i < steps.length - 1 && <div className="w-8 h-px bg-border mx-2" />}
            </div>
          ))}
        </div>

        {/* Form content */}
        <div className="mt-8">
          {step === 0 && (
            <div className="space-y-5">
              <div>
                <label className="block text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-2">
                  Full legal name
                </label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => updateField("full_name", e.target.value)}
                  placeholder="As it appears on your NRC"
                  className="w-full rounded-sm border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brass focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-2">
                  NRC number
                </label>
                <input
                  type="text"
                  value={formData.nrc_number}
                  onChange={(e) => updateField("nrc_number", e.target.value)}
                  placeholder="123456/78/9"
                  className="w-full rounded-sm border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brass focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-2">
                  Phone number
                </label>
                <input
                  type="tel"
                  value={formData.phone_number}
                  onChange={(e) => updateField("phone_number", e.target.value)}
                  placeholder="+260 97 123 4567"
                  className="w-full rounded-sm border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brass focus:border-transparent"
                />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label className="block text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-2">
                  Artistic discipline
                </label>
                <select
                  value={formData.artistic_discipline}
                  onChange={(e) => updateField("artistic_discipline", e.target.value)}
                  className="w-full rounded-sm border border-input bg-background px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brass focus:border-transparent"
                >
                  <option value="">Select discipline</option>
                  <option value="filmmaker">Filmmaker</option>
                  <option value="actor">Actor</option>
                  <option value="director">Director</option>
                  <option value="producer">Producer</option>
                  <option value="writer">Writer</option>
                  <option value="photographer">Photographer</option>
                  <option value="musician">Musician</option>
                  <option value="broadcaster">Broadcaster</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-2">
                  Years of experience
                </label>
                <select
                  value={formData.years_experience}
                  onChange={(e) => updateField("years_experience", e.target.value)}
                  className="w-full rounded-sm border border-input bg-background px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brass focus:border-transparent"
                >
                  <option value="0">Less than 1 year</option>
                  <option value="1">1-2 years</option>
                  <option value="3">3-5 years</option>
                  <option value="6">6-10 years</option>
                  <option value="11">11-15 years</option>
                  <option value="16">16-20 years</option>
                  <option value="21">More than 20 years</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-2">
                  Province
                </label>
                <select
                  value={formData.province}
                  onChange={(e) => updateField("province", e.target.value)}
                  className="w-full rounded-sm border border-input bg-background px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brass focus:border-transparent"
                >
                  <option value="">Select province</option>
                  <option value="central">Central</option>
                  <option value="copperbelt">Copperbelt</option>
                  <option value="eastern">Eastern</option>
                  <option value="luapula">Luapula</option>
                  <option value="lusaka">Lusaka</option>
                  <option value="muchinga">Muchinga</option>
                  <option value="northern">Northern</option>
                  <option value="northwestern">Northwestern</option>
                  <option value="southern">Southern</option>
                  <option value="western">Western</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-2">
                  City
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => updateField("city", e.target.value)}
                  placeholder="Lusaka"
                  className="w-full rounded-sm border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brass focus:border-transparent"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div>
                <label className="block text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-2">
                  Membership Category
                </label>
                <div className="space-y-3">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => updateField("membership_category_id", category.id)}
                      className={`w-full text-left rounded-sm border p-4 transition-colors ${
                        formData.membership_category_id === category.id
                          ? "border-brass bg-brass/10"
                          : "border-border bg-paper hover:bg-card"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-foreground">{category.name}</p>
                          <p className="text-sm text-muted-foreground">{category.description}</p>
                        </div>
                        <p className="font-semibold text-brass">K{category.annual_fee_zmw}/year</p>
                      </div>
                    </button>
                  ))}
                  {categories.length === 0 && (
                    <p className="text-sm text-muted-foreground">Loading membership categories...</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation buttons */}
        <div className="mt-10 flex justify-between">
          <button
            onClick={() => setStep(step - 1)}
            disabled={step === 0}
            className="px-6 py-3 text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          {step < steps.length - 1 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="inline-flex items-center gap-2 rounded-sm bg-brass text-ink px-7 py-4 text-sm font-semibold hover:bg-brass/90 transition-all active:scale-[0.98]"
            >
              Next <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-sm bg-brass text-ink px-7 py-4 text-sm font-semibold hover:bg-brass/90 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  Submit Registration
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
