import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowRight, ShieldCheck, Award, Users, FileText, Smartphone,
  CheckCircle2, QrCode, Building2, GraduationCap, Star, Phone, Facebook,
  Calendar, MapPin, Mail, Target, Eye,
} from "lucide-react";
import heroBg from "@/assets/nama-hero.jpg";
import { formatZmw } from "@/lib/nama";
import {
  NATIONAL_EXECUTIVE, BLOG_POSTS, UPCOMING_EVENT,
  NAMA_MISSION, NAMA_VISION, NAMA_CONTACT_EMAIL,
} from "@/lib/nama-content";

export const Route = createFileRoute("/")({
  component: LandingPage,
  head: () => ({
    meta: [
      { title: "NAMA — National Association for Media Arts" },
      { name: "description", content: "The official membership and digital certification body for Zambian filmmakers, scriptwriters, actors, and media practitioners. Register, get certified, get recognised." },
    ],
  }),
});

function LandingPage() {
  const navigate = useNavigate();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    import("@/integrations/supabase/client").then(({ supabase }) => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          navigate({ to: "/app" });
        } else {
          setChecked(true);
        }
      });
    }).catch(() => setChecked(true));
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Hero />
      <Marquee />
      <MissionVision />
      <WhyRegister />
      <Tiers />
      <HowItWorks />
      <Team />
      <Blog />
      <Events />
      <Compliance />
      <FinalCTA />
      <Footer />
    </div>
  );
}

