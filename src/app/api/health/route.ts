import { NextResponse } from "next/server";

// Lightweight liveness probe for Coolify / container orchestrators.
// Kept dependency-free so it stays fast and never blocks the request path.
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({ status: "ok" }, { status: 200 });
}
