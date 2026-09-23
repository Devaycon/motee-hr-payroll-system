import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), ".data", "runtime");
const FILE = path.join(DATA_DIR, "workflow-runs.json");

async function ensureDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {
    // ignored
  }
}

/**
 * A pre-existing `workflow-runs.json` from an earlier design holds
 * `{ runs: [...] }` in the weak `assignment: { type: "role", role: "hr" }`
 * vocabulary this module replaces, and no code ever read it. It fails the
 * `byCountry` guard below, so the first save overwrites it - intended.
 */
async function read(): Promise<{ byCountry: Record<string, unknown> } | null> {
  try {
    const raw = await fs.readFile(FILE, "utf8");
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && parsed.byCountry) return parsed;
    return null;
  } catch {
    return null;
  }
}

export async function GET() {
  const data = await read();
  return NextResponse.json(data ?? { byCountry: {} });
}

export async function PUT(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || !body.byCountry) {
    return NextResponse.json(
      { error: "Body must be { byCountry: {} }" },
      { status: 400 },
    );
  }
  try {
    await ensureDir();
    await fs.writeFile(
      FILE,
      JSON.stringify({ byCountry: body.byCountry }, null, 2),
      "utf8",
    );
    return NextResponse.json({ ok: true });
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
