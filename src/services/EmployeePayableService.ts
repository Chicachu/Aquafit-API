import path from "path";
import { employeePayableCollection } from "../models/employee-payable/employee-payable.class";
import { employeeCheckInCollection } from "../models/employee-checkin/employee-checkin.class";
import { assignmentService } from "./AssignmentService";
import { classService } from "./ClassService";
import { usersService } from "./UsersService";
import { PaymentStatus } from "../types/enums/PaymentStatus";
import { Currency } from "../types/enums/Currency";
import { Role } from "../types/enums/Role";
import { AssignmentStatus } from "../types/enums/AssignmentStatus";
import { logger } from "./LoggingService";
import type { Price } from "../types/Price";
import type { EmployeePayable, PayableLineItem } from "../types/EmployeePayable";
import type { Assignment } from "../types/Assignment";
import type { Class } from "../types/Class";

const _FILE_NAME = path.basename(__filename);

function _startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export async function getPayablesByUserId(userId: string) {
  logger.debugInside(_FILE_NAME, "getPayablesByUserId", { userId });
  return employeePayableCollection.getByEmployeeId(userId);
}

export async function getPayableById(userId: string, payableId: string) {
  logger.debugInside(_FILE_NAME, "getPayableById", { userId, payableId });
  return employeePayableCollection.findOne({ _id: payableId, employeeId: userId });
}

/**
 * Fetch payable by id and merge in freshly computed charge/lineItems for its period.
 * Ensures payment details always reflect current check-ins and assignments.
 */
export async function getPayableDetailsWithComputedAmounts(
  userId: string,
  payableId: string
): Promise<EmployeePayable | null> {
  const payable = await employeePayableCollection.findOne({ _id: payableId, employeeId: userId });
  if (!payable) return null;

  const start = new Date(payable.period.startDate);
  const year = start.getFullYear();
  const month = start.getMonth();
  const computed = await computeChargeAndLineItemsForMonth(userId, year, month);

  if (computed) {
    const out = payable as unknown as EmployeePayable;
    out.charge = computed.charge;
    out.lineItems = computed.lineItems;
    return out;
  }
  return payable as unknown as EmployeePayable;
}

function _hasValidPayment(a: Assignment): boolean {
  const p = a.paymentValue;
  return !!(p?.amount != null && p.amount > 0 && p.currency);
}

/** Uses status only; cron job checks endDate and sets UNASSIGNED. */
function _isAssignmentActive(a: Assignment): boolean {
  const today = _startOfDay(new Date());
  if (a.startDate && new Date(a.startDate) > today) return false;
  if (a.status === AssignmentStatus.UNASSIGNED) return false;
  return true;
}

function _addTimeToDate(date: Date, timeStr: string): Date {
  const parts = timeStr.split(":");
  const h = Math.floor(Number(parts[0]) || 0);
  const m = Math.floor(Number(parts[1]) || 0);
  const d = new Date(date);
  d.setHours(h, m, 0, 0);
  return d;
}

function _endOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

/** Build [check-in, check-out] work intervals from sorted entries. Pairs in order. */
function _buildWorkIntervals(entries: { type: string; date: Date }[]): { start: Date; end: Date }[] {
  const intervals: { start: Date; end: Date }[] = [];
  let pending: Date | null = null;
  for (const e of entries) {
    if (e.type === "check-in") {
      pending = new Date(e.date);
    } else if (e.type === "check-out" && pending !== null) {
      intervals.push({ start: pending, end: new Date(e.date) });
      pending = null;
    }
  }
  if (pending !== null) {
    intervals.push({ start: pending, end: _endOfDay(pending) });
  }
  return intervals;
}

function _sameLocalDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** True if moment is inside [start, end] for any interval that starts on the same local calendar day. */
function _workIntervalsContainMoment(
  intervals: { start: Date; end: Date }[],
  moment: Date
): boolean {
  const t = moment.getTime();
  return intervals.some((i) => {
    if (!_sameLocalDay(i.start, moment)) return false;
    return t >= i.start.getTime() && t <= i.end.getTime();
  });
}

