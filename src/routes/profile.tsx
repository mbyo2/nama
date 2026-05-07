import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { fetchMyMember, updateMember } from "@/lib/nama-api";
import { toast } from "sonner";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
  head: () => ({
    meta: [
      { title: "Edit Profile — NAMA" },
    ],
  }),
});

function ProfilePage() {
  const { user } = useAuth();
  const [member, setMember] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    phone_number: "",
    artistic_discipline: "",
    province: "",
    city: "",
    years_experience: "",
    tpin: "",
    bio: ""
  });

  useEffect(() => {
    if (!user) return;
    
    const loadMember = async () => {
      try {
        const m = await fetchMyMember(user.id);
        if (!m) {
          window.location.href = '/register';
          return;
        }
        
        setMember(m);
        setFormData({
          full_name: m.full_name || "",
          phone_number: m.phone_number || "",
          artistic_discipline: m.artistic_discipline || "",
          province: m.province || "",
          city: m.city || "",
          years_experience: m.years_experience?.toString() || "",
          tpin: m.tpin || "",
          bio: m.bio || ""
        });
      } catch (error) {
        console.error("Error loading profile:", error);
        toast.error("Could not load your profile");
      } finally {
        setLoading(false);
      }
    };
    
    loadMember();
  }, [user]);

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!user || !member) return;
    
    setSaving(true);
    try {
      const updateData = {
        ...formData,
        years_experience: formData.years_experience ? parseInt(formData.years_experience) : 0
      };
      await updateMember(member.id, updateData);
      toast.success("Profile updated successfully!");
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast.error(error.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <Loader2 className="w-5 h-5 text-brass animate-spin" />
      </div>
    );
  }

  if (!member) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Profile not found</p>
          <button
            onClick={() => window.location.href = '/app'}
            className="mt-4 text-brass hover:text-brass/80"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper text-foreground">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <button
          onClick={() => window.location.href = '/app'}
          className="inline-flex items-center gap-2 text-[12px] text-muted-foreground hover:text-foreground mb-8"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to dashboard
        </button>

        <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-brass">— Edit Profile</p>
        <h1 className="mt-3 font-serif text-3xl sm:text-4xl text-foreground tracking-tight" style={{ lineHeight: "1.1" }}>
          Update your information.
        </h1>

        <div className="mt-8 space-y-6">
          <div>
            <label className="block text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-2">
              Full legal name
            </label>
            <input
              type="text"
              value={formData.full_name}
              onChange={(e) => updateField("full_name", e.target.value)}
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
              placeholder="+260 977 123 456"
              className="w-full rounded-sm border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brass focus:border-transparent"
            />
          </div>

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

          <div className="grid sm:grid-cols-2 gap-4">
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

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-2">
                Years of experience
              </label>
              <input
                type="number"
                min="0"
                max="50"
                value={formData.years_experience}
                onChange={(e) => updateField("years_experience", e.target.value)}
                placeholder="5"
                className="w-full rounded-sm border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brass focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-2">
                TPIN (Taxpayer Identification Number)
              </label>
              <input
                type="text"
                value={formData.tpin}
                onChange={(e) => updateField("tpin", e.target.value)}
                placeholder="100000000"
                className="w-full rounded-sm border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brass focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-2">
              Bio
            </label>
            <textarea
              value={formData.bio}
              onChange={(e) => updateField("bio", e.target.value)}
              placeholder="Tell us about yourself and your work..."
              rows={4}
              className="w-full rounded-sm border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brass focus:border-transparent resize-none"
            />
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-sm bg-brass text-ink px-7 py-4 text-sm font-semibold hover:bg-brass/90 disabled:opacity-40 disabled:pointer-events-none transition-all"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>

            <button
              onClick={() => window.location.href = '/app'}
              className="inline-flex items-center gap-2 rounded-sm border border-border bg-paper text-foreground px-7 py-4 text-sm font-medium hover:bg-card transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
