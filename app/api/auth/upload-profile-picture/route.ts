import { type NextRequest, NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";

const BUCKET_NAME = "staff-profiles";
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/jpg"];

export async function POST(request: NextRequest) {
  // 10 uploads per IP per hour
  const { allowed } = rateLimit(request, { max: 10, windowMs: 60 * 60 * 1000 }, "upload-profile")
  if (!allowed) {
    return NextResponse.json({ error: "Too many upload attempts. Please try again later." }, { status: 429 })
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const formUserId = formData.get("userId");

    // Prefer the authenticated user's ID when available; during initial signup
    // there may be no session yet, so we fall back to the explicit userId
    // provided by the client.
    const authClient = await createClient()
    const { data: { user }, error: authError } = await authClient.auth.getUser()

    const userId =
      user?.id ??
      (typeof formUserId === "string" && formUserId.length > 0 ? formUserId : null);

    if (authError && !userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!file) {
      return NextResponse.json(
        { error: "Missing file" },
        { status: 400 }
      );
    }

    // Validate file
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Only JPG and PNG files are allowed" },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size must be less than 5MB" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const timestamp = Date.now();
    const extension = file.type === "image/png" ? "png" : "jpg";
    const fileName = `profile_${timestamp}.${extension}`;
    const filePath = `${userId}/${fileName}`;

    const buffer = await file.arrayBuffer();

    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, buffer, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json(
        { error: "Failed to upload file" },
        { status: 500 }
      );
    }

    const { data: publicData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);
    const publicUrl = publicData?.publicUrl;

    if (!publicUrl) {
      return NextResponse.json(
        { error: "Failed to generate public URL" },
        { status: 500 }
      );
    }

    const { error: dbError } = await supabase
      .from("profiles")
      .update({
        profile_picture_path: filePath,
        profile_picture_url: publicUrl,
        picture_uploaded_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (dbError) {
      return NextResponse.json(
        { error: "Failed to update database" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { url: publicUrl, path: filePath },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 }
    );
  }
}
