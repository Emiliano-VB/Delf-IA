import { createClient } from '@supabase/supabase-js';
import { tutorRespondFull } from '../../../lib/tutorRules';
import {
  HISTORY_SEND_LIMIT,
  MAX_INPUT_CHARS,
  MINUTES_PER_REPLY,
  XP_PER_REPLY,
} from '../../../lib/config';

export const runtime = 'nodejs';
export const maxDuration = 60; // segundos (los reintentos pueden tardar)
export const dynamic = 'force-dynamic';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Título del chat a partir del primer mensaje.
function makeTitle(message) {
  const clean = message.replace(/\s+/g, ' ').trim();
  if (clean.length < 4 || /^(hola|buenas|hey|holi|ejercicio|otro|reto|ayuda)\b/i.test(clean)) {
    const fecha = new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'short', timeZone: 'America/Mexico_City' });
    return `Práctica · ${fecha}`;
  }
  return clean.length > 40 ? `${clean.slice(0, 40)}…` : clean;
}

function fail(message, status) {
  return Response.json({ error: message }, { status });
}

export async function POST(request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    console.error('Faltan variables de entorno de Supabase');
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

  const convIdRaw = typeof body?.conversationId === 'string' ? body.conversationId : null;
  if (convIdRaw && !UUID.test(convIdRaw)) return fail('Solicitud inválida.', 400);
  let convId = convIdRaw;

  // Cliente de Supabase "como el alumno": las políticas RLS se aplican con su token.
  const supabase = createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData?.user) return fail('Tu sesión expiró. Inicia sesión de nuevo.', 401);
  const userId = userData.user.id;

  // 2. El chat debe ser del alumno (las políticas RLS lo comprueban) y se lee su historial reciente.
  let previous = [];
  if (convId) {
    const { data: conv, error: convError } = await supabase.from('conversations').select('id').eq('id', convId).maybeSingle();
    if (convError || !conv) return fail('No se encontró ese chat. Abre uno nuevo.', 404);
    const { data: rows, error: historyError } = await supabase
      .from('chat_history')
      .select('role, content, created_at')
      .eq('user_id', userId)
      .eq('conversation_id', convId)
      .order('created_at', { ascending: false })
      .limit(HISTORY_SEND_LIMIT);
    if (historyError) console.error('No se pudo leer el historial:', historyError.message);
    previous = (rows || []).reverse();
  }

  const askedAt = new Date().toISOString();
  // Anti-spam (en todos los chats del alumno): menos de 15 s entre mensajes no suma el XP base.
  const { data: lastRows } = await supabase
    .from('chat_history')
    .select('created_at')
    .eq('user_id', userId)
    .eq('role', 'user')
    .order('created_at', { ascending: false })
    .limit(1);
  const lastAt = lastRows?.[0]?.created_at;
  const tooFast = lastAt ? Date.now() - new Date(lastAt).getTime() < 15000 : false;

  // Nivel de partida: el del último logro, para que un chat nuevo no empiece desde cero.
  const { data: lastAch } = await supabase
    .from('achievements')
    .select('level')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1);
  const baseLevel = lastAch?.[0]?.level || 1;

  // 3. Respuesta del tutor (motor de reglas local: sin IA externa, sin claves).
  let reply = null;
  let bonusXp = 0;
  let achievement = null;
  try {
    ({ reply, bonusXp, achievement } = tutorRespondFull(message, previous, { userId, baseLevel }));
  } catch (err) {
    console.error('Error en el tutor:', err);
  }
  if (!reply) {
    return fail('No se pudo obtener respuesta del tutor. Intenta enviar tu mensaje nuevamente.', 502);
  }

  // Chat nuevo: se crea con el primer mensaje.
  let conversation = null;
  if (!convId) {
    const { data: created, error: createError } = await supabase
      .from('conversations')
      .insert({ user_id: userId, title: makeTitle(message) })
      .select('id, title, updated_at')
      .single();
    if (createError || !created) {
      console.error('No se pudo crear el chat:', createError?.message);
      return fail('No se pudo crear el chat. Intenta enviar tu mensaje nuevamente.', 500);
    }
    conversation = created;
    convId = created.id;
  }

  // Se guardan juntos y solo si hubo respuesta: así un fallo no deja mensajes huérfanos
  // en el historial (con fechas distintas para conservar el orden).
  const { error: saveError } = await supabase.from('chat_history').insert([
    { user_id: userId, conversation_id: convId, role: 'user', content: message, created_at: askedAt },
    { user_id: userId, conversation_id: convId, role: 'assistant', content: reply, created_at: new Date().toISOString() },
  ]);
  if (saveError) console.error('No se pudo guardar la conversación:', saveError.message);

  if (!conversation) {
    const now = new Date().toISOString();
    const { error: touchError } = await supabase.from('conversations').update({ updated_at: now }).eq('id', convId);
    if (touchError) console.error('No se pudo actualizar el chat:', touchError.message);
    conversation = { id: convId, updated_at: now };
  }

  // Logro: se guarda para la vitrina del alumno.
  if (achievement) {
    const { error: achError } = await supabase.from('achievements').insert({
      user_id: userId,
      level: achievement.level,
      name: achievement.name,
      topic: achievement.topic || null,
    });
    if (achError) console.error('No se pudo guardar el logro:', achError.message);
  }

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
    const xp = (profile.xp ?? 0) + (tooFast ? 0 : XP_PER_REPLY) + bonusXp;
    const next = {
      xp,
      level: Math.floor(xp / 100) + 1,
      minutes_today: (profile.minutes_today ?? 0) + MINUTES_PER_REPLY,
    };
    const { error: updateError } = await supabase.from('profiles').update(next).eq('id', userId);
    if (updateError) console.error('No se pudo actualizar el progreso:', updateError.message);
    else updatedProfile = next;
  }

  return Response.json({ reply, profile: updatedProfile, achievement, conversation });
}
