import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function stripLeadingZeros(value: number) {
  // Convert input to a string
  const decimalStr = value.toString();

  // Check if the number is in scientific notation and return as is
  if (/e/i.test(decimalStr)) {
    return decimalStr;
  }

  // Remove leading zeros from the integer part while preserving the decimal part
  const cleanedStr = decimalStr.replace(/^0+(\d)/, "$1");

  // Ensure the result is '0' for cases where only zeros are input
  return cleanedStr === "" || cleanedStr === "." ? "0" : cleanedStr;
}
