/**
 * Every request the panel makes goes through here, so a failure is never
 * mistaken for success. Pages used to call fetch and then show "Sačuvano!"
 * whatever came back — an expired session or a server error lost the owner's
 * work without a word.
 *
 * - any non-2xx answer throws an AdminError with a message the owner can read;
 * - an expired session (401) says so, and does NOT navigate away: the edits on
 *   screen stay, the owner signs in again in another tab and saves again;
 * - an answer that is not JSON (a proxy error page, a dropped connection)
 *   becomes a readable error instead of a crash inside res.json().
 */
export class AdminError extends Error {
  status: number;
  body: unknown;
  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

export const SESSION_EXPIRED =
  'Sesija je istekla. Otvori /admin/login u novom tabu, prijavi se, pa ovdje ponovo klikni Sačuvaj — izmjene na ekranu su sačuvane.';

export async function adminFetch<T = unknown>(url: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, { credentials: 'same-origin', ...init });
  } catch {
    throw new AdminError('Nema veze sa serverom. Provjeri internet i pokušaj ponovo.', 0);
  }
  const text = await res.text().catch(() => '');
  let body: unknown = null;
  try { body = text ? JSON.parse(text) : null; } catch { /* not JSON */ }

  if (res.status === 401) throw new AdminError(SESSION_EXPIRED, 401, body);
  if (!res.ok) {
    const own = body && typeof body === 'object' && 'error' in body ? String((body as { error: unknown }).error) : '';
    throw new AdminError(own || `Greška na serveru (${res.status}). Pokušaj ponovo za koji trenutak.`, res.status, body);
  }
  return body as T;
}

/** JSON body helper: adminFetch(url, json('PUT', data)) */
export const json = (method: string, data: unknown): RequestInit => ({
  method,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data),
});

/** The message to show for any error thrown from adminFetch */
export const errorText = (err: unknown) =>
  err instanceof AdminError ? err.message : 'Nešto nije uspjelo. Pokušaj ponovo.';
