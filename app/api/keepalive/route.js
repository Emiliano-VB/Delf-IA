import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Lo llama a diario el cron de Vercel (ver vercel.json). Hace una consulta mínima a Supabase
// para que el plan gratuito no pause el proyecto por inactividad.
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return Response.json({ ok: false, error: 'config' }, { status: 500 });

  const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { error } = await supabase.from('profiles').select('id', { count: 'exact', head: true });
  if (error) {
    console.error('keepalive:', error.message);
    return Response.json({ ok: false }, { status: 502 });
  }
  return Response.json({ ok: true, at: new Date().toISOString() });
}
