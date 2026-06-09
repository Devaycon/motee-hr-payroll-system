/**
 * Canonical gender per person, used to pick a gender-accurate profile avatar
 * even on the many screens that don't carry a `gender` field.
 *
 * `PEOPLE_GENDERS` is generated from the authoritative datasets that DO have a
 * gender field — the locale directories (nigeria.json + uk.json) and
 * employees-demo — keyed by lowercased full name. (EOR workers are omitted
 * because those screens already pass `gender` directly.) `FIRST_NAME_GENDERS`
 * is a small fallback for incidental people who only appear in gender-less
 * lists (kudos roster, top performers, my-workspace, etc.).
 *
 * Values mirror each person's stored gender (which is intentionally not always
 * name-correlated in the demo data) so the avatar matches the record.
 */

export type SimpleGender = "male" | "female";

export const PEOPLE_GENDERS: Record<string, SimpleGender> = {
  "adaeze okonkwo": "female",
  "amaka afolayan": "female",
  "amaka chukwu": "female",
  "arjun taylor": "male",
  "babatunde adeyemi": "male",
  "charlie hall": "female",
  "charlie khan": "female",
  "chidinma okeke": "female",
  "chinedu lawal": "male",
  "chinedu olawale": "male",
  "chinedu sanusi": "male",
  "chukwuemeka eze": "male",
  "ella walker": "female",
  "emeka abubakar": "male",
  "emeka nwosu": "male",
  "emily williams": "female",
  "fatima al-hassan": "female",
  "femi ogundimu": "male",
  "femi sanusi": "male",
  "folake afolayan": "female",
  "folake ibrahim": "female",
  "folake nwosu": "female",
  "george hall": "male",
  "harry brown": "male",
  "harry khan": "male",
  "harry patel": "male",
  "ibrahim adeyemi": "male",
  "ifeoma bello": "female",
  "jack thomas": "male",
  "joshua hall": "male",
  "joshua wood": "male",
  "ngozi adebayo": "female",
  "ngozi mohammed": "female",
  "ngozi obi": "female",
  "nneka sanusi": "female",
  "oliver hughes": "male",
  "oliver thomas": "male",
  "oluwaseun afolabi": "male",
  "priya taylor": "female",
  "priya williams": "female",
  "thomas thomas": "male",
  "tochukwu lawal": "male",
  "william jones": "male",
  "yusuf eze": "male",
  "yusuf garba": "male",
  "yusuf nwosu": "male",
  "zainab uche": "female",
};

/**
 * Fallback by first name for people not in PEOPLE_GENDERS. Best-effort
 * real-world reading of common Nigerian + Western first names used in the demo.
 */
export const FIRST_NAME_GENDERS: Record<string, SimpleGender> = {
  // Female
  adaeze: "female", amaka: "female", chidinma: "female", chioma: "female",
  ifeoma: "female", ngozi: "female", nneka: "female", zainab: "female",
  fatima: "female", halima: "female", aisha: "female", folake: "female",
  funke: "female", bisi: "female", grace: "female", hannah: "female",
  emma: "female", emily: "female", ella: "female", olivia: "female",
  sophie: "female", sarah: "female", priya: "female", andrea: "female",
  maria: "female", chiamaka: "female", blessing: "female", joy: "female",
  // Male
  emeka: "male", chinedu: "male", chukwuemeka: "male", obi: "male",
  tunde: "male", babatunde: "male", femi: "male", yusuf: "male",
  ibrahim: "male", musa: "male", oluwaseun: "male", segun: "male",
  george: "male", harry: "male", jack: "male", joshua: "male",
  oliver: "male", william: "male", thomas: "male", james: "male",
  liam: "male", mateo: "male", arjun: "male", tom: "male", david: "male",
  michael: "male", daniel: "male",
};
