import { IDocument } from "./IDocument";

export type EmployeeCheckIn = IDocument & {
  employeeId: string;
  assignmentId: string;
  date: Date;
};

export type EmployeeCheckInCreationDTO = {
  employeeId: string;
  assignmentId: string;
  date: Date;
};
