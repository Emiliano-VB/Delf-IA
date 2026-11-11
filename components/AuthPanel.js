'use client';

import { useState } from 'react';
import Header from './Header';

export default function AuthPanel({ supabase }) {
  const [tab, setTab] = useState('login');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null); // { type: 'error' | 'warn' | 'success', text }

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [regEmail, setRegEmail] = useState('');
  const [regPass, setRegPass] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  function switchTab(next) {
    setTab(next);
    setNotice(null);
  }

  async function handleLogin(e) {
    e.preventDefault();
    if (!email.trim() || !password) {
      setNotice({ type: 'warn', text: 'Escribe tu correo y tu contraseña.' });
      return;
    }
    setBusy(true);
    setNotice(null);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      console.error('Fallo de inicio de sesión:', error.message);
      setNotice({ type: 'error', text: 'No se pudo iniciar sesión. Revisa tu correo y contraseña.' });
    }
    // Si todo sale bien, la página detecta la sesión y muestra el chat.
    setBusy(false);
  }

  async function handleRegister(e) {
    e.preventDefault();
    if (!regEmail.trim() || !regPass || !firstName.trim()) {
      setNotice({ type: 'warn', text: 'Completa correo, contraseña y nombre.' });
      return;
    }
    if (regPass.length < 8) {
      setNotice({ type: 'warn', text: 'La contraseña debe tener al menos 8 caracteres.' });
      return;
    }
    setBusy(true);
    setNotice(null);
    // Los datos del perfil viajan en los metadatos; la app crea la fila de `profiles`
    // la primera vez que el alumno inicia sesión.
    const { data, error } = await supabase.auth.signUp({
      email: regEmail.trim(),
      password: regPass,
      options: {
        data: { first_name: firstName.trim(), last_name: lastName.trim() },
      },
    });
    if (error) {
      console.error('Fallo en el registro:', error.message);
      setNotice({ type: 'error', text: 'No se pudo crear la cuenta. Verifica los datos o prueba con otro correo.' });
    } else if (!data.session) {
      setNotice({
        type: 'success',
        text: '¡Cuenta creada! Revisa tu correo para confirmarla y luego inicia sesión.',
      });
    }
    // Si hay sesión (confirmación de correo desactivada), la página entra sola.
    setBusy(false);
  }

  return (
    <div className="auth-wrap">
      <Header />
      <h2 style={{ marginTop: 24 }}>¡Bienvenido!</h2>
      <p>Tu tutor personal de matemáticas socrático paso a paso.</p>

      <div className="tabs" role="tablist">
        <button type="button" role="tab" className={`tab ${tab === 'login' ? 'active' : ''}`} onClick={() => switchTab('login')}>
          Iniciar Sesión
        </button>
        <button type="button" role="tab" className={`tab ${tab === 'register' ? 'active' : ''}`} onClick={() => switchTab('register')}>
          Registrarse
        </button>
      </div>

      {notice && <div className={`alert ${notice.type}`}>{notice.text}</div>}

      {tab === 'login' ? (
        <form onSubmit={handleLogin}>
          <label className="field">
            <span>Correo electrónico</span>
            <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label className="field">
            <span>Contraseña</span>
            <input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
          <button type="submit" className="btn block" disabled={busy}>
            {busy ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleRegister}>
          <label className="field">
            <span>Correo electrónico</span>
            <input type="email" autoComplete="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} />
          </label>
          <label className="field">
            <span>Contraseña (mínimo 8 caracteres)</span>
            <input type="password" autoComplete="new-password" value={regPass} onChange={(e) => setRegPass(e.target.value)} />
          </label>
          <label className="field">
            <span>Nombre</span>
            <input type="text" autoComplete="given-name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          </label>
          <label className="field">
            <span>Apellido</span>
            <input type="text" autoComplete="family-name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </label>
          <button type="submit" className="btn block" disabled={busy}>
            {busy ? 'Creando cuenta…' : 'Crear Cuenta'}
          </button>
        </form>
      )}
    </div>
  );
}