/**
 * Session moments for an assignment's class in the given month: each (day, startTime)
 * where day is in class.days and within [class.startDate, class.endDate] and [firstDay, lastDay].
 */
function _sessionMomentsForAssignmentInMonth(
  cls: Class,
  year: number,
  month: number
): Date[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const classStart = new Date(cls.startDate);
  const classEnd = cls.endDate ? new Date(cls.endDate) : null;
  if (classEnd && classEnd < firstDay) return [];
  if (classStart > lastDay) return [];

  const start = classStart > firstDay ? classStart : firstDay;
  const end = classEnd && classEnd < lastDay ? classEnd : lastDay;
  const moments: Date[] = [];
  const cur = new Date(start);
  cur.setHours(0, 0, 0, 0);
  while (cur <= end) {
    if (cls.days.includes(cur.getDay())) {
      moments.push(_addTimeToDate(new Date(cur), cls.startTime));
    }
    cur.setDate(cur.getDate() + 1);
  }
  return moments;
}

/**
 * Compute charge and line items from work intervals (check-in/check-out pairs) and
 * assignment class sessions. Check-ins are not tied to assignments; we use time at work
 * to see if they were present for a class session.
 *
 * - Work intervals: pair check-in with next check-out.
 * - For each assignment's class, each session (day + startTime) in the month: if any
 *   work interval contains that moment, count +1 for that assignment.
 * - Instructors: paymentValue.amount per session. Employees: (amount / class.days.length) per session.
 *
 * Returns null when no payable should exist (e.g. not instructor/employee, no
 * assignments, or no work intervals and not first day of month).
 */
export async function computeChargeAndLineItemsForMonth(
  staffId: string,
  year: number,
  month: number
): Promise<{ charge: Price; lineItems: PayableLineItem[] } | null> {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const today = _startOfDay(new Date());
  const isFirstDayOfMonth =
    today.getDate() === 1 && today.getMonth() === month && today.getFullYear() === year;

  const user = await usersService.getUserById(staffId);
  const isInstructor = user?.role === Role.INSTRUCTOR;
  const isEmployee = user?.role === Role.EMPLOYEE;
  if (!isInstructor && !isEmployee) return null;

  const allAssignments = await assignmentService.getInstructorAssignments(staffId);
  const assignments = allAssignments.filter(
    (a) => _hasValidPayment(a) && _isAssignmentActive(a)
  );
  if (assignments.length === 0) return null;

  const assignmentMap = new Map<string, Assignment>(assignments.map((a) => [a._id!, a]));
  const classByAssignmentId = new Map<string, Class>();
  for (const a of assignments) {
    try {
      const cls = await classService.getClass(a.classId);
      classByAssignmentId.set(a._id!, cls);
    } catch {
      /* skip */
    }
  }

  const entries = await employeeCheckInCollection.getEntriesForEmployeeInMonth(
    staffId,
    year,
    month
  );
  const workIntervals = _buildWorkIntervals(entries);
  const hasWorkIntervals = workIntervals.length > 0;

  logger.debugInside(_FILE_NAME, "computeChargeAndLineItemsForMonth", {
    staffId,
    year,
    month,
    entriesCount: entries.length,
    workIntervalsCount: workIntervals.length,
    assignmentsCount: assignments.length,
  });

  if (isFirstDayOfMonth && !hasWorkIntervals) {
    const currency = assignments[0]!.paymentValue!.currency ?? Currency.PESOS;
    return { charge: { amount: 0, currency }, lineItems: [] };
  }
  if (!hasWorkIntervals) return null;

  const byAssignment = new Map<string, { count: number; amount: number }>();
  let currency: Currency = Currency.PESOS;

  for (const a of assignments) {
    const cls = classByAssignmentId.get(a._id!);
    if (!cls || !a.paymentValue) continue;

    const moments = _sessionMomentsForAssignmentInMonth(cls, year, month);
    let count = 0;
    for (const m of moments) {
      if (_workIntervalsContainMoment(workIntervals, m)) count += 1;
    }
    if (count === 0) continue;

    const p = a.paymentValue;
    currency = p.currency as Currency;
    const amountPerSession = isInstructor
      ? p.amount
      : p.amount / (cls.days.length || 1);
    const amount = count * amountPerSession;
    const aid = a._id!;
    byAssignment.set(aid, { count, amount });
  }

  let totalAmount = 0;
  const lineItems: PayableLineItem[] = [];
  for (const [aid, { count, amount }] of byAssignment) {
    totalAmount += amount;
    const a = assignmentMap.get(aid);
    const cls = classByAssignmentId.get(aid);
    const curr = (a?.paymentValue?.currency ?? currency) as Currency;
    lineItems.push({
      assignmentId: aid,
      sessionsCount: count,
      amount: { amount: Math.round(amount * 100) / 100, currency: curr },
      ...(cls && {
        classType: cls.classType,
        classLocation: cls.classLocation,
        days: cls.days,
        startTime: cls.startTime
      })
    });
  }

  lineItems.sort((x, y) => {
    const locA = (x.classLocation ?? "").toLowerCase();
    const locB = (y.classLocation ?? "").toLowerCase();
    if (locA !== locB) return locA.localeCompare(locB);

    const typeA = (x.classType ?? "").toLowerCase();
    const typeB = (y.classType ?? "").toLowerCase();
    if (typeA !== typeB) return typeA.localeCompare(typeB);

    const minDayA = (x.days?.length ? Math.min(...x.days) : 999);
    const minDayB = (y.days?.length ? Math.min(...y.days) : 999);
    if (minDayA !== minDayB) return minDayA - minDayB;

    const [hA, mA] = (x.startTime ?? "99:99").split(":").map(Number);
    const [hB, mB] = (y.startTime ?? "99:99").split(":").map(Number);
    return hA * 60 + (mA || 0) - (hB * 60 + (mB || 0));
  });

  const baseCurrency = assignments[0]!.paymentValue!.currency ?? Currency.PESOS;
  const charge: Price = {
    amount: Math.round(totalAmount * 100) / 100,
    currency: byAssignment.size > 0 ? currency : (baseCurrency as Currency)
  };
  return { charge, lineItems };
}

