/**
 * DEMO CONFIGURATION — Backend Driven
 *
 * This file contains static dropdown data for demonstration purposes.
 *
 * When integrating with a live backend:
 * - Replace these static arrays with API endpoint calls
 * - Create services/hooks to fetch data from backend APIs
 * - Implement caching where appropriate
 * - Handle loading and error states
 *
 * Example backend endpoints (to be created):
 * - GET /api/departments
 * - GET /api/leave-types
 * - GET /api/contract-types
 * - GET /api/countries
 * - GET /api/states?country={countryCode}
 * - GET /api/employee-types
 * - etc.
 */

export interface SystemOption {
  id: number;
  name: string;
}

export interface CountryOption {
  id: number;
  code: string;
  name: string;
}

export const systemData = {
  departments: [
    { id: 1, name: "Human Resources" },
    { id: 2, name: "Finance" },
    { id: 3, name: "Operations" },
    { id: 4, name: "Engineering" },
    { id: 5, name: "Sales" },
    { id: 6, name: "Marketing" },
    { id: 7, name: "Product" },
    { id: 8, name: "Design" },
    { id: 9, name: "Legal" },
    { id: 10, name: "Customer Success" },
  ] as SystemOption[],

  urgencyLevels: [
    { id: 1, name: "Low" },
    { id: 2, name: "Medium" },
    { id: 3, name: "High" },
    { id: 4, name: "Critical" },
  ] as SystemOption[],

  leaveTypes: [
    { id: 1, name: "Annual Leave" },
    { id: 2, name: "Sick Leave" },
    { id: 3, name: "Maternity Leave" },
    { id: 4, name: "Paternity Leave" },
    { id: 5, name: "Unpaid Leave" },
    { id: 6, name: "Compassionate Leave" },
    { id: 7, name: "Study Leave" },
  ] as SystemOption[],

  contractTypes: [
    { id: 1, name: "Permanent" },
    { id: 2, name: "Contract" },
    { id: 3, name: "Temporary" },
    { id: 4, name: "Internship" },
    { id: 5, name: "Consultancy" },
    { id: 6, name: "NDA" },
  ] as SystemOption[],

  counterparties: [
    { id: 1, name: "Vendor A" },
    { id: 2, name: "Vendor B" },
    { id: 3, name: "Client C" },
    { id: 4, name: "Contractor LLC" },
    { id: 5, name: "Supplier Co." },
  ] as SystemOption[],

  reasonsForOffboarding: [
    { id: 1, name: "Resignation" },
    { id: 2, name: "Termination" },
    { id: 3, name: "Retirement" },
    { id: 4, name: "End of Contract" },
    { id: 5, name: "Layoff" },
  ] as SystemOption[],

  assetTypes: [
    { id: 1, name: "Laptop" },
    { id: 2, name: "Desktop" },
    { id: 3, name: "Mobile Phone" },
    { id: 4, name: "Tablet" },
    { id: 5, name: "Monitor" },
    { id: 6, name: "Keyboard & Mouse" },
    { id: 7, name: "Headset" },
    { id: 8, name: "Printer" },
    { id: 9, name: "Other" },
  ] as SystemOption[],

  employeeTypes: [
    { id: 1, name: "Full-time" },
    { id: 2, name: "Part-time" },
    { id: 3, name: "Temporary" },
    { id: 4, name: "Contract" },
    { id: 5, name: "Freelance / Self-employed" },
    { id: 6, name: "Internship" },
    { id: 7, name: "Apprenticeship" },
    { id: 8, name: "Casual" },
    { id: 9, name: "Seasonal" },
    { id: 10, name: "Remote / Telecommuting" },
  ] as SystemOption[],

  countries: [
    { id: 1, code: "NG", name: "Nigeria" },
    { id: 2, code: "US", name: "United States" },
    { id: 3, code: "GB", name: "United Kingdom" },
    { id: 4, code: "CA", name: "Canada" },
    { id: 5, code: "AU", name: "Australia" },
    { id: 6, code: "GH", name: "Ghana" },
    { id: 7, code: "KE", name: "Kenya" },
    { id: 8, code: "ZA", name: "South Africa" },
    { id: 9, code: "IE", name: "Ireland" },
    { id: 10, code: "IN", name: "India" },
    { id: 11, code: "DE", name: "Germany" },
    { id: 12, code: "FR", name: "France" },
  ] as CountryOption[],

  states: {
    NG: [
      { id: 1, name: "Lagos" },
      { id: 2, name: "Ogun" },
      { id: 3, name: "Oyo" },
      { id: 4, name: "Abuja (FCT)" },
      { id: 5, name: "Rivers" },
      { id: 6, name: "Kano" },
      { id: 7, name: "Enugu" },
      { id: 8, name: "Kaduna" },
    ],
    US: [
      { id: 1, name: "California" },
      { id: 2, name: "Texas" },
      { id: 3, name: "Florida" },
      { id: 4, name: "New York" },
      { id: 5, name: "Illinois" },
      { id: 6, name: "Washington" },
    ],
    GB: [
      { id: 1, name: "England" },
      { id: 2, name: "Scotland" },
      { id: 3, name: "Wales" },
      { id: 4, name: "Northern Ireland" },
    ],
    CA: [
      { id: 1, name: "Ontario" },
      { id: 2, name: "Quebec" },
      { id: 3, name: "British Columbia" },
      { id: 4, name: "Alberta" },
    ],
    AU: [
      { id: 1, name: "New South Wales" },
      { id: 2, name: "Victoria" },
      { id: 3, name: "Queensland" },
      { id: 4, name: "Western Australia" },
    ],
  } as Record<string, SystemOption[]>,

  nationalities: [
    { id: 1, name: "Nigerian" },
    { id: 2, name: "American" },
    { id: 3, name: "British" },
    { id: 4, name: "Canadian" },
    { id: 5, name: "Australian" },
    { id: 6, name: "Ghanaian" },
    { id: 7, name: "Kenyan" },
    { id: 8, name: "South African" },
    { id: 9, name: "Irish" },
    { id: 10, name: "Indian" },
    { id: 11, name: "German" },
    { id: 12, name: "French" },
  ] as SystemOption[],
};

// ── Convenience name arrays for <Select> consumption ─────────────────────────
const names = (opts: SystemOption[]) => opts.map((o) => o.name);

export const DEPARTMENTS = names(systemData.departments);
export const URGENCY_LEVELS = names(systemData.urgencyLevels);
export const LEAVE_TYPES = names(systemData.leaveTypes);
export const CONTRACT_TYPES = names(systemData.contractTypes);
export const COUNTERPARTIES = names(systemData.counterparties);
export const OFFBOARDING_REASONS = names(systemData.reasonsForOffboarding);
export const ASSET_TYPES = names(systemData.assetTypes);
export const EMPLOYEE_TYPES = names(systemData.employeeTypes);
export const COUNTRY_NAMES = systemData.countries.map((c) => c.name);
export const NATIONALITIES = names(systemData.nationalities);

/**
 * States/provinces for a country, accepting either an ISO code ("NG") or a
 * country name ("Nigeria"). Returns [] when the country is unknown.
 */
export function statesForCountry(country?: string | null): string[] {
  if (!country) return [];
  const direct = systemData.states[country];
  if (direct) return names(direct);
  const match = systemData.countries.find(
    (c) => c.name.toLowerCase() === country.toLowerCase(),
  );
  const byName = match ? systemData.states[match.code] : undefined;
  return byName ? names(byName) : [];
}
