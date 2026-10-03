export const DAY_LABELS = ['월', '화', '수', '목', '금']

export function formatKoreanDate(dateString: string) {
  const [year, month, day] = dateString.split('-').map(Number)
  return `${year}. ${month}. ${day}.`
}

export function formatShortDate(dateString: string) {
  const [, month, day] = dateString.split('-').map(Number)
  return `${month}.${String(day).padStart(2, '0')}`
}

export function getMonday(date = new Date()) {
  const result = new Date(date)
  const day = result.getDay() || 7
  result.setDate(result.getDate() - day + 1)
  return toDateString(result)
}

export function shiftDate(dateString: string, days: number) {
  const date = new Date(`${dateString}T12:00:00`)
  date.setDate(date.getDate() + days)
  return toDateString(date)
}

export function toDateString(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
