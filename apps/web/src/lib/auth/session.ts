import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";
import { getWebSessionSecret } from "@/lib/env/server";

export const SESSION_COOKIE = "sc_session";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: "admin" | "employee";
}

export interface SessionData {
  token: string;
  user: SessionUser;
}

interface SignedSessionPayload {
  token: string;
  user: SessionUser;
}

interface JwtPayload {
  sub: string;
  email: string;
  role: "admin" | "employee";
  exp?: number;
}

const SESSION_SECRET = getWebSessionSecret();

function toBase64Url(input: string): string {
  return Buffer.from(input).toString("base64url");
}

function fromBase64Url(input: string): string {
  return Buffer.from(input, "base64url").toString("utf8");
}

function signSessionPayload(encodedPayload: string): string {
  return createHmac("sha256", SESSION_SECRET).update(encodedPayload).digest("base64url");
}

function decodeJwtPayload(token: string): JwtPayload | null {
  const segments = token.split(".");

  if (segments.length < 2) {
    return null;
  }

  try {
    return JSON.parse(fromBase64Url(segments[1])) as JwtPayload;
  } catch {
    return null;
  }
}

function isJwtExpired(payload: JwtPayload): boolean {
  if (!payload.exp) {
    return false;
  }

  return payload.exp * 1000 <= Date.now();
}

export function createSignedSessionValue(session: SessionData): string {
  const encodedPayload = toBase64Url(JSON.stringify(session));
  const signature = signSessionPayload(encodedPayload);

  return `${encodedPayload}.${signature}`;
}

export async function getSession(): Promise<SessionData | null> {
  const store = await cookies();
  const rawSession = store.get(SESSION_COOKIE)?.value;

  if (!rawSession) {
    return null;
  }

  try {
    const [encodedPayload, signature] = rawSession.split(".");

    if (!encodedPayload || !signature) {
      return null;
    }

    const expectedSignature = signSessionPayload(encodedPayload);
    const providedSignature = Buffer.from(signature);
    const expectedSignatureBuffer = Buffer.from(expectedSignature);

    if (providedSignature.length !== expectedSignatureBuffer.length) {
      return null;
    }

    const isValidSignature = timingSafeEqual(
      providedSignature,
      expectedSignatureBuffer
    );

    if (!isValidSignature) {
      return null;
    }

    const session = JSON.parse(fromBase64Url(encodedPayload)) as SignedSessionPayload;
    const jwtPayload = decodeJwtPayload(session.token);

    if (!jwtPayload || isJwtExpired(jwtPayload)) {
      return null;
    }

    return {
      token: session.token,
      user: {
        id: jwtPayload.sub,
        email: jwtPayload.email,
        role: jwtPayload.role,
        name: session.user.name
      }
    };
  } catch {
    return null;
  }
}
