import { DAILY_GOAL_MIN } from '../lib/config';

export default function Sidebar({ profile, profileOk, leaderboard, onSignOut }) {
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
