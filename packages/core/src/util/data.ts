import { OlliDataset, OlliFieldDef, UnitOlliSpec, OlliValue } from '../Types';
import { selectionTest } from './selection';
import { LogicalComposition } from 'vega-lite/src/logical';
import { FieldPredicate } from 'vega-lite/src/predicate';

export function getDomain(
  field: string,
  data: OlliDataset,
  predicate?: LogicalComposition<FieldPredicate>
): OlliValue[] {
  const unique_vals = new Set<OlliValue>();
  const dataset = predicate ? selectionTest(data, predicate) : data;
  // TODO account for domain overrides in the field def
  dataset
    .map((d) => d[field])
    .forEach((v) => {
      unique_vals.add(v);
    });
  return [...unique_vals].filter((x) => x !== null && x !== undefined).sort((a: any, b: any) => a - b);
}

export function getFieldDef(field: string, fields: OlliFieldDef[]): OlliFieldDef {
  return fields.find((f) => f.field === field);
}
