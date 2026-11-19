/**
 * Nigerian reference lists the payroll import validates against and prints on
 * the template's "Valid values" sheet: states (PAYE goes to the State IRS of
 * residence), banks with their CBN/NIBSS codes (for the bulk payment file) and
 * the PenCom-licensed Pension Fund Administrators.
 */

export const NG_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno", "Cross River", "Delta",
  "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT", "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi",
  "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto",
  "Taraba", "Yobe", "Zamfara",
] as const;

const squash = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

/** "Lagos State", "lagos", "Abuja", "F.C.T." → the canonical state name, or null. */
export function matchState(input: string): string | null {
  const s = squash(input.replace(/\bstate\b/i, ""));
  if (!s) return null;
  if (/^(fct|abuja|federalcapitalterritory|fctabuja)$/.test(s)) return "FCT";
  return NG_STATES.find((st) => squash(st) === s) ?? null;
}

/** Banks as payroll knows them. `name` matches the HR records; codes are the CBN 3-digit or NIP codes. */
export const NG_BANKS: { name: string; code: string; aliases?: string[] }[] = [
  { name: "Access Bank", code: "044", aliases: ["access", "diamond bank"] },
  { name: "Citibank", code: "023", aliases: ["citibank nigeria"] },
  { name: "Ecobank", code: "050" },
  { name: "Fidelity Bank", code: "070", aliases: ["fidelity"] },
  { name: "First Bank", code: "011", aliases: ["first bank of nigeria", "firstbank", "fbn"] },
  { name: "FCMB", code: "214", aliases: ["first city monument bank"] },
  { name: "Globus Bank", code: "103" },
  { name: "GTBank", code: "058", aliases: ["guaranty trust bank", "gtb", "gtco", "guaranty trust"] },
  { name: "Jaiz Bank", code: "301" },
  { name: "Keystone Bank", code: "082" },
  { name: "Lotus Bank", code: "303" },
  { name: "Optimus Bank", code: "107" },
  { name: "Parallex Bank", code: "104" },
  { name: "Polaris Bank", code: "076", aliases: ["skye bank"] },
  { name: "PremiumTrust Bank", code: "105", aliases: ["premium trust bank"] },
  { name: "Providus Bank", code: "101" },
  { name: "Signature Bank", code: "106" },
  { name: "Stanbic IBTC", code: "221", aliases: ["stanbic", "stanbic ibtc bank"] },
  { name: "Standard Chartered", code: "068", aliases: ["standard chartered bank"] },
  { name: "Sterling Bank", code: "232", aliases: ["sterling"] },
  { name: "SunTrust Bank", code: "100" },
  { name: "TAJBank", code: "302", aliases: ["taj bank"] },
  { name: "Titan Trust Bank", code: "102" },
  { name: "Union Bank", code: "032", aliases: ["union bank of nigeria"] },
  { name: "UBA", code: "033", aliases: ["united bank for africa"] },
  { name: "Unity Bank", code: "215" },
  { name: "Wema Bank", code: "035", aliases: ["wema", "alat"] },
  { name: "Zenith Bank", code: "057", aliases: ["zenith"] },
  { name: "Kuda", code: "50211", aliases: ["kuda bank", "kuda microfinance bank"] },
  { name: "Moniepoint", code: "50515", aliases: ["moniepoint mfb", "moniepoint microfinance bank"] },
  { name: "OPay", code: "999992", aliases: ["opay digital services", "paycom"] },
  { name: "PalmPay", code: "999991", aliases: ["palm pay"] },
];

const bankKey = (s: string) => squash(s.replace(/\b(plc|limited|ltd|nigeria|bank)\b/gi, ""));

export function matchBank(input: string): { name: string; code: string } | null {
  const k = bankKey(input);
  if (!k) return null;
  const hit = NG_BANKS.find((b) => bankKey(b.name) === k || (b.aliases ?? []).some((a) => bankKey(a) === k));
  return hit ? { name: hit.name, code: hit.code } : null;
}

/** PenCom-licensed PFAs. The first six are the names already on the demo company's records. */
export const NG_PFAS: { code: string; name: string; aliases?: string[] }[] = [
  { code: "PFA-STANBIC", name: "Stanbic IBTC Pension Managers", aliases: ["stanbic ibtc pension", "stanbic pension"] },
  { code: "PFA-ARM", name: "ARM Pension Managers", aliases: ["arm pension", "access arm pensions", "access-arm pensions", "arm"] },
  { code: "PFA-LEADWAY", name: "Leadway Pensure PFA", aliases: ["leadway pensure", "leadway pension", "leadway"] },
  { code: "PFA-PREMIUM", name: "Premium Pension Limited", aliases: ["premium pension"] },
  { code: "PFA-CRUSADER", name: "Crusader Sterling Pensions", aliases: ["crusader sterling", "crusader"] },
  { code: "PFA-FIDELITY", name: "FCMB Pensions", aliases: ["fcmb pensions", "aiico pension managers"] },
  { code: "PFA-FIDPEN", name: "Fidelity Pension Managers", aliases: ["fidelity pension"] },
  { code: "PFA-GTPEN", name: "Guaranty Trust Pension Managers", aliases: ["gt pension managers", "gtpml"] },
  { code: "PFA-NLPC", name: "NLPC Pension Fund Administrators", aliases: ["nlpc pension", "nlpc"] },
  { code: "PFA-NORRENBERGER", name: "Norrenberger Pensions", aliases: ["norrenberger", "iei anchor pensions"] },
  { code: "PFA-NPF", name: "NPF Pensions", aliases: ["npf pension"] },
  { code: "PFA-OAK", name: "Oak Pensions", aliases: ["oak pension"] },
  { code: "PFA-PAL", name: "Pensions Alliance Limited", aliases: ["pal pensions", "pensions alliance"] },
  { code: "PFA-RADIX", name: "Radix Pension Managers", aliases: ["radix"] },
  { code: "PFA-TANGERINE", name: "Tangerine APT Pensions", aliases: ["tangerine apt", "tangerine pensions", "apt pensions"] },
  { code: "PFA-TRUSTFUND", name: "Trustfund Pensions", aliases: ["trustfund"] },
  { code: "PFA-VERITAS", name: "Veritas Glanvills Pensions", aliases: ["veritas glanvills", "veritas"] },
  { code: "PFA-NUPEMCO", name: "NUPEMCO", aliases: ["nigerian university pension management company"] },
];

const pfaKey = (s: string) => squash(s.replace(/\b(pfa|limited|ltd|plc)\b/gi, ""));

export function matchPfa(input: string): { code: string; name: string } | null {
  const k = pfaKey(input);
  if (!k) return null;
  const hit = NG_PFAS.find((p) => pfaKey(p.name) === k || (p.aliases ?? []).some((a) => pfaKey(a) === k));
  return hit ? { code: hit.code, name: hit.name } : null;
}
