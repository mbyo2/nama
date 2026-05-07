import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  ogUrl?: string;
  canonical?: string;
  type?: string;
  noIndex?: boolean;
}

export function SEO({
  title = "NAMA — National Association for Media Arts",
  description = "The official membership and digital certification body for Zambian filmmakers, scriptwriters, actors, and media practitioners. Register, get certified, get recognised.",
  keywords = "NAMA Zambia, media arts, film certification, Zambia filmmakers, scriptwriters, actors, membership, digital certificates",
  ogImage,
  ogUrl,
  canonical,
  type = "website",
  noIndex = false,
}: SEOProps) {
  const siteUrl = "https://nama.org.zm";
  const fullUrl = ogUrl || canonical || siteUrl;
  const fullImageUrl = ogImage ? `${siteUrl}${ogImage}` : `${siteUrl}/nama-hero.jpg`;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      
      {/* Canonical URL */}
      {canonical && <link rel="canonical" href={`${siteUrl}${canonical}`} />}
      
      {/* Robots */}
      {noIndex && <meta name="robots" content="noindex, nofollow" />}
      
      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullImageUrl} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:site_name" content="NAMA Zambia" />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImageUrl} />
      
      {/* Additional Meta */}
      <meta name="author" content="NAMA Zambia" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta httpEquiv="Content-Type" content="text/html; charset=UTF-8" />
      
      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": "NAMA Zambia",
          "alternateName": "National Association for Media Arts",
          "url": siteUrl,
          "logo": `${siteUrl}/nama-logo.jpg`,
          "description": description,
          "address": {
            "@type": "PostalAddress",
            "addressCountry": "Zambia",
            "addressLocality": "Lusaka"
          },
          "contactPoint": {
            "@type": "ContactPoint",
            "email": "info@nama.org.zm",
            "contactType": "general"
          },
          "sameAs": [
            "https://www.facebook.com/NAMAZambia",
            "https://twitter.com/NAMAZambia"
          ]
        })}
      </script>
    </Helmet>
  );
}
