import { OlliDataset } from 'olli';
import { bin } from 'vega-statistics';
import { LogicalComposition } from 'vega-lite/src/logical';
import { FieldPredicate } from 'vega-lite/src/predicate';
import { getDomain } from './data';
import { OlliEncodingFieldDef } from '../Types';

export function getBins(
  fieldDef: OlliEncodingFieldDef,
  data: OlliDataset,
  domainFilter?: LogicalComposition<FieldPredicate>
): [number, number][] {
  const domain = getDomain(fieldDef, data, domainFilter);
  const bins = [];
  if (Array.isArray(fieldDef.bin)) {
    if (domain[0] < fieldDef.bin[0]) {
      // if domain is smaller than first bin, add a bin
      bins.push([domain[0], fieldDef.bin[0]]);
    }
    for (let i = 0; i < fieldDef.bin.length - 1; i++) {
      bins.push([fieldDef.bin[i], fieldDef.bin[i + 1]]);
    }
    if (domain[domain.length - 1] > fieldDef.bin[fieldDef.bin.length - 1]) {
      // if domain is larger than last bin, add a bin
      bins.push([fieldDef.bin[fieldDef.bin.length - 1], domain[domain.length - 1]]);
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
  domainFilter?: LogicalComposition<FieldPredicate>
) {
  const bins = getBins(fieldDef, data, domainFilter);
  return bins.map((bin, idx) => {
    return {
      field: fieldDef.field,
      range: bin,
      inclusive: idx === bins.length - 1,
    };
  });
}
