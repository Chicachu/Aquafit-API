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
import type { PayableLineItem } from "../types/EmployeePayable";
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

function _hasValidPayment(a: Assignment): boolean {
  const p = a.paymentValue;
  return !!(p?.amount != null && p.amount > 0 && p.currency);
}

function _isAssignmentActive(a: Assignment): boolean {
  const today = _startOfDay(new Date());
  if (a.startDate && new Date(a.startDate) > today) return false;
  if (a.endDate != null && new Date(a.endDate) <= today) return false;
  if (a.status === AssignmentStatus.UNASSIGNED) return false;
  return true;
}

/**
 * Instructors: paid per check-in. A check-in counts only if the check-in date's weekday
 * is in the assignment's class days (e.g. Monday check-in for M/W/F class). Each check-in
 * adds paymentValue.amount once.
 * Employees: same weekday rule; paymentValue.amount is weekly salary, so we add
 * (amount / class.days.length) per valid check-in to prorate by expected days.
 */
export async function createOrUpdatePayableForMonth(
  staffId: string,
  year: number,
  month: number
): Promise<void> {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const period = { startDate: _startOfDay(firstDay), endDate: _startOfDay(lastDay) };
  const today = _startOfDay(new Date());
  const isFirstDayOfMonth =
    today.getDate() === 1 && today.getMonth() === month && today.getFullYear() === year;

  const user = await usersService.getUserById(staffId);
  const isInstructor = user?.role === Role.INSTRUCTOR;
  const isEmployee = user?.role === Role.EMPLOYEE;
  if (!isInstructor && !isEmployee) return;

  const allAssignments = await assignmentService.getInstructorAssignments(staffId);
  const assignments = allAssignments.filter(
    (a) => _hasValidPayment(a) && _isAssignmentActive(a)
  );
  if (assignments.length === 0) return;

  const assignmentMap = new Map<string, Assignment>(assignments.map((a) => [a._id!, a]));
  const classByAssignmentId = new Map<string, Class>();
  for (const a of assignments) {
    try {
      const cls = await classService.getClass(a.classId);
      classByAssignmentId.set(a._id!, cls);
    } catch {
      // skip assignments whose class is missing
    }
  }

  const checkIns = await employeeCheckInCollection.getCheckInsForEmployeeInMonth(
    staffId,
    year,
    month
  );
  const hasCheckIns = checkIns.length > 0;

  let charge: Price;
  let lineItems: PayableLineItem[] = [];

  if (isFirstDayOfMonth && !hasCheckIns) {
    const currency = assignments[0].paymentValue!.currency ?? Currency.PESOS;
    charge = { amount: 0, currency };
  } else if (hasCheckIns) {
    const byAssignment = new Map<string, { count: number; amount: number }>();
    let currency: Currency = Currency.PESOS;

    for (const c of checkIns) {
      const a = assignmentMap.get(c.assignmentId);
      const cls = classByAssignmentId.get(c.assignmentId);
      if (!a || !cls || !_hasValidPayment(a) || !a.paymentValue) continue;

      const checkInWeekday = new Date(c.date).getDay();
      if (!cls.days.includes(checkInWeekday)) continue;

      const p = a.paymentValue;
      currency = p.currency as Currency;
      const amountPerCheckIn = isInstructor
        ? p.amount
        : p.amount / (cls.days.length || 1);

      const cur = byAssignment.get(c.assignmentId) ?? { count: 0, amount: 0 };
      cur.count += 1;
      cur.amount += amountPerCheckIn;
      byAssignment.set(c.assignmentId, cur);
    }

    let totalAmount = 0;
    for (const [aid, { count, amount }] of byAssignment) {
      totalAmount += amount;
      const a = assignmentMap.get(aid);
      const curr = a?.paymentValue?.currency ?? currency;
      lineItems.push({
        assignmentId: aid,
        sessionsCount: count,
        amount: { amount: Math.round(amount * 100) / 100, currency: curr }
      });
    }
    if (byAssignment.size === 0) {
      currency = assignments[0].paymentValue!.currency ?? Currency.PESOS;
    }
    charge = { amount: Math.round(totalAmount * 100) / 100, currency };
  } else {
    return;
  }

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
