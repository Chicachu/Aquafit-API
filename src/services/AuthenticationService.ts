import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import AppError from "../types/AppError";
import { User } from "../types/User";
import i18n from '../../config/i18n';

class AuthenticationService { 
  async authenticateUser(user: User, password: string): Promise<string> {
    if (!user || !user.password) {
      throw new AppError(i18n.__('errors.incorrectCredentials'), 400)
    }

    const authenticated = await bcrypt.compare(password, user.password)

    if (!authenticated) {
      throw new AppError(i18n.__('errors.incorrectCredentials'), 400)
    }

    return jwt.sign({ userId: user._id }, process.env.JWT_SECRET!)
  }
}

const authenticationService = new AuthenticationService()
export { authenticationService, AuthenticationService }