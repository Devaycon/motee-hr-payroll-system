import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import {
  badCountry,
  countryFromRequest,
  runtimeDir,
  runtimeFile,
  type RuntimeCountry,
} from "@/src/lib/server/runtime-file";
import type {
  ApprovalChainTemplate,
  ApprovalRequest,
} from "@/src/lib/types/approvals";

const FILE_NAME = "approvals.json";

interface ApprovalsFile {
  templates: ApprovalChainTemplate[];
  requests: ApprovalRequest[];
}

async function ensureDir(country: RuntimeCountry) {
  try {
    await fs.mkdir(runtimeDir(country), { recursive: true });
  } catch {
    // ignored
  }
}

async function read(country: RuntimeCountry): Promise<ApprovalsFile | null> {
  try {
    const raw = await fs.readFile(runtimeFile(FILE_NAME, country), "utf8");
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed === "object" &&
      Array.isArray(parsed.templates) &&
      Array.isArray(parsed.requests)
    ) {
      return parsed as ApprovalsFile;
    }
    return null;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const country = countryFromRequest(request);
  if (!country) return badCountry();
  const data = await read(country);
  return NextResponse.json(data ?? { templates: [], requests: [] });
}

export async function PUT(request: Request) {
  const country = countryFromRequest(request);
  if (!country) return badCountry();
  const body = await request.json().catch(() => null);
  if (
    !body ||
    !Array.isArray(body.templates) ||
    !Array.isArray(body.requests)
  ) {
    return NextResponse.json(
      { error: "Body must be { templates: [], requests: [] }" },
      { status: 400 },
    );
  }
  try {
    await ensureDir(country);
    await fs.writeFile(
      runtimeFile(FILE_NAME, country),
      JSON.stringify(
        { templates: body.templates, requests: body.requests },
        null,
        2,
      ),
      "utf8",
    );
    return NextResponse.json({
      ok: true,
      templates: body.templates.length,
      requests: body.requests.length,
    });
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
