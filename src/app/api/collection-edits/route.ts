import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), ".data", "runtime");
const FILE = path.join(DATA_DIR, "collection-edits.json");

interface Snapshot {
  added: Record<string, unknown[]>;
  edits: Record<string, Record<string, unknown>>;
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
    if (parsed && typeof parsed.added === "object" && typeof parsed.edits === "object")
      return parsed as Snapshot;
    return null;
  } catch {
    return null;
  }
}

export async function GET() {
  const data = await read();
  return NextResponse.json(data ?? { added: {}, edits: {} });
}

export async function PUT(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body.added !== "object" || typeof body.edits !== "object") {
    return NextResponse.json({ error: "Body must be { added, edits }" }, { status: 400 });
  }
  try {
    await ensureDir();
    await fs.writeFile(
      FILE,
      JSON.stringify({ added: body.added, edits: body.edits }, null, 2),
      "utf8",
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to persist", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
