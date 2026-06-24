import React from 'react';

const KNOWN_ROLES = new Set(['Viewer', 'Proposer', 'Moderator', 'Admin']);
const ROLE_OPTIONS = ['Viewer', 'Proposer', 'Moderator', 'Admin'] as const;

function resolveActorId(): string {
  if (typeof window === 'undefined') {
    return 'dashboard-anonymous';
  }
  return window.localStorage.getItem('lt-actor-id')?.trim() || 'dashboard-anonymous';
}

function resolveRoleBadge(): string {
  if (typeof window === 'undefined') {
    return 'Viewer';
  }
  const raw = window.localStorage.getItem('lt-user-role')?.trim() || '';
  return KNOWN_ROLES.has(raw) ? raw : 'Viewer';
}

const NavBar: React.FC = () => {
  const [role, setRole] = React.useState(resolveRoleBadge);
  const [actorId, setActorId] = React.useState(resolveActorId);
  const [saveState, setSaveState] = React.useState<'idle' | 'saved'>('idle');
  const identityDetailsRef = React.useRef<HTMLDetailsElement | null>(null);

  const saveIdentity = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem('lt-user-role', role);
    window.localStorage.setItem('lt-actor-id', actorId.trim() || 'dashboard-anonymous');
    window.dispatchEvent(new CustomEvent('lt-identity-updated', { detail: { role, actorId } }));
    setSaveState('saved');
    identityDetailsRef.current?.removeAttribute('open');
    window.setTimeout(() => setSaveState('idle'), 1500);
  };

  const openAssistant = () => {
    if (typeof window === 'undefined') {
      return;
    }
    window.dispatchEvent(new CustomEvent('lt-assistant-open'));
  };

  return (
    <nav className="app-nav" aria-label="Top navigation">
      <div className="app-nav-inner">
        <span className="app-nav-brand">Wendbare Wetsuitvoering</span>
        <div className="app-nav-meta">
          <button type="button" className="app-nav-link border-0 bg-transparent" onClick={openAssistant}>Fact-find</button>
          <span className="app-role-badge">{role}</span>
          <details className="app-role-switcher" ref={identityDetailsRef}>
            <summary className="app-role-switcher-summary">Identity</summary>
            <form className="app-role-switcher-panel" onSubmit={saveIdentity}>
              <label htmlFor="nav-role-select" className="app-role-switcher-label">Rol</label>
              <select
                id="nav-role-select"
                className="app-role-switcher-input"
                value={role}
                onChange={(event) => setRole(event.target.value as (typeof ROLE_OPTIONS)[number])}
              >
                {ROLE_OPTIONS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>

              <label htmlFor="nav-actor-id-input" className="app-role-switcher-label">Actor</label>
              <input
                id="nav-actor-id-input"
                type="text"
                className="app-role-switcher-input"
                value={actorId}
                onChange={(event) => setActorId(event.target.value)}
                placeholder="dashboard-user-1"
              />

              <button type="submit" className="app-role-switcher-save">
                Opslaan
              </button>
              <span className="app-role-switcher-state" aria-live="polite">
                {saveState === 'saved' ? 'Opgeslagen' : ''}
              </span>
            </form>
          </details>
          <button type="button" className="app-proposal-button">+ Voorstel</button>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
