import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import {
  badCountry,
  countryFromRequest,
  runtimeDir,
  runtimeFile,
  type RuntimeCountry,
} from "@/src/lib/server/runtime-file";

const FILE_NAME = "collection-edits.json";

interface Snapshot {
  added: Record<string, unknown[]>;
  edits: Record<string, Record<string, unknown>>;
  removed?: Record<string, string[]>;
}

async function ensureDir(country: RuntimeCountry) {
  try {
    await fs.mkdir(runtimeDir(country), { recursive: true });
  } catch {
    // ignore
  }
}

async function read(country: RuntimeCountry): Promise<Snapshot | null> {
  try {
    const raw = await fs.readFile(runtimeFile(FILE_NAME, country), "utf8");
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.added === "object" && typeof parsed.edits === "object")
      return parsed as Snapshot;
    return null;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const country = countryFromRequest(request);
  if (!country) return badCountry();
  const data = await read(country);
  return NextResponse.json(data ?? { added: {}, edits: {} });
}

export async function PUT(request: Request) {
  const country = countryFromRequest(request);
  if (!country) return badCountry();
  const body = await request.json().catch(() => null);
  if (!body || typeof body.added !== "object" || typeof body.edits !== "object") {
    return NextResponse.json({ error: "Body must be { added, edits }" }, { status: 400 });
  }
  try {
    await ensureDir(country);
    await fs.writeFile(
      runtimeFile(FILE_NAME, country),
      JSON.stringify(
        {
          added: body.added,
          edits: body.edits,
          removed: typeof body.removed === "object" && body.removed ? body.removed : {},
        },
        null,
        2,
      ),
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
