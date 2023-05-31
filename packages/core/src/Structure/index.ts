import { LogicalAnd } from 'vega-lite/src/logical';
import { FieldPredicate } from 'vega-lite/src/predicate';
import { OlliSpec, OlliDataset } from '../Types';
import { fieldToPredicates } from '../util/selection';
import { ElaboratedOlliNode, OlliNode, OlliNodeLookup, OlliNodeType } from './Types';

export function olliSpecToTree(olliSpec: OlliSpec, namespace: string): ElaboratedOlliNode {
  /**
   * If the top level has multiple nodes, we wrap them in a single node
   */
  function ensureFirstLayerHasOneRoot(nodes: ElaboratedOlliNode[]): ElaboratedOlliNode {
    if (nodes.length === 1) {
      return nodes[0];
    }
    return {
      id: namespace,
      nodeType: 'other',
      fullPredicate: { and: [] },
      children: nodes,
    };
  }

  function nodeTypeFromGroupField(field: string, olliSpec: OlliSpec): OlliNodeType {
    if (field === olliSpec.facetField) return 'root';
    const axis = olliSpec.axes?.find((a) => a.field === field);
    if (axis) {
      switch (axis.axisType) {
        case 'x':
          return 'xAxis';
        case 'y':
          return 'yAxis';
      }
    }
    const legend = olliSpec.legends?.find((l) => l.field === field);
    if (legend) {
      return 'legend';
    }
    return 'other';
  }

  function elaborateOlliNodes(
    olliNodes: OlliNode[],
    data: OlliDataset,
    fullPredicate: LogicalAnd<FieldPredicate>,
    idPrefix: string
  ): ElaboratedOlliNode[] {
    if (!olliNodes) {
      // base case (leaf node)
      // const datums = selectionTest(data, fullPredicate);
      // return datums.map((datum, idx) => {
      //   return {
      //     id: `${idPrefix}-${idx}`,
      //     nodeType: 'data',
      //     fullPredicate: datumToPredicate(datum, fields),
      //     children: [],
      //   };
      // });
      return [];
    }
    return olliNodes.map((node, idx) => {
      if ('groupby' in node) {
        const fieldDef = node.groupby;
        const nodeType = nodeTypeFromGroupField(fieldDef.field, olliSpec);
        const childPreds = fieldToPredicates(fieldDef, data);

        return {
          id: `${idPrefix}-${idx}`,
          fullPredicate,
          nodeType,
          groupby: node.groupby,
          children: childPreds.map((p, childIdx) => {
            const childFullPred = {
              and: [...fullPredicate.and, p],
            };
            const childId = `${idPrefix}-${idx}-${childIdx}`;
            return {
              id: childId,
              nodeType: nodeType === 'root' ? 'facet' : 'filteredData',
              predicate: p,
              fullPredicate: childFullPred,
              children: elaborateOlliNodes(node.children, data, childFullPred, childId),
            };
          }),
        };
      } else if ('predicate' in node) {
        const predicate = node.predicate;
        const nextFullPred = {
          and: [...fullPredicate.and, predicate],
        };
        const nextId = `${idPrefix}-${idx}`;
        return {
          id: nextId,
          nodeType: 'filteredData',
          fullPredicate: nextFullPred,
          predicate,
          children: elaborateOlliNodes(node.children, data, nextFullPred, nextId),
        };
      } else {
        throw new Error('Invalid node type');
      }
    });
  }

  const nodes = Array.isArray(olliSpec.structure) ? olliSpec.structure : [olliSpec.structure];

  const tree = ensureFirstLayerHasOneRoot(elaborateOlliNodes(nodes, olliSpec.data, { and: [] }, namespace));
  addParentRefs(tree);
  return tree;
}

