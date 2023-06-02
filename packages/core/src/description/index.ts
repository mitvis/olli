import { OlliValue } from '../Types';
import { OlliDataset, OlliSpec } from '../Types';
import { ElaboratedOlliNode, OlliNode, OlliNodeLookup } from '../Structure/Types';
import { getBins } from '../util/bin';
import { getDomain, getFieldDef } from '../util/data';
import { selectionTest } from '../util/selection';
import { fmtValue } from '../util/values';
import { FieldPredicate } from 'vega-lite/src/predicate';
import { LogicalAnd, LogicalComposition } from 'vega-lite/src/logical';

export function generateDescriptions(olliSpec: OlliSpec, tree: ElaboratedOlliNode) {
  const queue = [tree];
  while (queue.length > 0) {
    const node = queue.shift();
    if (!node) {
      continue;
    }
    node.description = nodeToDescription(node, olliSpec);
    queue.push(...node.children);
  }
}

export function nodeToDescription(node: ElaboratedOlliNode, olliSpec: OlliSpec): string {
  const index = (node.parent?.children.indexOf(node) || 0) + 1;
  const siblings = (node.parent?.children || []).length;
  switch (node.nodeType) {
    case 'root':
      if ('groupby' in node && olliSpec.mark === 'line') {
        return `${olliSpec.description?.concat(' ') || ''}A multi-series line chart with 5 lines for ${
          node.groupby
        }, with axes ${olliSpec.axes.map((a) => a.title || a.field).join(' and ')}.`;
      }
      if (
        olliSpec.mark === 'point' &&
        olliSpec.axes?.length === 2 &&
        olliSpec.axes.every((a) => getFieldDef(a.field, olliSpec).type === 'quantitative')
      ) {
        return `${olliSpec.description?.concat(' ') || ''}A scatterplot with axes ${olliSpec.axes
          .map((a) => a.title || a.field)
          .join(' and ')}.`;
      }
      if (olliSpec.mark && olliSpec.axes?.length) {
        return `${olliSpec.description?.concat(' ') || ''}A ${olliSpec.mark} chart with axes ${olliSpec.axes
          .map((a) => a.title || a.field)
          .join(' and ')}.`;
      }
      if (olliSpec.mark) {
        return `${olliSpec.description?.concat(' ') || ''}A ${olliSpec.mark} chart.`;
      }
      const fields = olliSpec.fields.map((f) => f.field);
      return `A dataset with ${fields.length} fields${fields.length <= 3 ? ' ' + [...fields].join(', ') : ''}.`;
    case 'facet':
      if ('predicate' in node && 'equal' in node.predicate) {
        if (olliSpec.mark === 'line') {
          return `${index} of ${siblings}. A line titled ${node.predicate.equal}, with axes ${olliSpec.axes
            .map((a) => a.title || a.field)
            .join(' and ')}.`;
        }
        return `${index} of ${siblings}. A ${olliSpec.mark} chart titled ${
          node.predicate.equal
        }, with axes ${olliSpec.axes.map((a) => a.title || a.field).join(' and ')}.`;
      }
      return `${index} of ${siblings}. A facet with axes ${olliSpec.axes
        .map((a) => a.title || a.field)
        .join(' and ')}.`;
    case 'xAxis':
    case 'yAxis':
    case 'legend':
      const guideType = node.nodeType === 'xAxis' ? 'X-axis' : node.nodeType === 'yAxis' ? 'Y-axis' : 'Legend';
      if ('groupby' in node) {
        const fieldDef = getFieldDef(node.groupby, olliSpec);
        let first, last;
        if (fieldDef.type === 'quantitative' || fieldDef.type === 'temporal') {
          const guide =
            olliSpec.axes?.find((axis) => axis.field === node.groupby) ||
            olliSpec.legends?.find((legend) => legend.field === node.groupby);
          const bins = getBins(node.groupby, olliSpec);
          first = fmtValue(bins[0][0]);
          last = fmtValue(bins[bins.length - 1][1]);
          return `${guideType} titled ${node.groupby} for a ${
            'scaleType' in guide ? guide.scaleType || fieldDef.type : fieldDef.type
          } scale with values from ${first} to ${last}.`;
        } else {
          const domain = getDomain(node.groupby, olliSpec.data);
          first = fmtValue(domain[0]);
          last = fmtValue(domain[domain.length - 1]);
          return `${guideType} titled ${node.groupby} for a ${fieldDef.type} scale with ${domain.length} values from ${first} to ${last}.`;
        }
      }
      return `${guideType}.`;
    case 'filteredData':
      if ('predicate' in node) {
        const selection = selectionTest(olliSpec.data, node.fullPredicate);
        if ('range' in node.predicate) {
          return `${index} of ${siblings}. ${fmtValue(node.predicate.range[0])} to ${fmtValue(
            node.predicate.range[1]
          )}. ${selection.length} values. Press t to open table.`;
        } else if ('equal' in node.predicate) {
          return `${index} of ${siblings}. ${fmtValue(node.predicate.equal as OlliValue)}. ${
            selection.length
          } values. Press t to open table.`;
        }
      }
    case 'other':
      if ('groupby' in node) {
        if (!node.parent) {
          const fields = olliSpec.fields.map((f) => f.field);
          return `A dataset with ${fields.length} fields${
            fields.length <= 3 ? ' ' + [...fields].join(', ') : ''
          }, grouped by ${node.groupby}.`;
        }
        return `${node.children.length} groups, grouped by ${node.groupby}.`;
      } else if ('predicate' in node) {
        let predicateDescription;
        if ('range' in node.predicate) {
          predicateDescription = `is between ${fmtValue(node.predicate.range[0])} to ${fmtValue(
            node.predicate.range[1]
          )}`;
        } else if ('equal' in node.predicate) {
          predicateDescription = `is ${fmtValue(node.predicate.equal as OlliValue)}`;
        }
        return `${index} of ${siblings}. ${node.predicate.field} ${predicateDescription}.`;
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
