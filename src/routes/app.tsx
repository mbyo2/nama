// Replaces the old habit-tracker `/app` page with the NAMA member dashboard.
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowRight, ShieldCheck, FileText, Clock, AlertCircle, LogOut,
  QrCode, User, Phone, Building2, MapPin, Sparkles, Crown,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import namaLogo from "@/assets/nama-logo.jpg";
import {
  fetchMyMember, fetchCategories, fetchMyCertificate,
} from "@/lib/nama-api";
import { formatZmw, membershipStatusLabel } from "@/lib/nama";
import type { Member, MembershipCategory, Certificate } from "@/lib/nama";
import { toast } from "sonner";

export const Route = createFileRoute("/app")({
  component: DashboardPage,
  head: () => ({
    meta: [
      { title: "Member dashboard — NAMA" },
      { name: "description", content: "Your NAMA membership dashboard — status, certificate, and renewals." },
    ],
  }),
});

function DashboardPage() {
  const { user, isLoading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [member, setMember] = useState<Member | null>(null);
  const [categories, setCategories] = useState<MembershipCategory[]>([]);
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate({ to: "/login" });
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const [m, c, cert, roles] = await Promise.all([
          fetchMyMember(user.id),
          fetchCategories(),
          fetchMyCertificate(user.id),
          supabase.from("user_roles").select("role").eq("user_id", user.id),
        ]);
        if (cancelled) return;
        setMember(m);
        setCategories(c);
        setCertificate(cert);
        setIsAdmin((roles.data ?? []).some((r) => r.role === "admin"));
      } catch (err) {
        console.error(err);
        toast.error("Could not load your dashboard");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user, authLoading, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/" });
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground text-sm">Loading your dashboard…</div>
      </div>
    );
  }

  const category = member ? categories.find((c) => c.id === member.membership_category_id) : null;

  return (
    <div className="min-h-screen bg-paper text-foreground">
      <DashboardHeader email={user?.email ?? ""} onSignOut={handleSignOut} isAdmin={isAdmin} />

      <main className="max-w-4xl mx-auto px-6 py-12">
        {!member ? (
          <NotRegistered />
        ) : (
          <RegisteredView
            member={member}
            category={category ?? null}
            certificate={certificate}
          />
        )}
      </main>
    </div>
  );
}

/* ── Header ── */
function DashboardHeader({ email, onSignOut, isAdmin }: { email: string; onSignOut: () => void; isAdmin: boolean }) {
  return (
    <header className="border-b border-border bg-paper">
      <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <img src={namaLogo} alt="NAMA logo" className="w-9 h-9 rounded-full object-cover" />
          <div className="leading-tight">
            <p className="font-serif text-foreground text-base font-semibold">NAMA</p>
            <p className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground">Member portal</p>
          </div>
        </Link>
        <div className="flex items-center gap-4">
          {isAdmin && (
            <Link to="/admin" className="inline-flex items-center gap-1.5 text-[12px] text-brass hover:text-brass/80">
              <Crown className="w-3.5 h-3.5" /> Admin
            </Link>
          )}
          <span className="hidden sm:inline text-[12px] text-muted-foreground truncate max-w-[180px]">{email}</span>
          <button
            onClick={onSignOut}
            className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign out
          </button>
        </div>
      </div>
    </header>
  );
}

/* ── Not registered ── */
function NotRegistered() {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-brass">— Welcome to NAMA</p>
      <h1 className="mt-3 font-serif text-4xl sm:text-5xl text-foreground tracking-tight" style={{ lineHeight: "1.1" }}>
        Let's get you on the<br /><em className="italic">national register.</em>
      </h1>
      <p className="mt-5 text-muted-foreground max-w-xl">
        You're signed in. The next step is to complete your member profile — NRC, TPIN, discipline, and tier — and pay your annual membership. Your certificate is issued the moment payment confirms.
      </p>

      <div className="mt-10 grid sm:grid-cols-3 gap-px bg-border">
        {[
          { icon: User, label: "Profile", desc: "NRC, TPIN, discipline, province" },
          { icon: ShieldCheck, label: "Tier", desc: "Pick the tier that matches your experience" },
          { icon: FileText, label: "Certificate", desc: "Issued the moment payment confirms" },
        ].map((s) => (
          <div key={s.label} className="bg-paper p-6">
            <s.icon className="w-5 h-5 text-brass mb-3" strokeWidth={1.5} />
            <p className="text-[11px] uppercase tracking-[0.2em] text-brass mb-1">{s.label}</p>
            <p className="text-[13px] text-muted-foreground">{s.desc}</p>
          </div>
        ))}
      </div>

      <Link
        to="/app/register"
        className="mt-10 inline-flex items-center gap-2 rounded-sm bg-brass text-ink px-7 py-4 text-sm font-semibold hover:bg-brass/90 transition-all active:scale-[0.98]"
      >
        Begin registration <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}

