"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";

interface BrandForm {
  business_name: string;
  slogan: string;
  logo_url: string;
  brand_color_primary: string;
  brand_color_secondary: string;
  whatsapp: string;
  address: string;
  operating_hours: string;
}

const DEFAULTS: BrandForm = {
  business_name: "Cantik Beauty Saloon",
  slogan: "Look Beautiful, Feel Cantik",
  logo_url: "",
  brand_color_primary: "#B76E79",
  brand_color_secondary: "#8B4E57",
  whatsapp: "60123456789",
  address: "No. 12, Jalan Cantik 3, Taman Indah, Kuala Lumpur",
  operating_hours: "Mon–Fri: 10am – 8pm\nSat: 9am – 9pm\nSun: 10am – 7pm",
};

export default function BrandPage() {
  const [form, setForm] = useState<BrandForm>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoError, setLogoError] = useState("");
  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/admin/brand")
      .then((r) => r.json())
      .then((d) => {
        setForm({
          business_name: d.business_name ?? DEFAULTS.business_name,
          slogan: d.slogan ?? DEFAULTS.slogan,
          logo_url: d.logo_url ?? "",
          brand_color_primary: d.brand_color_primary ?? DEFAULTS.brand_color_primary,
          brand_color_secondary: d.brand_color_secondary ?? DEFAULTS.brand_color_secondary,
          whatsapp: d.whatsapp ?? DEFAULTS.whatsapp,
          address: d.address ?? DEFAULTS.address,
          operating_hours: d.operating_hours ?? DEFAULTS.operating_hours,
        });
        setLoading(false);
      });
  }, []);

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoError("");
    setLogoUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    // Upload to brand-assets bucket (reuse upload endpoint with bucket override)
    const res = await fetch("/api/admin/upload?bucket=brand-assets", { method: "POST", body: fd });
    const data = await res.json();
    if (data.error) {
      setLogoError(data.error);
    } else {
      setForm((f) => ({ ...f, logo_url: data.url }));
    }
    setLogoUploading(false);
    if (logoInputRef.current) logoInputRef.current.value = "";
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/admin/brand", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  function set(key: keyof BrandForm, val: string) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-playfair text-2xl font-bold text-[#2D1B1E]">Brand Settings</h1>
        <p className="text-gray-500 text-sm">Customise your salon's identity on the website</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Form ── */}
        <form onSubmit={save} className="lg:col-span-2 space-y-5">

          {/* Shop info */}
          <Section title="🏪 Shop Info">
            <Field label="Shop Name">
              <input value={form.business_name} onChange={(e) => set("business_name", e.target.value)}
                className={input} placeholder="Cantik Beauty Saloon" />
            </Field>
            <Field label="Slogan">
              <input value={form.slogan} onChange={(e) => set("slogan", e.target.value)}
                className={input} placeholder="Look Beautiful, Feel Cantik" />
            </Field>
            <Field label="WhatsApp Number">
              <input value={form.whatsapp} onChange={(e) => set("whatsapp", e.target.value)}
                className={input} placeholder="60123456789 (no spaces, no +)" />
            </Field>
          </Section>

          {/* Logo */}
          <Section title="🖼️ Logo">
            <div className="flex items-center gap-4">
              {/* Preview */}
              <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-rose-200 flex items-center justify-center overflow-hidden shrink-0 bg-rose-50">
                {form.logo_url ? (
                  <Image src={form.logo_url} alt="Logo" width={80} height={80} className="object-contain w-full h-full" unoptimized />
                ) : (
                  <span className="text-3xl">🏪</span>
                )}
              </div>
              <div className="flex-1">
                <label className={`inline-flex items-center gap-2 cursor-pointer ${logoUploading ? "opacity-60 pointer-events-none" : ""} bg-white border border-rose-200 text-sm text-gray-600 px-4 py-2 rounded-xl hover:bg-rose-50 transition-all`}>
                  {logoUploading ? (
                    <><div className="w-4 h-4 border-2 border-[#B76E79] border-t-transparent rounded-full animate-spin" /> Uploading...</>
                  ) : (
                    <><span>📤</span> Upload Logo</>
                  )}
                  <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                </label>
                {form.logo_url && (
                  <button type="button" onClick={() => set("logo_url", "")}
                    className="ml-2 text-xs text-red-400 hover:text-red-600">Remove</button>
                )}
                {logoError && <p className="text-xs text-red-500 mt-1">{logoError}</p>}
                <p className="text-xs text-gray-400 mt-1">PNG, JPG, SVG · max 5MB · Recommended: square</p>
              </div>
            </div>
          </Section>

          {/* Colors */}
          <Section title="🎨 Brand Colors">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Primary Colour">
                <div className="flex items-center gap-3">
                  <input type="color" value={form.brand_color_primary}
                    onChange={(e) => set("brand_color_primary", e.target.value)}
                    className="w-12 h-10 rounded-xl border border-rose-200 cursor-pointer p-1 bg-white" />
                  <input value={form.brand_color_primary}
                    onChange={(e) => set("brand_color_primary", e.target.value)}
                    className={input} placeholder="#B76E79" maxLength={7} />
                </div>
              </Field>
              <Field label="Secondary Colour">
                <div className="flex items-center gap-3">
                  <input type="color" value={form.brand_color_secondary}
                    onChange={(e) => set("brand_color_secondary", e.target.value)}
                    className="w-12 h-10 rounded-xl border border-rose-200 cursor-pointer p-1 bg-white" />
                  <input value={form.brand_color_secondary}
                    onChange={(e) => set("brand_color_secondary", e.target.value)}
                    className={input} placeholder="#8B4E57" maxLength={7} />
                </div>
              </Field>
            </div>
          </Section>

          {/* Location & Hours */}
          <Section title="📍 Location & Hours">
            <Field label="Address">
              <input value={form.address} onChange={(e) => set("address", e.target.value)}
                className={input} placeholder="No. 12, Jalan Cantik 3, KL" />
            </Field>
            <Field label="Operating Hours">
              <textarea value={form.operating_hours}
                onChange={(e) => set("operating_hours", e.target.value)}
                rows={4} className={`${input} resize-none`}
                placeholder={"Mon–Fri: 10am – 8pm\nSat: 9am – 9pm\nSun: 10am – 7pm"} />
              <p className="text-xs text-gray-400 mt-1">One line per day. Displayed in the footer.</p>
            </Field>
          </Section>

          {/* Save */}
          <button type="submit" disabled={saving}
            className="w-full bg-[#B76E79] hover:bg-[#8B4E57] text-white font-semibold py-3 rounded-2xl transition-all disabled:opacity-60 text-sm shadow-md">
            {saving ? "Saving..." : saved ? "✅ Saved!" : "💾 Save Brand Settings"}
          </button>
        </form>

        {/* ── Preview ── */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-rose-100 sticky top-20">
            <h3 className="font-semibold text-[#2D1B1E] text-sm mb-4">Live Preview</h3>

            {/* Mock hero */}
            <div className="rounded-xl overflow-hidden mb-3">
              <div className="p-4 text-white text-center" style={{ background: `linear-gradient(135deg, #2D1B1E, ${form.brand_color_secondary}, ${form.brand_color_primary})` }}>
                <div className="w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center text-white font-bold overflow-hidden"
                  style={{ background: form.brand_color_primary }}>
                  {form.logo_url ? (
                    <Image src={form.logo_url} alt="logo" width={40} height={40} className="object-contain" unoptimized />
                  ) : (
                    form.business_name[0]
                  )}
                </div>
                <p className="font-playfair text-sm font-bold">{form.business_name}</p>
                <p className="text-xs opacity-75 mt-0.5 italic">{form.slogan}</p>
              </div>
            </div>

            {/* Color swatches */}
            <div className="flex gap-2 mb-3">
              <div className="flex-1 h-10 rounded-xl flex items-center justify-center text-white text-xs font-medium shadow-sm"
                style={{ backgroundColor: form.brand_color_primary }}>
                Primary
              </div>
              <div className="flex-1 h-10 rounded-xl flex items-center justify-center text-white text-xs font-medium shadow-sm"
                style={{ backgroundColor: form.brand_color_secondary }}>
                Secondary
              </div>
            </div>

            {/* Info preview */}
            <div className="text-xs text-gray-500 space-y-1">
              <p>📱 wa.me/{form.whatsapp}</p>
              <p className="truncate">📍 {form.address}</p>
            </div>

            <p className="text-xs text-gray-400 mt-3 text-center">Changes update the website after save</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────
const input = "w-full border border-rose-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#B76E79]";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-rose-100 space-y-4">
      <h3 className="font-semibold text-[#2D1B1E] text-sm">{title}</h3>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs text-gray-500 font-medium block mb-1">{label}</label>
      {children}
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-[#B76E79] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
