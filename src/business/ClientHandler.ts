import { ClassService, classService } from "../services/ClassService"
import { enrollmentService, EnrollmentService } from "../services/EnrollmentService"
import AppError from "../types/AppError"
import { Class } from "../types/Class"
import { Promotion } from "../types/discounts/Promotion"
import { Enrollment, EnrollmentCreationDTO } from "../types/Enrollment"
import { BillingFrequency } from "../types/enums/BillingFrequency"
import { Currency } from "../types/enums/Currency"

class ClientHandler {
  constructor(private _enrollmentService: EnrollmentService, private _classService: ClassService) {}
  async enrollClient(
    classId: string, 
    userId: string, 
    startDate: Date, 
    billingFrequency?: BillingFrequency, 
    promotion?: Promotion,
    currency?: Currency
  ): Promise<void> {
    if (!classId || !userId) {
      throw new AppError(i18n.__('errors.missingParameters'), 400)
    }

    const classDoc = await this._classService.getClass(classId)
    const enrollment = await this._enrollClient(classDoc, userId, startDate, billingFrequency)
    

    const basePrice = classDoc.prices.find(p => currency ? p.currency === currency : p.currency === Currency.PESOS)
    // apply promos or discounts 
    
  }

  private async _enrollClient(classDoc: Class, userId: string, startDate: Date, billingFrequency?: BillingFrequency): Promise<Enrollment> {
    const enrollmentDTO: EnrollmentCreationDTO = {
      userId, 
      classId: classDoc._id, 
      startDate, 
      billingFrequency: billingFrequency ?? classDoc.billingFrequency
    }
    
    return await this._enrollmentService.enrollClient(enrollmentDTO)
  }
}

const clientHandler = new ClientHandler(enrollmentService, classService)
export { clientHandler, ClientHandler }