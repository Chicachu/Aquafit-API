import { ClassService, classService } from "../services/ClassService"
import { EnrollmentService, enrollmentService } from "../services/EnrollmentService"
import { PaymentService, paymentService } from "../services/PaymentService"
import AppError from "../types/AppError"
import { ClassDetails } from "../types/ClassDetails"

class ClassHandler {
  constructor(
    private classService: ClassService, 
    private enrollmentService: EnrollmentService,
    private paymentService: PaymentService
  ) {}

  async getClassDetails(classId: string): Promise<ClassDetails> {
    const foundClass = await this.classService.getClass(classId)
    if (!foundClass) {
      throw new AppError(i18n.__('errors.resourceNotFound'), 404)
    }

    const classEnrollments = await this.enrollmentService.getClassEnrollmentInfo(foundClass._id!)
    const enrollmentIds = classEnrollments?.map(enrollment => enrollment._id)
    const clientIds = classEnrollments?.map(enrollment => enrollment.classId)

    let payments 
    if (enrollmentIds && clientIds) {
      payments = await this.paymentService.getAllPaymentsForClass(enrollmentIds, clientIds)
    }

    const classDetails: ClassDetails = {
      ...foundClass, 
      clients: []
    }

    return classDetails
  }
}
const classHandler = new ClassHandler(classService, enrollmentService, paymentService)
export { classHandler, ClassHandler }