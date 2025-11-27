// /lib/supabase/getPublicUrl.ts
export function getPublicUrl(path: string) {
  return `https://supabase.doubleguerra.pro/storage/v1/object/public/${path}`;
}
