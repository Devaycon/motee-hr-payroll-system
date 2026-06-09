// Label/style/format constants are country-neutral; employee and org-chart data
// now come from the active locale via useEmployees() / useHierarchy().
export {
  DEPT_OPTIONS,
  EMPLOYMENT_TYPE_LABELS,
  EMPLOYMENT_TYPE_STYLES,
  STATUS_LABELS,
  STATUS_STYLES,
  formatDate,
} from "@/src/data/employees-demo";

export type { EmployeeRow } from "@/src/lib/types/employees";
