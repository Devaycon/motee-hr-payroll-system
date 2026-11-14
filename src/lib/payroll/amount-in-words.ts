const ONES = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
  "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen",
];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
const SCALES = ["", "Thousand", "Million", "Billion", "Trillion"];

function underThousand(n: number): string {
  const parts: string[] = [];
  const h = Math.floor(n / 100);
  const rest = n % 100;
  if (h) parts.push(`${ONES[h]} Hundred`);
  if (rest) {
    const words = rest < 20 ? ONES[rest] : `${TENS[Math.floor(rest / 10)]}${rest % 10 ? `-${ONES[rest % 10]}` : ""}`;
    parts.push(h ? `and ${words}` : words);
  }
  return parts.join(" ");
}

/** 271000 → "Two Hundred and Seventy-One Thousand" (British usage, as on NG payslips). */
export function integerToWords(n: number): string {
  n = Math.floor(Math.abs(n));
  if (n === 0) return "Zero";
  const groups: number[] = [];
  while (n > 0) {
    groups.push(n % 1000);
    n = Math.floor(n / 1000);
  }
  const words: string[] = [];
  for (let i = groups.length - 1; i >= 0; i--) {
    const g = groups[i];
    if (!g) continue;
    let w = underThousand(g);
    // "One Million and Fifty" — British "and" before a trailing sub-hundred group.
    if (i === 0 && groups.length > 1 && g < 100) w = `and ${w}`;
    words.push(SCALES[i] ? `${w} ${SCALES[i]}` : w);
  }
  return words.join(", ").replace(/, and /g, " and ");
}

/**
 * Amount in words for the payslip: "Two Hundred and Forty-Five Thousand,
 * Four Hundred and Ninety-Seven Naira Only", with kobo when present.
 */
export function amountInWords(amount: number, major = "Naira", minor = "Kobo"): string {
  const negative = amount < 0;
  const abs = Math.abs(Math.round(amount * 100));
  const whole = Math.floor(abs / 100);
  const fraction = abs % 100;
  let out = `${integerToWords(whole)} ${major}`;
  if (fraction) out += `, ${integerToWords(fraction)} ${minor}`;
  return `${negative ? "Minus " : ""}${out} Only`;
}
