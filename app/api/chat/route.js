import { createClient } from '@supabase/supabase-js';
import { askTutor, getModels, prepareContents } from '../../../lib/tutor';
import {
  HISTORY_SEND_LIMIT,
  MAX_INPUT_CHARS,
  MINUTES_PER_REPLY,
  XP_PER_REPLY,
} from '../../../lib/config';

export const runtime = 'nodejs';
export const maxDuration = 60; // segundos (los reintentos pueden tardar)
export const dynamic = 'force-dynamic';

function fail(message, status) {
  return Response.json({ error: message }, { status });
}

export async function POST(request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey || !process.env.GEMINI_API_KEY) {
    console.error('Faltan variables de entorno (Supabase o GEMINI_API_KEY)');
    return fail('El servidor no está configurado correctamente.', 500);
  }

  // 1. Autenticación: el navegador envía el token de sesión de Supabase.
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return fail('Inicia sesión para continuar.', 401);

  let body;
  try {
    body = await request.json();
  } catch {
    return fail('Solicitud inválida.', 400);
  }
  const message = typeof body?.message === 'string' ? body.message.trim() : '';
  if (!message) return fail('Escribe un mensaje.', 400);
  if (message.length > MAX_INPUT_CHARS) {
    return fail(`El mensaje es demasiado largo (máximo ${MAX_INPUT_CHARS} caracteres).`, 400);
  }

  // Cliente de Supabase "como el alumno": las políticas RLS se aplican con su token.
  const supabase = createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData?.user) return fail('Tu sesión expiró. Inicia sesión de nuevo.', 401);
  const userId = userData.user.id;

  // 2. Historial reciente (antes de guardar el mensaje nuevo).
  const { data: rows, error: historyError } = await supabase
    .from('chat_history')
    .select('role, content')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(HISTORY_SEND_LIMIT);
  if (historyError) console.error('No se pudo leer el historial:', historyError.message);
  const previous = (rows || []).reverse();

  const askedAt = new Date().toISOString();

  // 3. Respuesta del tutor (reintentos + fallback entre modelos).
  let reply = null;
  try {
    const contents = prepareContents(previous, message);
    ({ text: reply } = await askTutor(contents, getModels()));
  } catch (err) {
    console.error('Error al consultar a Gemini:', err);
  }
  if (!reply) {
    return fail('No se pudo obtener respuesta del tutor. Intenta enviar tu mensaje nuevamente.', 502);
  }

  // Se guardan juntos y solo si hubo respuesta: así un fallo no deja mensajes huérfanos
  // en el historial (con fechas distintas para conservar el orden).
  const { error: saveError } = await supabase.from('chat_history').insert([
    { user_id: userId, role: 'user', content: message, created_at: askedAt },
    { user_id: userId, role: 'assistant', content: reply, created_at: new Date().toISOString() },
  ]);
  if (saveError) console.error('No se pudo guardar la conversación:', saveError.message);

  // 4. Progreso (solo si el perfil se leyó bien, para no sobrescribir con valores por defecto).
  let updatedProfile = null;
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('xp, minutes_today')
    .eq('id', userId)
    .single();
  if (profileError || !profile) {
    console.error('No se pudo leer el perfil:', profileError?.message);
  } else {
    const xp = (profile.xp ?? 0) + XP_PER_REPLY;
    const next = {
      xp,
      level: Math.floor(xp / 100) + 1,
      minutes_today: (profile.minutes_today ?? 0) + MINUTES_PER_REPLY,
    };
    const { error: updateError } = await supabase.from('profiles').update(next).eq('id', userId);
    if (updateError) console.error('No se pudo actualizar el progreso:', updateError.message);
    else updatedProfile = next;
  }

  return Response.json({ reply, profile: updatedProfile });
}
