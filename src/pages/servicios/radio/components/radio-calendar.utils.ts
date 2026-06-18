export function getWeekRange(date: Date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(d.setDate(diff))
  monday.setHours(0, 0, 0, 0)
  const sunday = new Date(monday)
  sunday.setDate(sunday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)
  return { monday, sunday }
}

export function getWeekDays(monday: Date) {
  const days: Date[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday)
    d.setDate(d.getDate() + i)
    days.push(d)
  }
  return days
}

export function formatDate(d: Date) {
  return d.toISOString().split("T")[0]
}

export function timeToMinutes(t: string) {
  const p = t.split(":")
  return parseInt(p[0]) * 60 + parseInt(p[1] || "0")
}
