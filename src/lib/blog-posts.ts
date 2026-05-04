// Full blog content sourced from https://www.namazambia.org/blog
// Migrated in-house — the legacy Wix site is being retired.

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  author: string;
  date: string;          // ISO date for SEO / sorting
  dateLabel: string;     // human label
  readMinutes: number;
  image: string;
  /** Markdown-style body. Paragraphs separated by blank lines. Use ### for subheads, > for quotes, - for bullets. */
  body: string;
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "empowering-young-creatives-workshop-american-corner-nipa-lusaka",
    title: "Empowering Young Creatives: Insights From the Workshop at the American Corner, NIPA Lusaka",
    excerpt:
      "A vibrant workshop at the American Corner at ZIPA in Lusaka brought together aspiring creatives, media practitioners, and young professionals eager to sharpen their skills.",
    author: "Memory Sampa",
    date: "2026-04-26",
    dateLabel: "Apr 26, 2026",
    readMinutes: 2,
    image:
      "https://static.wixstatic.com/media/1df22b_fb2de886530b4b57b6756f5687ec3560~mv2.jpg/v1/fill/w_1200,h_700,fp_0.5_0.5,q_90,enc_avif,quality_auto/1df22b_fb2de886530b4b57b6756f5687ec3560~mv2.webp",
    body: `By Memory Sampa — NAMA Publicity Secretary

A vibrant and engaging workshop recently took place at the American Corner located at the Zambia Institute of Public Administration (ZIPA) in Lusaka, bringing together aspiring creatives, media practitioners, and young professionals eager to sharpen their skills and expand their understanding of the creative and information space.

The session created a dynamic learning environment where participants were exposed to practical knowledge, industry insights, and the kind of mentorship that is too often missing from formal classrooms in Zambia.

### A space for sharing and learning

Speakers from the National Association of Media Arts (NAMA) walked attendees through the realities of working in Zambia's growing creative economy — from how to professionalise their craft, to building portfolios, navigating contracts, and understanding intellectual property rights.

The workshop also tackled the importance of structured representation, encouraging young creatives to register, get certified, and join a recognised national body that can advocate on their behalf.

### Why this matters

For many of the participants, this was their first encounter with industry-standard guidance. Several spoke openly about the difficulty of finding accurate information, fair contracts, or pathways into mainstream media. NAMA's approach — taking the conversation directly to community spaces like the American Corner — is part of a deliberate grassroots strategy.

The association reaffirmed its commitment to nationwide capacity building and to ensuring that every province has access to the same quality of training, exposure, and opportunity.

> "When we equip a young creative with the right tools, we're not just changing one career — we're shaping an industry."

The workshop closed with networking, photo sessions, and a clear call to action: register with NAMA, stay connected, and keep building.`,
  },
  {
    slug: "university-of-arts-motion-picture-production-strategic-pathway-zambia",
    title: "University of Arts and Motion Picture Production: A Strategic Pathway for Zambia's Creative Economy",
    excerpt:
      "Nations that have invested in creative industries — film, music, theatre, and digital media — have turned artistic talent into billion-dollar sectors. Why not Zambia?",
    author: "Pumulo Mumbuna",
    date: "2026-04-18",
    dateLabel: "Apr 18, 2026",
    readMinutes: 4,
    image:
      "https://static.wixstatic.com/media/1df22b_4ef32ba0c4b2481ca06d7f75ff84443c~mv2.jpeg/v1/fill/w_1200,h_700,fp_0.5_0.5,q_90,enc_avif,quality_auto/1df22b_4ef32ba0c4b2481ca06d7f75ff84443c~mv2.webp",
    body: `Hey there, creative minds and culture lovers!

Let's talk about something exciting — something that could change the game for Zambian artists, filmmakers, and storytellers forever.

Creativity is one of the most powerful engines of growth and cultural influence. Nations that have invested in creative industries — film, music, theatre, and digital media — have turned artistic talent into billion-dollar sectors. These industries create jobs, put countries on the global map, and even help with diplomacy.

**So here's my question: Why not Zambia?**

### A dream worth pursuing

For Zambia, the time has come to recognise the immense economic and cultural potential hiding in plain sight within our creative community. One of the most transformative steps the Government of Zambia could take is the establishment of a national university dedicated exclusively to the arts — specialising in acting, film, theatre, and motion picture production.

Such an institution would nurture artistic talent, professionalise the country's creative sector, and position Zambia as a regional hub for film and performing arts.

### What the rest of the world teaches us

Across the world, creative industries have proven to be powerful economic drivers. Take Hollywood — it has transformed filmmaking into a massive ecosystem involving actors, directors, technicians, writers, producers, and marketers. Then there's Nigeria's Nollywood, one of the largest film industries in the world, producing thousands of movies each year and generating billions for the national economy.

So why can't Zambia be next?

### Filling a big gap in our education system

Most universities in Zambia focus primarily on academic disciplines such as business, engineering, law, and medicine. Important fields, yes — but the absence of a dedicated institution focused on performing arts and cinematic production creates a significant gap.

A national university of arts and motion picture production would offer structured programmes in:

- Acting and theatre performance
- Film directing and screenwriting
- Cinematography and film editing
- Music composition and production
- Costume design and stagecraft
- Animation and digital media production

### Show me the money

The film industry is not only about storytelling — it is also a major economic engine. Every production involves dozens of professionals: actors, scriptwriters, directors, editors, lighting technicians, sound engineers, costume designers, and marketing teams.

If Zambia develops a strong domestic film industry, it could generate substantial revenue through cinema ticket sales, television licensing, streaming platforms, international distribution, and tourism linked to film locations. Iconic attractions such as Victoria Falls and the Zambezi River could attract international productions — all we need are the skilled filmmakers to make it happen.

### Keeping our culture alive

A national arts university would also play an important role in preserving and promoting Zambia's cultural heritage. Imagine cultural ceremonies such as the Kuomboka being documented and dramatised through cinematic productions — preserved for future generations while shared with global audiences.

### Final thoughts

The establishment of a University of Arts and Motion Picture Production is not a luxury. It is a strategic necessity for Zambia's economic diversification and cultural growth.

**The time to act is now. Let's dream big. Let's build.**

_The author is an International Business Consultant._`,
  },
  {
    slug: "mama-g-lands-in-zambia-new-era-global-film-collaborations",
    title: "Mama G Lands in Zambia, Sparking a New Era of Global Film Collaborations",
    excerpt:
      "Renowned Nigerian actress and filmmaker Patience Ozokwo, popularly known as Mama G, has arrived in Zambia — a major boost for the country's growing entertainment industry.",
    author: "Dominic Chifumbe",
    date: "2026-04-18",
    dateLabel: "Apr 18, 2026",
    readMinutes: 2,
    image:
      "https://static.wixstatic.com/media/1df22b_822759d2680c4e86bb4b4c1b7a9b5433~mv2.jpeg/v1/fill/w_1200,h_700,fp_0.5_0.5,q_90,enc_avif,quality_auto/1df22b_822759d2680c4e86bb4b4c1b7a9b5433~mv2.webp",
    body: `By Dominic Chifumbe — ZNBC, Lusaka

Zambia's entertainment industry is experiencing remarkable growth, steadily transitioning from a peripheral sector into a key contributor to the country's economic development. This surge is being fuelled by a new wave of authentic storytelling, increasing regional recognition, and supportive government policies.

In a major boost to the industry, renowned Nigerian actress and filmmaker Patience Ozokwo — popularly known as Mama G — has arrived in Zambia for a landmark cross-border collaboration that promises to open new doors for local talent.

### A landmark moment

Her visit signals a turning point: Zambian film is no longer just a domestic story. It is becoming part of a wider African creative network that exchanges craft, capital, and audiences across borders.

Mama G's presence is expected to inspire a new generation of Zambian actors, directors, and producers — and to attract co-production interest from across West and East Africa.

### Why this matters for Zambian creatives

Collaborations of this scale do more than create headlines. They:

- Open up training opportunities with international veterans.
- Improve production standards as local crews work alongside experienced teams.
- Build distribution pathways into bigger continental markets.
- Send a clear signal to investors that Zambia is ready for serious creative capital.

NAMA welcomes the visit and continues to advocate for structured collaborations that protect Zambian creatives, ensure fair contracts, and grow the formal media-arts economy.`,
  },
  {
    slug: "nama-launches-national-drive-creative-excellence-industry-empowerment",
    title: "NAMA Launches National Drive for Creative Excellence and Industry Empowerment",
    excerpt:
      "NAMA has embarked on an ambitious nationwide campaign to strengthen Zambia's creative sector through resource mobilisation and large-scale capacity building ahead of the 2026 NAMA Awards.",
    author: "NAMA Media Team",
    date: "2026-04-18",
    dateLabel: "Apr 18, 2026",
    readMinutes: 3,
    image:
      "https://static.wixstatic.com/media/1df22b_1ea3b31156fb4f56b6cfac811412b464~mv2.png/v1/fill/w_1200,h_700,fp_0.5_0.5,q_95,enc_avif,quality_auto/1df22b_1ea3b31156fb4f56b6cfac811412b464~mv2.webp",
    body: `By NAMA Media Team

The National Association of Media Arts (NAMA) has embarked on an ambitious nationwide campaign aimed at strengthening Zambia's creative sector through resource mobilisation and large-scale capacity building ahead of the 2026 National Academy Media Awards (NAMA Awards).

In what has been described as a strategic and transformative move, NAMA is actively engaging the corporate world, government institutions, and development partners to support what it calls an enormous campaign — designed not only to successfully host the awards, but to significantly expand participation and elevate industry standards across the country.

Speaking during a stakeholder engagement meeting, NAMA President Morgan Mbulo emphasised that the initiative goes beyond awarding excellence — it is about building it.

> "We are not just preparing for an awards ceremony. We are cultivating talent. We already have creatives submitting work, but we want to widen that base by investing in skills development and ensuring that every province has the capacity to participate meaningfully."

### Capacity building across all provinces

Central to this initiative is the rollout of capacity-building workshops across all ten provinces of Zambia, targeting filmmakers, content creators, photographers, broadcasters, and other media practitioners. These workshops will focus on various creative disciplines, equipping participants with both technical skills and industry knowledge.

The goal is to ensure a broader and more competitive pool of entries for the NAMA Awards, while empowering creatives at the grassroots level.

### Grassroots approach to industry growth

Unlike traditional top-down initiatives, NAMA's approach begins at the grassroots. By targeting districts and local communities, the association aims to unlock hidden talent and ensure inclusive participation in the creative economy.

This decentralised model is expected to democratise access to opportunities in the media-arts sector, allowing creatives from all regions to contribute and benefit.

### Resource mobilisation strategy

To support this expansive vision, NAMA has launched a robust resource-mobilisation campaign, seeking partnerships with corporate entities, government bodies, and international organisations. The association is positioning the NAMA Awards as not just an event, but a national development platform for the creative industry.

> "We are calling on stakeholders in the corporate world, governance, and development space to come on board and support this noble cause. This is an opportunity to invest in Zambia's creative future."

### A call to action

As preparations gain momentum, NAMA is urging all stakeholders to actively participate in this transformative journey.

"This is a collective effort," Mr. Mbulo emphasised. "With the right support and collaboration, we can build a creative industry that is inclusive, sustainable, and globally competitive."`,
  },
];

export function getPostBySlug(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}

export const UPCOMING_EVENT = {
  title: "Africa Creative Market Turns 5 — Five Cities. One Global Moment.",
  date: "Jun 29 – Jul 04, 2026",
  location: "Lusaka, Zambia",
  image:
    "https://static.wixstatic.com/media/1df22b_cd177d590a234481b602957d87dd4806~mv2.jpg/v1/fill/w_1200,h_1500,al_c,q_85,enc_avif,quality_auto/1df22b_cd177d590a234481b602957d87dd4806~mv2.jpg",
};
