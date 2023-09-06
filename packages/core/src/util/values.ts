import { isNumeric as vlIsNumeric } from 'vega-lite';
import { isString } from 'vega';
import { OlliFieldDef, OlliTimeUnit, OlliValue } from '../Types';

export const fmtValue = (value: OlliValue, fieldDef: OlliFieldDef): string => {
  if (fieldDef.type === 'temporal' && !(value instanceof Date)) {
    value = new Date(value);
  } else if (fieldDef.type === 'quantitative' && isNumeric(String(value))) {
    value = Number(String(value));
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
  if (!timeUnit) {
    return date.toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }
  const opts = {};
  if (timeUnit.includes('year')) {
    opts['year'] = 'numeric';
  }
  if (timeUnit.includes('month')) {
    opts['month'] = 'short';
  }
  if (timeUnit.includes('day')) {
    opts['weekday'] = 'short';
  }
  if (timeUnit.includes('date')) {
    opts['day'] = 'numeric';
  }
  if (timeUnit.includes('hours')) {
    opts['hour'] = 'numeric';
  }
  if (timeUnit.includes('minutes')) {
    opts['minute'] = 'numeric';
  }
  if (timeUnit.includes('seconds')) {
    opts['second'] = 'numeric';
  }
  if (!Object.keys(opts).length) {
    return date.toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }
  return date.toLocaleString('en-US', opts);
}
