import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import {
  badCountry,
  countryFromRequest,
  runtimeDir,
  runtimeFile,
  type RuntimeCountry,
} from "@/src/lib/server/runtime-file";

const FILE_NAME = "workflow-runs.json";

async function ensureDir(country: RuntimeCountry) {
  try {
    await fs.mkdir(runtimeDir(country), { recursive: true });
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
async function read(country: RuntimeCountry): Promise<{ byCountry: Record<string, unknown> } | null> {
  try {
    const raw = await fs.readFile(runtimeFile(FILE_NAME, country), "utf8");
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && parsed.byCountry) return parsed;
    return null;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const country = countryFromRequest(request);
  if (!country) return badCountry();
  const data = await read(country);
  return NextResponse.json(data ?? { byCountry: {} });
}

export async function PUT(request: Request) {
  const country = countryFromRequest(request);
  if (!country) return badCountry();
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || !body.byCountry) {
    return NextResponse.json(
      { error: "Body must be { byCountry: {} }" },
      { status: 400 },
    );
  }
  try {
    await ensureDir(country);
    await fs.writeFile(
      runtimeFile(FILE_NAME, country),
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
