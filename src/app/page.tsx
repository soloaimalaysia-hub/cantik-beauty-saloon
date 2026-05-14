import { supabaseAdmin, TENANT_ID } from "@/lib/supabase-server";
import Image from "next/image";

// ─── Types ───────────────────────────────────────────────────────────────────
interface Brand {
  business_name: string;
  slogan: string;
  logo_url: string | null;
  brand_color_primary: string;
  brand_color_secondary: string;
  whatsapp: string;
  address: string;
  operating_hours: string;
}

interface SectionCfg {
  section_key: string;
  position: number;
  is_visible: boolean;
}

// ─── Defaults ────────────────────────────────────────────────────────────────
const DEFAULT_BRAND: Brand = {
  business_name: "Rs Atelier Studio",
  slogan: "Where Style Meets Artistry",
  logo_url: null,
  brand_color_primary: "#B76E79",
  brand_color_secondary: "#8B4E57",
  whatsapp: "60123456789",
  address: "Kuala Lumpur, Malaysia",
  operating_hours: "Mon–Fri: 10am – 8pm\nSat: 9am – 9pm\nSun: 10am – 7pm",
};

const DEFAULT_SECTIONS: SectionCfg[] = [
  { section_key: "hero",       position: 0, is_visible: true },
  { section_key: "services",   position: 1, is_visible: true },
  { section_key: "promotions", position: 2, is_visible: true },
  { section_key: "gallery",    position: 3, is_visible: true },
  { section_key: "reviews",    position: 4, is_visible: true },
];

// ─── Static content ───────────────────────────────────────────────────────────
const SERVICES_DATA = [
  { icon: "✂️",  name: "Hair Services",   nameMy: "Rawatan Rambut", desc: "Haircut, colouring, treatment, rebonding & styling by experienced stylists.", price: "From RM 35", popular: true },
  { icon: "💅",  name: "Nail Art",         nameMy: "Seni Kuku",      desc: "Manicure, pedicure, gel nails, nail extensions & creative nail art designs.",    price: "From RM 45", popular: false },
  { icon: "🧖‍♀️", name: "Facial & Spa",    nameMy: "Rawatan Muka",   desc: "Deep cleansing facial, whitening treatment, anti-aging & relaxing spa packages.",price: "From RM 88", popular: true },
  { icon: "💆‍♀️", name: "Massage",         nameMy: "Urutan",         desc: "Traditional Malay massage, aromatherapy, reflexology & full body relaxation.",  price: "From RM 65", popular: false },
  { icon: "👰",  name: "Bridal Package",  nameMy: "Pakej Pengantin", desc: "Full bridal makeover — hair, makeup, nails & spa for your perfect wedding day.", price: "From RM 380", popular: false },
  { icon: "🌸",  name: "Beauty Package",  nameMy: "Pakej Kecantikan",desc: "All-in-one pampering: facial + massage + manicure. Perfect for self-care day.", price: "From RM 168", popular: true },
];

const GALLERY = [
  { label: "Hair Styling", emoji: "💇‍♀️" }, { label: "Nail Art",    emoji: "💅" },
  { label: "Facial",       emoji: "🧖‍♀️" }, { label: "Massage",    emoji: "💆‍♀️" },
  { label: "Bridal Look",  emoji: "👰" },  { label: "Spa",         emoji: "🌸" },
];

const TESTIMONIALS = [
  { name: "Nurul Ain", text: "Love the hair colour treatment! Staff very friendly and professional. Will come back again 💕", stars: 5, service: "Hair Colouring" },
  { name: "Mei Ling",  text: "Best nail art in town! Very detailed and the gel nails last so long. Highly recommend!",      stars: 5, service: "Nail Art" },
  { name: "Priya",     text: "The facial + massage combo is amazing. Felt so relaxed after. Price very reasonable too!",   stars: 5, service: "Beauty Package" },
];

// ─── Main page ────────────────────────────────────────────────────────────────
export const revalidate = 60; // ISR: revalidate every 60 seconds

