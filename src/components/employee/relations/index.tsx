"use client";

import { useEffect, useState } from "react";
import { ShieldAlert, Plus } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent } from "@/src/components/ui/card";
import { useAppDispatch, useAppSelector } from "@/src/lib/stores/hooks";
import { pushNotification } from "@/src/lib/stores/notifications-slice";
import { caseRaised } from "@/src/lib/notifications/er-cases";
import { useCasesData } from "@/src/components/hr/grievance/hooks";
import { seedCountry, addCase } from "@/src/lib/stores/er-cases-slice";
import { MY_NAME, MY_INITIALS, MY_DEPT } from "./components/data";
import type { ERCase, NewERCase } from "./components/data";
import { CaseIntakeModal } from "./components/case-intake-modal";
import { MyCaseCard } from "./components/my-case-card";

export function EmployeeRelationsPage() {
  const dispatch = useAppDispatch();
  const country = useAppSelector((s) => s.locale.country);
  const user = useAppSelector((s) => s.auth.user);
  // Same locale-derived demo data the HR admin Employee Relations page
  // seeds from — both sides read and write the one `erCases` slice now, so
  // whichever loads first seeds the country and the other just reads it.
  const { data } = useCasesData();
  const casesByCountry = useAppSelector((s) => s.erCases.byCountry[country]);

  useEffect(() => {
    if (data && !casesByCountry) {
      dispatch(seedCountry({ country, cases: data }));
    }
  }, [data, casesByCountry, country, dispatch]);

  const allCases = casesByCountry ?? [];

  const myName = user?.name ?? MY_NAME;
  const myInitials = user?.initials ?? MY_INITIALS;
  const myDept = user?.departmentName ?? MY_DEPT;
  const myEmployeeId = user?.employeeId;

  const myCases = allCases.filter((c) =>
    myEmployeeId ? c.employeeId === myEmployeeId : c.employeeName === myName,
  );
  const sortedMyCases = [...myCases].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  const [modalOpen, setModalOpen] = useState(false);

  function generateId() {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  }

  function handleCreate(
    d: Pick<
      NewERCase,
      "complaintType" | "incidentDate" | "description" | "priority"
    >,
  ) {
    const today = new Date().toISOString().split("T")[0];
    const newCase: ERCase = {
      id: generateId(),
      caseNumber: `ERC-${String(allCases.length + 1).padStart(3, "0")}`,
      complaintType: d.complaintType,
      employeeId: myEmployeeId,
      employeeName: myName,
      employeeInitials: myInitials,
      employeeDept: myDept,
      dateRaised: today,
      incidentDate: d.incidentDate,
      description: d.description,
      stage: "raised",
      priority: d.priority,
      // Employee-initiated cases default to "confidential" rather than the
      // admin form's casual "standard" default — these are grievance,
      // harassment and disciplinary matters, not routine requests, and the
      // employee has no picker to choose a level themselves. HR can raise it
      // further (highly confidential / restricted) once triaged.
      confidentialityLevel: "confidential",
      witnesses: [],
      evidence: [],
      hearingPanel: [],
      hasAppeal: false,
      notes: [],
      createdAt: today,
      updatedAt: today,
    };
    dispatch(addCase({ country, case: newCase }));
    // Same notification builder HR's own "New Case" flow dispatches, so this
    // surfaces in HR's notification centre exactly as an admin-created case
    // would (§5.9 in the HR module).
    dispatch(pushNotification(caseRaised(newCase)));
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-4xl font-bold text-foreground">
              Raise a Case
            </h1>
            <p className="text-sm text-muted-foreground">
              Report a grievance, disciplinary concern, harassment or any
              other employee relations matter — confidentially, direct to HR.
            </p>
          </div>
        </div>
        <Button onClick={() => setModalOpen(true)} className="gap-2" size="sm">
          <Plus className="h-4 w-4" /> Raise a Case
        </Button>
      </div>

      <Card className="border-dashed">
        <CardContent className="flex items-start gap-3 p-4">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
          <div className="text-sm text-muted-foreground">
            <p className="font-medium text-foreground">
              A confidential channel
            </p>
            <p>
              Cases you raise here are handled confidentially by HR and are
              only visible to the people assigned to work on them. Use this
              for grievances, harassment, discrimination, disciplinary
              concerns, whistleblowing or safeguarding — anything more
              sensitive than a routine HR Help Desk query.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">My Cases</h2>
        {sortedMyCases.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-sm text-muted-foreground">
              You haven&apos;t raised any cases yet.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {sortedMyCases.map((c) => (
              <MyCaseCard key={c.id} caseData={c} />
            ))}
          </div>
        )}
      </div>

      <CaseIntakeModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreate={handleCreate}
      />
    </div>
  );
}
