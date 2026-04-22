import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { createSignedSessionValue, SESSION_COOKIE } from "@/lib/auth/session";
import { getServerApiBaseUrl } from "@/lib/env/server";

const API_BASE_URL = getServerApiBaseUrl();

export async function POST(request: Request) {
  const formData = await request.formData();
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({ email, password }),
      cache: "no-store"
    });
  } catch {
    return NextResponse.redirect(new URL("/login?error=auth_unavailable", request.url), 303);
  }

  if (!response.ok) {
    const errorParam =
      response.status === 401 ? "invalid_credentials" : "auth_unavailable";

    return NextResponse.redirect(new URL(`/login?error=${errorParam}`, request.url), 303);
  }

  let payload: {
    accessToken: string;
    user: {
      id: string;
      name: string;
      email: string;
      role: "admin" | "employee";
    };
  };

  try {
    payload = (await response.json()) as {
      accessToken: string;
      user: {
        id: string;
        name: string;
        email: string;
        role: "admin" | "employee";
      };
    };
  } catch {
    return NextResponse.redirect(new URL("/login?error=auth_unavailable", request.url), 303);
  }

  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE, createSignedSessionValue({
    token: payload.accessToken,
    user: payload.user
  }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8
  });

  return NextResponse.redirect(new URL("/", request.url), 303);
}
