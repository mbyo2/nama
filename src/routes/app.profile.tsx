import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Loader2, Save, Lock } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { fetchMyMember, updateMyMember } from "@/lib/nama-api";
import {
  ARTISTIC_DISCIPLINES, ZM_PROVINCES, isValidTpin, isValidZmPhone,
} from "@/lib/nama";
import type { Member } from "@/lib/nama";
import { toast } from "sonner";

export const Route = createFileRoute("/app/profile")({
  component: ProfilePage,
  head: () => ({
    meta: [
      { title: "Edit profile — NAMA member portal" },
      { name: "description", content: "Update your NAMA member profile details." },
      { name: "robots", content: "noindex" },
    ],
  }),
});

function ProfilePage() {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [member, setMember] = useState<Member | null>(null);
  const [bootstrapped, setBootstrapped] = useState(false);
  const [saving, setSaving] = useState(false);

  // editable fields
  const [tpin, setTpin] = useState("");
  const [phone, setPhone] = useState("");
  const [discipline, setDiscipline] = useState<string>(ARTISTIC_DISCIPLINES[0]);
  const [province, setProvince] = useState<string>(ZM_PROVINCES[0]);
  const [city, setCity] = useState("");
  const [years, setYears] = useState("0");
  const [bio, setBio] = useState("");
  const [institution, setInstitution] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate({ to: "/login" }); return; }
    (async () => {
      try {
        const m = await fetchMyMember(user.id);
        if (!m) { navigate({ to: "/app/register" }); return; }
        setMember(m);
        setTpin(m.tpin ?? "");
        setPhone(m.phone_number);
        setDiscipline(m.artistic_discipline);
        setProvince(m.province);
        setCity(m.city);
        setYears(String(m.years_experience));
        setBio(m.bio ?? "");
        setInstitution(m.institution_name ?? "");
      } catch (e) {
        console.error(e);
        toast.error("Could not load your profile");
      } finally {
        setBootstrapped(true);
      }
    })();
  }, [user, authLoading, navigate]);

  const tpinInvalid = tpin.trim() !== "" && !isValidTpin(tpin);
  const phoneInvalid = phone.trim() !== "" && !isValidZmPhone(phone);
  const valid = useMemo(
    () => !tpinInvalid && isValidZmPhone(phone) && city.trim().length > 1,
    [tpinInvalid, phone, city],
  );

  const handleSave = async () => {
    if (!member || !valid) return;
    setSaving(true);
    try {
      await updateMyMember(member.id, {
        tpin: tpin.trim() || null,
        phone_number: phone.trim(),
        artistic_discipline: discipline,
        province,
        city: city.trim(),
        years_experience: Number(years) || 0,
        bio: bio.trim() || null,
        institution_name: institution.trim() || null,
      });
      toast.success("Profile updated");
      navigate({ to: "/app" });
    } catch (e) {
      console.error(e);
      toast.error("Could not save your profile");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || !bootstrapped) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <Loader2 className="w-5 h-5 text-brass animate-spin" />
      </div>
    );
  }
  if (!member) return null;

  return (
    <div className="min-h-screen bg-paper text-foreground">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <Link to="/app" className="inline-flex items-center gap-2 text-[12px] text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to dashboard
        </Link>

        <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-brass">— Edit profile</p>
        <h1 className="mt-3 font-serif text-3xl sm:text-4xl text-foreground tracking-tight" style={{ lineHeight: "1.1" }}>
          Keep your details current.
        </h1>

        <div className="mt-8 bg-card border border-border rounded-sm p-6 sm:p-8 space-y-5">
          {/* Locked: name + NRC */}
          <div className="grid sm:grid-cols-2 gap-5">
            <Locked label="Full legal name" value={member.full_name} />
            <Locked label="NRC number" value={member.nrc_number} mono />
          </div>

          <Field label="ZRA TPIN" hint="Optional · 10 digits">
            <input
              value={tpin}
              onChange={(e) => setTpin(e.target.value.replace(/\D/g, "").slice(0, 10))}
              placeholder="1000123456"
              className={inputCls(tpinInvalid)}
            />
          </Field>

          <Field label="Mobile number" hint="Used for mobile-money payments">
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+260 977 123 456"
              className={inputCls(phoneInvalid)}
            />
          </Field>

          <div className="grid sm:grid-cols-2 gap-5">
            <Field label="Discipline">
              <select value={discipline} onChange={(e) => setDiscipline(e.target.value)} className={inputCls()}>
                {ARTISTIC_DISCIPLINES.map((d) => <option key={d}>{d}</option>)}
              </select>
            </Field>
            <Field label="Years of experience">
              <input
                type="number" min={0} max={80}
                value={years}
                onChange={(e) => setYears(e.target.value)}
                className={inputCls()}
              />
            </Field>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            <Field label="Province">
              <select value={province} onChange={(e) => setProvince(e.target.value)} className={inputCls()}>
                {ZM_PROVINCES.map((p) => <option key={p}>{p}</option>)}
              </select>
            </Field>
            <Field label="City / town">
              <input value={city} onChange={(e) => setCity(e.target.value)} className={inputCls()} />
            </Field>
          </div>

          <Field label="Institution / company" hint="Optional">
            <input
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              className={inputCls()}
            />
          </Field>

          <Field label="Short bio" hint="Optional · 280 chars">
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, 280))}
              rows={3}
              className={inputCls()}
            />
          </Field>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <Link
            to="/app"
            className="inline-flex items-center gap-2 rounded-sm border border-border bg-paper px-5 py-3 text-sm text-foreground hover:bg-card"
          >
            Cancel
          </Link>
          <button
            type="button"
            onClick={handleSave}
            disabled={!valid || saving}
            className="inline-flex items-center gap-2 rounded-sm bg-brass text-ink px-7 py-3 text-sm font-semibold hover:bg-brass/90 disabled:opacity-40 disabled:pointer-events-none"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{label}</span>
      {hint && <span className="block text-[11px] text-muted-foreground/60 mt-0.5">{hint}</span>}
      {children}
    </label>
  );
}

function Locked({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-1.5">
        <Lock className="w-3 h-3" /> {label}
      </p>
      <p className={`mt-2 px-4 py-3 rounded-sm border border-dashed border-border bg-paper text-sm text-muted-foreground ${mono ? "font-mono" : ""}`}>
        {value}
      </p>
    </div>
  );
}

function inputCls(invalid?: boolean) {
  return `mt-2 w-full rounded-sm border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brass focus:border-transparent transition-all ${
    invalid ? "border-destructive" : "border-input"
  }`;
}
