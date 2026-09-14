import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import type { BenefitPlan } from "@/src/lib/types/benefits";

const DATA_DIR = path.join(process.cwd(), ".data", "runtime");
const FILE = path.join(DATA_DIR, "benefit-plans.json");

async function ensureDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {
    // ignored
  }
}

async function readStored(): Promise<BenefitPlan[]> {
  try {
    const raw = await fs.readFile(FILE, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed?.plans) ? parsed.plans : [];
  } catch {
    return [];
  }
}

export async function GET() {
  const plans = await readStored();
  return NextResponse.json({ plans });
}

export async function PUT(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || !Array.isArray(body.plans)) {
    return NextResponse.json(
      { error: "Body must be { plans: BenefitPlan[] }" },
      { status: 400 },
    );
  }

  try {
    await ensureDir();
    await fs.writeFile(
      FILE,
      JSON.stringify({ plans: body.plans }, null, 2),
      "utf8",
    );
    return NextResponse.json({ ok: true, count: body.plans.length });
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
