import { AccessControl } from 'accesscontrol'
import { Role } from '../types/enums/Role'

const ac = new AccessControl()
const PROFILE='clientProfile'
const CLASS_SCHEDULE='classSchedule'

function roles(): AccessControl {
  ac.grant(Role.CLIENT)
    .readOwn(PROFILE)
    .readAny(CLASS_SCHEDULE)
  
  ac.grant(Role.INSTRUCTOR)
    .extend(Role.CLIENT)
    .readAny(PROFILE)
    .readAny(CLASS_SCHEDULE)
  
  ac.grant(Role.ADMIN)
    .extend(Role.CLIENT)
    .extend(Role.INSTRUCTOR)
    .updateAny(CLASS_SCHEDULE)
    .deleteAny(CLASS_SCHEDULE)
    .updateAny(PROFILE)
    .deleteAny(PROFILE)

  return ac
}

export { roles }