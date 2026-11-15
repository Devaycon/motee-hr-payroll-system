import path from "path";
import { NextResponse } from "next/server";

/**
 * Per-country location of the `.data/runtime` JSON stores.
 *
 * UK keeps the original files in `.data/runtime/` (so existing demo edits are
 * untouched); Nigeria lives in `.data/runtime/ng/`. Keeping the two apart is
 * what stops a UK approval chain or workflow showing up in the Nigeria demo.
 */
export type RuntimeCountry = "uk" | "ng";

const ROOT = path.join(process.cwd(), ".data", "runtime");

export function runtimeDir(country: RuntimeCountry): string {
  return country === "uk" ? ROOT : path.join(ROOT, country);
}

export function runtimeFile(name: string, country: RuntimeCountry): string {
  return path.join(runtimeDir(country), name);
}

/** `?country=` from the request; a missing value means UK (older clients). */
export function countryFromRequest(request: Request): RuntimeCountry | null {
  const value = new URL(request.url).searchParams.get("country") ?? "uk";
  return value === "uk" || value === "ng" ? value : null;
}

export function badCountry() {
  return NextResponse.json({ error: "Unknown country" }, { status: 400 });
}
