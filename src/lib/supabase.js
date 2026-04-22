import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const BUCKET = 'productos';

export const uploadImage = async (blobUrl) => {
  if (!blobUrl) return null;
  if (!blobUrl.startsWith('blob:')) return blobUrl;

  const res  = await fetch(blobUrl);
  const blob = await res.blob();
  const ext  = blob.type === 'image/png' ? 'png' : 'jpg';
  const path = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
    contentType: blob.type,
    upsert: false,
  });

  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
};
