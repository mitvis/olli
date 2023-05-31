import { OlliValue } from '../Types';
import { OlliDataset, OlliSpec } from '../Types';
import { ElaboratedOlliNode, OlliNode, OlliNodeLookup } from '../structure/Types';
import { getBins } from '../util/bin';
import { getDomain } from '../util/data';
import { selectionTest } from '../util/selection';
import { fmtValue } from '../util/values';

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
  switch (node.nodeType) {
    case 'root':
      if ('groupby' in node && olliSpec.mark === 'line') {
        return `${olliSpec.description} A multi-series line chart with 5 lines representing ${node.groupby.field}.`;
      }
      return `${olliSpec.description} A ${olliSpec.mark} chart.`;
    case 'facet':
      if ('predicate' in node && 'equal' in node.predicate) {
        if (olliSpec.mark === 'line') {
          return `A line representing ${node.predicate.equal}.`;
        }
        return `A ${olliSpec.mark} chart representing ${node.predicate.equal}.`;
      }
      return `A facet.`;
    case 'xAxis':
    case 'yAxis':
    case 'legend':
      const guideType = node.nodeType === 'xAxis' ? 'X-axis' : node.nodeType === 'yAxis' ? 'Y-axis' : 'Legend';
      if ('groupby' in node) {
        let first, last;
        if (node.groupby.type === 'quantitative' || node.groupby.type === 'temporal') {
          const bins = getBins(node.groupby, olliSpec.data);
          first = fmtValue(bins[0][0]);
          last = fmtValue(bins[bins.length - 1][1]);
        } else {
          const domain = getDomain(node.groupby, olliSpec.data);
          first = fmtValue(domain[0]);
          last = fmtValue(domain[domain.length - 1]);
        }
        return `${guideType} titled ${node.groupby.field} for a ${node.groupby.type} scale with values from ${first} to ${last}.`;
      }
      return `${guideType}.`;
    case 'filteredData':
      if ('predicate' in node) {
        const selection = selectionTest(olliSpec.data, node.fullPredicate);
        if ('range' in node.predicate) {
          return `${fmtValue(node.predicate.range[0])} to ${fmtValue(node.predicate.range[1])}. ${
            selection.length
          } values.`;
        } else if ('equal' in node.predicate) {
          return `${fmtValue(node.predicate.equal as OlliValue)}. ${selection.length} values.`;
        }
      }
  }
}
