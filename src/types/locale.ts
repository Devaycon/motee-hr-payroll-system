export interface SupportedCountry {
  countryCode: string;
  name: string;
  currency: string;
  currencySymbol: string;
  locale: string;
  timezone: string;
}

export interface VisitorLocale {
  detectedCountryCode: string | null;
  isSupported: boolean;
  countryCode: string;
  country: string;
  currency: string;
  currencySymbol: string;
  locale: string;
  timezone: string;
  source: string;
}

export interface TenantLocale {
  id: string;
  name: string;
  slug: string;
  plan: string;
  status: string;
  industry: string | null;
  country: string;
  countryCode: string;
  timezone: string;
  currency: string;
  currencySymbol: string;
  locale: string;
  logoUrl: string | null;
  primaryColor: string | null;
  usesPayeStarterRecords: boolean;
  createdAt: string;
  trialEndsAt: string | null;
  billingEmail: string | null;
}
