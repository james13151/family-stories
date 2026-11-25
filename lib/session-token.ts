import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "hl_session";
export const LOCALE_COOKIE = "hl_locale";

function key() {
  return new TextEncoder().encode(process.env.SESSION_SECRET || "");
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  };
}

export async function signSession(userId: string) {
  if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 16) {
    throw new Error("SESSION_SECRET must be at least 16 characters");
  }
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(key());
}

export async function verifySessionToken(token: string | undefined | null) {
  if (!token || !process.env.SESSION_SECRET) return null;
  try {
    const { payload } = await jwtVerify(token, key());
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}