export function getFieldsUsed(olliSpec: OlliSpec, tree: ElaboratedOlliNode) {
  if (olliSpec.axes || olliSpec.legends || olliSpec.facetField) {
    const fields = new Set(
      [
        olliSpec.facetField || [],
        olliSpec.axes.map((axis) => axis.field),
        olliSpec.legends.map((legend) => legend.field),
      ].flat()
    );
    return fields;
  } else {
    const queue = [tree];
    const fields = new Set();
    while (queue.length > 0) {
      const node = queue.shift();
      if ('groupby' in node) {
        const field = node.groupby.field;
        if (!fields.has(field)) {
          fields.add(field);
        }
      } else if ('predicate' in node) {
        const field = node.predicate.field;
        if (!fields.has(field)) {
          fields.add(field);
        }
      }
      queue.push(...node.children);
    }
    return fields;
  }
}

export function addParentRefs(tree: ElaboratedOlliNode) {
  const queue = [tree];
  while (queue.length > 0) {
    const node = queue.shift();
    node.children.forEach((child) => {
      child.parent = node;
    });
    queue.push(...node.children);
  }
}

export function treeToNodeLookup(tree: ElaboratedOlliNode): OlliNodeLookup {
  const nodeLookup = {};
  const queue = [tree];
  while (queue.length > 0) {
    const node = queue.shift();
    nodeLookup[node.id] = node;
    queue.push(...node.children);
  }
  return nodeLookup;
}

//////////////////////////////////////////////////////////////////////////////////////////

// const filterInterval = (
//   selection: OlliDataset,
//   field: string,
//   lowerBound: number | Date,
//   upperBound: number | Date
// ): OlliDataset => {
//   return selection.filter((datum: any) => {
//     let value = datum[field];
//     if (value instanceof Date) {
//       const lowerBoundStr = String(lowerBound);
//       const upperBoundStr = String(upperBound);
//       if (lowerBoundStr.length === 4 && upperBoundStr.length === 4) {
//         value = value.getFullYear();
//       }
//     }
//     return value >= lowerBound && value < upperBound;
//   });
// };

// function axisValuesToIntervals(values: string[] | number[]): ([number, number] | [Date, Date])[] {
//   const ensureAxisValuesNumeric = (values: any[]): { values: number[]; isDate?: boolean } => {
//     const isStringArr = values.every((v) => typeof v === 'string' || v instanceof String);
//     if (isStringArr) {
//       return {
//         values: values.map((s) => Number(s.replaceAll(',', ''))),
//       };
//     }
//     const isDateArr = values.every((v) => v instanceof Date);
//     if (isDateArr) {
//       return {
//         values: values.map((d) => d.getTime()),
//         isDate: true,
//       };
//     }
//     return {
//       values,
//     };
//   };

//   const getEncodingValueIncrements = (
//     incrementArray: [number, number][],
//     currentValue: number,
//     index: number,
//     array: number[]
//   ): [number, number][] => {
//     let bounds: [number, number];
//     let reducedIndex = index - 1;
//     if (index === 0 && currentValue === 0) {
//       return incrementArray;
//     } else if (reducedIndex === -1 && currentValue !== 0) {
//       const incrementDifference: number = (array[index + 1] as number) - currentValue;
//       bounds = [currentValue - incrementDifference, currentValue];
//     } else if (index === array.length - 1) {
//       const incrementDifference: number = currentValue - (array[index - 1] as number);
//       const finalIncrement = currentValue + incrementDifference;
//       incrementArray.push([array[reducedIndex] as number, currentValue]);
//       bounds = [currentValue, finalIncrement];
//     } else {
//       bounds = [array[reducedIndex] as number, array[reducedIndex + 1] as number];
//     }
//     incrementArray.push([bounds[0], bounds[1]]);
//     return incrementArray;
//   };

//   const res = ensureAxisValuesNumeric(values);
//   const increments = res.values.reduce(getEncodingValueIncrements, []);
//   if (res.isDate) {
//     return increments.map((value) => [new Date(value[0]), new Date(value[1])]);
//   }
//   return increments;
// }

