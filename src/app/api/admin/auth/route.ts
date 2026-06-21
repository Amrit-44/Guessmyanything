import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";

// Credentials are checked server-side ONLY. They are NEVER sent to the client.
const ADMIN_NAME = "Admin-Amrit";
const ADMIN_PASSWORD = "AMRIT-4454-ADMIN";
const SESSION_COOKIE = "admin_session";
const SESSION_TOKEN = "gma-admin-" + Buffer.from(`${ADMIN_NAME}:${ADMIN_PASSWORD}`).toString("base64");

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, password } = body;

    if (!name || !password) {
      return NextResponse.json({ error: "Name and password are required" }, { status: 400 });
    }

    // Strict match against server-side constants
    if (name === ADMIN_NAME && password === ADMIN_PASSWORD) {
      // Set HTTP-only, secure cookie
      const response = NextResponse.json({ success: true });
      response.cookies.set(SESSION_COOKIE, SESSION_TOKEN, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 60 * 60 * 24, // 24 hours
      });
      return response;
    }

    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  } catch {
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
  }
}

// Allow checking if the session is valid
export async function GET() {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE);
  if (session?.value === SESSION_TOKEN) {
    return NextResponse.json({ authenticated: true });
  }
  return NextResponse.json({ authenticated: false }, { status: 401 });
}
