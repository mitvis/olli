import { OlliValue } from "./Types";

export const fmtValue = (value: OlliValue): string => {
  if (value instanceof Date) {
      return value.toLocaleString("en-US", { year: 'numeric', month: 'short', day: 'numeric' });
  }
  else if (typeof value !== 'string' && (!isNaN(value) && value % 1 != 0)) {
      return Number(value).toFixed(2);
  }
  return String(value);
}