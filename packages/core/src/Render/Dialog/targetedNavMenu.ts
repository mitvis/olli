import { getCustomizedDescription } from '../../Customization';
import { OlliRuntime } from '../../Runtime/OlliRuntime';
import { getSpecForNode } from '../../Structure';
import { ElaboratedOlliNode } from '../../Structure/Types';
import { selectionTest } from '../../util/selection';

export function makeTargetedNavMenu(tree: OlliRuntime): HTMLElement {
  const container = document.createElement('div');
  let selectedNodeId = tree.rootTreeItem.olliNode.id;

  function generateChildSelects(node: ElaboratedOlliNode) {
    if (!node.children || !node.children.length) {
      return null;
    }
    const olliSpec = getSpecForNode(node, tree.olliSpec);
    const layerDiv = document.createElement('div');
    const layerChildContainer = document.createElement('div');
    const layerSelect = document.createElement('select');
    const sortedByValueCount = [...node.children].sort((a: ElaboratedOlliNode, b: ElaboratedOlliNode) => {
      const aCount = selectionTest(olliSpec.data, a.fullPredicate).length;
      const bCount = selectionTest(olliSpec.data, b.fullPredicate).length;
      return bCount - aCount;
    });
    const layerOptions = sortedByValueCount.map((child) => {
      const option = document.createElement('option');
      option.setAttribute('value', child.id);
      option.innerText = getCustomizedDescription(child);
      if (tree.lastFocusedTreeItem?.olliNode.id.startsWith(child.id)) {
        option.setAttribute('selected', 'selected');
      }
      return option;
    });
    layerSelect.replaceChildren(...layerOptions);
    layerSelect.onchange = () => {
      selectedNodeId = layerSelect.value;
      container.setAttribute('data-state', selectedNodeId);
      const childSelects = generateChildSelects(tree.olliNodeLookup[selectedNodeId]);
      if (childSelects) {
        layerChildContainer.replaceChildren(childSelects);
      } else {
        layerChildContainer.replaceChildren();
      }
    };
    layerSelect.onchange(null);
    layerDiv.replaceChildren(layerSelect, layerChildContainer);
    return layerDiv;
  }

  const selects = generateChildSelects(tree.rootTreeItem.olliNode);
  container.replaceChildren(selects);

  return container;
}
