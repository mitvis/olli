import { OlliDataset, OlliFieldDef, OlliValue } from '../Types';
import { UnitOlliSpec } from '../Types';
import { ElaboratedOlliNode, OlliNodeType } from '../Structure/Types';
import { getBins } from '../util/bin';
import { getDomain, getFieldDef } from '../util/data';
import { selectionTest } from '../util/selection';
import { fmtValue } from '../util/values';
import { FieldPredicate } from 'vega-lite/src/predicate';
import { LogicalComposition } from 'vega-lite/src/logical';

export function getCustomizedDescription(node: ElaboratedOlliNode) {
  function capitalizeFirst(s: string) {
    return s.slice(0, 1).toUpperCase() + s.slice(1);
  }

  function removeFinalPeriod(s: string) {
    if (s.endsWith('.')) {
      return s.slice(0, -1);
    }
    return s;
  }

  return (
    Array.from(node.description.values())
      .filter((s) => s.length > 0)
      .map(capitalizeFirst)
      .map(removeFinalPeriod)
      .join('. ') + '.'
  );
}

export function nodeToDescription(
  node: ElaboratedOlliNode,
  dataset: OlliDataset,
  olliSpec: UnitOlliSpec
): Map<string, string> {
  const indexStr = `${(node.parent?.children.indexOf(node) || 0) + 1} of ${(node.parent?.children || []).length}`;
  const description = olliSpec.description || '';
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
  const pluralize = (count: number, noun: string, suffix = 's') => `${count} ${noun}${count !== 1 ? suffix : ''}`;
  const averageValue = (selection: OlliDataset, field: string) => Math.round(selection.reduce((a, b) => a + Number(b[field]), 0)
  /selection.length);

  function name(node: ElaboratedOlliNode): string {
    switch (node.nodeType) {
      case 'root':
        if ('groupby' in node) {
          return description;
        }
        if (olliSpec.mark) {
          return olliSpec.description || '';
        }
        return '';
      case 'view':
        if ('predicate' in node && 'equal' in node.predicate) {
          return `titled ${node.predicate.equal}`;
        }
        return '';
      case 'xAxis':
      case 'yAxis':
      case 'legend':
        const guideType = node.nodeType === 'xAxis' ? 'x-axis' : node.nodeType === 'yAxis' ? 'y-axis' : 'legend';
        return `${guideType} titled ${node.groupby}`;
      default:
        throw `Node type ${node.nodeType} does not have the 'name' token.`;
    }
  }

  function index(node: ElaboratedOlliNode): string {
    switch (node.nodeType) {
      case 'view':
      case 'filteredData':
      case 'other':
        return indexStr;
      default:
        throw `Node type ${node.nodeType} does not have the 'index' token.`;
    }
  }

  function type(node: ElaboratedOlliNode): string {
    switch (node.nodeType) {
      case 'root':
        if ('groupby' in node) {
          return `a ${chartTypePrefix(node)}${chartType()}`;
        }
        if (olliSpec.mark) {
          return `a ${chartType()}`;
        }
        if (node.children.length) {
          if (node.children[0].viewType === 'layer') {
            return 'a layered chart';
          }
          if (node.children[0].viewType === 'concat') {
            return 'a multi-view chart';
          }
        }
        return 'a dataset';
      case 'view':
        const viewName =
          olliSpec.mark === 'line' ? 'line' : olliSpec.mark ? chartType() : node.viewType ? node.viewType : 'view';
        return `a ${viewName}`;
      case 'xAxis':
      case 'yAxis':
      case 'legend':
        const guideType = node.nodeType === 'xAxis' ? 'X-axis' : node.nodeType === 'yAxis' ? 'Y-axis' : 'Legend';
        if ('groupby' in node) {
          const fieldDef = getFieldDef(node.groupby, olliSpec.fields);
          if (fieldDef.type === 'quantitative' || fieldDef.type === 'temporal') {
            const guide =
              olliSpec.axes?.find((axis) => axis.field === node.groupby) ||
              olliSpec.legends?.find((legend) => legend.field === node.groupby);
            const bins = getBins(node.groupby, dataset, olliSpec.fields);
            if (bins.length) {
              return `for a ${'scaleType' in guide ? guide.scaleType || fieldDef.type : fieldDef.type} scale`;
            }
          } else {
            return `for a ${fieldDef.type} scale`;
          }
        }
        return '';
      default:
        throw `Node type ${node.nodeType} does not have the 'type' token.`;
    }
  }

  function children(node: ElaboratedOlliNode): string {
    switch (node.nodeType) {
      case 'root':
        if ('groupby' in node || (olliSpec.mark && olliSpec.axes?.length)) {
          return `with axes ${axes}`;
        }
        const fields = olliSpec.fields.map((f) => f.field);
        if (fields.length <= 3) {
          return ' ' + [...fields].join(', ');
        }
        return '';
      case 'view':
        return `with axes ${axes}`;
      default:
        throw `Node type ${node.nodeType} does not have the 'children' token.`;
    }
  }

  function data(node: ElaboratedOlliNode): string {
    switch (node.nodeType) {
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
            const bins = getBins(node.groupby, dataset, olliSpec.fields);
            if (bins.length) {
              first = fmtValue(bins[0][0], fieldDef);
              last = fmtValue(bins[bins.length - 1][1], fieldDef);
              return `with values from ${first} to ${last}`;
            }
          } else {
            const domain = getDomain(fieldDef, dataset);
            if (domain.length) {
              first = fmtValue(domain[0], fieldDef);
              last = fmtValue(domain[domain.length - 1], fieldDef);
              return `with ${pluralize(domain.length, 'value')} from ${first} to ${last}`;
            }
          }
        }
        return '';
      case 'filteredData':
        if ('predicate' in node) {
          return predicateToDescription(node.predicate, olliSpec.fields);
        }
        return '';
      case 'other':
        if ('groupby' in node) {
          return `grouped by ${node.groupby}`;
        } else if ('predicate' in node) {
          return predicateToDescription(node.predicate, olliSpec.fields);
        }
      default:
        throw `Node type ${node.nodeType} does not have the 'data' token.`;
    }
  }

  function size(node: ElaboratedOlliNode): string {
    switch (node.nodeType) {
      case 'root':
        if ('groupby' in node) {
          return `with ${node.children.length} views for ${node.groupby}`;
        }
        if ((olliSpec.mark && olliSpec.axes?.length) || olliSpec.mark) {
          return '';
        }
        const fields = olliSpec.fields.map((f) => f.field);
        return `with ${fields.length} fields`;
      case 'filteredData':
        if ('predicate' in node) {
          const instructions = node.children.length ? '' : ' Press t to open table';
          const selection = selectionTest(dataset, node.fullPredicate);
          return `${pluralize(selection.length, 'value')}.${instructions}`;
        }
        return '';
      case 'annotations':
        return `${node.children.length} annotations`;
      case 'other':
        if ('groupby' in node) {
          return `${node.children.length} groups`;
        } else if ('predicate' in node) {
          const instructions = node.children.length ? '' : ' Press t to open table';
          const selection = selectionTest(dataset, node.fullPredicate);
          return `${pluralize(selection.length, 'value')}.${instructions}`;
        }
        return '';
      default:
        throw `Node type ${node.nodeType} does not have the 'size' token.`;
    }
  }

  function depth(node: ElaboratedOlliNode): string {
    return `level ${node.height}`;
  }

  function parent(node: ElaboratedOlliNode): string {
    switch (node.nodeType) {
      case 'xAxis':
      case 'yAxis':
      case 'legend':
      case 'filteredData':
        let view = node;
        while (view.parent && view.nodeType != 'view') {
          view = view.parent;
        }
        if ('predicate' in view && 'equal' in view.predicate) {
          return `${view.predicate.equal}`;
        }
        return '';
      default:
        throw `Node type ${node.nodeType} does not have the 'parent' token.`;
    }
  }

  function aggregate(node: ElaboratedOlliNode): string {
    let axis;
    switch (node.nodeType) {
      case 'xAxis':
      case 'yAxis':
      case 'legend':
        axis = getFieldDef(node.groupby, olliSpec.fields);
      case 'filteredData':
        if (!axis) { axis = getFieldDef(node.parent.groupby, olliSpec.fields);}
        if (axis.type !== 'quantitative') { return ''; }

        const selection = selectionTest(dataset, node.fullPredicate);
        if (selection.length === 0) { return '' };
        const average = averageValue(selection, axis.field);
        const maximum = selection.reduce((a, b) => Math.max(a,  Number(b[axis.field])), 
                        Number(selection[0][axis.field]));
        const minimum = selection.reduce((a, b) => Math.min(a,  Number(b[axis.field])), 
                        Number(selection[0][axis.field]));
        return `the average value is ${average}, the maximum is ${maximum}, and the minimum is ${minimum}`

      default:
        throw `Node type ${node.nodeType} does not have the 'aggregate' token.`;
    }
  }

  function quartile(node: ElaboratedOlliNode): string {
    switch (node.nodeType) {
      case 'filteredData':
        const selection = selectionTest(dataset, node.fullPredicate);

        // TODO
        // find sections to compare against TODO somehow
        
        // const avgs: number[] = []
        // sections.forEach(interval => {
        //     if (interval.length == 0) {
        //         avgs.push(0);
        //         return;
        //     }
        //     const avg = averageValue(interval, field);
        //     avgs.push(Number(avg));
        // });

        // avgs.sort(function(a, b) {
        //     return a - b;
        //   });
        // const thisAvg = selection.length == 0 ? 0 : averageValue(selection, field)
        // const sectionsPos = avgs.indexOf(Number(thisAvg))/avgs.length;
        // const sectionsQuart = Math.max(1, Math.ceil(sectionsPos * 4)); // pos is btwn 0 and 1, no quartile 0
        // return `This section's average ${field} is in the ${ordinal_suffix_of(sectionsQuart)} quartile  of all sections`

        return ''
      default:
        throw `Node type ${node.nodeType} does not have the 'quartile' token.`;
    }
  }

  const nodeTypeToTokens = new Map<OlliNodeType, string[]>([
    ['root', ['name', 'type', 'size', 'children', 'depth']],
    ['view', ['index', 'type', 'name', 'children', 'depth']],
    ['xAxis', ['name', 'type', 'data', 'parent', 'aggregate', 'depth']],
    ['yAxis', ['name', 'type', 'data', 'parent', 'aggregate', 'depth']],
    ['legend', ['name', 'type', 'data', 'parent', 'aggregate', 'depth']],
    ['filteredData', ['index', 'data', 'size', 'parent', 'aggregate', 'quartile', 'depth']],
    ['annotations', ['size', 'depth']],
    ['other', ['index', 'data', 'size', 'depth']],
  ]);

  const tokenFunctions = new Map<string, Function>([
    ['name', name],
    ['index', index],
    ['type', type],
    ['children', children],
    ['data', data],
    ['size', size],
    ['depth', depth],
    ['parent', parent],
    ['quartile', quartile],
    ['aggregate', aggregate]
  ]);

  const resultDescription = new Map<string, string>();
  const tokens = nodeTypeToTokens.get(node.nodeType);
  if (tokens !== undefined) {
    for (const token of tokens) {
      const tokenFunc = tokenFunctions.get(token);
      if (tokenFunc !== undefined) {
        resultDescription.set(token, tokenFunc(node));
      }
    }
  }

  return resultDescription;
}

