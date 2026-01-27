import path from "path";
import { instructorPayableCollection } from "../models/instructor-payable/instructor-payable.class";
import { instructorCheckInCollection } from "../models/instructor-checkin/instructor-checkin.class";
import { assignmentService } from "./AssignmentService";
import { PaymentStatus } from "../types/enums/PaymentStatus";
import { Currency } from "../types/enums/Currency";
import { logger } from "./LoggingService";
import type { Price } from "../types/Price";
import type { PayableLineItem } from "../types/InstructorPayable";
import type { Assignment } from "../types/Assignment";

const _FILE_NAME = path.basename(__filename);

function _startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export async function getPayablesByUserId(userId: string) {
  logger.debugInside(_FILE_NAME, "getPayablesByUserId", { userId });
  return instructorPayableCollection.getByInstructorId(userId);
}

function _hasValidPayment(a: Assignment): boolean {
  const p = a.paymentPerSession;
  return !!(p?.amount != null && p.amount > 0 && p.currency);
}

export async function createOrUpdatePayableForMonth(
  instructorId: string,
  year: number,
  month: number
): Promise<void> {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const period = { startDate: _startOfDay(firstDay), endDate: _startOfDay(lastDay) };
  const today = _startOfDay(new Date());
  const isFirstDayOfMonth =
    today.getDate() === 1 && today.getMonth() === month && today.getFullYear() === year;

  const assignments = await assignmentService.getInstructorAssignments(instructorId);
  const withPayment = assignments.filter(_hasValidPayment);
  if (withPayment.length === 0) return;

  const checkIns = await instructorCheckInCollection.getCheckInsForInstructorInMonth(
    instructorId,
    year,
    month
  );
  const hasCheckIns = checkIns.length > 0;

  let charge: Price;
  let lineItems: PayableLineItem[] = [];

  if (isFirstDayOfMonth && !hasCheckIns) {
    const currency = withPayment[0].paymentPerSession!.currency ?? Currency.PESOS;
    charge = { amount: 0, currency };
  } else if (hasCheckIns) {
    const byAssignment = new Map<string, number>();
    for (const c of checkIns) {
      byAssignment.set(c.assignmentId, (byAssignment.get(c.assignmentId) || 0) + 1);
    }
    const assignmentMap = new Map(assignments.map((a) => [a._id!, a]));
    let totalAmount = 0;
    let currency: Currency = Currency.PESOS;
    for (const [aid, count] of byAssignment) {
      const a = assignmentMap.get(aid);
      if (!a || !_hasValidPayment(a) || !a.paymentPerSession) continue;
      const p = a.paymentPerSession;
      currency = p.currency as Currency;
      const amt = count * p.amount;
      totalAmount += amt;
      lineItems.push({
        assignmentId: aid,
        sessionsCount: count,
        amount: { amount: amt, currency: p.currency }
      });
    }
    charge = { amount: totalAmount, currency };
  } else {
    return;
  }

  const existing = await instructorPayableCollection.findOne({
    instructorId,
    "period.startDate": period.startDate
  });

  if (existing) {
    await instructorPayableCollection.updateOne({ _id: existing._id }, { $set: { charge, lineItems } });
    logger.debugInside(_FILE_NAME, "createOrUpdatePayableForMonth", {
      instructorId,
      year,
      month,
      updated: true,
      charge: charge.amount
    });
  } else {
    await instructorPayableCollection.create({
      instructorId,
      period,
      paymentStatus: PaymentStatus.PENDING,
      charge,
      lineItems
    });
    logger.debugInside(_FILE_NAME, "createOrUpdatePayableForMonth", {
      instructorId,
      year,
      month,
      created: true,
      charge: charge.amount
    });
  }
}

export async function generatePayablesForCurrentMonth(): Promise<void> {
  logger.debugInside(_FILE_NAME, "generatePayablesForCurrentMonth", {});
  const instructorIds = await assignmentService.getInstructorIdsWithPayableAssignments();
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  for (const instructorId of instructorIds) {
    try {
      await createOrUpdatePayableForMonth(instructorId, year, month);
    } catch (e: any) {
      logger.error(`generatePayablesForCurrentMonth: error for instructor ${instructorId}: ${e?.message || e}`);
    }
  }
  logger.debugComplete(_FILE_NAME, "generatePayablesForCurrentMonth");
}
