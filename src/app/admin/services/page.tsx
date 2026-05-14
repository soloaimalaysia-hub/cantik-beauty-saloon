"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";

interface MediaItem {
  url: string;
  type: "image" | "video";
  path?: string;
}

interface Service {
  id: string;
  service_name: string;
  duration_minutes: number;
  price: number;
  is_active: boolean;
  media: MediaItem[];
}

const EMPTY = { service_name: "", duration_minutes: 60, price: 0 };
const MAX_PHOTOS = 9;
const MAX_VIDEOS = 2;

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);

  // Media state
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const photoCount = mediaItems.filter((m) => m.type === "image").length;
  const videoCount = mediaItems.filter((m) => m.type === "video").length;
  const canAddMore = photoCount < MAX_PHOTOS || videoCount < MAX_VIDEOS;

  const load = () =>
    fetch("/api/admin/services")
      .then((r) => r.json())
      .then((d) => { setServices(d); setLoading(false); });

  useEffect(() => { load(); }, []);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploadError("");
    setUploading(true);

    for (const file of files) {
      const isImage = file.type.startsWith("image/");
      const isVideo = file.type.startsWith("video/");

      // Check limits
      if (isImage && photoCount + mediaItems.filter(m => m.type === "image").length >= MAX_PHOTOS) {
        setUploadError(`Max ${MAX_PHOTOS} photos allowed`);
        continue;
      }
      if (isVideo && videoCount + mediaItems.filter(m => m.type === "video").length >= MAX_VIDEOS) {
        setUploadError(`Max ${MAX_VIDEOS} videos allowed`);
        continue;
      }

      const fd = new FormData();
      fd.append("file", file);

      try {
        const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
        const data = await res.json();
        if (data.error) {
          setUploadError(data.error);
        } else {
          setMediaItems((prev) => [...prev, { url: data.url, type: data.type, path: data.path }]);
        }
      } catch {
        setUploadError("Upload failed. Try again.");
      }
    }

    setUploading(false);
    // Reset input so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function removeMedia(index: number) {
    const item = mediaItems[index];
    // Delete from storage if we have a path
    if (item.path) {
      await fetch("/api/admin/upload", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: item.path }),
      });
    }
    setMediaItems((prev) => prev.filter((_, i) => i !== index));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const payload = { ...form, media: mediaItems };

    if (editing) {
      await fetch("/api/admin/services", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editing.id, ...payload }),
      });
      setEditing(null);
    } else {
      await fetch("/api/admin/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }
    setForm(EMPTY);
    setMediaItems([]);
    setUploadError("");
    setSaving(false);
    load();
  }

  async function del(id: string) {
    if (!confirm("Delete this service?")) return;
    await fetch("/api/admin/services", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    load();
  }

  function startEdit(s: Service) {
    setEditing(s);
    setForm({ service_name: s.service_name, duration_minutes: s.duration_minutes, price: s.price });
    setMediaItems(s.media ?? []);
    setUploadError("");
  }

  function cancelEdit() {
    setEditing(null);
    setForm(EMPTY);
    setMediaItems([]);
    setUploadError("");
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-playfair text-2xl font-bold text-[#2D1B1E]">Services</h1>
        <p className="text-gray-500 text-sm">{services.length} services</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Form ── */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-rose-100">
          <h2 className="font-semibold text-[#2D1B1E] mb-4">
            {editing ? "✏️ Edit Service" : "➕ Add Service"}
          </h2>
          <form onSubmit={save} className="space-y-3">
            {/* Service Name */}
            <div>
              <label className="text-xs text-gray-500 font-medium">Service Name</label>
              <input
                value={form.service_name}
                onChange={(e) => setForm({ ...form, service_name: e.target.value })}
                required
                className="w-full border border-rose-200 rounded-xl px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-[#B76E79]"
                placeholder="e.g. Hair Colouring"
              />
            </div>

            {/* Duration */}
            <div>
              <label className="text-xs text-gray-500 font-medium">Duration (minutes)</label>
              <input
                type="number"
                value={form.duration_minutes}
                onChange={(e) => setForm({ ...form, duration_minutes: Number(e.target.value) })}
                required
                min={5}
                className="w-full border border-rose-200 rounded-xl px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-[#B76E79]"
              />
            </div>

            {/* Price */}
            <div>
              <label className="text-xs text-gray-500 font-medium">Price (RM)</label>
              <input
                type="number"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                required
                min={0}
                step={0.5}
                className="w-full border border-rose-200 rounded-xl px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-[#B76E79]"
              />
            </div>

            {/* ── Media upload ── */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-gray-500 font-medium">Photos & Videos</label>
                <span className="text-xs text-gray-400">
                  {photoCount}/{MAX_PHOTOS} photos · {videoCount}/{MAX_VIDEOS} videos
                </span>
              </div>

              {/* Thumbnail grid */}
              <div className="grid grid-cols-3 gap-2">
                {mediaItems.map((item, i) => (
                  <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 group">
                    {item.type === "image" ? (
                      <Image
                        src={item.url}
                        alt={`media-${i}`}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <video
                        src={item.url}
                        className="w-full h-full object-cover"
                        muted
                        playsInline
                      />
                    )}
                    {/* Type badge */}
                    <span className="absolute bottom-1 left-1 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                      {item.type === "video" ? "🎬" : "📷"}
                    </span>
                    {/* Delete button */}
                    <button
                      type="button"
                      onClick={() => removeMedia(i)}
                      className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow"
                    >
                      ×
                    </button>
                  </div>
                ))}

                {/* Add button */}
                {canAddMore && (
                  <label className={`aspect-square border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all ${
                    uploading
                      ? "border-gray-200 bg-gray-50 cursor-not-allowed"
                      : "border-rose-200 hover:border-[#B76E79] hover:bg-rose-50"
                  }`}>
                    {uploading ? (
                      <div className="w-5 h-5 border-2 border-[#B76E79] border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span className="text-2xl text-gray-300 leading-none">+</span>
                        <span className="text-[10px] text-gray-400 mt-0.5">Photo/Video</span>
                      </>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,video/mp4,video/quicktime,video/webm"
                      multiple
                      className="hidden"
                      disabled={uploading}
                      onChange={handleFileSelect}
                    />
                  </label>
                )}
              </div>

              {uploadError && (
                <p className="text-xs text-red-500 mt-1">{uploadError}</p>
              )}
              <p className="text-[10px] text-gray-400 mt-1">
                Max 9 photos (8MB each) · 2 videos (50MB each)
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={saving || uploading}
                className="flex-1 bg-[#B76E79] hover:bg-[#8B4E57] text-white text-sm font-medium py-2 rounded-xl transition-all disabled:opacity-60"
              >
                {saving ? "Saving..." : editing ? "Update" : "Add Service"}
              </button>
              {editing && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="px-4 py-2 border border-rose-200 text-gray-500 text-sm rounded-xl hover:bg-rose-50 transition-all"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* ── Service cards ── */}
        <div className="lg:col-span-2 space-y-3">
          {services.map((s) => (
            <div key={s.id} className="bg-white rounded-2xl shadow-sm border border-rose-50 overflow-hidden">
              {/* Media strip */}
              {s.media?.length > 0 && (
                <div className="flex gap-1 p-2 bg-rose-50/50 overflow-x-auto">
                  {s.media.map((m, i) => (
                    <div key={i} className="relative w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-gray-100">
                      {m.type === "image" ? (
                        <Image src={m.url} alt={`svc-${i}`} fill className="object-cover" unoptimized />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-800 text-white text-lg">
                          🎬
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Info + actions */}
              <div className="p-4 flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-[#2D1B1E]">{s.service_name}</p>
                  <p className="text-sm text-gray-400">
                    ⏱ {s.duration_minutes} min · 💰 RM {Number(s.price).toFixed(2)}
                    {s.media?.length > 0 && (
                      <span className="ml-2 text-[#B76E79]">
                        📷 {s.media.filter(m => m.type === "image").length}
                        {s.media.filter(m => m.type === "video").length > 0 &&
                          ` · 🎬 ${s.media.filter(m => m.type === "video").length}`
                        }
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => startEdit(s)}
                    className="text-xs px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-all"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => del(s.id)}
                    className="text-xs px-3 py-1.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-all"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
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
