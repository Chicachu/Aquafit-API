const INTERNAL_AQUAFIT_EMAIL_REGEX = /^[^@\s]+@aquafitvallarta\.com$/i
export const ADMIN_AQUAFIT_EMAIL = 'admin@aquafitvallarta.com'

const ADMIN_AQUAFIT_EMAILS = new Set([
  'admin@aquafitvallarta.com',
  'info@aquafitvallarta.com'
])

export function isAdminAquafitEmail(email: string): boolean {
  return ADMIN_AQUAFIT_EMAILS.has(email.trim().toLowerCase())
}

export function isInternalAquafitEmail(email: string): boolean {
  return INTERNAL_AQUAFIT_EMAIL_REGEX.test(email.trim())
}

export function parseNameFromInternalEmail(email: string): { firstName: string; lastName: string } {
  const localPart = email.trim().split('@')[0] ?? 'User'
  const parts = localPart.split(/[._-]+/).filter(Boolean)
  const capitalize = (value: string) =>
    value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()

  if (parts.length >= 2) {
    return {
      firstName: capitalize(parts[0]),
      lastName: capitalize(parts.slice(1).join(' '))
    }
  }

  return {
    firstName: capitalize(parts[0] || 'User'),
    lastName: 'Staff'
  }
}
