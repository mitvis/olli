import { LogicalAnd } from 'vega-lite/src/logical';
import { FieldPredicate } from 'vega-lite/src/predicate';
import { UnitOlliSpec, OlliDataset, OlliSpec } from '../Types';
import { fieldToPredicates, selectionTest } from '../util/selection';
import { ElaboratedOlliNode, OlliNode, OlliNodeLookup, OlliNodeType } from './Types';
import { nodeToDescription } from '../Customization';

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
      description: new Map<string, string>(),
      children: nodes,
    };
  }

  function nodeTypeFromGroupField(field: string, olliSpec: UnitOlliSpec): OlliNodeType {
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
    olliSpec: UnitOlliSpec,
    specIndex: number,
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
          specIndex,
          groupby: node.groupby,
          description: new Map<string, string>(),
          children: childPreds.map((p, childIdx) => {
            const childFullPred = {
              and: [...fullPredicate.and, p],
            };
            const childId = `${idPrefix}-${idx}-${childIdx}`;
            return {
              id: childId,
              nodeType: nodeType === 'root' ? 'facet' : 'filteredData',
              specIndex,
              predicate: p,
              fullPredicate: childFullPred,
              description: new Map<string, string>(),
              children: elaborateOlliNodes(olliSpec, specIndex, node.children, data, childFullPred, childId),
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
          specIndex,
          fullPredicate: nextFullPred,
          predicate,
          description: new Map<string, string>(),
          children: elaborateOlliNodes(olliSpec, specIndex, node.children, data, nextFullPred, nextId),
        };
      } else if ('annotations' in node) {
        const id = `${idPrefix}-${idx}`;
        return {
          id: id,
          fullPredicate,
          nodeType: 'annotations',
          specIndex,
          description: new Map<string, string>(),
          children: elaborateOlliNodes(olliSpec, specIndex, node.annotations, data, fullPredicate, id),
        };
      } else {
        throw new Error('Invalid node type');
      }
    });
  }

  if (Array.isArray(olliSpec)) {
    const layerNodes = olliSpec.map((spec, idx) => {
      const nodes = Array.isArray(spec.structure) ? spec.structure : [spec.structure];
      const data = spec.selection ? selectionTest(spec.data, spec.selection) : spec.data;
      const elaborated = elaborateOlliNodes(spec, idx, nodes, data, { and: [] }, `${namespace}-${idx}`);
      return {
        id: `${namespace}-${idx}`,
        nodeType: 'facet' as OlliNodeType,
        specIndex: idx,
        fullPredicate: { and: [] },
        description: new Map<string, string>(),
        children: elaborated,
      };
    });
    const tree = ensureFirstLayerHasOneRoot(layerNodes);
    postProcessTree(tree, olliSpec);
    return tree;
  } else {
    const nodes = Array.isArray(olliSpec.structure) ? olliSpec.structure : [olliSpec.structure];
    const data = olliSpec.selection ? selectionTest(olliSpec.data, olliSpec.selection) : olliSpec.data;
    const tree = ensureFirstLayerHasOneRoot(
      elaborateOlliNodes(olliSpec, undefined, nodes, data, { and: [] }, namespace)
    );
    postProcessTree(tree, olliSpec);
    return tree;
  }
}

export function postProcessTree(tree: ElaboratedOlliNode, olliSpec: OlliSpec) {
  function postProcess(node: ElaboratedOlliNode) {
    // add parent refs
    node.children.forEach((child) => {
      child.parent = node;
    });
    // initialize descriptions
    const spec =
      getSpecForNode(node, olliSpec) ||
      (Array.isArray(olliSpec)
        ? {
            data: olliSpec.flatMap((s) => s.data),
            selection: null,
            fields: olliSpec.flatMap((s) => s.fields),
            axes: olliSpec.flatMap((s) => s.axes),
            legends: olliSpec.flatMap((s) => s.legends),
          }
        : olliSpec);
    const data = spec.selection ? selectionTest(spec.data, spec.selection) : spec.data;
    node.description = nodeToDescription(node, data, spec);
  }

  const queue = [tree];
  while (queue.length > 0) {
    const node = queue.shift();
    postProcess(node);
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

export function getSpecForNode(node: ElaboratedOlliNode, olliSpec: OlliSpec): UnitOlliSpec {
  return Array.isArray(olliSpec) ? olliSpec[node.specIndex] : olliSpec;
}