export function predicateToDescription(predicate: LogicalComposition<FieldPredicate>, fields: OlliFieldDef[]) {
  if ('and' in predicate) {
    return predicate.and.map((p) => predicateToDescription(p, fields)).join(' and ');
  }
  if ('or' in predicate) {
    return predicate.or.map((p) => predicateToDescription(p, fields)).join(' or ');
  }
  if ('not' in predicate) {
    return `not ${predicateToDescription(predicate.not, fields)}`;
  }
  return fieldPredicateToDescription(predicate, fields);
}

function fieldPredicateToDescription(predicate: FieldPredicate, fields: OlliFieldDef[]) {
  const fieldDef = getFieldDef(predicate.field, fields);
  if ('equal' in predicate) {
    return `${predicate.field} equals ${fmtValue(predicate.equal as OlliValue, fieldDef)}`;
  }
  if ('range' in predicate) {
    return `${predicate.field} is between ${fmtValue(predicate.range[0], fieldDef)} and ${fmtValue(
      predicate.range[1],
      fieldDef
    )}`;
  }
  if ('lt' in predicate) {
    return `${predicate.field} is less than ${fmtValue(predicate.lt as OlliValue, fieldDef)}`;
  }
  if ('lte' in predicate) {
    return `${predicate.field} is less than or equal to ${fmtValue(predicate.lte as OlliValue, fieldDef)}`;
  }
  if ('gt' in predicate) {
    return `${predicate.field} is greater than ${fmtValue(predicate.gt as OlliValue, fieldDef)}`;
  }
  if ('gte' in predicate) {
    return `${predicate.field} is greater than or equal to ${fmtValue(predicate.gte as OlliValue, fieldDef)}`;
  }

  return '';
}
