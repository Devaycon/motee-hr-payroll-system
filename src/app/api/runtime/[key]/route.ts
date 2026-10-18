import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

/**
 * Generic JSON snapshot store for the newer slices (branch performance,
 * sickness & absence). Same contract as the per-module routes — GET returns
 * the last snapshot, PUT overwrites it — keyed by an allow-listed name so a
 * request can never write an arbitrary file.
 */

const DATA_DIR = path.join(process.cwd(), ".data", "runtime");
const ALLOWED = new Set(["branch-performance", "sickness", "leave-schemes"]);

function fileFor(key: string): string | null {
  return ALLOWED.has(key) ? path.join(DATA_DIR, `${key}.json`) : null;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ key: string }> },
) {
  const file = fileFor((await params).key);
  if (!file) return NextResponse.json({ error: "Unknown store" }, { status: 404 });
  try {
    const raw = await fs.readFile(file, "utf8");
    return NextResponse.json({ snapshot: JSON.parse(raw) });
  } catch {
    return NextResponse.json({ snapshot: null });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ key: string }> },
) {
  const file = fileFor((await params).key);
  if (!file) return NextResponse.json({ error: "Unknown store" }, { status: 404 });
  const body = await request.json().catch(() => null);
  if (!body || typeof body.snapshot !== "object" || body.snapshot === null) {
    return NextResponse.json({ error: "Body must be { snapshot: object }" }, { status: 400 });
  }
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(file, JSON.stringify(body.snapshot, null, 2), "utf8");
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to persist", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
