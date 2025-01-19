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
  
  ac.grant(Role.ADMIN)
    .extend(Role.INSTRUCTOR)
    .createAny(AccessControlResource.CLASS)
    .updateAny(AccessControlResource.CLASS)
    .deleteAny(AccessControlResource.CLASS)
    .updateAny(AccessControlResource.USER)
    .deleteAny(AccessControlResource.USER)
    .readAny(AccessControlResource.ALL)
    .updateAny(AccessControlResource.ALL)
    .deleteAny(AccessControlResource.ALL)

  return ac
}

export { roles }