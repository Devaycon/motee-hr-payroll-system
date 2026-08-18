/**
 * §6.24 — quarter-on-quarter and year-on-year headcount movement.
 *
 * The Headcount Plan tab answers "where are we now against target". It cannot
 * answer "are we growing or shrinking, and how fast", because it only ever
 * looks at one period. These are pure functions over the same plan rows.
 */
import {
	previousQuarter,
	sameQuarterLastYear,
	QUARTERLY_PERIODS,
	type HeadcountPlan,
	type PlanPeriod,
} from "@/src/lib/types/headcount";

export interface TrendRow {
	department: string;
	current: number;
	previous: number;
	/** current − previous. Negative means the department shrank. */
	delta: number;
	/** Percentage change, rounded to 1dp. Null when there is no baseline. */
	pctChange: number | null;
	/** Target for the current period, for context alongside the movement. */
	target: number;
}

export interface TrendSummary {
	/** The period being compared against, or null when none is held. */
	comparisonPeriod: PlanPeriod | null;
	rows: TrendRow[];
	totalCurrent: number;
	totalPrevious: number;
	totalDelta: number;
	totalPctChange: number | null;
	/** Departments that grew / shrank / held steady. */
	grew: number;
	shrank: number;
	flat: number;
}

/**
 * Percent change guarding the zero baseline. Going from 0 to 5 is not a
 * "500% increase" or an Infinity — it has no meaningful percentage, so the
 * caller shows the absolute movement instead.
 */
function percentChange(current: number, previous: number): number | null {
	if (previous === 0) return null;
	return Math.round(((current - previous) / previous) * 1000) / 10;
}

function actualsByDepartment(
	plans: HeadcountPlan[],
	period: PlanPeriod,
): Map<string, HeadcountPlan> {
	return new Map(
		plans.filter((p) => p.period === period).map((p) => [p.department, p]),
	);
}

/** Compare `period` against another period, department by department. */
function compare(
	plans: HeadcountPlan[],
	period: PlanPeriod,
	comparisonPeriod: PlanPeriod | null,
): TrendSummary {
	const current = actualsByDepartment(plans, period);
	const previous = comparisonPeriod
		? actualsByDepartment(plans, comparisonPeriod)
		: new Map<string, HeadcountPlan>();

	// Departments present in either period — one that closed still belongs in
	// the trend, as a drop to zero rather than a silent disappearance.
	const departments = [
		...new Set([...current.keys(), ...previous.keys()]),
	].sort();

	const rows: TrendRow[] = departments.map((department) => {
		const cur = current.get(department)?.actual ?? 0;
		const prev = previous.get(department)?.actual ?? 0;
		return {
			department,
			current: cur,
			previous: prev,
			delta: cur - prev,
			pctChange: percentChange(cur, prev),
			target: current.get(department)?.target ?? 0,
		};
	});

	const totalCurrent = rows.reduce((s, r) => s + r.current, 0);
	const totalPrevious = rows.reduce((s, r) => s + r.previous, 0);

	return {
		comparisonPeriod,
		rows,
		totalCurrent,
		totalPrevious,
		totalDelta: totalCurrent - totalPrevious,
		totalPctChange: percentChange(totalCurrent, totalPrevious),
		grew: rows.filter((r) => r.delta > 0).length,
		shrank: rows.filter((r) => r.delta < 0).length,
		flat: rows.filter((r) => r.delta === 0).length,
	};
}

/** §6.24 — movement against the immediately preceding quarter. */
export function quarterOverQuarter(
	plans: HeadcountPlan[],
	period: PlanPeriod,
): TrendSummary {
	return compare(plans, period, previousQuarter(period));
}

/** §6.24 — movement against the same quarter a year earlier. */
export function yearOverYear(
	plans: HeadcountPlan[],
	period: PlanPeriod,
): TrendSummary {
	return compare(plans, period, sameQuarterLastYear(period));
}

export interface TrendSeriesPoint {
	period: PlanPeriod;
	actual: number;
	target: number;
}

/**
 * Company-wide actual vs target across every quarter held, for the trend
 * chart. Quarters only — mixing FY totals into a quarterly series would
 * double-count the year.
 */
export function headcountSeries(plans: HeadcountPlan[]): TrendSeriesPoint[] {
	return QUARTERLY_PERIODS.map((period) => {
		const rows = plans.filter((p) => p.period === period);
		return {
			period,
			actual: rows.reduce((s, p) => s + p.actual, 0),
			target: rows.reduce((s, p) => s + p.target, 0),
		};
	}).filter((point) => point.actual > 0 || point.target > 0);
}
