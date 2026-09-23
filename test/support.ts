export interface Call {
  url: URL;
  method: string;
  headers: Headers;
  body: BodyInit | null | undefined;
}

/** A fetch that records each call and answers with the next queued response. */
export function mockFetch(...responses: Array<{ status?: number; body: unknown }>) {
  const calls: Call[] = [];
  const fetch = async (input: RequestInfo | URL, init: RequestInit = {}) => {
    calls.push({
      url: new URL(String(input)),
      method: init.method ?? "GET",
      headers: new Headers(init.headers),
      body: init.body,
    });
    const next = responses.shift() ?? { body: {} };
    return new Response(JSON.stringify(next.body), {
      status: next.status ?? 200,
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  };
  return { fetch: fetch as typeof globalThis.fetch, calls };
}
