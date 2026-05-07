import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import {
  ARTISTIC_DISCIPLINES, ZM_PROVINCES, formatZmw,
  isValidNrc, isValidTpin, isValidZmPhone,
} from "@/lib/nama";
import type { MembershipCategory } from "@/lib/nama";
import { fetchCategories, fetchMyMember, createMember } from "@/lib/nama-api";
import { toast } from "sonner";

export const Route = createFileRoute("/app/register")({
  component: RegisterPage,
  head: () => ({
    meta: [
      { title: "Register — NAMA member portal" },
      { name: "description", content: "Complete your NAMA member profile and pick your annual tier." },
    ],
  }),
  errorComponent: ({ error }) => {
    console.error('Registration page error:', error);
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center px-6">
        <div className="text-center">
          <h1 className="text-2xl text-foreground mb-4">Registration Error</h1>
          <p className="text-muted-foreground mb-4">Something went wrong loading the registration form.</p>
          <p className="text-sm text-muted-foreground">Error: {error.message}</p>
          <Link to="/app" className="mt-4 inline-block text-brass hover:text-brass/80">
            ← Back to dashboard
          </Link>
        </div>
      </div>
    );
  },
});

interface FormState {
  full_name: string;
  nrc_number: string;
  tpin: string;
  phone_number: string;
  artistic_discipline: string;
  province: string;
  city: string;
  years_experience: string;
  bio: string;
  institution_name: string;
  membership_category_id: string;
}

const initial: FormState = {
  full_name: "",
  nrc_number: "",
  tpin: "",
  phone_number: "",
  artistic_discipline: ARTISTIC_DISCIPLINES[0],
  province: ZM_PROVINCES[0],
  city: "",
  years_experience: "0",
  bio: "",
  institution_name: "",
  membership_category_id: "",
};

const STEPS = ["Identity", "Practice", "Tier"] as const;