/**
 * Create or update the payable for the given staff/month. Uses
 * computeChargeAndLineItemsForMonth and persists the result.
 */
export async function createOrUpdatePayableForMonth(
  staffId: string,
  year: number,
  month: number
): Promise<void> {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const period = { startDate: _startOfDay(firstDay), endDate: _startOfDay(lastDay) };

  const computed = await computeChargeAndLineItemsForMonth(staffId, year, month);
  if (!computed) return;

  const { charge, lineItems } = computed;

  const existing = await employeePayableCollection.findOne({
    employeeId: staffId,
    "period.startDate": period.startDate
  });

  if (existing) {
    await employeePayableCollection.updateOne({ _id: existing._id }, { $set: { charge, lineItems } });
    logger.debugInside(_FILE_NAME, "createOrUpdatePayableForMonth", {
      staffId,
      year,
      month,
      updated: true,
      charge: charge.amount
    });
  } else {
    await employeePayableCollection.create({
      employeeId: staffId,
      period,
      paymentStatus: PaymentStatus.PENDING,
      charge,
      lineItems
    });
    logger.debugInside(_FILE_NAME, "createOrUpdatePayableForMonth", {
      staffId,
      year,
      month,
      created: true,
      charge: charge.amount
    });
  }
}

export async function generatePayablesForCurrentMonth(): Promise<void> {
  logger.debugInside(_FILE_NAME, "generatePayablesForCurrentMonth", {});
  const staffIds = await assignmentService.getInstructorIdsWithPayableAssignments();
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  for (const staffId of staffIds) {
    try {
      await createOrUpdatePayableForMonth(staffId, year, month);
    } catch (e: any) {
      logger.error(`generatePayablesForCurrentMonth: error for staff ${staffId}: ${e?.message || e}`);
    }
  }
  logger.debugComplete(_FILE_NAME, "generatePayablesForCurrentMonth");
}
