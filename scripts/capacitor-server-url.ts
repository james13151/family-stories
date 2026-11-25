/**
 * Address baked into the Android WebView at build time.
 * The phone never runs Next.js. It only opens this site.
 *
 * CAPACITOR_SERVER_URL wins. PUBLIC_BASE_URL is used when it is a public
 * http(s) origin. A laptop address such as 127.0.0.1 is ignored unless it
 * was set explicitly as CAPACITOR_SERVER_URL (useful for an emulator).
 */
export const CAPACITOR_SERVER_PLACEHOLDER = "https://stories.example.com";

function isLocalHost(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "0.0.0.0" || hostname === "::1";
}

export function capacitorServerUrl(env: NodeJS.ProcessEnv = process.env) {
  const explicit = env.CAPACITOR_SERVER_URL?.trim();
  const fallback = env.PUBLIC_BASE_URL?.trim();
  const candidate = explicit || fallback || CAPACITOR_SERVER_PLACEHOLDER;
  try {
    const url = new URL(candidate);
    if (url.protocol !== "http:" && url.protocol !== "https:") return CAPACITOR_SERVER_PLACEHOLDER;
    if (!explicit && isLocalHost(url.hostname)) return CAPACITOR_SERVER_PLACEHOLDER;
    return url.origin;
  } catch {
    return CAPACITOR_SERVER_PLACEHOLDER;
  }
}
