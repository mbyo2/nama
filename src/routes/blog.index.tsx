import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Calendar, Clock } from "lucide-react";
import namaLogo from "@/assets/nama-logo.jpg";
import { BLOG_POSTS } from "@/lib/blog-posts";

export const Route = createFileRoute("/blog/")({
  component: BlogIndex,
  head: () => ({
    meta: [
      { title: "NAMA Blog — Insights from Zambia's Media Arts Sector" },
      {
        name: "description",
        content:
          "Reporting, opinion, and field notes from the National Association for Media Arts of Zambia. Workshops, policy, film, and the people building Zambia's creative economy.",
      },
      { property: "og:title", content: "NAMA Blog — Insights from Zambia's Media Arts Sector" },
      {
        property: "og:description",
        content:
          "Workshops, policy, film, and the people building Zambia's creative economy — straight from NAMA's national network.",
      },
      { property: "og:type", content: "website" },
      { property: "og:image", content: BLOG_POSTS[0]?.image },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: BLOG_POSTS[0]?.image },
    ],
    links: [{ rel: "canonical", href: "https://nama-zambia.lovable.app/blog" }],
  }),
});

function BlogIndex() {
  return (
    <div className="min-h-screen bg-paper text-foreground">
      {/* Nav */}
      <nav className="border-b border-border bg-paper">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img src={namaLogo} alt="NAMA logo" className="w-10 h-10 rounded-full object-cover" />
            <div className="leading-tight">
              <p className="font-serif text-foreground text-lg font-semibold tracking-tight">NAMA</p>
              <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Media Arts Zambia</p>
            </div>
          </Link>
          <Link to="/" className="text-[12px] uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5">
            <ArrowLeft className="w-3.5 h-3.5" /> Home
          </Link>
        </div>
      </nav>

      {/* Header */}
      <header className="bg-ink text-paper py-24">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-brass">— The NAMA blog</p>
          <h1 className="mt-4 font-serif text-5xl sm:text-6xl tracking-tight max-w-3xl" style={{ lineHeight: "1.05" }}>
            Stories from <em className="italic">Zambia's</em> media arts sector.
          </h1>
          <p className="mt-6 text-paper/70 max-w-2xl text-[15px] leading-relaxed">
            Reporting, opinion, and field notes from NAMA members across Zambia's ten provinces — workshops, policy, film, music, and the people building the creative economy.
          </p>
        </div>
      </header>

      {/* Posts */}
      <main className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-10">
            {BLOG_POSTS.map((p) => (
              <article key={p.slug} className="group">
                <Link to="/blog/$slug" params={{ slug: p.slug }} className="block">
                  <div className="aspect-[4/3] overflow-hidden bg-muted mb-5">
                    <img
                      src={p.image}
                      alt={p.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700"
                    />
                  </div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-brass mb-2">By {p.author}</p>
                  <h2 className="font-serif text-2xl text-foreground leading-snug mb-3 group-hover:text-brass transition-colors">
                    {p.title}
                  </h2>
                  <p className="text-[14px] text-muted-foreground leading-relaxed line-clamp-3">{p.excerpt}</p>
                  <div className="mt-4 flex items-center gap-4 text-[11px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5"><Calendar className="w-3 h-3" />{p.dateLabel}</span>
                    <span className="inline-flex items-center gap-1.5"><Clock className="w-3 h-3" />{p.readMinutes} min read</span>
                  </div>
                  <p className="mt-4 text-[12px] text-brass inline-flex items-center gap-1.5">
                    Read article <ArrowRight className="w-3 h-3" />
                  </p>
                </Link>
              </article>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
