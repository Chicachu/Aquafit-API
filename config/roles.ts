import { AccessControl } from 'accesscontrol'
import { Role } from '../src/types/enums/Role'
import { AccessControlResource } from '../src/types/enums/AccessControlResource'

const ac = new AccessControl()

function roles(): AccessControl {
  ac.grant(Role.GUEST)
    .readAny(AccessControlResource.CLASS)

  ac.grant(Role.CLIENT)
    .extend(Role.GUEST)
    .readOwn(AccessControlResource.USER)
  
  ac.grant(Role.INSTRUCTOR)
    .extend(Role.CLIENT)
    .readAny(AccessControlResource.USER)
    .readAny(AccessControlResource.CLASS)
  
  ac.grant(Role.ADMIN)
    .extend(Role.INSTRUCTOR)
    .updateAny(AccessControlResource.CLASS)
    .deleteAny(AccessControlResource.CLASS)
    .updateAny(AccessControlResource.USER)
    .deleteAny(AccessControlResource.USER)

  return ac
}

export { roles }