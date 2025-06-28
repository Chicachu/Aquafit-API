import i18n from '../../config/i18n'

const dayMap = {
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  es: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
}

export function formatSchedule(days: number[], time: string): string {
  const locale = i18n.getLocale()
  const lang = locale === 'es' ? 'es' : 'en'
  const daysLocalized = dayMap[lang]

  // Format days
  const formattedDays = days
    .sort((a, b) => a - b)
    .map(d => daysLocalized[d])
    .join('/')

  // Format time
  const [hourStr, minuteStr] = time.split(':')
  let hour = parseInt(hourStr, 10)
  const minute = parseInt(minuteStr, 10)
  const isPM = hour >= 12
  const displayHour = hour % 12 === 0 ? 12 : hour % 12
  const period = isPM ? 'pm' : 'am'

  const formattedTime = `${displayHour}:${minute.toString().padStart(2, '0')}${period}`

  return `${formattedDays} - ${formattedTime}`
}

export function objectAsString(object: {}): string {
  return Object.entries(object)
      .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
      .join(', ')
}