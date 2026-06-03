import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";
import { ArrowLeft, Calendar, Clock, Loader2, FileText } from "lucide-react";
import namaLogo from "@/assets/nama-logo.jpg";
import { fetchBlogPost, fetchBlogPosts, type BlogPost } from "@/lib/nama-api";

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

export const Route = createFileRoute("/blog/$slug")({
  loader: async ({ params }) => {
    const post = await fetchBlogPost(params.slug);
    if (!post) throw notFound();
    return { post };
  },
  head: ({ loaderData }) => {
    const post = loaderData?.post;
    if (!post) {
      return { meta: [{ title: "Article not found — NAMA" }] };
    }
    const url = `https://nama-zambia.lovable.app/blog/${post.slug}`;
    return {
      meta: [
        { title: `${post.title} — NAMA` },
        { name: "description", content: post.excerpt },
        { name: "author", content: post.author_name },
        { property: "article:published_time", content: post.published_at || post.created_at },
        { property: "article:author", content: post.author_name },
        { property: "og:type", content: "article" },
        { property: "og:title", content: post.title },
        { property: "og:description", content: post.excerpt },
        { property: "og:image", content: post.featured_image || "" },
        { property: "og:url", content: url },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: post.title },
        { name: "twitter:description", content: post.excerpt },
        { name: "twitter:image", content: post.featured_image || "" },
        {
          name: "script:ld+json",
          content: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "NewsArticle",
            headline: post.title,
            description: post.excerpt,
            image: post.featured_image ? [post.featured_image] : [],
            datePublished: post.published_at || post.created_at,
            author: [{ "@type": "Person", name: post.author_name }],
            publisher: {
              "@type": "Organization",
              name: "National Association for Media Arts of Zambia",
              logo: { "@type": "ImageObject", url: "https://nama-zambia.lovable.app/nama-logo.jpg" },
            },
            mainEntityOfPage: { "@type": "WebPage", "@id": url },
          }),
        },
      ],
      links: [{ rel: "canonical", href: url }],
    };
  },
  component: BlogPostPage,
  notFoundComponent: () => (
    <div className="min-h-screen flex items-center justify-center bg-paper px-6">
      <div className="text-center">
        <p className="text-[11px] uppercase tracking-[0.25em] text-brass">404</p>
        <h1 className="mt-3 font-serif text-4xl text-foreground">Article not found</h1>
        <Link to="/blog" className="mt-6 inline-flex items-center gap-1.5 text-brass text-[13px]">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to the blog
        </Link>
      </div>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="min-h-screen flex items-center justify-center bg-paper px-6">
      <div className="text-center max-w-md">
        <h1 className="font-serif text-3xl text-foreground">Something went wrong</h1>
        <p className="mt-3 text-sm text-muted-foreground">{error.message}</p>
        <Link to="/blog" className="mt-6 inline-flex items-center gap-1.5 text-brass text-[13px]">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to the blog
        </Link>
      </div>
    </div>
  ),
});

function BlogPostPage() {
  const { post } = Route.useLoaderData();
  const [others, setOthers] = useState<BlogPost[]>([]);
  const [loadingOthers, setLoadingOthers] = useState(true);

  useEffect(() => {
    const loadOthers = async () => {
      try {
        const allPosts = await fetchBlogPosts();
        const filtered = allPosts.filter((p) => p.id !== post.id).slice(0, 3);
        setOthers(filtered);
      } catch (error) {
        console.error("Error loading other posts:", error);
      } finally {
        setLoadingOthers(false);
      }
    };

    loadOthers();
  }, [post.id]);

  // Scroll to top when article loads
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="min-h-screen bg-paper text-foreground">
      {/* Nav */}
      <nav className="border-b border-border bg-paper">
        <div className="max-w-4xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img src={namaLogo} alt="NAMA logo" className="w-10 h-10 rounded-full object-cover" />
            <div className="leading-tight">
              <p className="font-serif text-foreground text-lg font-semibold tracking-tight">NAMA</p>
              <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Media Arts Zambia</p>
            </div>
          </Link>
          <Link to="/blog" className="text-[12px] uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5">
            <ArrowLeft className="w-3.5 h-3.5" /> All articles
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <header className="border-b border-border">
        <div className="max-w-3xl mx-auto px-6 pt-16 pb-10">
          <p className="text-[10px] uppercase tracking-[0.25em] text-brass">— NAMA Insights</p>
          <h1 className="mt-4 font-serif text-4xl sm:text-5xl text-foreground tracking-tight" style={{ lineHeight: "1.1" }}>
            {post.title}
          </h1>
          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px] text-muted-foreground">
            <span>By <span className="text-foreground">{post.author_name}</span></span>
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="w-3 h-3" />
              {new Date(post.published_at || post.created_at).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric"
              })}
            </span>
            <span className="inline-flex items-center gap-1.5"><Clock className="w-3 h-3" />{post.read_minutes} min read</span>
          </div>
        </div>
        <div className="max-w-5xl mx-auto px-6 pb-12">
          <div className="aspect-[16/9] overflow-hidden bg-muted">
            {post.featured_image ? (
              <img src={post.featured_image} alt={post.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-brass/10 flex items-center justify-center">
                <FileText className="w-16 h-16 text-brass/30" />
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Body */}
      <main className="py-16">
        <article className="max-w-2xl mx-auto px-6">
          <div
            className="blog-content max-w-none text-[16px]"
            dangerouslySetInnerHTML={{ __html: toContentHtml(post.content) }}
          />
        </article>
      </main>

      {/* More posts */}
      {others.length > 0 && (
        <section className="border-t border-border bg-ink text-paper py-20">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="font-serif text-3xl mb-10">More from the blog</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {others.map((p) => (
                <Link key={p.id} to="/blog/$slug" params={{ slug: p.slug }} className="group block">
                  <div className="aspect-[4/3] overflow-hidden mb-4">
                    {p.featured_image ? (
                      <img src={p.featured_image} alt={p.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700" />
                    ) : (
                      <div className="w-full h-full bg-brass/10 flex items-center justify-center">
                        <FileText className="w-8 h-8 text-brass/30" />
                      </div>
                    )}
                  </div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-brass mb-2">By {p.author_name}</p>
                  <h3 className="font-serif text-lg text-paper leading-snug group-hover:text-brass transition-colors">{p.title}</h3>
                  <p className="mt-3 text-[12px] text-brass inline-flex items-center gap-1.5">
                    Read <ArrowRight className="w-3 h-3" />
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
