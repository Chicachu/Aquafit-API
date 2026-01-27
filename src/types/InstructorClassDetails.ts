import { Class } from "./Class"
import { User } from "./User"
import { Assignment } from "./Assignment"

export type InstructorClassDetails = {
  instructor: User
  assignmentInfo: {
    class: Class
    assignment: Assignment
  }[]
}