// /**
//  * Creates a {@link AccessibilityTreeNode} of the given parameters.
//  * This function recursively constructs a tree and returns the root node of the tree.
//  *
//  * @param type The {@link NodeType} to construct
//  * @param selected filtered list of data rows selected by the node
//  * @param parent The parent {@link AccessibilityTreeNode} of the node
//  * @param olliVisSpec The spec for the visualization
//  * @param fieldsUsed The data fields that are used by encodings in the olliVisSpec
//  * @param facetValue? If the spec is a faceted chart, the data value to facet on
//  * @param filterValue? if the current node being constructed is a filteredData node, the FilterValue to filter on
//  * @param guide? if the current node is associated with a guide, the guide spec
//  * @param index? the index of the current node in its sibling list
//  * @param length? the length of the list containing the current node and its siblings
//  * @param gridIndex? if the current node being constructed is a grid node, the row/col coordinates of the node
//  *
//  * @returns The {@link AccessibilityTreeNode} from the provided parameters
//  */
// function olliVisSpecToNode(
//   type: NodeType,
//   selected: OlliDatum[],
//   parent: AccessibilityTreeNode | null,
//   olliVisSpec: OlliSpec,
//   fieldsUsed: string[],
//   facetValue?: string,
//   filterValue?: FilterValue,
//   guide?: Guide,
//   index?: number,
//   length?: number,
//   gridIndex?: { i: number; j: number }
// ): AccessibilityTreeNode {
//   let node: AccessibilityTreeNode = {
//     type,
//     parent,
//     selected,
//     filterValue,
//     gridIndex,
//     //
//     description: type,
//     children: [],
//   };

//   const facetedChart = olliVisSpec as FacetedChart;
//   const chart = olliVisSpec as Chart;

//   switch (type) {
//     case 'multiView':
//       node.children = [...facetedChart.charts.entries()].map(([facetValue, chart]: [string, Chart], index, array) => {
//         return olliVisSpecToNode(
//           'chart',
//           selected.filter((datum: any) => String(datum[facetedChart.facetedField]) === facetValue),
//           node,
//           chart,
//           fieldsUsed,
//           facetValue,
//           undefined,
//           undefined,
//           index,
//           array.length
//         );
//       });
//       break;
//     case 'chart':
//       // remove some axes depending on mark type
//       const filteredAxes = chart.axes.filter((axis) => {
//         if (chart.mark === 'bar' && axis.type === 'continuous') {
//           // don't show continuous axis for bar charts
//           return false;
//         }
//         return true;
//       });
//       node.children = [
//         ...filteredAxes.map((axis) => {
//           return olliVisSpecToNode(
//             axis.axisType === 'x' ? 'xAxis' : 'yAxis',
//             selected,
//             node,
//             chart,
//             fieldsUsed,
//             facetValue,
//             undefined,
//             axis
//           );
//         }),
//         ...chart.legends.map((legend) => {
//           return olliVisSpecToNode('legend', selected, node, chart, fieldsUsed, facetValue, undefined, legend);
//         }),
//         ...(chart.mark === 'point' &&
//         filteredAxes.length === 2 &&
//         filteredAxes.every((axis) => axis.type === 'continuous')
//           ? [olliVisSpecToNode('grid', selected, node, chart, fieldsUsed, facetValue)]
//           : []),
//       ];
//       break;
//     case 'xAxis':
//     case 'yAxis':
//       const axis = guide as Axis;
//       switch (axis.type) {
//         case 'discrete':
//           node.children = axis.values.map((value) => {
//             return olliVisSpecToNode(
//               'filteredData',
//               selected.filter((d) => String(d[axis.field]) === String(value)),
//               node,
//               chart,
//               fieldsUsed,
//               facetValue,
//               String(value),
//               axis
//             );
//           });
//           break;
//         case 'continuous':
//           const intervals = axisValuesToIntervals(axis.values);
//           node.children = intervals.map(([a, b]) => {
//             return olliVisSpecToNode(
//               'filteredData',
//               filterInterval(selected, axis.field, a, b),
//               node,
//               chart,
//               fieldsUsed,
//               facetValue,
//               [a, b],
//               axis
//             );
//           });
//           break;
//       }
//       break;
//     case 'legend':
//       const legend = guide as Legend;
//       switch (legend.type) {
//         case 'discrete':
//           node.children = legend.values.map((value) => {
//             return olliVisSpecToNode(
//               'filteredData',
//               selected.filter((d) => String(d[legend.field]) === String(value)),
//               node,
//               chart,
//               fieldsUsed,
//               facetValue,
//               String(value),
//               legend
//             );
//           });
//           break;
//         case 'continuous':
//           // TODO currently unsupported
//           break;
//       }
//       break;
//     case 'grid':
//       const xAxis = chart.axes.find((axis) => axis.axisType === 'x')!;
//       const yAxis = chart.axes.find((axis) => axis.axisType === 'y')!;
//       const xIntervals = axisValuesToIntervals(xAxis.values);
//       const yIntervals = axisValuesToIntervals(yAxis.values);
//       const cartesian = (...a: any[][]) =>
//         a.reduce((a: any[], b: any[]) => a.flatMap((d: any) => b.map((e: any) => [d, e].flat())));
//       node.children = cartesian(xIntervals, yIntervals).map(([x1, x2, y1, y2], index) => {
//         return olliVisSpecToNode(
//           'filteredData',
//           filterInterval(filterInterval(selected, xAxis.field, x1, x2), yAxis.field, y1, y2),
//           node,
//           chart,
//           fieldsUsed,
//           facetValue,
//           [
//             [x1, x2],
//             [y1, y2],
//           ],
//           undefined,
//           undefined,
//           undefined,
//           {
//             i: Math.floor(index / yIntervals.length),
//             j: index % yIntervals.length,
//           }
//         );
//       });
//       break;
//     case 'filteredData':
//       node.children = selected.map((datum, index, array) => {
//         return olliVisSpecToNode(
//           'data',
//           [datum],
//           node,
//           chart,
//           fieldsUsed,
//           facetValue,
//           undefined,
//           guide,
//           index,
//           array.length
//         );
//       });
//       break;
//     case 'data':
//       // set the ordering of the fields for rendering to a table
//       // put the filter values last, since user already knows the value
//       node.tableKeys = fieldsUsed;
//       if (guide) {
//         node.tableKeys = node.tableKeys.filter((f) => f !== guide.field).concat([guide.field]);
//       }
//       if (facetValue) {
//         const facetedField = fieldsUsed[0];
//         node.tableKeys = node.tableKeys.filter((f) => f !== facetedField).concat([facetedField]);
//       }
//       break;
//     default:
//       throw `Node type ${type} not handled in olliVisSpecToNode`;
//   }

