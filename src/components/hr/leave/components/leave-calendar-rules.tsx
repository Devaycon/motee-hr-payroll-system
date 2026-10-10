"use client";

import { useState } from "react";
import { CalendarOff, CalendarX2, Plus, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { useAppSelector } from "@/src/lib/stores/hooks";
import { getApiErrorMessage } from "@/src/lib/utils";
import { formatDate } from "@/src/lib/utils/format-date";
import {
  leaveBlackoutSchema,
  publicHolidaySchema,
} from "@/src/lib/validations/leave";
import {
  useCloseLeaveYearMutation,
  usePreviewLeaveYearEndQuery,
} from "@/src/store/services/leave-balances";
import {
  useCreateLeaveBlackoutMutation,
  useCreatePublicHolidayMutation,
  useDeleteLeaveBlackoutMutation,
  useDeletePublicHolidayMutation,
  useGeneratePublicHolidaysMutation,
  useGetLeaveBlackoutsQuery,
  useGetLeaveTypesQuery,
  useGetPublicHolidaysQuery,
  useUpdateLeaveBlackoutMutation,
} from "@/src/store/services/leave-policies";
import type { LeaveBlackoutDto } from "@/src/types/leave-policies";

const thisYear = new Date().getFullYear();

function PublicHolidays() {
  const [year, setYear] = useState(thisYear);
  const [date, setDate] = useState("");
  const [name, setName] = useState("");
  const countryCode = useAppSelector((s) => s.locale.data?.tenant.countryCode);
  const { data, isLoading } = useGetPublicHolidaysQuery({ year });
  const [createHoliday, { isLoading: adding }] = useCreatePublicHolidayMutation();
  const [generateHolidays, { isLoading: generating }] =
    useGeneratePublicHolidaysMutation();
  const [deleteHoliday] = useDeletePublicHolidayMutation();
  const holidays = [...(data?.data ?? [])].sort((a, b) =>
    a.date.localeCompare(b.date),
  );

  async function handleAdd() {
    const parsed = publicHolidaySchema.safeParse({
      date,
      name,
      countryCode: countryCode || null,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    try {
      await createHoliday(parsed.data).unwrap();
      toast.success(`${parsed.data.name} added`);
      setDate("");
      setName("");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not add the holiday."));
    }
  }

  async function handleGenerate() {
    try {
      const created = (await generateHolidays(year).unwrap()).data;
      toast.success(`${created.length} public holiday(s) loaded for ${year}`);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not load the holidays."));
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteHoliday(id).unwrap();
      toast.success("Holiday removed");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not remove the holiday."));
    }
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CalendarOff className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">
              Public Holidays
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={year}
              onChange={(e) => setYear(Number(e.target.value) || thisYear)}
              className="h-8 w-24 text-sm"
              aria-label="Year"
            />
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1.5 text-xs"
              disabled={generating}
              onClick={handleGenerate}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Load standard holidays
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-2">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">Date</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <div className="flex flex-1 flex-col gap-1.5">
            <Label className="text-xs">Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Founders' Day"
              className="h-8 text-sm"
            />
          </div>
          <Button
            size="sm"
            className="h-8 gap-1.5 text-xs"
            disabled={adding}
            onClick={handleAdd}
          >
            <Plus className="h-3.5 w-3.5" />
            Add
          </Button>
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : holidays.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No public holidays recorded for {year}.
          </p>
        ) : (
          <ul className="divide-y divide-border rounded-md border border-border">
            {holidays.map((holiday) => (
              <li
                key={holiday.id}
                className="flex items-center justify-between gap-3 px-3 py-2"
              >
                <div className="flex flex-col">
                  <span className="text-sm text-foreground">{holiday.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(holiday.date)}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground"
                  aria-label={`Remove ${holiday.name}`}
                  onClick={() => handleDelete(holiday.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function Blackouts() {
  const { data, isLoading } = useGetLeaveBlackoutsQuery();
  const { data: types } = useGetLeaveTypesQuery();
  const [createBlackout, { isLoading: adding }] =
    useCreateLeaveBlackoutMutation();
  const [updateBlackout] = useUpdateLeaveBlackoutMutation();
  const [deleteBlackout] = useDeleteLeaveBlackoutMutation();
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const blackouts = data?.data ?? [];

  async function handleAdd() {
    // A new blackout covers every leave type and every department; narrow it
    // afterwards if it should not.
    const parsed = leaveBlackoutSchema.safeParse({
      name,
      reason: reason || null,
      startDate,
      endDate,
      leaveTypeIds: (types?.data ?? []).map((t) => t.id),
      departmentIds: [],
      isActive: true,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    try {
      await createBlackout(parsed.data).unwrap();
      toast.success(`${parsed.data.name} added`);
      setName("");
      setStartDate("");
      setEndDate("");
      setReason("");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not add the blackout."));
    }
  }

  async function handleToggle(blackout: LeaveBlackoutDto) {
    try {
      await updateBlackout({
        id: blackout.id,
        body: {
          name: blackout.name,
          reason: blackout.reason,
          startDate: blackout.startDate,
          endDate: blackout.endDate,
          leaveTypeIds: blackout.leaveTypeIds,
          departmentIds: blackout.departmentIds,
          isActive: !blackout.isActive,
        },
      }).unwrap();
      toast.success(blackout.isActive ? "Blackout paused" : "Blackout resumed");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not update the blackout."));
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteBlackout(id).unwrap();
      toast.success("Blackout removed");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not remove the blackout."));
    }
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-5">
        <div className="flex items-center gap-2">
          <CalendarX2 className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">
            Blackout Periods
          </h3>
        </div>
        <p className="text-xs text-muted-foreground">
          Dates when leave cannot be booked, such as a year-end close.
        </p>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto_auto]">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Year-end close"
              className="h-8 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">From</Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">To</Label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
        </div>
        <div className="flex items-end gap-2">
          <div className="flex flex-1 flex-col gap-1.5">
            <Label className="text-xs">Reason (optional)</Label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <Button
            size="sm"
            className="h-8 gap-1.5 text-xs"
            disabled={adding}
            onClick={handleAdd}
          >
            <Plus className="h-3.5 w-3.5" />
            Add
          </Button>
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : blackouts.length === 0 ? (
          <p className="text-sm text-muted-foreground">No blackout periods.</p>
        ) : (
          <ul className="divide-y divide-border rounded-md border border-border">
            {blackouts.map((blackout) => (
              <li
                key={blackout.id}
                className="flex items-center justify-between gap-3 px-3 py-2"
              >
                <div className="flex min-w-0 flex-col">
                  <span className="flex items-center gap-2 text-sm text-foreground">
                    {blackout.name}
                    {!blackout.isActive && (
                      <Badge variant="outline" className="text-[10px]">
                        Paused
                      </Badge>
                    )}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(blackout.startDate)} –{" "}
                    {formatDate(blackout.endDate)} ·{" "}
                    {blackout.appliesToEveryone ||
                    blackout.departmentNames.length === 0
                      ? "Everyone"
                      : blackout.departmentNames.join(", ")}
                  </span>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => handleToggle(blackout)}
                  >
                    {blackout.isActive ? "Pause" : "Resume"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground"
                    aria-label={`Remove ${blackout.name}`}
                    onClick={() => handleDelete(blackout.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function YearEnd() {
  const { data, isLoading } = usePreviewLeaveYearEndQuery();
  const [closeYear, { isLoading: closing }] = useCloseLeaveYearMutation();
  const [confirming, setConfirming] = useState(false);
  const preview = data?.data;

  async function handleClose() {
    try {
      const result = (await closeYear().unwrap()).data;
      toast.success(`${result.closedYearLabel} closed`, {
        description: `${result.carriedOver.length} balance(s) carried over, ${result.daysLapsed} day(s) lapsed.`,
      });
      setConfirming(false);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not close the leave year."));
    }
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-5">
        <h3 className="text-sm font-semibold text-foreground">
          Leave Year-End
        </h3>
        {isLoading || !preview ? (
          <p className="text-sm text-muted-foreground">
            {isLoading ? "Loading…" : "No year-end information available."}
          </p>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              Closing <span className="text-foreground">{preview.closedYearLabel}</span>{" "}
              carries {preview.carriedOver.length} balance(s) into the year
              starting {formatDate(preview.nextYearStart)} and lapses{" "}
              {preview.daysLapsed} day(s).
            </p>
            {preview.alreadyClosed ? (
              <Badge variant="outline" className="w-fit text-[10px]">
                Already closed
              </Badge>
            ) : confirming ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-foreground">
                  This cannot be undone. Close the year?
                </span>
                <Button
                  size="sm"
                  className="h-8 text-xs"
                  disabled={closing}
                  onClick={handleClose}
                >
                  Yes, close {preview.closedYearLabel}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs"
                  onClick={() => setConfirming(false)}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="h-8 w-fit text-xs"
                onClick={() => setConfirming(true)}
              >
                Close leave year
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

/** Public holidays, blackout periods and the year-end close. */
export function LeaveCalendarRules() {
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <PublicHolidays />
      <Blackouts />
      <div className="xl:col-span-2">
        <YearEnd />
      </div>
    </div>
  );
}
