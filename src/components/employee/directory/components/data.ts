import { recomputeNodes, HIERARCHY_NODES, DEPT_OPTIONS as STRUCT_DEPT_OPTIONS } from "@/src/data/structure-demo";

export {
  EMPLOYEES,
  DEPT_OPTIONS,
  EMPLOYMENT_TYPE_LABELS,
  EMPLOYMENT_TYPE_STYLES,
  STATUS_LABELS,
  STATUS_STYLES,
  formatDate,
} from "@/src/data/employees-demo";

export { STRUCT_DEPT_OPTIONS };

export type { EmployeeRow } from "@/src/lib/types/employees";

export const MY_DEPT = "Engineering";
export const TODAY = new Date();
export const treeNodes = recomputeNodes(HIERARCHY_NODES);

import { EMPLOYEES } from "@/src/data/employees-demo";
import type { EmployeeRow } from "@/src/lib/types/employees";

export function getThisMonthCelebrations(employees: EmployeeRow[]) {
  const birthdays: { emp: EmployeeRow; date: Date }[] = [];
  const anniversaries: { emp: EmployeeRow; date: Date; years: number }[] = [];

  for (const emp of employees) {
    if (emp.dateOfBirth) {
      const dob = new Date(emp.dateOfBirth);
      if (dob.getMonth() === TODAY.getMonth()) {
        birthdays.push({ emp, date: dob });
      }
    }
    if (emp.startDate) {
      const start = new Date(emp.startDate);
      if (
        start.getMonth() === TODAY.getMonth() &&
        start.getFullYear() !== TODAY.getFullYear()
      ) {
        anniversaries.push({
          emp,
          date: start,
          years: TODAY.getFullYear() - start.getFullYear(),
        });
      }
    }
  }

  return { birthdays, anniversaries };
}

export const MY_TEAM_COUNT = EMPLOYEES.filter((e) => e.department === MY_DEPT).length;
