const FALLBACK_ROLE = 'Viewer';
const FALLBACK_ACTOR_ID = 'dashboard-anonymous';

const KNOWN_ROLES = new Set(['Viewer', 'Proposer', 'Moderator', 'Admin']);

function getDashboardRole(): string {
  if (typeof window === 'undefined') {
    return FALLBACK_ROLE;
  }
  const raw = window.localStorage.getItem('lt-user-role')?.trim() || '';
  return KNOWN_ROLES.has(raw) ? raw : FALLBACK_ROLE;
}

function getDashboardActorId(): string {
  if (typeof window === 'undefined') {
    return FALLBACK_ACTOR_ID;
  }
  const raw = window.localStorage.getItem('lt-actor-id')?.trim() || '';
  return raw || FALLBACK_ACTOR_ID;
}

export function withIdentityHeaders(options?: RequestInit): RequestInit {
  const headers = new Headers(options?.headers ?? {});
  headers.set('X-User-Role', getDashboardRole());
  headers.set('X-Actor-Id', getDashboardActorId());
  return { ...options, headers };
}

export async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, withIdentityHeaders(options));
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  return response.json();
}

export async function apiFetchText(url: string, options?: RequestInit): Promise<string> {
  const response = await fetch(url, withIdentityHeaders(options));
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  return response.text();
}
