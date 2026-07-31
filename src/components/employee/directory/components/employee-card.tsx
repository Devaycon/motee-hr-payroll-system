import { MapPin, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import { PersonAvatar } from "@/src/components/shared/person-avatar";
import { EmployeeIds } from "@/src/components/shared/employee-id-columns";
import { EMPLOYMENT_TYPE_LABELS, EMPLOYMENT_TYPE_STYLES } from "./data";
import type { EmployeeRow } from "./data";

interface EmployeeCardProps {
  emp: EmployeeRow;
  onClick: (emp: EmployeeRow) => void;
}

export function EmployeeCard({ emp, onClick }: EmployeeCardProps) {
  return (
    <Card
      className="hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onClick(emp)}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <PersonAvatar
            name={emp.name}
            initials={emp.initials}
            gender={emp.gender}
            className="w-11 h-11 shrink-0"
            fallbackClassName="text-sm font-semibold text-white bg-[#4361ee]"
          />
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-start justify-between gap-1">
              <p className="text-sm font-semibold text-foreground leading-snug truncate">
                {emp.name}
              </p>
              {emp.status === "on_leave" && (
                <Badge className="text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 shrink-0">
                  On Leave
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {emp.jobTitle}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {emp.department}
            </p>
            <EmployeeIds employeeId={emp.referenceId} systemId={emp.id} />
            <div className="flex items-center gap-1.5 pt-1">
              <Badge
                className={`text-[10px] border ${EMPLOYMENT_TYPE_STYLES[emp.employmentType]}`}
              >
                {EMPLOYMENT_TYPE_LABELS[emp.employmentType]}
              </Badge>
              {emp.workLocation && (
                <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                  <MapPin className="w-2.5 h-2.5" />
                  {emp.workLocation}
                </span>
              )}
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
        </div>
      </CardContent>
    </Card>
  );
}
