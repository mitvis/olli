import { OlliDataset } from 'olli';
import { bin } from 'vega-statistics';
import { LogicalComposition } from 'vega-lite/src/logical';
import { FieldPredicate } from 'vega-lite/src/predicate';
import { getDomain } from './data';
import { OlliEncodingFieldDef, OlliValue } from '../Types';

export function getBins(
  fieldDef: OlliEncodingFieldDef,
  data: OlliDataset,
  ticks?: OlliValue[],
  domainFilter?: LogicalComposition<FieldPredicate>
): [number, number][] {
  const domain = getDomain(fieldDef, data, domainFilter);
  const bins = [];
  if (ticks && Array.isArray(ticks)) {
    if (domain[0] < ticks[0]) {
      // if domain is smaller than first bin, add a bin
      bins.push([domain[0], ticks[0]]);
    }
    for (let i = 0; i < ticks.length - 1; i++) {
      bins.push([ticks[i], ticks[i + 1]]);
    }
    if (domain[domain.length - 1] > ticks[ticks.length - 1]) {
      // if domain is larger than last bin, add a bin
      bins.push([ticks[ticks.length - 1], domain[domain.length - 1]]);
    }
  } else {
    const binResult = bin({ maxbins: 10, extent: [domain[0], domain[domain.length - 1]] });

    for (let i = binResult.start; i < binResult.stop; i += binResult.step) {
      bins.push([i, i + binResult.step]);
    }
  }
  return bins;
}

export function getBinPredicates(
  fieldDef: OlliEncodingFieldDef,
  data: OlliDataset,
  ticks?: OlliValue[],
  domainFilter?: LogicalComposition<FieldPredicate>
) {
  const bins = getBins(fieldDef, data, ticks, domainFilter);
  return bins.map((bin, idx) => {
    return {
      field: fieldDef.field,
      range: bin,
      inclusive: idx === bins.length - 1,
    };
  });
}
