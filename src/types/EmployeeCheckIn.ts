import { IDocument } from "./IDocument";

export enum CheckInType {
  CHECK_IN = "check-in",
  CHECK_OUT = "check-out"
}

export type EmployeeCheckIn = IDocument & {
  employeeId: string;
  type: CheckInType;
  date: Date;
};

export type EmployeeCheckInCreationDTO = {
  employeeId: string;
  type: CheckInType;
  date: Date;
};
