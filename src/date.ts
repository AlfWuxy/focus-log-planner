const parseLocalDate = (isoDate: string): Date => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) {
    throw new Error(`Invalid ISO date: ${isoDate}`);
  }

  const [, year, month, day] = match;
  return new Date(Number(year), Number(month) - 1, Number(day), 12);
};

export const formatLongDate = (isoDate: string): string =>
  new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  }).format(parseLocalDate(isoDate));

export const formatShortDate = (isoDate: string): string =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(parseLocalDate(isoDate));

export const formatWeekday = (isoDate: string): string =>
  new Intl.DateTimeFormat("en-US", { weekday: "short" })
    .format(parseLocalDate(isoDate))
    .toUpperCase();

export const addDays = (isoDate: string, amount: number): string => {
  const date = parseLocalDate(isoDate);
  date.setDate(date.getDate() + amount);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const describeRelativeDate = (isoDate: string, today: string): string => {
  if (isoDate === addDays(today, 1)) return "Tomorrow";
  if (isoDate === today) return "Today";
  return new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(
    parseLocalDate(isoDate),
  );
};
