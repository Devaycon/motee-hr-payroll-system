"use client";

import { useEmployees } from "@/src/components/hr/employees/hooks";

export function useDirectoryEmployees() {
  return useEmployees();
}
