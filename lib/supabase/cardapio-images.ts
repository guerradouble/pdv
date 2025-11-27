import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const supabase = getSupabaseBrowserClient();
const BUCKET = "cardapio";
const FOLDER = "images";

export async function uploadImages(files: File[]) {
  const results: string[] = [];

  for (const file of files) {
    const filePath = `${FOLDER}/${Date.now()}-${file.name}`;

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, file, { upsert: true });

    if (error) throw error;

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(filePath);

    results.push(data.publicUrl);
  }

  return results;
}

export async function listImages() {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .list(FOLDER, { limit: 1000 });

  if (error) throw error;

  return data.map((item) => ({
    name: item.name,
    path: `${FOLDER}/${item.name}`,
    url: supabase.storage.from(BUCKET).getPublicUrl(`${FOLDER}/${item.name}`)
      .data.publicUrl,
  }));
}

export async function deleteImage(path: string) {
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) throw error;
}
