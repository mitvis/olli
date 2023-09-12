import { getFieldDef } from './data';
import { ElaboratedOlliNode } from '../Structure/Types';
import { UnitOlliSpec, OlliDataset } from '../Types';

export function capitalizeFirst(s: string) {
  return s.slice(0, 1).toUpperCase() + s.slice(1);
}

export function removeFinalPeriod(s: string) {
  if (s.endsWith('.')) {
    return s.slice(0, -1);
  }
  return s;
}

export function getChartType(olliSpec: UnitOlliSpec) {
  if (olliSpec.mark) {
    if (olliSpec.mark === 'point' && olliSpec.axes?.length === 2) {
      if (olliSpec.axes.every((a) => getFieldDef(a.field, olliSpec.fields).type === 'quantitative')) {
        return 'scatterplot';
      } else if (
        olliSpec.axes.find((a) => getFieldDef(a.field, olliSpec.fields).type === 'quantitative') &&
        !olliSpec.axes.find((a) => getFieldDef(a.field, olliSpec.fields).type === 'temporal')
      ) {
        return 'dotplot';
      }
    }
    if (olliSpec.mark === 'line') {
      if (olliSpec.axes?.length === 2 && olliSpec.guides?.length === 1) {
        if (
          olliSpec.axes.every((a) => getFieldDef(a.field, olliSpec.fields).type === 'quantitative') &&
          olliSpec.guides[0].channel === 'order'
        ) {
          return 'connected scatterplot';
        }
      }
    }
    return `${olliSpec.mark} chart`;
  } else {
    return 'dataset';
  }
}
export const chartTypePrefix = (node: ElaboratedOlliNode, olliSpec: UnitOlliSpec): string => {
  if (node && 'groupby' in node && node.nodeType === 'root') {
    if (olliSpec.mark === 'line') {
      return 'multi-series ';
    } else {
      return 'multi-view ';
    }
  }
  return '';
};
export const pluralize = (count: number, noun: string, suffix = 's') => `${count} ${noun}${count !== 1 ? suffix : ''}`;
export const averageValue = (selection: OlliDataset, field: string) =>
  Math.round(selection.reduce((a, b) => a + Number(b[field]), 0) / selection.length);

export function ordinal_suffix_of(i: number) {
  // st, nd, rd, th
  var j = i % 10,
    k = i % 100;
  if (j == 1 && k != 11) {
    return i + 'st';
  }
  if (j == 2 && k != 12) {
    return i + 'nd';
  }
  if (j == 3 && k != 13) {
    return i + 'rd';
  }
  return i + 'th';
}
