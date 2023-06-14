import { OlliValue } from '../Types';
import { OlliSpec } from '../Types';
import { ElaboratedOlliNode, OlliNode } from '../Structure/Types';
import { getBins } from '../util/bin';
import { getDomain, getFieldDef } from '../util/data';
import { selectionTest } from '../util/selection';
import { fmtValue } from '../util/values';
import { FieldPredicate } from 'vega-lite/src/predicate';
import { LogicalComposition } from 'vega-lite/src/logical';

export function generateDescriptions(olliSpec: OlliSpec, tree: ElaboratedOlliNode) {
  const data = olliSpec.selection ? selectionTest(olliSpec.data, olliSpec.selection) : olliSpec.data;
  const queue = [tree];
  while (queue.length > 0) {
    const node = queue.shift();
    if (!node) {
      continue;
    }
    node.description = nodeToDescription(node, data, olliSpec);
    queue.push(...node.children);
  }
}

export function nodeToDescription(node: ElaboratedOlliNode, data, olliSpec: OlliSpec): string {
  const index = `${(node.parent?.children.indexOf(node) || 0) + 1} of ${(node.parent?.children || []).length}. `;
  const description = olliSpec.description?.concat(' ') || '';
  const chartType = () => {
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
      return `${olliSpec.mark} chart`;
    } else {
      return 'dataset';
    }
  };
  const chartTypePrefix = (node: ElaboratedOlliNode): string => {
    if (node && 'groupby' in node && node.nodeType === 'root') {
      if (olliSpec.mark === 'line') {
        return 'multi-series ';
      } else {
        return 'multi-view ';
      }
    }
    return '';
  };
  const axes = olliSpec.axes.map((a) => a.title || a.field).join(' and ');

  switch (node.nodeType) {
    case 'root':
      if ('groupby' in node) {
        return `${description}A ${chartTypePrefix(node)}${chartType()} with ${node.children.length} views for ${
          node.groupby
        }, with axes ${axes}.`;
      }
      if (olliSpec.mark && olliSpec.axes?.length) {
        return `${olliSpec.description?.concat(' ') || ''}A ${chartType()} with axes ${axes}.`;
      }
      if (olliSpec.mark) {
        return `${olliSpec.description?.concat(' ') || ''}A ${chartType()}.`;
      }
      const fields = olliSpec.fields.map((f) => f.field);
      return `A dataset with ${fields.length} fields${fields.length <= 3 ? ' ' + [...fields].join(', ') : ''}.`;
    case 'facet':
      const facetName = olliSpec.mark === 'line' ? 'line' : olliSpec.mark ? chartType() : 'facet';
      if ('predicate' in node && 'equal' in node.predicate) {
        return `${index}A ${facetName} titled ${node.predicate.equal}, with axes ${axes}.`;
      }
      return `${index}A ${facetName} with axes ${axes}.`;
    case 'xAxis':
    case 'yAxis':
    case 'legend':
      const guideType = node.nodeType === 'xAxis' ? 'X-axis' : node.nodeType === 'yAxis' ? 'Y-axis' : 'Legend';
      if ('groupby' in node) {
        const fieldDef = getFieldDef(node.groupby, olliSpec.fields);
        let first, last;
        if (fieldDef.type === 'quantitative' || fieldDef.type === 'temporal') {
          const guide =
            olliSpec.axes?.find((axis) => axis.field === node.groupby) ||
            olliSpec.legends?.find((legend) => legend.field === node.groupby);
          const bins = getBins(node.groupby, data, olliSpec.fields);
          if (bins.length) {
            first = fmtValue(bins[0][0]);
            last = fmtValue(bins[bins.length - 1][1]);
            return `${guideType} titled ${node.groupby} for a ${
              'scaleType' in guide ? guide.scaleType || fieldDef.type : fieldDef.type
            } scale with values from ${first} to ${last}.`;
          }
        } else {
          const domain = getDomain(node.groupby, data);
          if (domain.length) {
            first = fmtValue(domain[0]);
            last = fmtValue(domain[domain.length - 1]);
            return `${guideType} titled ${node.groupby} for a ${fieldDef.type} scale with ${domain.length} values from ${first} to ${last}.`;
          }
        }
        return `${guideType} titled ${node.groupby} for a ${fieldDef.type} scale.`;
      }
      return `${guideType}.`;
    case 'filteredData':
      const instructions = node.children.length ? '' : ' Press t to open table.';
      if ('predicate' in node) {
        const selection = selectionTest(data, node.fullPredicate);
        if ('range' in node.predicate) {
          return `${index}${fmtValue(node.predicate.range[0])} to ${fmtValue(node.predicate.range[1])}. ${
            selection.length
          } values.${instructions}`;
        } else if ('equal' in node.predicate) {
          return `${index}${fmtValue(node.predicate.equal as OlliValue)}. ${selection.length} values.${instructions}`;
        }
      }
    case 'other':
      if ('groupby' in node) {
        return `${node.children.length} groups, grouped by ${node.groupby}.`;
      } else if ('predicate' in node) {
        const instructions = node.children.length ? '' : ' Press t to open table.';
        return `${index}${node.predicate.field} ${predicateToDescription(node.predicate)}.${instructions}`;
      }
  }
}

export function predicateToDescription(predicate: LogicalComposition<FieldPredicate>) {
  if ('and' in predicate) {
    return predicate.and.map(predicateToDescription).join(' and ');
  }
  if ('or' in predicate) {
    return predicate.or.map(predicateToDescription).join(' or ');
  }
  if ('not' in predicate) {
    return `not ${predicateToDescription(predicate.not)}`;
  }
  return fieldPredicateToDescription(predicate);
}

function fieldPredicateToDescription(predicate: FieldPredicate) {
  if ('equal' in predicate) {
    return `${predicate.field} equals ${predicate.equal}`;
  }
  if ('range' in predicate) {
    return `${predicate.field} is between ${predicate.range[0]} and ${predicate.range[1]}`;
  }
  if ('lt' in predicate) {
    return `${predicate.field} is less than ${predicate.lt}`;
  }
  if ('lte' in predicate) {
    return `${predicate.field} is less than or equal to ${predicate.lte}`;
  }
  if ('gt' in predicate) {
    return `${predicate.field} is greater than ${predicate.gt}`;
  }
  if ('gte' in predicate) {
    return `${predicate.field} is greater than or equal to ${predicate.gte}`;
  }

  return '';
}