//   node.description = nodeToDesc(node, olliVisSpec, facetValue, guide, index, length);

//   return node;
// }

// /**
//  *
//  * @param node The node whose description is being created
//  * @returns A description based on the provided {@link AccessibilityTreeNode}
//  */
// function nodeToDesc(
//   node: AccessibilityTreeNode,
//   olliVisSpec: OlliSpec,
//   facetValue?: string,
//   guide?: Guide,
//   index?: number,
//   length?: number
// ): string {
//   return _nodeToDesc(node, olliVisSpec, facetValue, guide, index, length).replace(/\s+/g, ' ').trim();

//   function _nodeToDesc(
//     node: AccessibilityTreeNode,
//     olliVisSpec: OlliSpec,
//     facetValue?: string,
//     guide?: Guide,
//     index?: number,
//     length?: number
//   ): string {
//     const chartType = (chart: Chart) => {
//       if (chart.mark === 'point') {
//         if (chart.axes.every((axis) => axis.type === 'continuous')) {
//           return 'scatterplot';
//         } else {
//           return 'dot plot';
//         }
//       }
//       return chart.mark ? `${chart.mark} chart` : '';
//     };
//     const chartTitle = (chart: OlliSpec) => (chart.title || facetValue ? `titled "${chart.title || facetValue}"` : '');
//     const authorDescription = (chart: OlliSpec) => {
//       if (chart.description) {
//         let str = chart.description.trim();
//         if (!/.*[.?!]/g.test(str)) {
//           str += '.';
//         }
//         return str + ' ';
//       }
//       return '';
//     };
//     const listAxes = (chart: Chart) =>
//       chart.axes.length === 1
//         ? `with axis "${chart.axes[0].title || chart.axes[0].field}"`
//         : `with axes ${chart.axes.map((axis) => `"${axis.title || axis.field}"`).join(' and ')}`;
//     const guideTitle = (guide: Guide) => `titled "${guide.title || guide.field}"`;
//     const axisScaleType = (axis: Axis) => `for a ${axis.scaleType || axis.type} scale`;
//     const legendChannel = (legend: Legend) => (legend.channel ? `for ${legend.channel}` : '');
//     const pluralize = (count: number, noun: string, suffix = 's') => `${count} ${noun}${count !== 1 ? suffix : ''}`;
//     const guideValues = (guide: Guide) =>
//       guide.type === 'discrete'
//         ? guide.values.length === 2
//           ? `with 2 values: "${fmtValue(guide.values[0])}" and "${fmtValue(guide.values[1])}"`
//           : `with ${pluralize(guide.values.length, 'value')} starting with "${guide.values[0]}" and ending with "${
//               guide.values[guide.values.length - 1]
//             }"`
//         : `with values from "${fmtValue(guide.values[0])}" to "${fmtValue(guide.values[guide.values.length - 1])}"`;
//     const facetValueStr = (facetValue?: string) => (facetValue ? `"${facetValue}".` : '');
//     const filteredValues = (guideFilterValues?: EncodingFilterValue) => {
//       if (!guideFilterValues) return '';
//       else if (Array.isArray(guideFilterValues)) {
//         return `${guideFilterValues.map((v) => fmtValue(v)).join(' to ')}`;
//       } else {
//         return `"${fmtValue(guideFilterValues)}"`;
//       }
//     };
//     const filteredValuesGrid = (gridFilterValues?: GridFilterValue) => {
//       if (!gridFilterValues) return '';
//       return `in ${filteredValues(gridFilterValues[0])} and ${filteredValues(gridFilterValues[1])}`;
//     };
//     const indexStr = (index?: number, length?: number) =>
//       index !== undefined && length !== undefined ? `${index + 1} of ${length}.` : '';
//     const datum = (datum: OlliDatum, node: AccessibilityTreeNode) => {
//       return node.tableKeys
//         ?.map((field) => {
//           const value = fmtValue(datum[field]);
//           return `"${field}": "${value}"`;
//         })
//         .join(', ');
//     };
//     const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

