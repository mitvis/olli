import { OlliDataset, OlliFieldDef, UnitOlliSpec, OlliValue } from '../Types';
import { selectionTest } from './selection';
import { LogicalComposition } from 'vega-lite/src/logical';
import { FieldPredicate } from 'vega-lite/src/predicate';
import { dateToTimeUnit } from './values';

export function getDomain(
  fieldDef: OlliFieldDef,
  data: OlliDataset,
  predicate?: LogicalComposition<FieldPredicate>
): OlliValue[] {
  const unique_vals = new Set<OlliValue>();
  const dataset = predicate ? selectionTest(data, predicate) : data;
  // TODO account for domain overrides in the field def
  if (fieldDef.timeUnit) {
    const unique_time_vals = new Set<string>();
    dataset
      .map((d) => d[fieldDef.field])
      .forEach((v) => {
        if (v instanceof Date) {
          const time_val = dateToTimeUnit(v, fieldDef.timeUnit);
          console.log('time_val', time_val);
          if (!unique_time_vals.has(time_val)) {
            unique_time_vals.add(time_val);
            unique_vals.add(v);
          }
        }
      });
  } else {
    dataset
      .map((d) => d[fieldDef.field])
      .forEach((v) => {
        unique_vals.add(v);
      });
  }
  console.log('unique', [...unique_vals]);
  return [...unique_vals].filter((x) => x !== null && x !== undefined).sort((a: any, b: any) => a - b);
}

export function getFieldDef(field: string, fields: OlliFieldDef[]): OlliFieldDef {
  return fields.find((f) => f.field === field);
}
