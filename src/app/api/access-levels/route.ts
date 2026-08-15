import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import type {
  AccessLevel,
  RoleAssignmentEvent,
} from "@/src/lib/types/access-levels";

const DATA_DIR = path.join(process.cwd(), ".data", "runtime");
const FILE = path.join(DATA_DIR, "access-levels.json");

async function ensureDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {
    // ignored
  }
}

interface StoredShape {
  levels: AccessLevel[];
  /** §1.6 role assignment audit trail. */
  assignments: RoleAssignmentEvent[];
}

/**
 * Older snapshots were a bare `AccessLevel[]`; newer ones are an object that
 * also carries the assignment trail. Read both so an existing install isn't
 * wiped when it upgrades.
 */
async function readStored(): Promise<StoredShape> {
  try {
    const raw = await fs.readFile(FILE, "utf8");
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return { levels: parsed as AccessLevel[], assignments: [] };
    }
    return {
      levels: Array.isArray(parsed?.levels) ? parsed.levels : [],
      assignments: Array.isArray(parsed?.assignments) ? parsed.assignments : [],
    };
  } catch {
    return { levels: [], assignments: [] };
  }
}

export async function GET() {
  const stored = await readStored();
  return NextResponse.json(stored);
}

export async function PUT(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || !Array.isArray(body.levels)) {
    return NextResponse.json(
      { error: "Body must be { levels: AccessLevel[] }" },
      { status: 400 },
    );
  }

  try {
    await ensureDir();
    const payload: StoredShape = {
      levels: body.levels,
      assignments: Array.isArray(body.assignments) ? body.assignments : [],
    };
    await fs.writeFile(FILE, JSON.stringify(payload, null, 2), "utf8");
    return NextResponse.json({ ok: true, count: body.levels.length });
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
