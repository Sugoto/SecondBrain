import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export const TIME_ZONE = "Asia/Kolkata";

export const today = () => Temporal.Now.plainDateISO(TIME_ZONE);

export const toDate = (date: Temporal.PlainDate) => new Date(date.year, date.month - 1, date.day);

export const fromDate = (date: Date) =>
  Temporal.PlainDate.from({
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
  });

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
