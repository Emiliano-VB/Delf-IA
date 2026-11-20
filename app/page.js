'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import AuthPanel from '../components/AuthPanel';
import ChatMessage from '../components/ChatMessage';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import { HISTORY_LOAD_LIMIT, MAX_INPUT_CHARS } from '../lib/config';
import { getSupabase } from '../lib/supabaseClient';

const EMPTY_PROFILE = {
  first_name: 'Estudiante',
  xp: 0,
  level: 1,
  streak: 1,
  minutes_today: 0,
};

// Lee el perfil; si no existe (primer inicio de sesión), lo crea con los datos del registro.
async function loadOrCreateProfile(supabase, user) {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
  if (error) throw error;
  if (data) return data;

  const meta = user.user_metadata || {};
  const row = {
    id: user.id,
    first_name: meta.first_name || 'Estudiante',
    last_name: meta.last_name || '',
    xp: 0,
    level: 1,
    streak: 1,
    minutes_today: 0,
  };
  const { data: created, error: insertError } = await supabase.from('profiles').insert(row).select().single();
  if (insertError) throw insertError;
  return created;
}

export default function Home() {
  const [supabase, setSupabase] = useState(null);
  const [ready, setReady] = useState(false);
  const [configError, setConfigError] = useState(false);
  const [session, setSession] = useState(null);

  const [profile, setProfile] = useState(null);
  const [profileOk, setProfileOk] = useState(true);
  const [leaderboard, setLeaderboard] = useState([]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [chatError, setChatError] = useState('');
  const endRef = useRef(null);

  // 1. Sesión de Supabase
  useEffect(() => {
    const sb = getSupabase();
    if (!sb) {
      setConfigError(true);
      setReady(true);
      return undefined;
    }
    setSupabase(sb);
    sb.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    // Importante: aquí solo se actualiza el estado (sin llamadas a Supabase dentro del callback).
    const { data: sub } = sb.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // 2. Perfil e historial cuando hay un alumno con sesión
  const user = session?.user ?? null;
  const userId = user?.id ?? null;
  useEffect(() => {
    if (!userId || !supabase) {
      setProfile(null);
      setMessages([]);
      setLeaderboard([]);
      setChatError('');
      return undefined;
    }
    let cancelled = false;
    (async () => {
      try {
        const p = await loadOrCreateProfile(supabase, user);
        if (!cancelled) {
          setProfile(p);
          setProfileOk(true);
        }
      } catch (err) {
        console.error('No se pudo cargar el perfil:', err);
        if (!cancelled) {
          setProfile(null);
          setProfileOk(false);
        }
      }
      try {
        const { data, error } = await supabase
          .from('chat_history')
          .select('role, content')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(HISTORY_LOAD_LIMIT);
        if (error) throw error;
        if (!cancelled) setMessages((data || []).reverse());
      } catch (err) {
        console.error('No se pudo cargar el historial:', err);
        if (!cancelled) setMessages([]);
      }
    })();
    return () => {
      cancelled = true;
    };
    // `user` cambia de identidad en cada refresco del token; basta con el id.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, supabase]);

  // 3. Tabla de clasificación general (se carga cuando el perfil ya está listo)
  const hasProfile = Boolean(profile);
  const refreshLeaderboard = useCallback(async () => {
    if (!supabase || !hasProfile) return;
    const { data, error } = await supabase
      .from('profiles')
      .select('first_name, xp')
      .order('xp', { ascending: false })
      .limit(5);
    if (error) {
      console.error('No se pudo cargar la tabla de clasificación:', error.message);
      setLeaderboard(null);
    } else {
      setLeaderboard(data || []);
    }
  }, [supabase, hasProfile]);

  useEffect(() => {
    refreshLeaderboard();
  }, [refreshLeaderboard]);

  // Desplazar al último mensaje
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, sending]);

  async function handleSignOut() {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) console.error('Fallo al cerrar sesión:', error.message);
  }

  async function sendMessage(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending || !supabase) return;

    setInput('');
    setChatError('');
    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    setSending(true);

    try {
      const { data } = await supabase.auth.getSession(); // token vigente
      const token = data.session?.access_token;
      if (!token) throw new Error('Tu sesión expiró. Inicia sesión de nuevo.');

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: text }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload.error || 'No se pudo obtener respuesta del tutor.');

      setMessages((prev) => [...prev, { role: 'assistant', content: payload.reply }]);
      if (payload.profile) {
        setProfile((prev) => ({ ...(prev || EMPTY_PROFILE), ...payload.profile }));
        refreshLeaderboard();
      }
    } catch (err) {
      console.error(err);
      setChatError(
        err instanceof TypeError
          ? 'No se pudo conectar con el tutor. Revisa tu conexión e intenta de nuevo.'
          : err.message || 'No se pudo obtener respuesta del tutor. Intenta de nuevo.',
      );
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      sendMessage(e);
    }
  }

  // ---------- Render ----------
  if (!ready) {
    return (
      <div className="auth-wrap">
        <p className="muted">Cargando…</p>
      </div>
    );
  }

  if (configError) {
    return (
      <div className="auth-wrap">
        <Header />
        <div className="alert error">
          Falta configurar Supabase: define NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY en las
          variables de entorno y vuelve a desplegar.
        </div>
      </div>
    );
  }

  if (!session) {
    return <AuthPanel supabase={supabase} />;
  }

  return (
    <div className="app">
      <Sidebar
        profile={profile || EMPTY_PROFILE}
        profileOk={profileOk}
        leaderboard={leaderboard}
        onSignOut={handleSignOut}
      />
      <main className="main">
        <Header />
        <p className="caption">¡Aprende paso a paso! Te guiaré para encontrar la respuesta por ti mismo.</p>
        <hr />

        <div className="chat">
          {messages.length === 0 && !sending && (
            <div className="empty">Cuéntame qué problema o duda de matemáticas tienes y lo resolvemos juntos. 🐬</div>
          )}
          {messages.map((m, i) => (
            <ChatMessage key={i} role={m.role} content={m.content} />
          ))}
          {sending && <div className="thinking">Delf-IA está pensando…</div>}
          {chatError && <div className="alert error">{chatError}</div>}
          <div ref={endRef} />
        </div>

        <form className="composer" onSubmit={sendMessage}>
          <textarea
            rows={2}
            value={input}
            maxLength={MAX_INPUT_CHARS}
            placeholder="Escribe tu duda o problema matemático aquí..."
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={sending}
          />
          <button type="submit" className="btn" disabled={sending || !input.trim()}>
            Enviar
          </button>
        </form>
      </main>
    </div>
  );
}
