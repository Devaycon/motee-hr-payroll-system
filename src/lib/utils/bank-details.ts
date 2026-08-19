/**
 * UK sort-code helpers (client feedback §2.16).
 *
 * Sort code used to be crammed into the account-name field, so it could not be
 * validated or formatted. It is six digits, conventionally shown as NN-NN-NN.
 */

/** Format keystrokes into NN-NN-NN, ignoring anything that isn't a digit. */
export function formatSortCode(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 6);
  return digits.replace(/(\d{2})(?=\d)/g, "$1-");
}

/** True for a complete, well-formed sort code. */
export function isValidSortCode(value: string): boolean {
  return /^\d{2}-\d{2}-\d{2}$/.test(value);
}

/** UK account numbers are 8 digits; Nigerian NUBAN accounts are 10. */
export function accountNumberLength(isUK: boolean): number {
  return isUK ? 8 : 10;
}
