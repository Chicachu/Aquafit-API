import { IDocument } from "./IDocument";

export type InstructorCheckIn = IDocument & {
  instructorId: string;
  assignmentId: string;
  date: Date;
};

export type InstructorCheckInCreationDTO = {
  instructorId: string;
  assignmentId: string;
  date: Date;
};
