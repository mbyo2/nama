// Real content sourced from https://www.namazambia.org/

export interface TeamMember {
  name: string;
  role: string;
  phone: string;
  image: string;
  facebook?: string;
}

export const NATIONAL_EXECUTIVE: TeamMember[] = [
  {
    name: "Morgan Mbulo",
    role: "President",
    phone: "+260 966 929 919",
    image: "https://static.wixstatic.com/media/1df22b_1ea3b31156fb4f56b6cfac811412b464~mv2.png/v1/fill/w_344,h_344,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/IMG_Morgan.png",
    facebook: "https://web.facebook.com/profile.php?id=100093795259154",
  },
  {
    name: "Mfaweli Twaambo",
    role: "Vice President",
    phone: "+260 953 247 482",
    image: "https://static.wixstatic.com/media/1df22b_71f66810413840a683be398f37437600~mv2.jpg/v1/crop/x_0,y_1,w_896,h_897/fill/w_344,h_344,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/African_professional_smiling_20260407135.jpg",
  },
  {
    name: "Abel Silungwe",
    role: "Secretary General",
    phone: "+260 967 147 545",
    image: "https://static.wixstatic.com/media/1df22b_c604cd521d6d4b08aaafc9bc9c4fef9f~mv2.jpeg/v1/crop/x_0,y_0,w_896,h_895/fill/w_344,h_344,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/African_professional_smiling_202604071350%20(2).jpeg",
    facebook: "https://web.facebook.com/abel.p.silungwe/",
  },
  {
    name: "Emmanuel Mwape",
    role: "Treasurer General",
    phone: "+260 978 847 701",
    image: "https://static.wixstatic.com/media/1df22b_1a5fe0fda81d4601b6abbeedb03fbe0f~mv2.jpeg/v1/crop/x_119,y_42,w_677,h_678/fill/w_344,h_344,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/African_professional_smiling_202604071405.jpeg",
    facebook: "https://www.facebook.com/emmanuel.mwape.353",
  },
  {
    name: "Memory Sampa",
    role: "Publicity Secretary",
    phone: "+260 977 469 490",
    image: "https://static.wixstatic.com/media/1df22b_5d343a9f35ce41148e1f41f8e06c7431~mv2.jpeg/v1/crop/x_0,y_18,w_896,h_895/fill/w_344,h_344,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/African_professional_smiling_202604071358.jpeg",
    facebook: "https://www.facebook.com/share/p/1CZYGx4z8z/",
  },
  {
    name: "Choolwe Kayuna",
    role: "Committee Member",
    phone: "+260 972 006 980",
    image: "https://static.wixstatic.com/media/1df22b_d32d6869e8f04124a4dd4a360000742a~mv2.jpeg/v1/crop/x_0,y_57,w_896,h_895/fill/w_344,h_344,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/African_professional_smiling_202604071400.jpeg",
    facebook: "https://www.facebook.com/share/v/1P6kFfEFs4/",
  },
  {
    name: "Benson Musebela",
    role: "Committee Member",
    phone: "+260 965 346 160",
    image: "https://static.wixstatic.com/media/1df22b_817a45ffd328437492356433f61bcbb1~mv2.jpeg/v1/crop/x_0,y_26,w_896,h_895/fill/w_344,h_344,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/African_professional_smiling_202604071350%20(1).jpeg",
    facebook: "https://www.facebook.com/share/19r35qSjLF/",
  },
  {
    name: "Mpalasha Musonda",
    role: "Committee Member",
    phone: "+260 963 634 666",
    image: "https://static.wixstatic.com/media/1df22b_5643d7801dc9471382bd1b9c38ead38f~mv2.jpeg/v1/crop/x_0,y_31,w_896,h_895/fill/w_344,h_344,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/African_professional_smiling_202604071350.jpeg",
    facebook: "https://www.facebook.com/musonda.mpalasha.9",
  },
];

export interface BlogPost {
  title: string;
  excerpt: string;
  author: string;
  image: string;
  url: string;
}

export const BLOG_POSTS: BlogPost[] = [
  {
    title: "Empowering Young Creatives: Insights from the Workshop at the American Corner, NIPA Lusaka",
    excerpt: "A vibrant workshop at the American Corner at ZIPA in Lusaka brought together aspiring creatives, media practitioners, and young professionals eager to sharpen their skills.",
    author: "Memory Sampa",
    image: "https://static.wixstatic.com/media/1df22b_fb2de886530b4b57b6756f5687ec3560~mv2.jpg/v1/fill/w_667,h_500,fp_0.5_0.5,q_90,enc_avif,quality_auto/1df22b_fb2de886530b4b57b6756f5687ec3560~mv2.webp",
    url: "https://www.namazambia.org/post/empowering-young-creatives-insights-from-the-workshop-at-the-american-corner-nipa-lusaka",
  },
  {
    title: "University of Arts, Motion Picture Production: A Strategic Pathway for Zambia's Creative Economy",
    excerpt: "Nations that have invested in creative industries — film, music, theatre, and digital media — have turned artistic talent into billion-dollar sectors that change cultural influence forever.",
    author: "Pumulo Mumbuna",
    image: "https://static.wixstatic.com/media/1df22b_4ef32ba0c4b2481ca06d7f75ff84443c~mv2.jpeg/v1/fill/w_667,h_500,fp_0.5_0.5,q_90,enc_avif,quality_auto/1df22b_4ef32ba0c4b2481ca06d7f75ff84443c~mv2.webp",
    url: "https://www.namazambia.org/post/university-of-arts-motion-picture-production-strategic-pathway-for-zambia-s-creative-economy",
  },
  {
    title: "Mama G Lands in Zambia, Sparking a New Era of Global Film Collaborations",
    excerpt: "Renowned Nigerian actress and filmmaker Patience Ozokwo, popularly known as Mama G, has arrived in Zambia — a major boost for the country's growing entertainment industry.",
    author: "Dominic Chifumbe",
    image: "https://static.wixstatic.com/media/1df22b_822759d2680c4e86bb4b4c1b7a9b5433~mv2.jpeg/v1/fill/w_667,h_500,fp_0.5_0.5,q_90,enc_avif,quality_auto/1df22b_822759d2680c4e86bb4b4c1b7a9b5433~mv2.webp",
    url: "https://www.namazambia.org/post/mama-g-lands-in-zambia-sparking-a-new-era-of-global-film-collaborations",
  },
];

export const UPCOMING_EVENT = {
  title: "Africa Creative Market Turns 5 — Five Cities. One Global Moment.",
  date: "Jun 29 – Jul 04, 2026",
  location: "Lusaka, Zambia",
  url: "https://www.namazambia.org/event-details/africa-creative-market-turns-5-five-cities-one-global-moment",
  image: "https://static.wixstatic.com/media/1df22b_cd177d590a234481b602957d87dd4806~mv2.jpg/v1/fill/w_800,h_1000,al_c,q_85,enc_avif,quality_auto/1df22b_cd177d590a234481b602957d87dd4806~mv2.jpg",
};

export const NAMA_MISSION = "To promote inclusiveness, professionalism, and structured representation while supporting content creators and formalizing the media arts industry across Zambia.";

export const NAMA_VISION = "A well-structured, competitive, and sustainable media arts industry in Zambia, recognized nationally and internationally for its creativity and professionalism.";

export const NAMA_CONTACT_EMAIL = "info.nama.zambia@gmail.com";
