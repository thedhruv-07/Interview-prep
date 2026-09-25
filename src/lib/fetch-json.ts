// Every client fetch here used to assume the server always answers with
// JSON. It doesn't: a crashed or timed-out function, or an unreachable
// database, can come back with an empty or non-JSON body, and res.json()
// then throws "Unexpected end of JSON input" — which hides the real failure.
// This reads the body as text first and always throws a message a user (or
// whoever reads the console) can act on.
export async function fetchJson<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(input, init);
  } catch {
    throw new Error("Couldn't reach the server. Check your connection and try again.");
  }

  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    // non-JSON body (e.g. a platform error page) — handled below
  }

  if (!res.ok) {
    const serverMessage = (data as { error?: string } | null)?.error;
    throw new Error(
      serverMessage ??
        `The server had a problem (HTTP ${res.status}). The database or AI service may be temporarily unavailable — please try again shortly.`
    );
  }
  if (data === null) {
    throw new Error(`The server sent an empty response (HTTP ${res.status}). Please try again.`);
  }
  return data as T;
}
