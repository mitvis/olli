import { isNumeric as vlIsNumeric } from 'vega-lite';
import { isString } from 'vega';
import { OlliValue } from '../Types';

export const fmtValue = (value: OlliValue): string => {
  if (value instanceof Date) {
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