export default async function LandingPage() {
  // Load brand settings
  const { data: rawBrand } = await supabaseAdmin
    .from("tenants")
    .select("business_name,slogan,logo_url,brand_color_primary,brand_color_secondary,whatsapp,address,operating_hours")
    .eq("id", TENANT_ID)
    .single();

  const brand: Brand = {
    business_name:       rawBrand?.business_name       ?? DEFAULT_BRAND.business_name,
    slogan:              rawBrand?.slogan               ?? DEFAULT_BRAND.slogan,
    logo_url:            rawBrand?.logo_url             ?? null,
    brand_color_primary: rawBrand?.brand_color_primary  ?? DEFAULT_BRAND.brand_color_primary,
    brand_color_secondary: rawBrand?.brand_color_secondary ?? DEFAULT_BRAND.brand_color_secondary,
    whatsapp:            rawBrand?.whatsapp             ?? DEFAULT_BRAND.whatsapp,
    address:             rawBrand?.address              ?? DEFAULT_BRAND.address,
    operating_hours:     rawBrand?.operating_hours      ?? DEFAULT_BRAND.operating_hours,
  };

  // Load section config
  const { data: rawSections } = await supabaseAdmin
    .from("saloon_website_sections")
    .select("section_key,position,is_visible")
    .eq("tenant_id", TENANT_ID)
    .order("position");

  const sections: SectionCfg[] = (rawSections && rawSections.length > 0)
    ? rawSections
    : DEFAULT_SECTIONS;

  const pc = brand.brand_color_primary;
  const sc = brand.brand_color_secondary;
  const wa = brand.whatsapp;
  const bookLink = `https://wa.me/${wa}?text=${encodeURIComponent("Hi! I'd like to book an appointment 💆‍♀️")}`;
  const waLink   = `https://wa.me/${wa}`;

  const hours = brand.operating_hours.split("\n").filter(Boolean);

  const sectionMap: Record<string, React.ReactNode> = {
    hero: (
      <section key="hero" className="relative overflow-hidden text-white py-24 md:py-32"
        style={{ background: `linear-gradient(135deg, #2D1B1E 0%, ${sc} 50%, ${pc} 100%)` }}>
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="max-w-6xl mx-auto px-4 text-center relative z-10">
          <p className="tracking-widest text-sm uppercase font-medium mb-4" style={{ color: `${pc}aa` }}>
            ✨ Premium Beauty Experience
          </p>
          <h2 className="font-playfair text-5xl md:text-7xl font-bold mb-6 leading-tight">
            {brand.slogan.split(",")[0]},<br />
            <span className="italic text-[#F7E7CE]">{brand.slogan.split(",")[1]?.trim() ?? brand.slogan}</span>
          </h2>
          <p className="text-white/80 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Your premier beauty destination in KL. Hair, nails, spa & wellness — all under one roof. Book via WhatsApp in seconds.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href={bookLink} target="_blank" rel="noopener noreferrer"
              className="bg-[#25D366] hover:bg-[#1ebe5d] text-white font-semibold px-8 py-4 rounded-full transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-lg">
              <WhatsAppIcon size={24} /> Book Appointment
            </a>
            <a href="#services"
              className="bg-white/10 hover:bg-white/20 border border-white/30 text-white font-medium px-8 py-4 rounded-full transition-all duration-300 text-lg">
              View Services
            </a>
          </div>
          <div className="flex justify-center gap-12 mt-16 pt-8 border-t border-white/20">
            {[["500+", "Happy Clients"], ["5★", "Google Rating"], ["8+", "Expert Stylists"]].map(([num, label]) => (
              <div key={label} className="text-center">
                <div className="font-playfair text-3xl font-bold text-[#F7E7CE]">{num}</div>
                <div className="text-white/60 text-xs mt-1">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    ),

    services: (
      <section key="services" id="services" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <p className="section-subtitle">What We Offer</p>
            <h2 className="section-title">Our Services</h2>
            <p className="text-gray-500 max-w-xl mx-auto">From hair to nails to full-body spa — we take care of everything so you can feel your best.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {SERVICES_DATA.map((svc) => (
              <div key={svc.name} className="relative bg-white rounded-2xl p-6 border border-rose-100 card-hover shadow-sm">
                {svc.popular && (
                  <span className="absolute top-4 right-4 text-white text-xs px-2 py-1 rounded-full font-medium"
                    style={{ backgroundColor: pc }}>Popular</span>
                )}
                <div className="text-4xl mb-4">{svc.icon}</div>
                <h3 className="font-playfair text-xl font-semibold text-[#2D1B1E] mb-1">{svc.name}</h3>
                <p className="text-xs mb-3 font-medium" style={{ color: pc }}>{svc.nameMy}</p>
                <p className="text-gray-500 text-sm leading-relaxed mb-4">{svc.desc}</p>
                <div className="flex items-center justify-between">
                  <span className="font-semibold" style={{ color: sc }}>{svc.price}</span>
                  <a href={`https://wa.me/${wa}?text=${encodeURIComponent(`Hi! I'd like to book ${svc.name} 💆‍♀️`)}`}
                    target="_blank" rel="noopener noreferrer"
                    className="text-sm font-medium flex items-center gap-1 transition-colors"
                    style={{ color: pc }}>Book →</a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    ),

    promotions: (
      <section key="promotions" id="promotion" className="py-20 bg-[#FFF5F7]">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <p className="section-subtitle">Limited Time</p>
            <h2 className="section-title">Special Promotions</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { tag: "🔥 HOT DEAL", title: "First Visit Special", desc: "20% OFF for all new customers on any service above RM 80", cta: "Claim Now", g: `${pc}, ${sc}` },
              { tag: "👯 BRING A FRIEND", title: "Bring A Friend", desc: "Both of you get 15% OFF when you book together. More fun, more savings!", cta: "Book Together", g: `${sc}, #2D1B1E` },
              { tag: "📅 WEEKDAY", title: "Weekday Treat", desc: "Mon–Thu 10am–2pm: Extra 10% OFF all spa & massage services", cta: "Book Weekday", g: `${pc}cc, ${pc}` },
            ].map((promo) => (
              <div key={promo.title} className="rounded-2xl p-7 text-white card-hover shadow-lg"
                style={{ background: `linear-gradient(135deg, ${promo.g})` }}>
                <span className="text-xs font-bold tracking-wider opacity-80">{promo.tag}</span>
                <h3 className="font-playfair text-2xl font-bold mt-3 mb-3">{promo.title}</h3>
                <p className="text-white/80 text-sm leading-relaxed mb-6">{promo.desc}</p>
                <a href={bookLink} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 border border-white/30 text-white font-medium px-5 py-2.5 rounded-full transition-all text-sm">
                  <WhatsAppIcon size={16} /> {promo.cta}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>
    ),

    gallery: (
      <section key="gallery" id="gallery" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <p className="section-subtitle">Our Work</p>
            <h2 className="section-title">Gallery</h2>
            <p className="text-gray-500">A glimpse of our transformations</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {GALLERY.map((item, i) => (
              <div key={item.label} className={`rounded-2xl overflow-hidden card-hover cursor-pointer ${i === 0 ? "md:col-span-2 md:row-span-2" : ""}`}>
                <div className={`w-full flex items-center justify-center ${i === 0 ? "h-80" : "h-44"}`}
                  style={{ background: `linear-gradient(135deg, ${i % 2 === 0 ? `${pc}22, ${pc}66` : `${sc}33, ${sc}88`})` }}>
                  <div className="text-center">
                    <div className={`${i === 0 ? "text-7xl" : "text-5xl"} mb-2`}>{item.emoji}</div>
                    <p className={`font-playfair font-medium ${i === 0 ? "text-xl text-[#2D1B1E]" : "text-sm"}`}
                      style={{ color: i === 0 ? "#2D1B1E" : sc }}>{item.label}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className="text-center text-gray-400 text-sm mt-6">
            📸 More photos on our{" "}
            <a href={waLink} target="_blank" rel="noopener noreferrer" style={{ color: pc }} className="hover:underline">WhatsApp</a>
          </p>
        </div>
      </section>
    ),

    reviews: (
      <section key="reviews" className="py-20 bg-[#FFF5F7]">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <p className="section-subtitle">Reviews</p>
            <h2 className="section-title">What Our Clients Say</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="bg-white rounded-2xl p-7 shadow-sm border border-rose-100 card-hover">
                <div className="flex gap-0.5 mb-4">
                  {[...Array(t.stars)].map((_, i) => (
                    <span key={i} className="text-lg" style={{ color: pc }}>★</span>
                  ))}
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mb-5 italic">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold"
                    style={{ background: `linear-gradient(135deg, ${pc}, ${sc})` }}>
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-[#2D1B1E] text-sm">{t.name}</p>
                    <p className="text-xs" style={{ color: pc }}>{t.service}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    ),
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Inject CSS variables */}
      <style>{`
        :root {
          --brand-primary: ${pc};
          --brand-secondary: ${sc};
        }
        .section-subtitle { color: ${pc}; }
        .btn-whatsapp { background-color: #25D366; }
        .nav-link { color: #2D1B1E; transition: color 0.2s; }
        .nav-link:hover { color: ${pc}; }
      `}</style>

      {/* Topbar */}
      <div className="text-white text-center py-2 text-xs tracking-wider"
        style={{ backgroundColor: "#2D1B1E" }}>
        📍 {brand.address} &nbsp;|&nbsp; ⏰ {hours[0] ?? "Daily 10am – 8pm"}
      </div>

      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50 border-b border-rose-100">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-md overflow-hidden"
              style={{ background: `linear-gradient(135deg, ${pc}, ${sc})` }}>
              {brand.logo_url ? (
                <Image src={brand.logo_url} alt="logo" width={48} height={48} className="object-contain w-full h-full" unoptimized />
              ) : (
                brand.business_name[0]
              )}
            </div>
            <div>
              <h1 className="font-playfair text-xl font-bold text-[#2D1B1E] leading-tight">{brand.business_name}</h1>
              <p className="text-xs tracking-widest uppercase" style={{ color: pc }}>Saloon</p>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm text-[#2D1B1E] font-medium">
            {sections.filter(s => s.is_visible && s.section_key !== "hero").map(s => (
              <a key={s.section_key} href={`#${s.section_key}`} className="nav-link capitalize">
                {s.section_key === "promotions" ? "Promotions" : s.section_key.charAt(0).toUpperCase() + s.section_key.slice(1)}
              </a>
            ))}
          </nav>
          <a href={bookLink} target="_blank" rel="noopener noreferrer"
            className="btn-whatsapp inline-flex items-center gap-2 text-white font-semibold px-5 py-2.5 rounded-full text-sm hover:opacity-90 transition-all">
            <WhatsAppIcon size={16} /> Book Now
          </a>
        </div>
      </header>

      {/* Sections in configured order */}
      {sections
        .filter((s) => s.is_visible)
        .sort((a, b) => a.position - b.position)
        .map((s) => sectionMap[s.section_key])
      }

      {/* Book CTA */}
      <section className="py-16 text-white"
        style={{ background: `linear-gradient(90deg, #2D1B1E, ${sc})` }}>
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="font-playfair text-4xl font-bold text-white mb-4">
            Ready for Your <span className="italic text-[#F7E7CE]">Transformation</span>?
          </h2>
          <p className="text-white/70 mb-8">Book your appointment now via WhatsApp — fast, easy, no app needed.</p>
          <a href={bookLink} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-3 bg-[#25D366] hover:bg-[#1ebe5d] text-white font-semibold px-10 py-4 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-lg">
            <WhatsAppIcon size={24} /> WhatsApp Us Now
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="text-white py-14" style={{ backgroundColor: "#2D1B1E" }}>
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold overflow-hidden"
                  style={{ background: `linear-gradient(135deg, ${pc}, ${pc}99)` }}>
                  {brand.logo_url
                    ? <Image src={brand.logo_url} alt="logo" width={40} height={40} className="object-contain" unoptimized />
                    : brand.business_name[0]}
                </div>
                <div>
                  <h3 className="font-playfair text-lg font-bold">{brand.business_name}</h3>
                  <p className="text-xs" style={{ color: pc }}>{brand.slogan}</p>
                </div>
              </div>
              <p className="text-white/60 text-sm leading-relaxed">
                Your premier beauty destination. We make you feel confident and beautiful every day.
              </p>
            </div>
            <div>
              <h4 className="font-playfair text-lg font-semibold mb-4" style={{ color: `${pc}cc` }}>Operating Hours</h4>
              <div className="space-y-2 text-sm text-white/70">
                {hours.map((line, i) => {
                  const [day, time] = line.split(":").map(s => s.trim());
                  return (
                    <div key={i} className="flex justify-between">
                      <span>{day}</span>
                      <span>{time}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div>
              <h4 className="font-playfair text-lg font-semibold mb-4" style={{ color: `${pc}cc` }}>Contact Us</h4>
              <div className="space-y-3 text-sm text-white/70">
                <p>📍 {brand.address}</p>
                <p>📱 {brand.whatsapp}</p>
              </div>
              <a href={bookLink} target="_blank" rel="noopener noreferrer"
                className="mt-5 inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#1ebe5d] text-white text-sm font-medium px-5 py-2.5 rounded-full transition-all">
                <WhatsAppIcon size={16} /> WhatsApp Us
              </a>
            </div>
          </div>
          <div className="border-t border-white/10 pt-6 text-center text-white/40 text-xs">
            © 2026 {brand.business_name} · Powered by{" "}
            <a href="https://duriantech.my" target="_blank" rel="noopener noreferrer" style={{ color: pc }}>DurianTech</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function WhatsAppIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}
