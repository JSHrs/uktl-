/** Keep redirect destinations on this site, including WHATWG backslash handling. */
export function safeRedirect(target: string | undefined): string {
  if (
    !target ||
    !target.startsWith("/") ||
    target.startsWith("//") ||
    /[\\\u0000-\u0020]/.test(target)
  )
    return "/app";
  try {
    const base = "https://uktl.invalid";
    const url = new URL(target, base);
    return url.origin === base ? url.pathname + url.search + url.hash : "/app";
  } catch {
    return "/app";
  }
}
