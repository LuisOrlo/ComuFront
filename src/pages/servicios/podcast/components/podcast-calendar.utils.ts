export function getWeekRange(date: Date) {
  const day = date.getDay()
  const monday = new Date(date)
  monday.setDate(date.getDate() - day + (day === 0 ? -6 : 1))
  monday.setHours(0, 0, 0, 0)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)
  return { monday, sunday }
}

export function getWeekDays(monday: Date) {
  const days: Date[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    days.push(d)
  }
  return days
}
