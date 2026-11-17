import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import {
  badCountry,
  countryFromRequest,
  runtimeDir,
  runtimeFile,
  type RuntimeCountry,
} from "@/src/lib/server/runtime-file";
import { DEFAULT_DEDUCTION_POLICY } from "@/src/lib/types/attendance";

const FILE_NAME = "attendance-deduction-policy.json";

async function ensureDir(country: RuntimeCountry) {
  try {
    await fs.mkdir(runtimeDir(country), { recursive: true });
  } catch {
    // ignored
  }
}

async function read(country: RuntimeCountry): Promise<{ policy: unknown } | null> {
  try {
    const raw = await fs.readFile(runtimeFile(FILE_NAME, country), "utf8");
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && parsed.policy) return parsed;
    return null;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const country = countryFromRequest(request);
  if (!country) return badCountry();
  const data = await read(country);
  return NextResponse.json(data ?? { policy: DEFAULT_DEDUCTION_POLICY });
}

export async function PUT(request: Request) {
  const country = countryFromRequest(request);
  if (!country) return badCountry();
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || !body.policy) {
    return NextResponse.json(
      { error: "Body must be { policy: {} }" },
      { status: 400 },
    );
  }
  try {
    await ensureDir(country);
    await fs.writeFile(
      runtimeFile(FILE_NAME, country),
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
