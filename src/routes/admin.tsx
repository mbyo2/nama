import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import {
  ArrowLeft, Loader2, Users, ShieldAlert, ShieldCheck, UserPlus, UserMinus,
  Crown, Award, Ban, RefreshCw, Mail, Send,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { membershipStatusLabel, formatZmw } from "@/lib/nama";
import type { Member, MembershipStatus } from "@/lib/nama";
import { adminRevokeCertificate, adminIssueCertificate, sendMessageToMember, fetchAdminMessages } from "@/lib/nama-api";
import { toast } from "sonner";

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
interface AdminEntry { user_id: string; email: string; granted_at: string; is_superadmin: boolean; }
interface CertRow {
  id: string; member_id: string; user_id: string;
  certificate_number: string; revoked: boolean;
  revoke_reason: string | null; expires_at: string;
}

function AdminPage() {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isSuperadmin, setIsSuperadmin] = useState(false);
  const [adminsExist, setAdminsExist] = useState<boolean | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [admins, setAdmins] = useState<AdminEntry[]>([]);
  const [certs, setCerts] = useState<CertRow[]>([]);
  const [summary, setSummary] = useState<PaymentSummary>({ total_paid: 0, total_records: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | MembershipStatus>("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [messageModal, setMessageModal] = useState<{ open: boolean; member?: Member }>({ open: false });
  const [messageForm, setMessageForm] = useState({ subject: "", content: "" });

  const reload = useCallback(async () => {
    if (!user) return;
    const { data: roles } = await supabase
      .from("user_roles").select("role").eq("user_id", user.id);
    const myRoles = (roles ?? []).map((r) => r.role);
    const admin = myRoles.includes("admin") || myRoles.includes("superadmin");
    const superadmin = myRoles.includes("superadmin");
    setIsAdmin(admin);
    setIsSuperadmin(superadmin);

    const { count } = await supabase
      .from("user_roles").select("*", { count: "exact", head: true }).in("role", ["admin", "superadmin"]);
    setAdminsExist((count ?? 0) > 0);

    if (!admin) { setLoading(false); return; }

    const [{ data: m }, { data: p }, { data: a }, { data: c }] = await Promise.all([
      supabase.from("members").select("*").order("created_at", { ascending: false }),
      supabase.from("payments").select("amount_zmw,status"),
      supabase.rpc("list_admins"),
      supabase.from("certificates").select("id,member_id,user_id,certificate_number,revoked,revoke_reason,expires_at").order("issued_at", { ascending: false }),
    ]);
    setMembers((m ?? []) as Member[]);
    setAdmins((a ?? []) as AdminEntry[]);
    setCerts((c ?? []) as CertRow[]);
    const paid = (p ?? []).filter((x) => x.status === "success");
    setSummary({
      total_paid: paid.reduce((s, x) => s + (x.amount_zmw ?? 0), 0),
      total_records: paid.length,
    });
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate({ to: "/login" }); return; }
    reload();
  }, [user, authLoading, navigate, reload]);

  const handleClaim = async () => {
    setBusyId("claim");
    const { data, error } = await supabase.rpc("claim_first_admin");
    setBusyId(null);
    if (error) return toast.error(error.message);
    if (data === true) {
      toast.success("You are now the founding admin");
      reload();
    } else {
      toast.error("An admin already exists");
    }
  };

  const handleStatusChange = async (memberId: string, status: MembershipStatus) => {
    setBusyId(memberId);
    const { error } = await supabase.rpc("admin_set_member_status", { _member_id: memberId, _status: status });
    setBusyId(null);
    if (error) return toast.error(error.message);
    toast.success(`Marked as ${membershipStatusLabel(status)}`);
    reload();
  };

  const handleGrant = async (m: Member) => {
    setBusyId(m.user_id);
    const { error } = await supabase.rpc("grant_admin", { _target: m.user_id });
    setBusyId(null);
    if (error) return toast.error(error.message);
    toast.success(`${m.full_name} is now an admin`);
    reload();
  };

  const handleRevoke = async (a: AdminEntry) => {
    if (a.user_id === user?.id && !confirm("Remove your own admin role?")) return;
    setBusyId(a.user_id);
    const { error } = await supabase.rpc("revoke_admin", { _target: a.user_id });
    setBusyId(null);
    if (error) return toast.error(error.message);
    toast.success("Admin role removed");
    reload();
  };

  const handleIssueCert = async (m: Member) => {
    if (!confirm(`Manually issue a certificate for ${m.full_name}? Any existing live certificate will be revoked and replaced.`)) return;
    setBusyId(`cert-${m.id}`);
    try {
      await adminIssueCertificate(m.id);
      toast.success(`Certificate issued for ${m.full_name}`);
      reload();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to issue certificate";
      toast.error(msg);
    } finally {
      setBusyId(null);
    }
  };

  const handleRevokeCert = async (cert: CertRow, memberName: string) => {
    const reason = prompt(`Revoke certificate ${cert.certificate_number} for ${memberName}.\nEnter a reason (recorded in the audit log):`);
    if (reason === null) return;
    setBusyId(`cert-${cert.id}`);
    try {
      await adminRevokeCertificate(cert.id, reason || "Revoked by administrator");
      toast.success("Certificate revoked");
      reload();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to revoke certificate";
      toast.error(msg);
    } finally {
      setBusyId(null);
    }
  };

  const handleSendMessage = (member: Member) => {
    setMessageModal({ open: true, member });
    setMessageForm({ subject: "", content: "" });
  };

  const handleSubmitMessage = async () => {
    if (!user || !messageModal.member || !messageForm.subject.trim() || !messageForm.content.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      await sendMessageToMember(
        messageModal.member.id,
        user.id,
        messageForm.subject,
        messageForm.content,
        user.email || "Admin",
        messageModal.member.full_name
      );
      toast.success(`Message sent to ${messageModal.member.full_name}`);
      setMessageModal({ open: false });
      setMessageForm({ subject: "", content: "" });
    } catch (error: any) {
      toast.error(error.message || "Failed to send message");
    }
  };

  if (authLoading || loading) {
    return <div className="min-h-screen bg-paper flex items-center justify-center"><Loader2 className="w-5 h-5 text-brass animate-spin" /></div>;
  }

  // Founding-admin claim screen
  if (!isAdmin && adminsExist === false) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          <Crown className="w-10 h-10 text-brass mx-auto" strokeWidth={1.4} />
          <h1 className="mt-6 font-serif text-3xl text-foreground">Claim founding admin</h1>
          <p className="mt-3 text-muted-foreground text-[14px]">
            No NAMA secretariat administrator has been registered yet. As the first signed-in member, you can claim the founding admin role to bootstrap the system.
          </p>
          <button
            onClick={handleClaim}
            disabled={busyId === "claim"}
            className="mt-8 inline-flex items-center gap-2 rounded-sm bg-brass text-ink px-6 py-3.5 text-sm font-semibold hover:bg-brass/90 disabled:opacity-60"
          >
            {busyId === "claim" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Crown className="w-4 h-4" />}
            Become founding admin
          </button>
          <Link to="/app" className="mt-6 block text-[13px] text-muted-foreground underline">Back to dashboard</Link>
        </div>
      </div>
    );
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

  const filtered = members.filter((m) => {
    if (statusFilter !== "all" && m.status !== statusFilter) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return m.full_name.toLowerCase().includes(q)
      || m.nrc_number.toLowerCase().includes(q)
      || m.artistic_discipline.toLowerCase().includes(q)
      || m.province.toLowerCase().includes(q);
  });

  const adminUserIds = new Set(admins.map((a) => a.user_id));

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
        <h1 className="mt-3 font-serif text-4xl text-foreground tracking-tight">Members, roles & revenue.</h1>

        <div className="mt-10 grid sm:grid-cols-4 gap-px bg-border">
          <Stat label="Total members" value={String(members.length)} />
          <Stat label="Active" value={String(counts.active)} />
          <Stat label="Pending" value={String(counts.pending)} />
          <Stat label="Revenue (ZMW)" value={formatZmw(summary.total_paid)} sub={`${summary.total_records} payments`} />
        </div>

        {/* Admins */}
        <section className="mt-14">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-brass" />
            <p className="text-[11px] uppercase tracking-[0.25em] text-brass">Administrators ({admins.length})</p>
          </div>
          <div className="mt-4 border border-border bg-card divide-y divide-border">
            {admins.map((a) => (
              <div key={a.user_id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-[14px] text-foreground flex items-center gap-2">
                    {a.email}
                    {a.is_superadmin && (
                      <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.15em] bg-brass/15 text-brass px-1.5 py-0.5 rounded-sm">
                        <Crown className="w-3 h-3" /> Superadmin
                      </span>
                    )}
                  </p>
                  <p className="text-[11px] text-muted-foreground">Granted {new Date(a.granted_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}{a.user_id === user?.id ? " · you" : ""}</p>
                </div>
                {isSuperadmin && !a.is_superadmin ? (
                  <button
                    onClick={() => handleRevoke(a)}
                    disabled={busyId === a.user_id || admins.length <= 1}
                    className="inline-flex items-center gap-1.5 text-[12px] text-destructive hover:underline disabled:opacity-40 disabled:no-underline"
                    title={admins.length <= 1 ? "Cannot remove the last admin" : "Revoke admin"}
                  >
                    <UserMinus className="w-3.5 h-3.5" /> Revoke
                  </button>
                ) : a.is_superadmin ? (
                  <span className="text-[11px] text-muted-foreground italic">Protected</span>
                ) : (
                  <span className="text-[11px] text-muted-foreground italic">Superadmin only</span>
                )}
              </div>
            ))}
          </div>
          {!isSuperadmin && (
            <p className="mt-2 text-[11px] text-muted-foreground italic">
              Only superadmins can grant or revoke admin roles.
            </p>
          )}
        </section>

        {/* Members */}
        <section className="mt-14">
          <div className="flex flex-wrap items-center gap-3 justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-brass" />
              <p className="text-[11px] uppercase tracking-[0.25em] text-brass">All members</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, NRC, discipline…"
                className="text-[13px] px-3 py-2 border border-border bg-paper rounded-sm focus:outline-none focus:border-brass"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                className="text-[13px] px-3 py-2 border border-border bg-paper rounded-sm focus:outline-none focus:border-brass"
              >
                <option value="all">All statuses</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="expired">Expired</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
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
                  <th className="text-left font-medium px-4 py-3">Role</th>
                  <th className="text-left font-medium px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((m) => {
                  const isMemberAdmin = adminUserIds.has(m.user_id);
                  const busy = busyId === m.id || busyId === m.user_id;
                  const liveCert = certs.find((c) => c.member_id === m.id && !c.revoked) ?? null;
                  const certBusy = busyId === `cert-${m.id}` || (liveCert ? busyId === `cert-${liveCert.id}` : false);
                  return (
                    <tr key={m.id} className="border-t border-border align-middle">
                      <td className="px-4 py-3 text-foreground">{m.full_name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{m.artistic_discipline}</td>
                      <td className="px-4 py-3 text-muted-foreground">{m.province}</td>
                      <td className="px-4 py-3 font-mono text-[12px] text-muted-foreground">{m.nrc_number}</td>
                      <td className="px-4 py-3"><StatusPill status={m.status} /></td>
                      <td className="px-4 py-3">
                        {isMemberAdmin ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-brass"><Crown className="w-3 h-3" /> Admin</span>
                        ) : (
                          <span className="text-[11px] text-muted-foreground">Member</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <select
                            value={m.status}
                            onChange={(e) => handleStatusChange(m.id, e.target.value as MembershipStatus)}
                            disabled={busy}
                            className="text-[11px] px-2 py-1 border border-border bg-paper rounded-sm"
                          >
                            <option value="pending">Pending</option>
                            <option value="active">Active</option>
                            <option value="expired">Expired</option>
                            <option value="suspended">Suspended</option>
                          </select>
                          {liveCert ? (
                            <button
                              onClick={() => handleRevokeCert(liveCert, m.full_name)}
                              disabled={certBusy}
                              className="inline-flex items-center gap-1 text-[11px] text-destructive hover:underline disabled:opacity-40"
                              title={`Revoke certificate ${liveCert.certificate_number}`}
                            >
                              <Ban className="w-3 h-3" /> Revoke cert
                            </button>
                          ) : (
                            <button
                              onClick={() => handleIssueCert(m)}
                              disabled={certBusy}
                              className="inline-flex items-center gap-1 text-[11px] text-brass hover:underline disabled:opacity-40"
                              title="Issue certificate"
                            >
                              <Award className="w-3 h-3" /> Issue cert
                            </button>
                          )}
                          <button
                            onClick={() => handleSendMessage(m)}
                            className="inline-flex items-center gap-1 text-[11px] text-brass hover:underline"
                            title="Send message"
                          >
                            <Mail className="w-3 h-3" /> Message
                          </button>
                          {isSuperadmin && !isMemberAdmin && (
                            <button
                              onClick={() => handleGrant(m)}
                              disabled={busy}
                              className="inline-flex items-center gap-1 text-[11px] text-foreground hover:text-brass disabled:opacity-40"
                            >
                              <UserPlus className="w-3 h-3" /> Make admin
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">No members match.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* Message Modal */}
      {messageModal.open && messageModal.member && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
          <div className="bg-paper border border-border rounded-sm max-w-lg w-full p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Send Message to {messageModal.member.full_name}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  value={messageForm.subject}
                  onChange={(e) => setMessageForm(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="Enter message subject"
                  className="w-full rounded-sm border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brass focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Message
                </label>
                <textarea
                  value={messageForm.content}
                  onChange={(e) => setMessageForm(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Enter your message..."
                  rows={6}
                  className="w-full rounded-sm border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brass focus:border-transparent resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSubmitMessage}
                className="inline-flex items-center gap-2 rounded-sm bg-brass text-ink px-4 py-2 text-sm font-semibold hover:bg-brass/90"
              >
                <Send className="w-4 h-4" />
                Send Message
              </button>
              <button
                onClick={() => setMessageModal({ open: false })}
                className="inline-flex items-center gap-2 rounded-sm border border-border bg-paper text-foreground px-4 py-2 text-sm font-medium hover:bg-card"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
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
