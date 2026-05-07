import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  ArrowLeft, Plus, Edit, Trash2, Eye, EyeOff, FileText, Calendar, Clock,
  Loader2, Save, X
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { 
  createBlogPost, 
  updateBlogPost, 
  deleteBlogPost, 
  fetchAdminBlogPosts,
  type BlogPost,
  type CreateBlogPostInput
} from "@/lib/nama-api";
import { toast } from "sonner";

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
  const { user } = useAuth();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [saving, setSaving] = useState(false);
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
    loadPosts();
  }, []);

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

  const handleSave = async () => {
    if (!user) return;
    
    if (!formData.title.trim() || !formData.slug.trim() || !formData.content.trim()) {
      toast.error("Please fill in title, slug, and content");
      return;
    }

    setSaving(true);
    try {
      if (isCreating) {
        await createBlogPost(user.id, user.email || "Admin", formData);
        toast.success("Blog post created successfully!");
      } else if (editingPost) {
        await updateBlogPost(editingPost.id, formData);
        toast.success("Blog post updated successfully!");
      }
      
      setIsCreating(false);
      setEditingPost(null);
      loadPosts();
    } catch (error: any) {
      toast.error(error.message || "Failed to save blog post");
    } finally {
      setSaving(false);
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

  if (loading) {
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
                  <textarea
                    value={formData.content}
                    onChange={(e) => updateField('content', e.target.value)}
                    placeholder="Write your article content here..."
                    rows={12}
                    className="w-full rounded-sm border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brass focus:border-transparent resize-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Featured Image URL</label>
                  <input
                    type="url"
                    value={formData.featured_image}
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
    </div>
  );
}
