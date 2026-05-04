import type { OnboardingRecord } from "@/src/lib/types/onboarding";

let _records: OnboardingRecord[] = [];

export function addPendingRecord(record: OnboardingRecord) {
  _records = [record, ..._records];
}

export function consumePendingRecords(): OnboardingRecord[] {
  const r = [..._records];
  _records = [];
  return r;
}
