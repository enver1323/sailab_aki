const KODayOfTheWeek = ["일", "월", "화", "수", "목", "금", "토"]

export const toKOLocaleString = (date: Date, noDay?: boolean): string => {
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, "0")
  const dateStr = date.getDate().toString().padStart(2, "0")

  const day = KODayOfTheWeek[date.getDay()]

  return `${year}.${month}.${dateStr}${noDay ? "" : ` (${day})`}`
}

export const toKOLocaleTimeString = (date: Date): string => {
  const hours = date.getHours() % 12
  const isPM = date.getHours() / 12
  const minutes = date.getMinutes().toString().padStart(2, "0")

  return `${isPM ? "오후" : "오전"} ${hours}:${minutes}`
}
