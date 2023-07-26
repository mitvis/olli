import { isNumeric as vlIsNumeric } from 'vega-lite';
import { isString } from 'vega';
import { OlliFieldDef, OlliTimeUnit, OlliValue } from '../Types';

export const fmtValue = (value: OlliValue, fieldDef: OlliFieldDef): string => {
  if (fieldDef.timeUnit && !(value instanceof Date)) {
    value = new Date(value);
  }
  if (value instanceof Date) {
    return dateToTimeUnit(value, fieldDef.timeUnit);
  } else if (typeof value !== 'string' && !isNaN(value) && value % 1 != 0) {
    return Number(value).toFixed(2);
  }
  return String(value);
};

export function serializeValue(value: any, fieldDef: any) {
  if (fieldDef.type === 'temporal') {
    value = datestampToTime(value);
  } else if (isString(value) && isNumeric(value)) {
    value = Number(value);
  }
  return value;
}

export function datestampToTime(datestamp: string | string[]) {
  if (Array.isArray(datestamp)) {
    return datestamp.map((v) => new Date(v).getTime());
  } else {
    return new Date(datestamp).getTime();
  }
}

export function isNumeric(value: string): boolean {
  return vlIsNumeric(value.replaceAll(',', ''));
}

export function dateToTimeUnit(date: Date, timeUnit: OlliTimeUnit): string {
  let opts;
  switch (timeUnit) {
    case 'year':
      opts = { year: 'numeric' };
      break;
    case 'month':
      opts = { month: 'short' };
      break;
    case 'day':
      opts = { weekday: 'short' };
      break;
    case 'date':
      opts = { day: 'numeric' };
      break;
    case 'hours':
      opts = { hour: 'numeric' };
      break;
    case 'minutes':
      opts = { minute: 'numeric' };
      break;
    case 'seconds':
      opts = { second: 'numeric' };
      break;
    default:
      opts = { year: 'numeric', month: 'short', day: 'numeric' };
      break;
  }
  return date.toLocaleString('en-US', opts);
}