function RegisterPage() {
  console.log('RegisterPage component mounted!');
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(initial);
  const [categories, setCategories] = useState<MembershipCategory[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [bootstrapped, setBootstrapped] = useState(false);

  console.log('RegisterPage: Initial state - authLoading=', authLoading, 'user=', !!user, 'bootstrapped=', bootstrapped);

  useEffect(() => {
    console.log('RegisterPage: useEffect triggered - authLoading=', authLoading, 'user=', !!user);
    if (authLoading) {
      console.log('RegisterPage: Still loading auth...');
      return;
    }
    if (!user) { 
      console.log('RegisterPage: No user found, redirecting to login');
      navigate({ to: "/login" }); 
      return; 
    }
    let cancelled = false;
    (async () => {
      try {
        const [cats, existing] = await Promise.all([
          fetchCategories(),
          fetchMyMember(user.id),
        ]);
        if (cancelled) return;
        setCategories(cats);
        if (existing) {
          // Already registered → go to dashboard
          navigate({ to: "/app" });
          return;
        }
        setForm((f) => ({
          ...f,
          full_name: (user.user_metadata?.full_name as string | undefined) ?? f.full_name,
          membership_category_id: cats[0]?.id ?? "",
        }));
      } catch (e) {
        console.error(e);
        toast.error("Could not load registration form");
      } finally {
        if (!cancelled) setBootstrapped(true);
      }
    })();
    return () => { cancelled = true; };
  }, [user, authLoading, navigate]);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const selectedCategory = useMemo(
    () => categories.find((c) => c.id === form.membership_category_id) ?? null,
    [categories, form.membership_category_id],
  );

  const stepValid = useMemo(() => {
    if (step === 0) {
      return (
        form.full_name.trim().length > 1 &&
        isValidNrc(form.nrc_number) &&
        (form.tpin.trim() === "" || isValidTpin(form.tpin)) &&
        isValidZmPhone(form.phone_number)
      );
    }
    if (step === 1) {
      return (
        !!form.artistic_discipline &&
        !!form.province &&
        form.city.trim().length > 1 &&
        Number(form.years_experience) >= 0
      );
    }
    if (step === 2) {
      return (
        !!form.membership_category_id &&
        (!selectedCategory?.requires_institution || form.institution_name.trim().length > 1)
      );
    }
    return false;
  }, [step, form, selectedCategory]);

  const handleNext = () => {
    if (!stepValid) return;
    if (step < STEPS.length - 1) setStep(step + 1);
  };

  const handleSubmit = async () => {
    if (!user || !stepValid || !selectedCategory) return;
    setSubmitting(true);
    try {
      await createMember(user.id, {
        full_name: form.full_name.trim(),
        nrc_number: form.nrc_number.trim(),
        tpin: form.tpin.trim() || null,
        phone_number: form.phone_number.trim(),
        artistic_discipline: form.artistic_discipline,
        province: form.province,
        city: form.city.trim(),
        years_experience: Number(form.years_experience) || 0,
        bio: form.bio.trim() || null,
        institution_name: selectedCategory.requires_institution
          ? form.institution_name.trim()
          : (form.institution_name.trim() || null),
        membership_category_id: form.membership_category_id,
      });
      toast.success("Profile submitted — let's complete payment");
      navigate({ to: "/app/pay" });
    } catch (e) {
      console.error(e);
      toast.error("Could not save your profile");
    } finally {
      setSubmitting(false);
    }
  };

  console.log('RegisterPage: Rendering check - authLoading=', authLoading, 'bootstrapped=', bootstrapped);
  if (authLoading || !bootstrapped) {
    console.log('RegisterPage: Showing loading spinner - authLoading=', authLoading, 'bootstrapped=', bootstrapped);
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-5 h-5 text-brass animate-spin mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            {authLoading ? 'Checking authentication...' : 'Loading registration form...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper text-foreground">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <Link to="/app" className="inline-flex items-center gap-2 text-[12px] text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to dashboard
        </Link>

        <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-brass">— Member registration</p>
        <h1 className="mt-3 font-serif text-3xl sm:text-4xl text-foreground tracking-tight" style={{ lineHeight: "1.1" }}>
          Tell us who you are.
        </h1>

        {/* Stepper */}
        <div className="mt-10 flex items-center gap-3">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-3 flex-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-medium border ${
                i < step ? "bg-brass border-brass text-ink" :
                i === step ? "bg-foreground text-paper border-foreground" :
                "bg-paper border-border text-muted-foreground"
              }`}>
                {i < step ? <CheckCircle2 className="w-3.5 h-3.5" /> : i + 1}
              </div>
              <p className={`text-[12px] uppercase tracking-[0.15em] ${i === step ? "text-foreground" : "text-muted-foreground"}`}>{s}</p>
              {i < STEPS.length - 1 && <div className="flex-1 h-px bg-border" />}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="mt-8 bg-card border border-border rounded-sm p-6 sm:p-8">
          {step === 0 && <StepIdentity form={form} update={update} />}
          {step === 1 && <StepPractice form={form} update={update} />}
          {step === 2 && (
            <StepTier
              form={form} update={update}
              categories={categories} selectedCategory={selectedCategory}
            />
          )}
        </div>

        {/* Nav buttons */}
        <div className="mt-6 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => step > 0 && setStep(step - 1)}
            disabled={step === 0}
            className="inline-flex items-center gap-2 rounded-sm border border-border bg-paper px-5 py-3 text-sm text-foreground hover:bg-card disabled:opacity-40 disabled:pointer-events-none"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={handleNext}
              disabled={!stepValid}
              className="inline-flex items-center gap-2 rounded-sm bg-foreground text-paper px-7 py-3 text-sm font-semibold hover:bg-foreground/90 disabled:opacity-40 disabled:pointer-events-none"
            >
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!stepValid || submitting}
              className="inline-flex items-center gap-2 rounded-sm bg-brass text-ink px-7 py-3 text-sm font-semibold hover:bg-brass/90 disabled:opacity-40 disabled:pointer-events-none"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              {submitting ? "Saving…" : "Submit & pay"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Steps ── */

function FieldLabel({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{children}</span>
      {hint && <span className="block text-[11px] text-muted-foreground/60 mt-0.5">{hint}</span>}
    </label>
  );
}

function inputCls(invalid?: boolean) {
  return `mt-2 w-full rounded-sm border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brass focus:border-transparent transition-all ${
    invalid ? "border-destructive" : "border-input"
  }`;
}

function StepIdentity({
  form, update,
}: { form: FormState; update: <K extends keyof FormState>(k: K, v: FormState[K]) => void }) {
  const nrcInvalid = form.nrc_number.length > 0 && !isValidNrc(form.nrc_number);
  const tpinInvalid = form.tpin.length > 0 && !isValidTpin(form.tpin);
  const phoneInvalid = form.phone_number.length > 0 && !isValidZmPhone(form.phone_number);
  return (
    <div className="space-y-5">
      <FieldLabel>Full legal name
        <input
          value={form.full_name}
          onChange={(e) => update("full_name", e.target.value)}
          placeholder="As it appears on your NRC"
          className={inputCls()}
        />
      </FieldLabel>
      <div className="grid sm:grid-cols-2 gap-5">
        <FieldLabel hint="Format: 123456/12/1">NRC number
          <input
            value={form.nrc_number}
            onChange={(e) => update("nrc_number", e.target.value)}
            placeholder="123456/12/1"
            className={inputCls(nrcInvalid)}
          />
        </FieldLabel>
        <FieldLabel hint="Optional · 10 digits">ZRA TPIN
          <input
            value={form.tpin}
            onChange={(e) => update("tpin", e.target.value.replace(/\D/g, "").slice(0, 10))}
            placeholder="1000123456"
            className={inputCls(tpinInvalid)}
          />
        </FieldLabel>
      </div>
      <FieldLabel hint="Used for mobile-money payments">Mobile number
        <input
          value={form.phone_number}
          onChange={(e) => update("phone_number", e.target.value)}
          placeholder="+260 977 123 456"
          className={inputCls(phoneInvalid)}
        />
      </FieldLabel>
    </div>
  );
}

function StepPractice({
  form, update,
}: { form: FormState; update: <K extends keyof FormState>(k: K, v: FormState[K]) => void }) {
  return (
    <div className="space-y-5">
      <div className="grid sm:grid-cols-2 gap-5">
        <FieldLabel>Discipline
          <select
            value={form.artistic_discipline}
            onChange={(e) => update("artistic_discipline", e.target.value)}
            className={inputCls()}
          >
            {ARTISTIC_DISCIPLINES.map((d) => <option key={d}>{d}</option>)}
          </select>
        </FieldLabel>
        <FieldLabel>Years of experience
          <input
            type="number" min={0} max={80}
            value={form.years_experience}
            onChange={(e) => update("years_experience", e.target.value)}
            className={inputCls()}
          />
        </FieldLabel>
      </div>
      <div className="grid sm:grid-cols-2 gap-5">
        <FieldLabel>Province
          <select
            value={form.province}
            onChange={(e) => update("province", e.target.value)}
            className={inputCls()}
          >
            {ZM_PROVINCES.map((p) => <option key={p}>{p}</option>)}
          </select>
        </FieldLabel>
        <FieldLabel>City / town
          <input
            value={form.city}
            onChange={(e) => update("city", e.target.value)}
            placeholder="Lusaka"
            className={inputCls()}
          />
        </FieldLabel>
      </div>
      <FieldLabel hint="Optional · 280 chars">Short bio
        <textarea
          value={form.bio}
          onChange={(e) => update("bio", e.target.value.slice(0, 280))}
          rows={3}
          placeholder="A line about your work that will appear on your member profile."
          className={inputCls()}
        />
      </FieldLabel>
    </div>
  );
}

function StepTier({
  form, update, categories, selectedCategory,
}: {
  form: FormState;
  update: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
  categories: MembershipCategory[];
  selectedCategory: MembershipCategory | null;
}) {
  return (
    <div className="space-y-5">
      <div className="grid sm:grid-cols-2 gap-3">
        {categories.map((c) => {
          const selected = c.id === form.membership_category_id;
          return (
            <button
              type="button"
              key={c.id}
              onClick={() => update("membership_category_id", c.id)}
              className={`text-left rounded-sm border p-4 transition-colors ${
                selected
                  ? "border-brass bg-brass/10"
                  : "border-border bg-paper hover:bg-card"
              }`}
            >
              <div className="flex items-baseline justify-between gap-2">
                <p className="font-serif text-lg text-foreground">{c.name}</p>
                <p className="font-serif text-base text-brass">{formatZmw(c.annual_fee_zmw)}</p>
              </div>
              <p className="text-[12px] text-muted-foreground mt-1">{c.description}</p>
            </button>
          );
        })}
      </div>

      {selectedCategory?.requires_institution && (
        <FieldLabel>Institution name
          <input
            value={form.institution_name}
            onChange={(e) => update("institution_name", e.target.value)}
            placeholder="Registered company / production house"
            className={inputCls()}
          />
        </FieldLabel>
      )}
    </div>
  );
}
