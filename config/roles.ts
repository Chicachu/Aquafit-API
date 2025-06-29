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
    .readAny(AccessControlResource.ENROLLMENT)
  
  ac.grant(Role.ADMIN)
    .extend(Role.INSTRUCTOR)
    .readAny(AccessControlResource.PAYMENT)
    .createAny(AccessControlResource.PAYMENT)
    .updateAny(AccessControlResource.PAYMENT)
    .deleteAny(AccessControlResource.PAYMENT)
    .createAny(AccessControlResource.CLASS)
    .updateAny(AccessControlResource.CLASS)
    .deleteAny(AccessControlResource.CLASS)
    .createAny(AccessControlResource.USER)
    .updateAny(AccessControlResource.USER)
    .deleteAny(AccessControlResource.USER)
    .createAny(AccessControlResource.ENROLLMENT)
    .updateAny(AccessControlResource.ENROLLMENT)
    .deleteAny(AccessControlResource.ENROLLMENT)
    .readAny(AccessControlResource.ALL)
    .updateAny(AccessControlResource.ALL)
    .deleteAny(AccessControlResource.ALL)

  return ac
}

export { roles }