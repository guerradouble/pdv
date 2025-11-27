// /lib/supabase/storage.ts
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { getPublicUrl } from "@/lib/supabase/getPublicUrl";

const supabase = getSupabaseBrowserClient();
const BUCKET = "cardapio";
const FOLDER = "images";

// =======================================
// UPLOAD
// =======================================
export async function uploadImages(files: File[]) {
  const results: string[] = [];

  for (const file of files) {
    const filePath = `${FOLDER}/${Date.now()}-${file.name}`;

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, file, { upsert: true });

    if (error) throw error;

    const publicUrl = getPublicUrl(`${BUCKET}/${filePath}`);
    results.push(publicUrl);
  }

  return results;
}

// =======================================
// LISTAR 
// =======================================
export async function listImages() {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .list(FOLDER, { limit: 1000 });

  if (error) throw error;

  return data.map((item) => {
    const path = `${BUCKET}/${FOLDER}/${item.name}`;
    return {
      name: item.name,
      path: `${FOLDER}/${item.name}`,
      url: getPublicUrl(path),
    };
  });
}

// =======================================
// EXCLUIR
// =======================================
export async function deleteImage(path: string) {
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) throw error;
}