/* ─── Hero ─── */
function Hero() {
  return (
    <section className="relative min-h-[88vh] overflow-hidden" style={{ background: "#0a0907" }}>
      <img
        src={heroBg}
        alt=""
        width={1920}
        height={1280}
        className="absolute inset-0 w-full h-full object-cover object-right pointer-events-none select-none"
        aria-hidden="true"
      />
      <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(to right, rgba(10,9,7,0.92), rgba(10,9,7,0.55) 45%, transparent 75%)" }} />
      <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(to bottom, rgba(10,9,7,0.5), transparent 25%, rgba(10,9,7,0.6))" }} />

      {/* Navbar */}
      <nav className="relative z-20 max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-sm border border-brass/60 flex items-center justify-center">
            <span className="font-serif text-brass text-base font-bold tracking-tight">N</span>
          </div>
          <div className="leading-tight">
            <p className="font-serif text-white text-lg font-semibold tracking-tight">NAMA</p>
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/60">Media Arts · Zambia</p>
          </div>
        </Link>

        <div className="hidden md:flex items-center gap-8 text-[13px] text-white/80">
          <a href="#about" className="hover:text-white transition-colors">About</a>
          <a href="#tiers" className="hover:text-white transition-colors">Membership</a>
          <a href="#team" className="hover:text-white transition-colors">Team</a>
          <a href="#blog" className="hover:text-white transition-colors">Insights</a>
          <Link to="/verify" className="hover:text-white transition-colors">Verify</Link>
        </div>

        <Link
          to="/login"
          className="inline-flex items-center gap-2 rounded-sm border border-brass/70 bg-brass/10 text-white px-5 py-2.5 text-[13px] font-medium hover:bg-brass/20 backdrop-blur-sm transition-all"
        >
          Member portal
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </nav>

      {/* Hero copy */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 pt-20 pb-32 sm:pt-28">
        <div className="max-w-2xl">
          <p className="inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.25em] text-brass">
            <span className="block w-8 h-px bg-brass" />
            Established under NAC Act, Cap 170
          </p>

          <h1 className="mt-6 font-serif text-white text-5xl sm:text-6xl lg:text-7xl font-medium tracking-tight" style={{ lineHeight: "1.02" }}>
            The Zambian creator's<br />
            <em className="text-brass not-italic font-serif italic">recognised home.</em>
          </h1>

          <p className="mt-7 text-lg text-white/80 max-w-xl" style={{ lineHeight: "1.6" }}>
            The National Association for Media Arts is Zambia's umbrella body for filmmakers, scriptwriters, actors, and media practitioners. Register, get certified, and stand in the room where your work is recognised.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-3">
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 rounded-sm bg-brass text-[#0a0907] px-7 py-4 text-sm font-semibold hover:bg-brass/90 transition-all active:scale-[0.98]"
            >
              Begin registration
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/verify"
              className="inline-flex items-center justify-center gap-2 rounded-sm border border-white/25 bg-white/5 text-white px-7 py-4 text-sm font-medium hover:bg-white/10 backdrop-blur-sm transition-all"
            >
              <QrCode className="w-4 h-4" />
              Verify a certificate
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom credentials bar */}
      <div className="absolute bottom-0 left-0 right-0 border-t border-white/10 backdrop-blur-sm" style={{ background: "rgba(10,9,7,0.4)" }}>
        <div className="max-w-6xl mx-auto px-6 py-5 flex flex-wrap items-center justify-between gap-y-3 gap-x-8 text-[11px] text-white/70 uppercase tracking-[0.2em]">
          <span className="flex items-center gap-2"><ShieldCheck className="w-3.5 h-3.5 text-brass" /> ECT Act 2021 compliant</span>
          <span className="flex items-center gap-2"><FileText className="w-3.5 h-3.5 text-brass" /> NAC Cap 170 registered</span>
          <span className="flex items-center gap-2"><Smartphone className="w-3.5 h-3.5 text-brass" /> Mobile money payments</span>
          <span className="flex items-center gap-2"><Building2 className="w-3.5 h-3.5 text-brass" /> Hosted in Zambia</span>
        </div>
      </div>
    </section>
  );
}

/* ─── Marquee of disciplines ─── */
function Marquee() {
  const disciplines = [
    "Filmmakers", "Scriptwriters", "Actors", "Cinematographers", "Editors",
    "Sound designers", "Animators", "Documentarians", "Producers", "Voice artists",
    "Media journalists", "Directors",
  ];
  return (
    <section className="bg-ink text-paper border-y border-white/5 py-6 overflow-hidden">
      <div className="flex gap-12 whitespace-nowrap animate-marquee">
        {[...disciplines, ...disciplines].map((d, i) => (
          <span key={i} className="font-serif italic text-2xl text-paper/40 tracking-tight">
            {d} <span className="text-brass mx-6">·</span>
          </span>
        ))}
      </div>
    </section>
  );
}

/* ─── Why register ─── */
const benefits = [
  { icon: Award, title: "A certificate that opens doors", desc: "An advanced electronic signature certificate, legally valid under the ECT Act 2021. Producers, banks, and the NAC can verify it via QR code in seconds." },
  { icon: Users, title: "Stand united with Zambia's industry", desc: "International investors look for coordination. NAMA is the single point of truth for credentialed Zambian media artists." },
  { icon: ShieldCheck, title: "Your data, hosted in Zambia", desc: "Compliant with the Data Protection Act 2021. Your NRC, TPIN, and creative records never leave the country without your consent." },
  { icon: Star, title: "Eligibility for the Ngoma Awards", desc: "Only registered, verified members are nominated for Zambia's most prestigious arts recognition." },
];

function WhyRegister() {
  return (
    <section id="why" className="py-28 bg-paper">
      <div className="max-w-6xl mx-auto px-6">
        <div className="max-w-2xl mb-16">
          <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-brass">— Why register</p>
          <h2 className="mt-4 font-serif text-4xl sm:text-5xl text-foreground tracking-tight" style={{ lineHeight: "1.1" }}>
            Recognition is the<br />difference between<br /><em className="not-italic italic">working</em> and being seen.
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 gap-px bg-border">
          {benefits.map((b) => (
            <div key={b.title} className="bg-paper p-8 hover:bg-card transition-colors">
              <b.icon className="w-6 h-6 text-brass mb-5" strokeWidth={1.5} />
              <h3 className="font-serif text-xl text-foreground mb-2">{b.title}</h3>
              <p className="text-[14px] text-muted-foreground leading-relaxed">{b.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Membership tiers ─── */
const tiers = [
  { id: "student", name: "Student", fee: 100, eligibility: "Enrolled in accredited media studies", icon: GraduationCap },
  { id: "bronze", name: "Bronze", fee: 200, eligibility: "Practitioners with < 5 years experience", icon: null },
  { id: "silver", name: "Silver", fee: 300, eligibility: "Practitioners with 5–9 years experience", icon: null },
  { id: "gold", name: "Gold", fee: 500, eligibility: "Practitioners with 10+ years experience", icon: Award, featured: true },
  { id: "institutional", name: "Institutional", fee: 2000, eligibility: "Registered media houses & production companies", icon: Building2 },
  { id: "associate", name: "Associate", fee: 1000, eligibility: "Non-media organisations sharing arts values", icon: null },
];

function Tiers() {
  return (
    <section id="tiers" className="py-28 bg-ink text-paper">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div className="max-w-xl">
            <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-brass">— Membership tiers</p>
            <h2 className="mt-4 font-serif text-4xl sm:text-5xl tracking-tight" style={{ lineHeight: "1.1" }}>
              Annual membership,<br /><em className="italic">no hidden costs.</em>
            </h2>
          </div>
          <p className="text-paper/70 max-w-sm text-[14px] leading-relaxed">
            Fees support NAMA's affiliation with the National Arts Council, certificate issuance, and sector advocacy. Pay in Zambian Kwacha via mobile money.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-white/10">
          {tiers.map((t) => (
            <div
              key={t.id}
              className={`p-7 transition-colors ${t.featured ? "bg-brass text-ink" : "bg-ink hover:bg-[#13110d]"}`}
            >
              <div className="flex items-start justify-between mb-6">
                <div>
                  <p className={`text-[11px] uppercase tracking-[0.2em] mb-2 ${t.featured ? "text-ink/70" : "text-brass"}`}>{t.name}</p>
                  <p className="font-serif text-4xl font-medium">{formatZmw(t.fee)}</p>
                  <p className={`text-[11px] mt-1 ${t.featured ? "text-ink/60" : "text-paper/50"}`}>per year</p>
                </div>
                {t.icon && <t.icon className={`w-5 h-5 ${t.featured ? "text-ink" : "text-brass"}`} strokeWidth={1.5} />}
              </div>
              <p className={`text-[13px] leading-relaxed ${t.featured ? "text-ink/80" : "text-paper/70"}`}>{t.eligibility}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── How it works ─── */
const steps = [
  { num: "01", title: "Verify your identity", desc: "Submit your NRC and TPIN. We validate against Zambian formats and link your record to your legal identity." },
  { num: "02", title: "Choose your tier and pay", desc: "Pick the membership category that matches your experience. Pay annual fees via MTN MoMo, Airtel Money, or Zamtel Kwacha." },
  { num: "03", title: "Receive your certificate", desc: "An electronically signed PDF certificate with a unique QR code, issued the moment your payment confirms — verifiable for life." },
];

function HowItWorks() {
  return (
    <section id="how" className="py-28 bg-paper">
      <div className="max-w-5xl mx-auto px-6">
        <div className="mb-16">
          <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-brass">— How it works</p>
          <h2 className="mt-4 font-serif text-4xl sm:text-5xl text-foreground tracking-tight max-w-2xl" style={{ lineHeight: "1.1" }}>
            From application to<br />certificate in <em className="italic">minutes.</em>
          </h2>
        </div>

        <div className="space-y-px bg-border">
          {steps.map((s) => (
            <div key={s.num} className="bg-paper p-8 grid grid-cols-12 gap-6 items-start hover:bg-card transition-colors">
              <p className="col-span-2 sm:col-span-1 font-serif text-3xl text-brass">{s.num}</p>
              <div className="col-span-10 sm:col-span-4">
                <h3 className="font-serif text-2xl text-foreground">{s.title}</h3>
              </div>
              <p className="col-span-12 sm:col-span-7 text-[14px] text-muted-foreground leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Compliance / trust strip ─── */
function Compliance() {
  const items = [
    { label: "NAC Act Cap 170", desc: "Registered national association" },
    { label: "ECT Act 2021", desc: "Advanced electronic signatures" },
    { label: "Data Protection Act 2021", desc: "Privacy by design, hosted locally" },
    { label: "ZRA Smart Invoice", desc: "Fiscalised payment receipts" },
  ];
  return (
    <section className="py-20 bg-card border-y border-border">
      <div className="max-w-6xl mx-auto px-6">
        <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-brass mb-8">— Built on Zambian law</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-border">
          {items.map((it) => (
            <div key={it.label} className="bg-card p-6">
              <div className="flex items-center gap-2 mb-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-brass" />
                <p className="font-serif text-base text-foreground font-medium">{it.label}</p>
              </div>
              <p className="text-[12px] text-muted-foreground">{it.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Final CTA ─── */
function FinalCTA() {
  return (
    <section className="relative overflow-hidden py-32 bg-ink text-paper">
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <img src={heroBg} alt="" width={1920} height={1280} loading="lazy" className="w-full h-full object-cover" aria-hidden="true" />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/80 to-ink/40 pointer-events-none" />
      <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
        <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-brass">— Take your seat</p>
        <h2 className="mt-5 font-serif text-4xl sm:text-6xl tracking-tight" style={{ lineHeight: "1.05" }}>
          Every Zambian creator<br /><em className="italic">deserves a record.</em>
        </h2>
        <p className="mt-6 text-paper/70 max-w-md mx-auto">
          Register today and join the national directory of professionalised media artists.
        </p>
        <Link
          to="/login"
          className="mt-10 inline-flex items-center gap-2 rounded-sm bg-brass text-ink px-8 py-4 text-sm font-semibold hover:bg-brass/90 transition-all active:scale-[0.98]"
        >
          Begin registration
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}

/* ─── Mission / Vision ─── */
function MissionVision() {
  return (
    <section id="about" className="py-28 bg-paper border-b border-border">
      <div className="max-w-6xl mx-auto px-6">
        <div className="max-w-2xl mb-16">
          <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-brass">— About NAMA</p>
          <h2 className="mt-4 font-serif text-4xl sm:text-5xl text-foreground tracking-tight" style={{ lineHeight: "1.1" }}>
            One association, <em className="not-italic italic">ten provinces,</em><br />a single industry voice.
          </h2>
          <p className="mt-6 text-[15px] text-muted-foreground leading-relaxed max-w-xl">
            The National Association of Media Arts unites practitioners across Zambia's ten provinces — mandated to foster professionalism, industry formalization, capacity building, content creation, and stakeholder collaboration.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-px bg-border">
          <div className="bg-paper p-10">
            <Target className="w-6 h-6 text-brass mb-5" strokeWidth={1.5} />
            <p className="text-[11px] uppercase tracking-[0.25em] text-brass mb-3">Mission</p>
            <p className="font-serif text-2xl text-foreground leading-snug">{NAMA_MISSION}</p>
          </div>
          <div className="bg-paper p-10">
            <Eye className="w-6 h-6 text-brass mb-5" strokeWidth={1.5} />
            <p className="text-[11px] uppercase tracking-[0.25em] text-brass mb-3">Vision</p>
            <p className="font-serif text-2xl text-foreground leading-snug">{NAMA_VISION}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Team ─── */
function Team() {
  return (
    <section id="team" className="py-28 bg-paper">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div className="max-w-xl">
            <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-brass">— Team NAMA</p>
            <h2 className="mt-4 font-serif text-4xl sm:text-5xl text-foreground tracking-tight" style={{ lineHeight: "1.1" }}>
              Dedication. Expertise.<br /><em className="italic">Passion.</em>
            </h2>
          </div>
          <p className="text-muted-foreground max-w-sm text-[14px] leading-relaxed">
            NAMA's national executive — self-driven leaders committed to cooperation, communication, and collaboration for Zambia's media arts sector.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-px bg-border">
          {NATIONAL_EXECUTIVE.map((m) => (
            <div key={m.name} className="bg-paper group">
              <div className="aspect-square overflow-hidden bg-muted">
                <img
                  src={m.image}
                  alt={`${m.name}, ${m.role} of NAMA`}
                  loading="lazy"
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                />
              </div>
              <div className="p-5">
                <p className="text-[10px] uppercase tracking-[0.2em] text-brass mb-1.5">{m.role}</p>
                <p className="font-serif text-lg text-foreground leading-tight">{m.name}</p>
                <div className="mt-3 flex items-center gap-3 text-[11px] text-muted-foreground">
                  <a href={`tel:${m.phone.replace(/\s+/g, "")}`} className="flex items-center gap-1.5 hover:text-foreground transition-colors">
                    <Phone className="w-3 h-3" />
                    <span>{m.phone}</span>
                  </a>
                  {m.facebook && (
                    <a href={m.facebook} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-brass transition-colors">
                      <Facebook className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Blog ─── */
function Blog() {
  return (
    <section id="blog" className="py-28 bg-ink text-paper">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div className="max-w-xl">
            <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-brass">— Stay ahead</p>
            <h2 className="mt-4 font-serif text-4xl sm:text-5xl tracking-tight" style={{ lineHeight: "1.1" }}>
              Latest <em className="italic">insights</em><br />from the sector.
            </h2>
          </div>
          <p className="text-paper/70 max-w-sm text-[14px] leading-relaxed">
            Reporting, opinion, and field notes from NAMA members across Zambia's ten provinces.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-white/10">
          {BLOG_POSTS.map((p) => (
            <a
              key={p.url}
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-ink hover:bg-[#13110d] transition-colors group flex flex-col"
            >
              <div className="aspect-[4/3] overflow-hidden">
                <img
                  src={p.image}
                  alt={p.title}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700"
                />
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <p className="text-[10px] uppercase tracking-[0.2em] text-brass mb-3">By {p.author}</p>
                <h3 className="font-serif text-xl text-paper leading-snug mb-3 group-hover:text-brass transition-colors">
                  {p.title}
                </h3>
                <p className="text-[13px] text-paper/60 leading-relaxed line-clamp-3">{p.excerpt}</p>
                <p className="mt-5 text-[12px] text-brass inline-flex items-center gap-1.5">
                  Read article <ArrowRight className="w-3 h-3" />
                </p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Events ─── */
function Events() {
  return (
    <section id="events" className="py-28 bg-paper border-t border-border">
      <div className="max-w-6xl mx-auto px-6">
        <div className="mb-12">
          <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-brass">— Upcoming events</p>
          <h2 className="mt-4 font-serif text-4xl sm:text-5xl text-foreground tracking-tight max-w-2xl" style={{ lineHeight: "1.1" }}>
            Where the <em className="italic">industry</em> gathers.
          </h2>
        </div>

        <a
          href={UPCOMING_EVENT.url}
          target="_blank"
          rel="noopener noreferrer"
          className="grid lg:grid-cols-5 gap-px bg-border group hover:bg-brass/30 transition-colors"
        >
          <div className="lg:col-span-2 aspect-[4/5] sm:aspect-[16/10] lg:aspect-auto overflow-hidden bg-muted">
            <img
              src={UPCOMING_EVENT.image}
              alt={UPCOMING_EVENT.title}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-700"
            />
          </div>
          <div className="lg:col-span-3 bg-paper p-10 sm:p-14 flex flex-col justify-center">
            <p className="text-[11px] uppercase tracking-[0.25em] text-brass mb-4">Featured event</p>
            <h3 className="font-serif text-3xl sm:text-4xl text-foreground tracking-tight leading-tight mb-6">
              {UPCOMING_EVENT.title}
            </h3>
            <div className="space-y-2.5 text-[14px] text-muted-foreground">
              <p className="flex items-center gap-2.5">
                <Calendar className="w-4 h-4 text-brass" />
                {UPCOMING_EVENT.date}
              </p>
              <p className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-brass" />
                {UPCOMING_EVENT.location}
              </p>
            </div>
            <p className="mt-8 inline-flex items-center gap-2 text-sm text-foreground font-medium">
              View event details <ArrowRight className="w-4 h-4 text-brass" />
            </p>
          </div>
        </a>
      </div>
    </section>
  );
}

/* ─── Footer ─── */
function Footer() {
  return (
    <footer className="bg-ink text-paper/70 py-16 border-t border-white/5">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-sm border border-brass/60 flex items-center justify-center">
                <span className="font-serif text-brass text-base font-bold">N</span>
              </div>
              <p className="font-serif text-paper text-lg">NAMA</p>
            </div>
            <p className="text-[12px] leading-relaxed">
              The National Association for Media Arts — affiliated to the National Arts Council of Zambia under NAC Act, Cap 170.
            </p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-brass mb-4">Members</p>
            <ul className="space-y-2 text-[13px]">
              <li><Link to="/login" className="hover:text-paper transition-colors">Sign in</Link></li>
              <li><Link to="/login" className="hover:text-paper transition-colors">Register</Link></li>
              <li><Link to="/verify" className="hover:text-paper transition-colors">Verify certificate</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-brass mb-4">Information</p>
            <ul className="space-y-2 text-[13px]">
              <li><a href="#tiers" className="hover:text-paper transition-colors">Membership tiers</a></li>
              <li><a href="#how" className="hover:text-paper transition-colors">How it works</a></li>
              <li><a href="#why" className="hover:text-paper transition-colors">Why register</a></li>
            </ul>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-brass mb-4">Compliance</p>
            <ul className="space-y-2 text-[13px]">
              <li>NAC Act, Cap 170</li>
              <li>ECT Act, 2021</li>
              <li>Data Protection Act, 2021</li>
            </ul>
          </div>
        </div>
        <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row justify-between gap-3 text-[12px]">
          <p>© {new Date().getFullYear()} National Association for Media Arts, Zambia.</p>
          <p>Lusaka · Zambia</p>
        </div>
      </div>
    </footer>
  );
}
