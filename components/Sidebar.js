import { DAILY_GOAL_MIN } from '../lib/config';

const BADGES = {
  1: { icon: '⚡', name: 'Chispa' },
  2: { icon: '⚙️', name: 'Engrane' },
  3: { icon: '🤖', name: 'Servo' },
  4: { icon: '📡', name: 'Sensor' },
  5: { icon: '🏆', name: 'Maestro' },
};

export default function Sidebar({ profile, profileOk, leaderboard, achievements = [], onSignOut }) {
  const counts = [1, 2, 3, 4, 5].map((l) => achievements.filter((a) => a.level === l).length);
  const recent = achievements.slice(0, 3);
  const mins = profile.minutes_today ?? 0;
  const pct = Math.min(mins / DAILY_GOAL_MIN, 1) * 100;

  return (
    <aside className="sidebar">
      <h2>👤 {profile.first_name || 'Estudiante'}</h2>
      <div style={{ marginTop: 12 }}>
        <button type="button" className="btn" onClick={onSignOut}>
          Cerrar Sesión
        </button>
      </div>

      {!profileOk && (
        <div className="alert warn">
          No se pudo cargar tu progreso; por ahora no se actualizarán tus puntos.
        </div>
      )}

      <hr />
      <h3>🏆 Tus Logros</h3>
      <div className="metrics">
        <div className="metric">
          <span className="metric-label">Nivel</span>
          <span className="metric-value">{profile.level ?? 1}</span>
        </div>
        <div className="metric">
          <span className="metric-label">XP Total</span>
          <span className="metric-value">{profile.xp ?? 0}</span>
        </div>
        <div className="metric wide">
          <span className="metric-label">🔥 Racha de Días</span>
          <span className="metric-value">{profile.streak ?? 1} días</span>
        </div>
      </div>

      <div>
        <strong>⏱️ Meta Diaria:</strong> {mins}/{DAILY_GOAL_MIN} min
        <div className="bar" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
          <div className="bar-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <hr />
      <h3>🎖️ Vitrina de Logros</h3>
      <div className="badges">
        {[1, 2, 3, 4, 5].map((l) => (
          <div key={l} className={`badge ${counts[l - 1] ? 'on' : ''}`} title={`${BADGES[l].name} (nivel ${l})`}>
            <span className="badge-icon">{BADGES[l].icon}</span>
            <span className="badge-count">×{counts[l - 1]}</span>
          </div>
        ))}
      </div>
      {recent.length === 0 ? (
        <p className="muted">Resuelve ejercicios para ganar tus primeros logros.</p>
      ) : (
        <ul className="recent-badges">
          {recent.map((a, i) => (
            <li key={`${a.created_at}-${i}`}>
              {BADGES[a.level]?.icon} <strong>{a.name}</strong>
              {a.topic ? <span className="muted"> · {a.topic}</span> : null}
            </li>
          ))}
        </ul>
      )}

      <hr />
      <h3>📊 Tabla de Clasificación</h3>
      {leaderboard === null ? (
        <p className="muted">No se pudo cargar la tabla de líderes.</p>
      ) : (
        <ol className="leaderboard">
          {leaderboard.map((member, idx) => (
            <li key={`${member.first_name}-${idx}`}>
              <strong>{idx + 1}.</strong> {member.first_name} — <code>{member.xp} XP</code>
            </li>
          ))}
        </ol>
      )}
    </aside>
  );
}
