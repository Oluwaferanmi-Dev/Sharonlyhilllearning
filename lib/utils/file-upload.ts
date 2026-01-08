import { createClient } from "@/lib/supabase/client";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/jpg"];

export interface UploadProgress {
  progress: number;
  status: "idle" | "uploading" | "success" | "error";
  error?: string;
}

export async function uploadProfilePicture(
  userId: string,
  file: File,
  onProgress?: (progress: UploadProgress) => void
): Promise<{ url: string; path: string } | null> {
  try {
    // Validate file
    if (!ALLOWED_TYPES.includes(file.type)) {
      onProgress?.({
        progress: 0,
        status: "error",
        error: "Only JPG and PNG files are allowed",
      });
      return null;
    }

    if (file.size > MAX_FILE_SIZE) {
      onProgress?.({
        progress: 0,
        status: "error",
        error: "File size must be less than 5MB",
      });
      return null;
    }

    onProgress?.({ progress: 10, status: "uploading" });

    const formData = new FormData();
    formData.append("file", file);
    formData.append("userId", userId);

    const response = await fetch("/api/auth/upload-profile-picture", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      onProgress?.({
        progress: 0,
        status: "error",
        error: errorData.error || "Upload failed",
      });
      console.error("[v0] Upload error:", errorData);
      return null;
    }

    onProgress?.({ progress: 100, status: "success" });

    const { url, path } = await response.json();
    return { url, path };
  } catch (error) {
    console.error("[v0] Upload exception:", error);
    onProgress?.({
      progress: 0,
      status: "error",
      error: error instanceof Error ? error.message : "Upload failed",
    });
    return null;
  }
}

export async function deleteProfilePicture(
  userId: string,
  filePath: string
): Promise<boolean> {
  try {
    const supabase = createClient();

    const { error } = await supabase.storage
      .from("staff-profiles")
      .remove([filePath]);

    if (error) {
      console.error("[v0] Delete error:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("[v0] Delete exception:", error);
    return false;
  }
}

export function getFileNameFromPath(path: string): string {
  return path.split("/").pop() || "";
}
