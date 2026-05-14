"use client";
import { useEffect, useState } from "react";

interface SectionItem {
  id: string;
  section_key: string;
  label: string;
  icon: string;
  position: number;
  is_visible: boolean;
}

export default function WebsitePage() {
  const [sections, setSections] = useState<SectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/admin/website")
      .then((r) => r.json())
      .then((d) => { setSections(d); setLoading(false); });
  }, []);

  // ── Drag & Drop ──────────────────────────────────────────
  function onDragStart(index: number) {
    setDragIndex(index);
  }

  function onDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    setDragOverIndex(index);
    if (dragIndex === null || dragIndex === index) return;

    setSections((prev) => {
      const next = [...prev];
      const [moved] = next.splice(dragIndex, 1);
      next.splice(index, 0, moved);
      return next.map((s, i) => ({ ...s, position: i }));
    });
    setDragIndex(index);
  }

  function onDragEnd() {
    setDragIndex(null);
    setDragOverIndex(null);
  }

  // ── Up / Down ────────────────────────────────────────────
  function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= sections.length) return;
    setSections((prev) => {
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next.map((s, i) => ({ ...s, position: i }));
    });
  }

  function toggleVisible(index: number) {
    setSections((prev) =>
      prev.map((s, i) => i === index ? { ...s, is_visible: !s.is_visible } : s)
    );
  }

  async function save() {
    setSaving(true);
    await fetch("/api/admin/website", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sections.map(({ id, position, is_visible }) => ({ id, position, is_visible }))),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-playfair text-2xl font-bold text-[#2D1B1E]">Website Sections</h1>
        <p className="text-gray-500 text-sm">Drag to reorder · Toggle to show/hide sections on your website</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Section list ── */}
        <div className="lg:col-span-2 space-y-2">
          {sections.map((s, i) => (
            <div
              key={s.id}
              draggable
              onDragStart={() => onDragStart(i)}
              onDragOver={(e) => onDragOver(e, i)}
              onDragEnd={onDragEnd}
              className={`bg-white rounded-2xl border transition-all select-none ${
                dragIndex === i
                  ? "opacity-50 scale-95 border-[#B76E79] shadow-lg"
                  : dragOverIndex === i && dragIndex !== null
                  ? "border-[#B76E79] shadow-md bg-rose-50"
                  : "border-rose-50 shadow-sm hover:shadow-md"
              }`}
            >
              <div className="flex items-center gap-3 p-4">
                {/* Drag handle */}
                <div className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-400 transition-colors shrink-0 px-1">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/>
                    <circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/>
                    <circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/>
                  </svg>
                </div>

                {/* Position badge */}
                <div className="w-7 h-7 rounded-lg bg-rose-50 flex items-center justify-center text-xs font-bold text-[#B76E79] shrink-0">
                  {i + 1}
                </div>

                {/* Icon + Label */}
                <div className="flex-1 min-w-0 flex items-center gap-2">
                  <span className="text-xl">{s.icon}</span>
                  <div>
                    <p className={`font-semibold text-sm ${s.is_visible ? "text-[#2D1B1E]" : "text-gray-400 line-through"}`}>
                      {s.label}
                    </p>
                    <p className="text-xs text-gray-400">{s.section_key}</p>
                  </div>
                </div>

                {/* Up / Down */}
                <div className="flex flex-col gap-0.5 shrink-0">
                  <button onClick={() => move(i, -1)} disabled={i === 0}
                    className="w-6 h-6 flex items-center justify-center rounded hover:bg-rose-50 text-gray-400 hover:text-[#B76E79] disabled:opacity-20 transition-all text-xs">
                    ▲
                  </button>
                  <button onClick={() => move(i, 1)} disabled={i === sections.length - 1}
                    className="w-6 h-6 flex items-center justify-center rounded hover:bg-rose-50 text-gray-400 hover:text-[#B76E79] disabled:opacity-20 transition-all text-xs">
                    ▼
                  </button>
                </div>

                {/* Toggle */}
                <button
                  onClick={() => toggleVisible(i)}
                  className={`relative w-11 h-6 rounded-full transition-all duration-200 shrink-0 ${
                    s.is_visible ? "bg-[#B76E79]" : "bg-gray-200"
                  }`}
                >
                  <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-200 ${
                    s.is_visible ? "left-5" : "left-0.5"
                  }`} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* ── Info panel ── */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-rose-100 sticky top-20">
            <h3 className="font-semibold text-[#2D1B1E] text-sm mb-3">How it works</h3>
            <div className="space-y-3 text-sm text-gray-500">
              <div className="flex gap-2">
                <span>⠿</span>
                <p><strong>Drag</strong> the dots on the left to reorder sections</p>
              </div>
              <div className="flex gap-2">
                <span>▲▼</span>
                <p><strong>Arrows</strong> to move up/down one step</p>
              </div>
              <div className="flex gap-2">
                <span className="shrink-0">🔘</span>
                <p><strong>Toggle</strong> to show or hide a section</p>
              </div>
              <div className="flex gap-2">
                <span>💾</span>
                <p>Click <strong>Save</strong> to apply changes to the live website</p>
              </div>
            </div>

            {/* Current order preview */}
            <div className="mt-4 pt-4 border-t border-rose-50">
              <p className="text-xs text-gray-400 font-medium mb-2">Current order (visible only)</p>
              <div className="space-y-1">
                {sections.filter(s => s.is_visible).map((s, i) => (
                  <div key={s.id} className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="w-4 h-4 rounded bg-[#B76E79] text-white flex items-center justify-center text-[10px] font-bold">
                      {i + 1}
                    </span>
                    <span>{s.icon}</span>
                    <span>{s.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={save}
              disabled={saving}
              className="w-full mt-4 bg-[#B76E79] hover:bg-[#8B4E57] text-white font-semibold py-2.5 rounded-xl transition-all disabled:opacity-60 text-sm"
            >
              {saving ? "Saving..." : saved ? "✅ Saved!" : "💾 Save Layout"}
            </button>
          </div>
        </div>
      </div>
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
