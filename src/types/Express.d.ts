import { User } from "./User";

declare module 'express' {
  export interface Request {
    user?: User,
    username?: string, 
    password?: string
  }
}