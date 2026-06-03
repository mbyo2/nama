import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  ArrowLeft, Plus, Edit, Trash2, Eye, EyeOff, FileText, Calendar, Clock,
  Loader2, Save, X, Send, Archive
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { RichTextEditor } from "@/components/rich-text-editor";
import { 
  createBlogPost, 
  updateBlogPost, 
  deleteBlogPost, 
  fetchAdminBlogPosts,
  type BlogPost,
  type CreateBlogPostInput
} from "@/lib/nama-api";
import { toast } from "sonner";

// Legacy posts were stored as plain text; render those preserving line breaks,
// while new posts contain HTML from the rich-text editor.
function toContentHtml(content: string): string {
  if (!content) return "";
  const looksLikeHtml = /<\/?[a-z][\s\S]*>/i.test(content);
  if (looksLikeHtml) return content;
  return content
    .split(/\n{2,}/)
    .map((block) => `<p>${block.replace(/\n/g, "<br />")}</p>`)
    .join("");
}

export const Route = createFileRoute("/admin-blog")({
  component: AdminBlogPage,
  head: () => ({
    meta: [
      { title: "Blog Management — NAMA Admin" },
      { name: "robots", content: "noindex" },
    ],
  }),
});

function AdminBlogPage() {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [formData, setFormData] = useState<CreateBlogPostInput>({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    featured_image: "",
    status: "draft",
    read_minutes: 5
  });

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate({ to: "/login" });
      return;
    }

    const checkAdminRole = async () => {
      try {
        const { data: roles } = await supabase
          .from("user_roles").select("role").eq("user_id", user.id);
        const myRoles = (roles ?? []).map((r) => r.role);
        const admin = myRoles.includes("admin") || myRoles.includes("superadmin");
        
        if (!admin) {
          navigate({ to: "/app" });
          return;
        }
        
        setIsAdmin(admin);
        loadPosts();
      } catch (error) {
        console.error("Error checking admin role:", error);
        navigate({ to: "/app" });
      }
    };

    checkAdminRole();
  }, [user, authLoading, navigate]);

  const loadPosts = async () => {
    try {
      const fetchedPosts = await fetchAdminBlogPosts();
      setPosts(fetchedPosts);
    } catch (error) {
      toast.error("Failed to load blog posts");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    setFormData({
      title: "",
      slug: "",
      excerpt: "",
      content: "",
      featured_image: "",
      status: "draft",
      read_minutes: 5
    });
    setIsCreating(true);
    setEditingPost(null);
  };

  const handleEdit = (post: BlogPost) => {
    setFormData({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      featured_image: post.featured_image || "",
      status: post.status,
      read_minutes: post.read_minutes
    });
    setEditingPost(post);
    setIsCreating(false);
  };

  const handleSave = async (statusOverride?: BlogPost["status"]) => {
    if (!user) return;

    if (!formData.title.trim() || !formData.slug.trim() || !formData.content.trim()) {
      toast.error("Please fill in title, slug, and content");
      return;
    }

    const payload: CreateBlogPostInput = statusOverride
      ? { ...formData, status: statusOverride }
      : formData;

    setSaving(true);
    try {
      if (isCreating) {
        await createBlogPost(user.id, user.email || "Admin", payload);
        toast.success(payload.status === "published" ? "Article published!" : "Draft saved.");
      } else if (editingPost) {
        await updateBlogPost(editingPost.id, payload);
        toast.success(payload.status === "published" ? "Article published!" : "Article updated.");
      }

      setFormData((prev) => ({ ...prev, status: payload.status }));
      setIsCreating(false);
      setEditingPost(null);
      loadPosts();
    } catch (error: any) {
      toast.error(error.message || "Failed to save blog post");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (post: BlogPost) => {
    const next = post.status === "published" ? "draft" : "published";
    try {
      await updateBlogPost(post.id, { status: next });
      toast.success(next === "published" ? "Article published!" : "Article unpublished.");
      loadPosts();
    } catch (error: any) {
      toast.error(error.message || "Failed to update status");
    }
  };

  const handleDelete = async (post: BlogPost) => {
    if (!confirm(`Are you sure you want to delete "${post.title}"?`)) return;
    
    try {
      await deleteBlogPost(post.id);
      toast.success("Blog post deleted successfully!");
      loadPosts();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete blog post");
    }
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingPost(null);
    setIsPreviewing(false);
  };

  const handlePreview = () => {
    setIsPreviewing(true);
  };

  const updateField = (field: keyof CreateBlogPostInput, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleTitleChange = (title: string) => {
    updateField('title', title);
    if (!isCreating && !editingPost) {
      updateField('slug', generateSlug(title));
    }
  };

  if (authLoading || loading || isAdmin === null) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <Loader2 className="w-5 h-5 text-brass animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper text-foreground">
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/admin" className="inline-flex items-center gap-2 text-[13px] text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to admin
          </Link>
          <p className="text-[11px] uppercase tracking-[0.25em] text-brass">Blog Management</p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-brass">— Content Management</p>
            <h1 className="mt-3 font-serif text-4xl text-foreground tracking-tight">Blog Articles</h1>
          </div>
          <button
            onClick={handleCreateNew}
            className="inline-flex items-center gap-2 rounded-sm bg-brass text-ink px-6 py-3 text-sm font-semibold hover:bg-brass/90"
          >
            <Plus className="w-4 h-4" /> New Article
          </button>
        </div>

        {(isCreating || editingPost) && (
          <div className="mb-8 border border-border bg-card rounded-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-foreground">
                {isCreating ? "Create New Article" : "Edit Article"}
              </h2>
              <button
                onClick={handleCancel}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="Enter article title"
                    className="w-full rounded-sm border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brass focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Slug</label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => updateField('slug', e.target.value)}
                    placeholder="article-url-slug"
                    className="w-full rounded-sm border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brass focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Excerpt</label>
                  <textarea
                    value={formData.excerpt}
                    onChange={(e) => updateField('excerpt', e.target.value)}
                    placeholder="Brief description of the article..."
                    rows={3}
                    className="w-full rounded-sm border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brass focus:border-transparent resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Content</label>
                  <RichTextEditor
                    value={formData.content}
                    onChange={(html) => updateField('content', html)}
                    placeholder="Write your article — use the toolbar for headings, lists, quotes and links…"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Featured Image URL</label>
                  <input
                    type="url"
                    value={formData.featured_image ?? ""}
                    onChange={(e) => updateField('featured_image', e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="w-full rounded-sm border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brass focus:border-transparent"
                  />
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => updateField('status', e.target.value as 'draft' | 'published' | 'archived')}
                    className="w-full rounded-sm border border-input bg-background px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brass focus:border-transparent"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Read Time (minutes)</label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={formData.read_minutes}
                    onChange={(e) => updateField('read_minutes', parseInt(e.target.value) || 5)}
                    className="w-full rounded-sm border border-input bg-background px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brass focus:border-transparent"
                  />
                </div>

                <div className="pt-6 space-y-3">
                  <button
                    onClick={handlePreview}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-sm border border-border bg-paper text-foreground px-6 py-3 text-sm font-medium hover:bg-card"
                  >
                    <Eye className="w-4 h-4" />
                    Preview
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-sm bg-brass text-ink px-6 py-3 text-sm font-semibold hover:bg-brass/90 disabled:opacity-40"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        {isCreating ? "Create Article" : "Update Article"}
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleCancel}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-sm border border-border bg-paper text-foreground px-6 py-3 text-sm font-medium hover:bg-card"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="border border-border bg-card overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="bg-paper text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              <tr>
                <th className="text-left font-medium px-4 py-3">Title</th>
                <th className="text-left font-medium px-4 py-3">Author</th>
                <th className="text-left font-medium px-4 py-3">Status</th>
                <th className="text-left font-medium px-4 py-3">Created</th>
                <th className="text-left font-medium px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr key={post.id} className="border-t border-border align-middle">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-foreground">{post.title}</p>
                      <p className="text-[11px] text-muted-foreground mt-1">{post.excerpt}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{post.author_name}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 rounded-sm px-2 py-1 text-[11px] font-medium ${
                      post.status === 'published' ? "bg-green-100 text-green-800" :
                      post.status === 'draft' ? "bg-yellow-100 text-yellow-800" :
                      "bg-gray-100 text-gray-800"
                    }`}>
                      {post.status === 'published' && <Eye className="w-3 h-3" />}
                      {post.status === 'draft' && <EyeOff className="w-3 h-3" />}
                      {post.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(post.created_at).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric"
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(post)}
                        className="inline-flex items-center gap-1 text-[11px] text-brass hover:underline"
                      >
                        <Edit className="w-3 h-3" /> Edit
                      </button>
                      <button
                        onClick={() => handleDelete(post)}
                        className="inline-flex items-center gap-1 text-[11px] text-destructive hover:underline"
                      >
                        <Trash2 className="w-3 h-3" /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {posts.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">No blog posts yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* Preview Modal */}
      {isPreviewing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-paper rounded-sm max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-paper border-b border-border p-4 flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Preview: {formData.title}</h3>
              <button
                onClick={() => setIsPreviewing(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-8">
              {formData.featured_image && (
                <img
                  src={formData.featured_image}
                  alt={formData.title}
                  className="w-full aspect-video object-cover rounded-sm mb-8"
                />
              )}
              <p className="text-[10px] uppercase tracking-[0.2em] text-brass mb-2">By {user?.email || "Admin"}</p>
              <h1 className="font-serif text-4xl text-foreground leading-tight mb-4">{formData.title}</h1>
              <p className="text-lg text-muted-foreground mb-8">{formData.excerpt}</p>
              <div className="prose prose-lg max-w-none">
                <div className="whitespace-pre-wrap text-foreground/85 leading-relaxed">
                  {formData.content}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
