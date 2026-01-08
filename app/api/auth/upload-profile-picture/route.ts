import { type NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

const BUCKET_NAME = "staff-profiles";
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/jpg"];

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const userId = formData.get("userId") as string;

    if (!file || !userId) {
      return NextResponse.json(
        { error: "Missing file or userId" },
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

    console.log("[v0] API: Uploading file:", filePath);

    const buffer = await file.arrayBuffer();

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, buffer, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error("[v0] API: Upload error:", error);
      return NextResponse.json(
        { error: "Failed to upload file" },
        { status: 500 }
      );
    }

    // Generate public URL
    const { data: publicData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);
    const publicUrl = publicData?.publicUrl;

    if (!publicUrl) {
      console.error("[v0] API: Failed to generate public URL");
      return NextResponse.json(
        { error: "Failed to generate public URL" },
        { status: 500 }
      );
    }

    console.log("[v0] API: File uploaded successfully:", publicUrl);

    // Update database with the new profile picture path and URL
    const { data: dbData, error: dbError } = await supabase
      .from("profiles")
      .update({
        profile_picture_path: filePath,
        profile_picture_url: publicUrl,
        picture_uploaded_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (dbError) {
      console.error("[v0] API: Database update error:", dbError);
      return NextResponse.json(
        { error: "Failed to update database" },
        { status: 500 }
      );
    }

    console.log("[v0] API: Database updated successfully:", dbData);

    return NextResponse.json(
      { url: publicUrl, path: filePath },
      { status: 200 }
    );
  } catch (error) {
    console.error("[v0] API: Upload exception:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 }
    );
  }
}
