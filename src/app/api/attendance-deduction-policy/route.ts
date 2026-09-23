import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { DEFAULT_DEDUCTION_POLICY } from "@/src/lib/types/attendance";

const DATA_DIR = path.join(process.cwd(), ".data", "runtime");
const FILE = path.join(DATA_DIR, "attendance-deduction-policy.json");

async function ensureDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {
    // ignored
  }
}

async function read(): Promise<{ policy: unknown } | null> {
  try {
    const raw = await fs.readFile(FILE, "utf8");
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && parsed.policy) return parsed;
    return null;
  } catch {
    return null;
  }
}

export async function GET() {
  const data = await read();
  return NextResponse.json(data ?? { policy: DEFAULT_DEDUCTION_POLICY });
}

export async function PUT(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || !body.policy) {
    return NextResponse.json(
      { error: "Body must be { policy: {} }" },
      { status: 400 },
    );
  }
  try {
    await ensureDir();
    await fs.writeFile(
      FILE,
      JSON.stringify({ policy: body.policy }, null, 2),
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
