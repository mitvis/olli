import { OlliValue } from '../Types';
import { OlliDataset, OlliSpec } from '../Types';
import { ElaboratedOlliNode, OlliNode, OlliNodeLookup } from '../Structure/Types';
import { getBins } from '../util/bin';
import { getDomain } from '../util/data';
import { selectionTest } from '../util/selection';
import { fmtValue } from '../util/values';
import { getFieldsUsed } from '../Structure';

export function generateDescriptions(olliSpec: OlliSpec, tree: ElaboratedOlliNode) {
  const queue = [tree];
  while (queue.length > 0) {
    const node = queue.shift();
    if (!node) {
      continue;
    }
    node.description = nodeToDescription(node, tree, olliSpec);
    queue.push(...node.children);
  }
}

export function nodeToDescription(node: ElaboratedOlliNode, tree: ElaboratedOlliNode, olliSpec: OlliSpec): string {
  const index = (node.parent?.children.indexOf(node) || 0) + 1;
  const siblings = (node.parent?.children || []).length;
  switch (node.nodeType) {
    case 'root':
      if ('groupby' in node && olliSpec.mark === 'line') {
        return `${olliSpec.description} A multi-series line chart with 5 lines for ${
          node.groupby.field
        }, with axes ${olliSpec.axes.map((a) => a.title || a.field).join(' and ')}.`;
      }
      return `${olliSpec.description} A ${olliSpec.mark} chart.`;
    case 'facet':
      if ('predicate' in node && 'equal' in node.predicate) {
        if (olliSpec.mark === 'line') {
          return `${index} of ${siblings}. A line titled ${node.predicate.equal}, with axes ${olliSpec.axes
            .map((a) => a.title || a.field)
            .join(' and ')}.`;
        }
        return `${index} of ${siblings}.A ${olliSpec.mark} chart titled ${
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
        let first, last;
        if (node.groupby.type === 'quantitative' || node.groupby.type === 'temporal') {
          const guide =
            olliSpec.axes?.find((axis) => axis.field === node.groupby.field) ||
            olliSpec.legends?.find((legend) => legend.field === node.groupby.field);
          const bins = getBins(node.groupby, olliSpec.data, guide?.ticks);
          first = fmtValue(bins[0][0]);
          last = fmtValue(bins[bins.length - 1][1]);
          return `${guideType} titled ${node.groupby.field} for a ${node.groupby.type} scale with values from ${first} to ${last}.`;
        } else {
          const domain = getDomain(node.groupby, olliSpec.data);
          first = fmtValue(domain[0]);
          last = fmtValue(domain[domain.length - 1]);
          return `${guideType} titled ${node.groupby.field} for a ${node.groupby.type} scale with ${domain.length} values from ${first} to ${last}.`;
        }
      }
      return `${guideType}.`;
    case 'filteredData':
      if ('predicate' in node) {
        const selection = selectionTest(olliSpec.data, node.fullPredicate);
        if ('range' in node.predicate) {
          return `${index} of ${siblings}. ${fmtValue(node.predicate.range[0])} to ${fmtValue(
            node.predicate.range[1]
          )}. ${selection.length} values.`;
        } else if ('equal' in node.predicate) {
          return `${index} of ${siblings}. ${fmtValue(node.predicate.equal as OlliValue)}. ${selection.length} values.`;
        }
      }
    case 'other':
      if ('groupby' in node) {
        if (!node.parent) {
          const fields = getFieldsUsed(olliSpec, tree);
          return `A dataset with ${fields.size} fields${
            fields.size <= 3 ? ' ' + [...fields].join(', ') : ''
          }, grouped by ${node.groupby.field}.`;
        }
        return `${node.children.length} groups, grouped by ${node.groupby.field}.`;
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
      } else {
        if (!node.parent) {
          const fields = getFieldsUsed(olliSpec, tree);
          return `A dataset with ${fields.size} fields${fields.size <= 3 ? ' ' + [...fields].join(', ') : ''}.`;
        }
      }
  }
}
