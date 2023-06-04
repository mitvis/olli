import { LogicalAnd } from 'vega-lite/src/logical';
import { FieldPredicate } from 'vega-lite/src/predicate';
import { OlliSpec, OlliDataset } from '../Types';
import { fieldToPredicates, selectionTest } from '../util/selection';
import { ElaboratedOlliNode, OlliNode, OlliNodeLookup, OlliNodeType } from './Types';

export function olliSpecToTree(olliSpec: OlliSpec): ElaboratedOlliNode {
  const namespace = (Math.random() + 1).toString(36).substring(7);
  /**
   * If the top level has multiple nodes, we wrap them in a single node
   */
  function ensureFirstLayerHasOneRoot(nodes: ElaboratedOlliNode[]): ElaboratedOlliNode {
    if (nodes.length === 1 && !['xAxis', 'yAxis'].includes(nodes[0].nodeType)) {
      return nodes[0];
    }
    return {
      id: namespace,
      nodeType: 'root',
      fullPredicate: { and: [] },
      children: nodes,
    };
  }

  function nodeTypeFromGroupField(field: string, olliSpec: OlliSpec): OlliNodeType {
    if (field === olliSpec.facet) return 'root';
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
      return [];
    }
    return olliNodes.map((node, idx) => {
      if ('groupby' in node) {
        const nodeType = nodeTypeFromGroupField(node.groupby, olliSpec);
        const childPreds = fieldToPredicates(node.groupby, data, olliSpec.fields);

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

  const data = olliSpec.selection ? selectionTest(olliSpec.data, olliSpec.selection) : olliSpec.data;

  const tree = ensureFirstLayerHasOneRoot(elaborateOlliNodes(nodes, data, { and: [] }, namespace));
  addParentRefs(tree);
  return tree;
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
