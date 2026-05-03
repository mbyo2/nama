import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Search, ShieldCheck, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/registry")({
  component: RegistryPage,
  head: () => ({
    meta: [
      { title: "Public registry — NAMA Zambia" },
      { name: "description", content: "Browse the public registry of certified members of the National Association for Media Arts of Zambia." },
    ],
  }),
});

interface RegistryRow {
  certificate_number: string;
  full_name: string;
  artistic_discipline: string;
  province: string;
  membership_category_id: string;
  issued_at: string;
  expires_at: string;
}

function RegistryPage() {
  const [rows, setRows] = useState<RegistryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase.rpc("public_member_registry");
        if (error) throw error;
        setRows((data ?? []) as RegistryRow[]);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = rows.filter((r) => {
    const needle = q.trim().toLowerCase();
    if (!needle) return true;
    return (
      r.full_name.toLowerCase().includes(needle) ||
      r.artistic_discipline.toLowerCase().includes(needle) ||
      r.province.toLowerCase().includes(needle) ||
      r.certificate_number.toLowerCase().includes(needle)
    );
  });

  return (
    <div className="min-h-screen bg-paper text-foreground">
      <div className="max-w-5xl mx-auto px-6 py-16">
        <Link to="/" className="inline-flex items-center gap-2 text-[13px] text-muted-foreground hover:text-foreground mb-10">
          <ArrowLeft className="w-3.5 h-3.5" /> Back home
        </Link>
        <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-brass">— Public registry</p>
        <h1 className="mt-4 font-serif text-4xl text-foreground tracking-tight" style={{ lineHeight: "1.1" }}>
          Certified <em className="italic">media artists</em> of Zambia.
        </h1>
        <p className="mt-4 text-muted-foreground max-w-xl">
          Every active NAMA member listed below holds a valid digital certificate. Tap any row to verify it independently.
        </p>

        <div className="mt-8 relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name, discipline, province…"
            className="w-full rounded-sm border border-input bg-background pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brass focus:border-transparent"
          />
        </div>

        <div className="mt-8">
          {loading ? (
            <div className="flex items-center gap-3 text-muted-foreground text-sm">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading registry…
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-sm border border-dashed border-border p-10 text-center text-muted-foreground text-sm">
              No certified members match your search yet.
            </div>
          ) : (
            <div className="border border-border bg-card">
              <div className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-border bg-paper text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-medium">
                <div className="col-span-4">Member</div>
                <div className="col-span-3">Discipline</div>
                <div className="col-span-2">Province</div>
                <div className="col-span-3">Certificate</div>
              </div>
              {filtered.map((r) => (
                <Link
                  key={r.certificate_number}
                  to="/verify"
                  search={{ token: r.certificate_number }}
                  className="grid grid-cols-12 gap-4 px-4 py-4 border-b border-border last:border-b-0 hover:bg-paper transition-colors text-[13px]"
                >
                  <div className="col-span-4 flex items-center gap-2 text-foreground">
                    <ShieldCheck className="w-3.5 h-3.5 text-brass flex-shrink-0" />
                    <span className="truncate font-medium">{r.full_name}</span>
                  </div>
                  <div className="col-span-3 text-muted-foreground truncate">{r.artistic_discipline}</div>
                  <div className="col-span-2 text-muted-foreground truncate">{r.province}</div>
                  <div className="col-span-3 font-mono text-[12px] text-foreground truncate">{r.certificate_number}</div>
                </Link>
              ))}
            </div>
          )}
          <p className="mt-4 text-[12px] text-muted-foreground">
            Showing {filtered.length} of {rows.length} active certified members.
          </p>
        </div>
      </div>
    </div>
  );
}
