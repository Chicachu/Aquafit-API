import path from "path"
import { ClassService, classService } from "../services/ClassService"
import { EnrollmentService, enrollmentService } from "../services/EnrollmentService"
import { invoiceService, InvoiceService } from "../services/InvoiceService"
import { logger } from "../services/LoggingService"
import AppError from "../types/AppError"
import { ClassDetails } from "../types/ClassDetails"

class ClassHandler {
  constructor(
    private classService: ClassService, 
    private enrollmentService: EnrollmentService,
    private invoiceService: InvoiceService
  ) {}

  private readonly _FILE_NAME = path.basename(__filename)

  async getClassDetails(classId: string): Promise<ClassDetails> {
    logger.debugInside(this._FILE_NAME, this.getClassDetails.name, { classId })
    const foundClass = await this.classService.getClass(classId)
    if (!foundClass) {
      throw new AppError('errors.resourceNotFound', 404)
    }

    const classEnrollments = await this.enrollmentService.getClassEnrollmentInfo(foundClass._id!)
    const enrollmentIds = classEnrollments?.map(enrollment => enrollment._id)
    const clientIds = classEnrollments?.map(enrollment => enrollment.classId)

    let payments 
    if (enrollmentIds && clientIds) {
      payments = await this.invoiceService.getAllInvoicesForClass(enrollmentIds, clientIds)
    }

    const classDetails: ClassDetails = {
      ...foundClass, 
      clients: []
    }

    logger.debugComplete(this._FILE_NAME, this.getClassDetails.name)
    return classDetails
  }
}
const classHandler = new ClassHandler(classService, enrollmentService, invoiceService)
export { classHandler, ClassHandler }