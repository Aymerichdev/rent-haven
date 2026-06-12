// Reescrito: ahora sube archivos vía la API FastAPI (que a su vez los guarda en Supabase Storage).
import { supabase } from "@/integrations/supabase/client";

export const STORAGE_BUCKET = "property-images";
const MAX_BYTES = 5 * 1024 * 1024;

export function validateImageFile(file: File): string | null {
  if (!file.type.startsWith("image/")) return "Solo se permiten imágenes";
  if (file.size > MAX_BYTES) return "La imagen supera los 5MB";
  return null;
}

/** Sube una imagen y devuelve su URL pública. */
export async function uploadImage(folder: string, file: File): Promise<string> {
  const err = validateImageFile(file);
  if (err) throw new Error(err);
  const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase();
  const fakePath = `${folder}/placeholder.${ext}`;
  const { data, error } = await supabase.storage.from(STORAGE_BUCKET).upload(fakePath, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) throw new Error(error.message);
  return (data as any).publicUrl as string;
}

export async function uploadImages(folder: string, files: File[]): Promise<string[]> {
  const urls: string[] = [];
  for (const f of files) urls.push(await uploadImage(folder, f));
  return urls;
}

/** Borrado best-effort por URL pública. */
export async function deleteImageByUrl(url: string): Promise<void> {
  try {
    const marker = `/${STORAGE_BUCKET}/`;
    const idx = url.indexOf(marker);
    if (idx === -1) return;
    const path = decodeURIComponent(url.slice(idx + marker.length));
    await supabase.storage.from(STORAGE_BUCKET).remove([path]);
  } catch {
    /* noop */
  }
}

export async function deleteFolder(folder: string): Promise<void> {
  try {
    const { data, error } = await supabase.storage.from(STORAGE_BUCKET).list(folder);
    if (error || !data?.length) return;
    const paths = (data as any[]).map((d: any) => `${folder}/${d.name}`);
    await supabase.storage.from(STORAGE_BUCKET).remove(paths);
  } catch {
    /* noop */
  }
}
