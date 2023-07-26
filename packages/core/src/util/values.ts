import { isNumeric as vlIsNumeric } from 'vega-lite';
import { isString } from 'vega';
import { OlliFieldDef, OlliValue } from '../Types';
import { TimeUnit } from 'vega-lite/src/timeunit';

export const fmtValue = (value: OlliValue, fieldDef: OlliFieldDef): string => {
  if (fieldDef.timeUnit && !(value instanceof Date)) {
    value = new Date(value);
  }
  if (value instanceof Date) {
    if (fieldDef?.timeUnit) {
      let opts;
      switch (fieldDef.timeUnit) {
        case 'year':
          opts = { year: 'numeric' };
          break;
        case 'month':
          opts = { month: 'short' };
          break;
        case 'day':
          opts = { day: 'numeric' };
          break;
        default:
          opts = { year: 'numeric', month: 'short', day: 'numeric' };
      }
      return value.toLocaleString('en-US', opts);
    }
    return value.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
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

export function dateToTimeUnit(date: Date, timeUnit: TimeUnit): string {
  let opts;
  switch (timeUnit) {
    case 'year':
      opts = { year: 'numeric' };
      break;
    case 'month':
      opts = { month: 'short' };
      break;
    case 'day':
      opts = { day: 'numeric' };
      break;
    default:
      opts = { year: 'numeric', month: 'short', day: 'numeric' };
      break;
  }
  return date.toLocaleString('en-US', opts);
}
