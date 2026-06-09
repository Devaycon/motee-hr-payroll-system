import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import type { AccessLevel } from "@/src/lib/types/access-levels";

const DATA_DIR = path.join(process.cwd(), ".data", "runtime");
const FILE = path.join(DATA_DIR, "access-levels.json");

async function ensureDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {
    // ignored
  }
}

async function readLevels(): Promise<AccessLevel[] | null> {
  try {
    const raw = await fs.readFile(FILE, "utf8");
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as AccessLevel[];
    return null;
  } catch {
    return null;
  }
}

export async function GET() {
  const levels = await readLevels();
  return NextResponse.json({ levels: levels ?? [] });
}

export async function PUT(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || !Array.isArray(body.levels)) {
    return NextResponse.json(
      { error: "Body must be { levels: AccessLevel[] }" },
      { status: 400 },
    );
  }

  try {
    await ensureDir();
    await fs.writeFile(FILE, JSON.stringify(body.levels, null, 2), "utf8");
    return NextResponse.json({ ok: true, count: body.levels.length });
  } catch (err) {
    return NextResponse.json(
      {
        error: "Failed to persist",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }
}
