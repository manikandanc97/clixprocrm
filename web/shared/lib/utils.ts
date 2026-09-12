import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/*
  cn = className merge helper

  Why?
  clsx -> conditional classes handle pannum
  twMerge -> duplicate tailwind classes remove pannum

  Example:
  cn("p-2", true && "p-4")
  final => "p-4"
*/

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}
