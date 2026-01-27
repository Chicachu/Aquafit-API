import { IDocument } from "./IDocument";
import { PaymentStatus } from "./enums/PaymentStatus";
import { Price } from "./Price";

export type PayableLineItem = {
  assignmentId: string;
  sessionsCount: number;
  amount: Price;
};

export type InstructorPayable = IDocument & {
  instructorId: string;
  period: { startDate: Date; endDate: Date };
  paymentStatus: PaymentStatus;
  charge: Price;
  lineItems?: PayableLineItem[];
};

export type InstructorPayableCreationDTO = {
  instructorId: string;
  period: { startDate: Date; endDate: Date };
  paymentStatus: PaymentStatus;
  charge: Price;
  lineItems?: PayableLineItem[];
};
