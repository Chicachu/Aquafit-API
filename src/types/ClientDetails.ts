import { Enrollment } from "./Enrollment";
import { IDocument } from "./IDocument";
import { User } from "./User";

export type ClientDetails = IDocument & User & {
  enrollments: Enrollment[]
}