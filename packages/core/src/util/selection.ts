import { OlliDataset, OlliDatum } from 'olli';
import { isDate, toNumber, isArray, inrange } from 'vega';
import { LogicalAnd, LogicalComposition } from 'vega-lite/src/logical';
import { FieldPredicate, FieldEqualPredicate } from 'vega-lite/src/predicate';
import { OlliEncodingFieldDef, OlliValue } from '../Types';
import { serializeValue } from './values';
import { getDomain } from './data';
import { getBinPredicates } from './bin';

const TYPE_ENUM = 'E',
  TYPE_RANGE_INC = 'R',
  TYPE_RANGE_EXC = 'R-E',
  TYPE_RANGE_LE = 'R-LE',
  TYPE_RANGE_RE = 'R-RE',
  TYPE_PRED_LT = 'LT',
  TYPE_PRED_LTE = 'LTE',
  TYPE_PRED_GT = 'GT',
  TYPE_PRED_GTE = 'GTE',
  TYPE_PRED_VALID = 'VALID',
  TYPE_PRED_ONE_OF = 'ONE';

export const predicateToTupleType = (predicate: FieldPredicate) => {
  if ('equal' in predicate) {
    return TYPE_ENUM;
  } else if ('lt' in predicate) {
    return TYPE_PRED_LT;
  } else if ('gt' in predicate) {
    return TYPE_PRED_GT;
  } else if ('lte' in predicate) {
    return TYPE_PRED_LTE;
  } else if ('gte' in predicate) {
    return TYPE_PRED_GTE;
  } else if ('range' in predicate) {
    if ((predicate as any).inclusive) {
      return TYPE_RANGE_INC;
    }
    return TYPE_RANGE_RE;
  } else if ('oneOf' in predicate) {
    return TYPE_PRED_ONE_OF;
  } else if ('valid' in predicate) {
    return TYPE_PRED_VALID;
  }
  return 'E';
};

export function predicateToSelectionStore(predicate: LogicalComposition<FieldPredicate>) {
  if (predicate) {
    const and = (predicate as LogicalAnd<FieldPredicate>).and as FieldPredicate[];
    const getPredValue = (p: FieldPredicate) => {
      const pred = p as any;
      const key = Object.keys(pred).find((k) => k !== 'field')!; // find the value key e.g. 'eq', 'lte'
      const value = pred[key];
      return value;
    };
    const tuple_fields = and
      ? and.map((p) => {
          const pred = p as FieldPredicate; // TODO: this will currently only support a non-nested "and" composition or a single pred because i do not want to deal
          return {
            type: predicateToTupleType(pred),
            field: pred.field,
          };
        })
      : [
          {
            type: predicateToTupleType(predicate as FieldPredicate),
            field: (predicate as FieldPredicate).field,
          },
        ];
    const tuple_values = and ? and.map(getPredValue) : [getPredValue(predicate as FieldPredicate)];
    if (!tuple_fields.length && !tuple_values.length) {
      return null;
    }
    return {
      unit: '',
      fields: tuple_fields,
      values: tuple_values,
    };
  }
}

export function selectionTest(data: OlliDataset, predicate: LogicalComposition<FieldPredicate>): OlliDataset {
  try {
    const store = predicateToSelectionStore(predicate);
    if (!store) return data;
    return data.filter((datum) => {
      return testPoint(datum, store);
    });
  } catch (e) {
    console.error(e);
    return data;
  }
}

function testPoint(datum: OlliDatum, entry: { unit?: string; fields: any; values: any }) {
  var fields = entry.fields,
    values = entry.values,
    dval;

  return fields.every((f: { field: string | number; type: any }, i: string | number) => {
    dval = datum[f.field];

    if (isDate(dval)) dval = toNumber(dval);
    if (isDate(values[i])) values[i] = toNumber(values[i]);
    if (isDate(values[i][0])) values[i] = values[i].map(toNumber);

    switch (f.type) {
      case TYPE_ENUM:
        // Enumerated fields can either specify individual values (single/multi selections)
        // or an array of values (interval selections).
        return !(isArray(values[i]) ? values[i].indexOf(dval) < 0 : dval !== values[i]);
      case TYPE_RANGE_INC:
        return inrange(dval as number, values[i], true, true);
      case TYPE_RANGE_RE:
        // Discrete selection of bins test within the range [bin_start, bin_end).
        return inrange(dval as number, values[i], true, false);
      case TYPE_RANGE_EXC: // 'R-E'/'R-LE' included for completeness.
        return inrange(dval as number, values[i], false, false);
      case TYPE_RANGE_LE:
        return inrange(dval as number, values[i], false, true);
      case TYPE_PRED_LT:
        return dval < values[i];
      case TYPE_PRED_GT:
        return dval > values[i];
      case TYPE_PRED_LTE:
        return dval <= values[i];
      case TYPE_PRED_GTE:
        return dval >= values[i];
      case TYPE_PRED_VALID:
        return !(dval === null || isNaN(dval as number));
      default:
        return true;
    }
  });
}

export function datumToPredicate(datum: OlliDatum, fieldDefs: OlliEncodingFieldDef[]): LogicalAnd<FieldEqualPredicate> {
  return {
    and: fieldDefs.map((fieldDef) => {
      return {
        field: fieldDef.field,
        equal: serializeValue(datum[fieldDef.field], fieldDef),
      };
    }),
  };
}

export function fieldToPredicates(
  fieldDef: OlliEncodingFieldDef,
  data: OlliDataset,
  ticks?: OlliValue[]
): FieldPredicate[] {
  if (fieldDef.type === 'nominal' || fieldDef.type === 'ordinal') {
    const domain = getDomain(fieldDef, data);
    return domain.map((value) => {
      return {
        field: fieldDef.field,
        equal: serializeValue(value, fieldDef),
      };
    });
  } else {
    const bins = getBinPredicates(fieldDef, data, ticks);
    return bins;
  }
}