//     const chart = olliVisSpec as Chart;
//     const axis = guide as Axis;
//     const legend = guide as Legend;

//     switch (node.type) {
//       case 'multiView':
//         return `${authorDescription(olliVisSpec)}A faceted chart ${chartTitle(olliVisSpec)} with ${
//           node.children.length
//         } views.`;
//       case 'chart':
//         return `${authorDescription(olliVisSpec)}${indexStr(index, length)} A ${chartType(chart)} ${chartTitle(
//           chart
//         )} ${listAxes(chart)}.`;
//       case 'xAxis':
//       case 'yAxis':
//         return `${axis.axisType.toUpperCase()}-axis ${guideTitle(axis)} ${axisScaleType(axis)} ${guideValues(
//           axis
//         )}. ${facetValueStr(facetValue)}`;
//       case 'legend':
//         return `Legend ${guideTitle(legend)} ${legendChannel(legend)} ${guideValues(axis)}. ${facetValueStr(
//           facetValue
//         )}`;
//       case 'grid':
//         return `Grid view of ${chartType(chart)}. ${facetValueStr(facetValue)}`;
//       case 'filteredData':
//         if (node.parent?.type === 'grid') {
//           return `${pluralize(node.children.length, 'value')} ${filteredValuesGrid(
//             node.filterValue as GridFilterValue
//           )}. ${facetValueStr(facetValue)}`;
//         } else {
//           return `${capitalize(filteredValues(node.filterValue as EncodingFilterValue))}. ${pluralize(
//             node.children.length,
//             'value'
//           )}. ${facetValueStr(facetValue)}`;
//         }
//       case 'data':
//         // note: the datum description is not used by the table renderer
//         return `${indexStr(index, length)} ${datum(node.selected[0], node)}`;
//       default:
//         throw `Node type ${node.type} not handled in nodeToDesc`;
//     }
//   }
// }
