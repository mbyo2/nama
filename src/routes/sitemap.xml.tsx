import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/sitemap/xml")({
  component: Sitemap,
});

function Sitemap() {
  const baseUrl = "https://nama.org.zm";
  const currentDate = new Date().toISOString();

  const pages = [
    { url: "", priority: "1.0", changefreq: "daily" },
    { url: "/blog", priority: "0.8", changefreq: "weekly" },
    { url: "/login", priority: "0.7", changefreq: "monthly" },
    { url: "/register", priority: "0.7", changefreq: "monthly" },
    { url: "/about", priority: "0.6", changefreq: "monthly" },
    { url: "/contact", priority: "0.6", changefreq: "yearly" },
  ];

  const blogPosts = [
    { url: "/blog/nama-launches-digital-certification-platform", date: "2024-01-15" },
    { url: "/blog/zambian-film-industry-growth-opportunities", date: "2024-01-10" },
    { url: "/blog/media-arts-funding-guide-2024", date: "2024-01-05" },
  ];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map((page) => `  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
${blogPosts.map((post) => `  <url>
    <loc>${baseUrl}${post.url}</loc>
    <lastmod>${post.date}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`).join('\n')}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
