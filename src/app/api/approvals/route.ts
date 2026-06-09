import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import type {
  ApprovalChainTemplate,
  ApprovalRequest,
} from "@/src/lib/types/approvals";

const DATA_DIR = path.join(process.cwd(), ".data", "runtime");
const FILE = path.join(DATA_DIR, "approvals.json");

interface ApprovalsFile {
  templates: ApprovalChainTemplate[];
  requests: ApprovalRequest[];
}

async function ensureDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {
    // ignored
  }
}

async function read(): Promise<ApprovalsFile | null> {
  try {
    const raw = await fs.readFile(FILE, "utf8");
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

export async function GET() {
  const data = await read();
  return NextResponse.json(data ?? { templates: [], requests: [] });
}

export async function PUT(request: Request) {
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
    await ensureDir();
    await fs.writeFile(
      FILE,
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
