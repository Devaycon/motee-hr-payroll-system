import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import type { ChangeRequest } from "@/src/lib/types/profile-edits";
import type { OverridesMap } from "@/src/lib/profile/overrides";

const DATA_DIR = path.join(process.cwd(), ".data", "runtime");
const FILE = path.join(DATA_DIR, "profile-edits.json");

interface Snapshot {
  overrides: OverridesMap;
  requests: ChangeRequest[];
}

async function ensureDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {
    // ignore
  }
}

async function read(): Promise<Snapshot | null> {
  try {
    const raw = await fs.readFile(FILE, "utf8");
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.overrides === "object" && Array.isArray(parsed.requests))
      return parsed as Snapshot;
    return null;
  } catch {
    return null;
  }
}

export async function GET() {
  const data = await read();
  return NextResponse.json(data ?? { overrides: {}, requests: [] });
}

export async function PUT(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body.overrides !== "object" || !Array.isArray(body.requests)) {
    return NextResponse.json(
      { error: "Body must be { overrides, requests }" },
      { status: 400 },
    );
  }
  try {
    await ensureDir();
    await fs.writeFile(
      FILE,
      JSON.stringify({ overrides: body.overrides, requests: body.requests }, null, 2),
      "utf8",
    );
    return NextResponse.json({ ok: true, requests: body.requests.length });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to persist", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
