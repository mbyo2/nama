import { Outlet, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";

import appCss from "../styles.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: "NAMA Zambia — National Association for Media Arts" },
      {
        name: "description",
        content:
          "The official membership and digital certification body for Zambian filmmakers, scriptwriters, actors, broadcasters, and media practitioners. Register, get certified, get recognised.",
      },
      {
        name: "keywords",
        content:
          "NAMA, NAMA Zambia, National Association for Media Arts, Zambia film industry, Zambian filmmakers, media arts Zambia, NAMA Awards, creative industry Zambia, certification, member registry",
      },
      { name: "author", content: "National Association for Media Arts of Zambia" },
      { name: "robots", content: "index, follow, max-image-preview:large" },
      { name: "theme-color", content: "#0a0907" },
      { property: "og:site_name", content: "NAMA Zambia" },
      { property: "og:title", content: "NAMA Zambia — National Association for Media Arts" },
      {
        property: "og:description",
        content:
          "Register, get certified, and join Zambia's recognised body for film, broadcast, and media artists.",
      },
      { property: "og:type", content: "website" },
      { property: "og:locale", content: "en_ZM" },
      { property: "og:url", content: "https://nama-zambia.lovable.app/" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "NAMA Zambia — National Association for Media Arts" },
      {
        name: "twitter:description",
        content:
          "The official membership and digital certification body for Zambia's media arts sector.",
      },
      {
        name: "script:ld+json",
        content: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "National Association for Media Arts of Zambia",
          alternateName: "NAMA Zambia",
          url: "https://nama-zambia.lovable.app/",
          logo: "https://nama-zambia.lovable.app/nama-logo.jpg",
          email: "info.nama.zambia@gmail.com",
          areaServed: "ZM",
          sameAs: ["https://web.facebook.com/profile.php?id=100093795259154"],
        }),
      },
    ],
    links: [
      { rel: "icon", type: "image/jpeg", href: "/nama-logo.jpg" },
      { rel: "shortcut icon", type: "image/jpeg", href: "/nama-logo.jpg" },
      { rel: "apple-touch-icon", href: "/nama-logo.jpg" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700;9..144,800&family=Inter:wght@400;500;600;700&display=swap",
      },
      { rel: "stylesheet", href: appCss },
    ],
    scripts: [
      {
        children: `
          (function() {
            var theme = localStorage.getItem('nama_theme') || 'light';
            if (theme === 'system') {
              theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            }
            if (theme === 'dark') document.documentElement.classList.add('dark');
          })();
        `,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFound,
});

function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-paper px-6">
      <div className="text-center">
        <p className="text-[11px] uppercase tracking-[0.25em] text-brass">404</p>
        <h1 className="mt-3 font-serif text-5xl text-foreground">Page not found</h1>
        <p className="mt-3 text-sm text-muted-foreground">The page you're looking for doesn't exist.</p>
        <a href="/" className="mt-8 inline-block px-6 py-3 bg-ink text-paper text-[12px] uppercase tracking-[0.2em]">Back to home</a>
      </div>
    </div>
  );
}

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="pb-[env(safe-area-inset-bottom)]">
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <>
      <div className="animate-page-enter">
        <Outlet />
      </div>
      <Toaster position="top-center" />
    </>
  );
}
