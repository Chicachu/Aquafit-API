import { IDocument } from "./IDocument";
import { PaymentStatus } from "./enums/PaymentStatus";
import { Price } from "./Price";

export type PayableLineItem = {
  assignmentId: string;
  sessionsCount: number;
  amount: Price;
};

export type EmployeePayable = IDocument & {
  employeeId: string;
  period: { startDate: Date; endDate: Date };
  paymentStatus: PaymentStatus;
  charge: Price;
  lineItems?: PayableLineItem[];
};

export type EmployeePayableCreationDTO = {
  employeeId: string;
  period: { startDate: Date; endDate: Date };
  paymentStatus: PaymentStatus;
  charge: Price;
  lineItems?: PayableLineItem[];
};