/* ── Registered view ── */
function RegisteredView({
  member, category, certificate,
}: {
  member: Member;
  category: MembershipCategory | null;
  certificate: Certificate | null;
}) {
  const isActive = member.status === "active";
  const isPending = member.status === "pending";
  const expiresOn = member.membership_expires_at
    ? new Date(member.membership_expires_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
    : null;

  return (
    <div className="space-y-10">
      {/* Status banner */}
      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-brass">— Member dashboard</p>
        <h1 className="mt-3 font-serif text-3xl sm:text-4xl text-foreground tracking-tight" style={{ lineHeight: "1.1" }}>
          {isActive ? <>Welcome, <em className="italic">{firstName(member.full_name)}.</em></> : "Almost there."}
        </h1>
      </div>

      {/* Status card */}
      <StatusCard member={member} category={category} certificate={certificate} expiresOn={expiresOn} />

      {/* Action panel */}
      {isPending && (
        <div className="rounded-sm border border-brass/40 bg-brass/5 p-6 sm:p-7 flex flex-col sm:flex-row items-start sm:items-center gap-5 justify-between">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-brass/15 flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5 text-brass" strokeWidth={1.8} />
            </div>
            <div>
              <p className="font-serif text-lg text-foreground">Payment pending</p>
              <p className="text-[13px] text-muted-foreground mt-1">
                Pay your annual {category?.name ?? "membership"} fee
                {category ? <> of <strong className="text-foreground">{formatZmw(category.annual_fee_zmw)}</strong></> : null} to activate your membership and issue your certificate.
              </p>
            </div>
          </div>
          <Link
            to="/app/pay"
            className="inline-flex items-center gap-2 rounded-sm bg-brass text-ink px-6 py-3.5 text-sm font-semibold hover:bg-brass/90 transition-all active:scale-[0.98] whitespace-nowrap"
          >
            Pay now <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {isActive && certificate && (
        <div className="rounded-sm border border-border bg-card p-6 sm:p-7 flex flex-col sm:flex-row items-start sm:items-center gap-5 justify-between">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-brass/15 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-brass" strokeWidth={1.8} />
            </div>
            <div>
              <p className="font-serif text-lg text-foreground">Your certificate is live</p>
              <p className="text-[13px] text-muted-foreground mt-1">
                Certificate <span className="font-mono text-foreground">{certificate.certificate_number}</span>
                {expiresOn ? <> · valid until {expiresOn}</> : null}
              </p>
            </div>
          </div>
          <Link
            to="/app/certificate"
            className="inline-flex items-center gap-2 rounded-sm bg-foreground text-paper px-6 py-3.5 text-sm font-semibold hover:bg-foreground/90 transition-all active:scale-[0.98] whitespace-nowrap"
          >
            View certificate <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {isActive && !certificate && (
        <div className="rounded-sm border border-destructive/30 bg-destructive/5 p-6 flex items-start gap-4">
          <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-serif text-base text-foreground">Certificate not issued</p>
            <p className="text-[13px] text-muted-foreground mt-1">
              Your membership is active but the certificate is missing. Visit the payment page to re-issue.
            </p>
          </div>
        </div>
      )}

      {/* Profile */}
      <ProfileCard member={member} />
    </div>
  );
}

function StatusCard({
  member, category, certificate, expiresOn,
}: {
  member: Member;
  category: MembershipCategory | null;
  certificate: Certificate | null;
  expiresOn: string | null;
}) {
  const isActive = member.status === "active";
  const dotColor = isActive ? "bg-success" : member.status === "pending" ? "bg-brass" : "bg-destructive";

  return (
    <div className="grid sm:grid-cols-4 gap-px bg-border">
      <Stat
        label="Status"
        value={
          <span className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${dotColor}`} />
            {membershipStatusLabel(member.status)}
          </span>
        }
      />
      <Stat label="Tier" value={category?.name ?? "—"} />
      <Stat label="Certificate" value={certificate ? "Issued" : "Not yet"} />
      <Stat label="Valid until" value={expiresOn ?? "—"} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="bg-paper p-5">
      <p className="text-[10px] uppercase tracking-[0.2em] text-brass mb-2">{label}</p>
      <p className="font-serif text-lg text-foreground">{value}</p>
    </div>
  );
}

function ProfileCard({ member }: { member: Member }) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-brass mb-4">— Member profile</p>
      <div className="grid sm:grid-cols-2 gap-px bg-border">
        <Field icon={User} label="Full name" value={member.full_name} />
        <Field icon={FileText} label="NRC" value={member.nrc_number} mono />
        <Field icon={FileText} label="TPIN" value={member.tpin ?? "—"} mono />
        <Field icon={Phone} label="Phone" value={member.phone_number} />
        <Field icon={QrCode} label="Discipline" value={member.artistic_discipline} />
        <Field icon={MapPin} label="Location" value={`${member.city}, ${member.province}`} />
        {member.institution_name && (
          <Field icon={Building2} label="Institution" value={member.institution_name} />
        )}
        <Field icon={Sparkles} label="Years experience" value={String(member.years_experience)} />
      </div>
    </div>
  );
}

function Field({
  icon: Icon, label, value, mono,
}: { icon: typeof User; label: string; value: string; mono?: boolean }) {
  return (
    <div className="bg-paper p-5 flex items-start gap-3">
      <Icon className="w-4 h-4 text-brass mt-0.5 flex-shrink-0" strokeWidth={1.5} />
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-1">{label}</p>
        <p className={`text-[14px] text-foreground truncate ${mono ? "font-mono" : ""}`}>{value}</p>
      </div>
    </div>
  );
}

function firstName(full: string): string {
  return full.split(" ")[0] || full;
}
