import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import {
  badCountry,
  countryFromRequest,
  runtimeDir,
  runtimeFile,
  type RuntimeCountry,
} from "@/src/lib/server/runtime-file";
import type { ChangeRequest } from "@/src/lib/types/profile-edits";
import type { OverridesMap } from "@/src/lib/profile/overrides";

const FILE_NAME = "profile-edits.json";

interface Snapshot {
  overrides: OverridesMap;
  requests: ChangeRequest[];
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
    if (parsed && typeof parsed.overrides === "object" && Array.isArray(parsed.requests))
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
  return NextResponse.json(data ?? { overrides: {}, requests: [] });
}

export async function PUT(request: Request) {
  const country = countryFromRequest(request);
  if (!country) return badCountry();
  const body = await request.json().catch(() => null);
  if (!body || typeof body.overrides !== "object" || !Array.isArray(body.requests)) {
    return NextResponse.json(
      { error: "Body must be { overrides, requests }" },
      { status: 400 },
    );
  }
  try {
    await ensureDir(country);
    await fs.writeFile(
      runtimeFile(FILE_NAME, country),
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
