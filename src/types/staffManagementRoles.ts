import { Role } from '../types/enums/Role';

/** Roles that can be assigned when adding or editing staff in the employees list. */
export const STAFF_MANAGEMENT_ROLES: Role[] = [
  Role.INSTRUCTOR,
  Role.MANAGER,
  Role.RECEPTIONIST
];

export function isStaffManagementRole(role: Role): boolean {
  return STAFF_MANAGEMENT_ROLES.includes(role);
}

export function hasStaffEmployeeId(role: Role): boolean {
  return isStaffManagementRole(role);
}
