import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import {
  badCountry,
  countryFromRequest,
  runtimeDir,
  runtimeFile,
  type RuntimeCountry,
} from "@/src/lib/server/runtime-file";
import type { BenefitPlan } from "@/src/lib/types/benefits";

const FILE_NAME = "benefit-plans.json";

async function ensureDir(country: RuntimeCountry) {
  try {
    await fs.mkdir(runtimeDir(country), { recursive: true });
  } catch {
    // ignored
  }
}

async function readStored(country: RuntimeCountry): Promise<{
  plans: BenefitPlan[];
  coverageOptions?: string[];
}> {
  try {
    const raw = await fs.readFile(runtimeFile(FILE_NAME, country), "utf8");
    const parsed = JSON.parse(raw);
    return {
      plans: Array.isArray(parsed?.plans) ? parsed.plans : [],
      coverageOptions: Array.isArray(parsed?.coverageOptions)
        ? parsed.coverageOptions
        : undefined,
    };
  } catch {
    return { plans: [] };
  }
}

export async function GET(request: Request) {
  const country = countryFromRequest(request);
  if (!country) return badCountry();
  return NextResponse.json(await readStored(country));
}

export async function PUT(request: Request) {
  const country = countryFromRequest(request);
  if (!country) return badCountry();
  const body = await request.json().catch(() => null);
  if (!body || !Array.isArray(body.plans)) {
    return NextResponse.json(
      { error: "Body must be { plans: BenefitPlan[] }" },
      { status: 400 },
    );
  }

  try {
    await ensureDir(country);
    await fs.writeFile(
      runtimeFile(FILE_NAME, country),
      JSON.stringify(
        {
          plans: body.plans,
          ...(Array.isArray(body.coverageOptions)
            ? { coverageOptions: body.coverageOptions }
            : {}),
        },
        null,
        2,
      ),
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
