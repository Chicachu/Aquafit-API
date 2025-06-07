import { Class } from "./Class"
import { Enrollment } from "./Enrollment"
import { User } from "./User"

export type ClientEnrollmentDetails = {
  client: User
  enrolledClassInfo: {
    class: Class, 
    enrollment: Enrollment
  }[]
}