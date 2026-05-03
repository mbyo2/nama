import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, Users, ShieldAlert } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { membershipStatusLabel, formatZmw } from "@/lib/nama";
import type { Member, MembershipStatus } from "@/lib/nama";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
  head: () => ({
    meta: [
      { title: "Admin — NAMA" },
      { name: "robots", content: "noindex" },
    ],
  }),
});

interface PaymentSummary { total_paid: number; total_records: number; }

function AdminPage() {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [summary, setSummary] = useState<PaymentSummary>({ total_paid: 0, total_records: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate({ to: "/login" }); return; }
    (async () => {
      const { data: roles } = await supabase
        .from("user_roles").select("role").eq("user_id", user.id);
      const admin = (roles ?? []).some((r) => r.role === "admin");
      setIsAdmin(admin);
      if (!admin) { setLoading(false); return; }

      const [{ data: m }, { data: p }] = await Promise.all([
        supabase.from("members").select("*").order("created_at", { ascending: false }),
        supabase.from("payments").select("amount_zmw,status"),
      ]);
      setMembers((m ?? []) as Member[]);
      const paid = (p ?? []).filter((x) => x.status === "success");
      setSummary({
        total_paid: paid.reduce((s, x) => s + (x.amount_zmw ?? 0), 0),
        total_records: paid.length,
      });
      setLoading(false);
    })();
  }, [user, authLoading, navigate]);

  if (authLoading || loading) {
    return <div className="min-h-screen bg-paper flex items-center justify-center"><Loader2 className="w-5 h-5 text-brass animate-spin" /></div>;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          <ShieldAlert className="w-10 h-10 text-brass mx-auto" strokeWidth={1.4} />
          <h1 className="mt-6 font-serif text-3xl text-foreground">Restricted area</h1>
          <p className="mt-3 text-muted-foreground text-[14px]">
            This dashboard is only accessible to NAMA secretariat staff. Contact the National Executive if you need access.
          </p>
          <Link to="/app" className="mt-8 inline-flex items-center gap-2 text-[13px] text-foreground underline">
            Back to your member dashboard
          </Link>
        </div>
      </div>
    );
  }

  const counts = members.reduce<Record<MembershipStatus, number>>((acc, m) => {
    acc[m.status] = (acc[m.status] ?? 0) + 1; return acc;
  }, { active: 0, pending: 0, expired: 0, suspended: 0 });

  return (
    <div className="min-h-screen bg-paper text-foreground">
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/app" className="inline-flex items-center gap-2 text-[13px] text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to dashboard
          </Link>
          <p className="text-[11px] uppercase tracking-[0.25em] text-brass">Secretariat</p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-brass">— Admin console</p>
        <h1 className="mt-3 font-serif text-4xl text-foreground tracking-tight">Members & revenue.</h1>

        <div className="mt-10 grid sm:grid-cols-4 gap-px bg-border">
          <Stat label="Total members" value={String(members.length)} />
          <Stat label="Active" value={String(counts.active)} />
          <Stat label="Pending" value={String(counts.pending)} />
          <Stat label="Revenue (ZMW)" value={formatZmw(summary.total_paid)} sub={`${summary.total_records} payments`} />
        </div>

        <div className="mt-12 flex items-center gap-2">
          <Users className="w-4 h-4 text-brass" />
          <p className="text-[11px] uppercase tracking-[0.25em] text-brass">All members</p>
        </div>

        <div className="mt-4 border border-border bg-card overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="bg-paper text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              <tr>
                <th className="text-left font-medium px-4 py-3">Name</th>
                <th className="text-left font-medium px-4 py-3">Discipline</th>
                <th className="text-left font-medium px-4 py-3">Province</th>
                <th className="text-left font-medium px-4 py-3">NRC</th>
                <th className="text-left font-medium px-4 py-3">Status</th>
                <th className="text-left font-medium px-4 py-3">Joined</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id} className="border-t border-border">
                  <td className="px-4 py-3 text-foreground">{m.full_name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{m.artistic_discipline}</td>
                  <td className="px-4 py-3 text-muted-foreground">{m.province}</td>
                  <td className="px-4 py-3 font-mono text-[12px] text-muted-foreground">{m.nrc_number}</td>
                  <td className="px-4 py-3">
                    <StatusPill status={m.status} />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(m.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                </tr>
              ))}
              {members.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">No members yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-paper p-5">
      <p className="text-[10px] uppercase tracking-[0.2em] text-brass mb-2">{label}</p>
      <p className="font-serif text-2xl text-foreground">{value}</p>
      {sub && <p className="text-[11px] text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}

function StatusPill({ status }: { status: MembershipStatus }) {
  const color = status === "active" ? "bg-success/15 text-success" :
    status === "pending" ? "bg-brass/15 text-brass" :
    "bg-destructive/15 text-destructive";
  return <span className={`inline-flex items-center gap-1.5 rounded-sm px-2 py-1 text-[11px] font-medium ${color}`}>
    <span className="w-1.5 h-1.5 rounded-full bg-current" />
    {membershipStatusLabel(status)}
  </span>;
}
