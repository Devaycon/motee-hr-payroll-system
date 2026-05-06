import { Mail, Phone } from "lucide-react";
import { Badge } from "@/src/components/ui/badge";
import { Avatar, AvatarFallback } from "@/src/components/ui/avatar";
import { Separator } from "@/src/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import {
  STATUS_LABELS,
  STATUS_STYLES,
  EMPLOYMENT_TYPE_LABELS,
  EMPLOYMENT_TYPE_STYLES,
  formatDate,
} from "./data";
import type { EmployeeRow } from "./data";

interface EmployeeDetailModalProps {
  open: boolean;
  employee: EmployeeRow | null;
  onClose: (open: boolean) => void;
}

export function EmployeeDetailModal({
  open,
  employee,
  onClose,
}: EmployeeDetailModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="sr-only">Employee Profile</DialogTitle>
        </DialogHeader>
        {employee && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="w-16 h-16">
                <AvatarFallback
                  className="text-xl font-bold text-white"
                  style={{ backgroundColor: "#4361ee" }}
                >
                  {employee.initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-bold text-foreground text-lg leading-snug">
                  {employee.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {employee.jobTitle}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge
                    className={`text-xs border ${STATUS_STYLES[employee.status]}`}
                  >
                    {STATUS_LABELS[employee.status]}
                  </Badge>
                  <Badge
                    className={`text-xs border ${EMPLOYMENT_TYPE_STYLES[employee.employmentType]}`}
                  >
                    {EMPLOYMENT_TYPE_LABELS[employee.employmentType]}
                  </Badge>
                </div>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Department</p>
                <p className="font-medium text-foreground">
                  {employee.department}
                </p>
              </div>
              {employee.grade && (
                <div>
                  <p className="text-xs text-muted-foreground">Grade</p>
                  <p className="font-medium text-foreground">
                    {employee.grade}
                  </p>
                </div>
              )}
              {employee.managerName && (
                <div>
                  <p className="text-xs text-muted-foreground">Reports To</p>
                  <p className="font-medium text-foreground">
                    {employee.managerName}
                  </p>
                </div>
              )}
              {employee.workLocation && (
                <div>
                  <p className="text-xs text-muted-foreground">Location</p>
                  <p className="font-medium text-foreground">
                    {employee.workLocation}
                  </p>
                </div>
              )}
              {employee.workMode && (
                <div>
                  <p className="text-xs text-muted-foreground">Work Mode</p>
                  <p className="font-medium text-foreground">
                    {employee.workMode}
                  </p>
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground">Start Date</p>
                <p className="font-medium text-foreground">
                  {formatDate(employee.startDate)}
                </p>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <a
                  href={`mailto:${employee.email}`}
                  className="text-[#4361ee] hover:underline truncate"
                >
                  {employee.email}
                </a>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span className="text-foreground">{employee.phone}</span>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
