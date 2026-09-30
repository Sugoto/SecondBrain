import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export const TIME_ZONE = "Asia/Kolkata";

export const today = () => Temporal.Now.plainDateISO(TIME_ZONE);

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
