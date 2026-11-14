/** Next.js may normalize request.url to localhost; Host retains the browser's authority. */
export function hasSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    const actual = new URL(origin);
    const expected = new URL(request.url);
    expected.host = request.headers.get("host") || expected.host;
    return actual.origin === origin && actual.origin === expected.origin;
  } catch { return false; }
}
