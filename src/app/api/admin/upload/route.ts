import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

const DEFAULT_BUCKET = "service-media";
const ALLOWED_BUCKETS = ["service-media", "brand-assets"];
const MAX_IMAGE_SIZE = 8 * 1024 * 1024;  // 8 MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50 MB

export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const bucketParam = searchParams.get("bucket") ?? DEFAULT_BUCKET;
    const BUCKET = ALLOWED_BUCKETS.includes(bucketParam) ? bucketParam : DEFAULT_BUCKET;

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");

    if (!isImage && !isVideo) {
      return NextResponse.json({ error: "Only images and videos are allowed" }, { status: 400 });
    }

    const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File too large. Max ${isVideo ? "50MB" : "8MB"}` },
        { status: 400 }
      );
    }

    // Build unique path
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
    const path = `services/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const buffer = await file.arrayBuffer();

    const { error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(path, buffer, { contentType: file.type, upsert: false });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: { publicUrl } } = supabaseAdmin.storage
      .from(BUCKET)
      .getPublicUrl(path);

    return NextResponse.json({
      url: publicUrl,
      type: isImage ? "image" : "video",
      path,
    });
  } catch (err) {
    console.error("[upload error]", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

// DELETE a file from storage
export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const { path, bucket } = body as { path?: string; bucket?: string };
    if (!path) return NextResponse.json({ error: "No path" }, { status: 400 });

    const targetBucket = ALLOWED_BUCKETS.includes(bucket ?? "") ? (bucket as string) : DEFAULT_BUCKET;

    const { error } = await supabaseAdmin.storage.from(targetBucket).remove([path]);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[delete error]", err);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
