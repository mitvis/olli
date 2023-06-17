import { OlliRuntime } from '../../Runtime/OlliRuntime';
import { ElaboratedOlliNode } from '../../Structure/Types';
import { selectionTest } from '../../util/selection';

export function makeTargetedNavMenu(tree: OlliRuntime): HTMLElement {
  const container = document.createElement('div');
  let selectedNodeId = tree.rootTreeItem.olliNode.id;

  function generateChildSelects(node) {
    if (!node.children || !node.children.length) {
      return null;
    }
    const layerDiv = document.createElement('div');
    const layerChildContainer = document.createElement('div');
    const layerSelect = document.createElement('select');
    const sortedByValueCount = [...node.children].sort((a: ElaboratedOlliNode, b: ElaboratedOlliNode) => {
      const aCount = selectionTest(tree.olliSpec.data, a.fullPredicate).length;
      const bCount = selectionTest(tree.olliSpec.data, b.fullPredicate).length;
      return bCount - aCount;
    });
    const layerOptions = sortedByValueCount.map((child) => {
      const option = document.createElement('option');
      option.setAttribute('value', child.id);
      option.innerText = child.description;
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

  // // Layer 1 -- Select a Node
  // const nodeSelectContainer = document.createElement('div');
  // const nodeSelectLabel = document.createElement('label');
  // nodeSelectLabel.setAttribute('for', 'olli-node-select');
  // nodeSelectLabel.innerText = 'Layer 1: ';
  // const nodeSelect = document.createElement('select');
  // nodeSelect.classList.add('olli-node-select');
  // nodeSelect.setAttribute('name', 'olli-node-select');
  // nodeSelect.setAttribute('id', 'olli-node-select');
  // nodeSelectContainer.replaceChildren(nodeSelectLabel, nodeSelect);

  // // const topOption = document.createElement('option');
  // // topOption.setAttribute('value', tree.rootTreeItem.olliNode.id);
  // // topOption.innerText = tree.rootTreeItem.olliNode.description;
  // const nodeSelectOptions = tree.rootTreeItem.olliNode.children.map((node) => {
  //   const option = document.createElement('option');
  //   option.setAttribute('value', node.id);
  //   option.innerText = node.description;
  //   return option;
  // });
  // // const allOptions = [topOption, ...nodeSelectOptions];
  // const allOptions = [...nodeSelectOptions];
  // nodeSelect.replaceChildren(...allOptions);

  // // Layer 2 -- Range
  // const rangeSelectContainer = document.createElement('div');
  // const rangeSelectLabel = document.createElement('label');
  // rangeSelectLabel.setAttribute('for', 'olli-range-select');
  // rangeSelectLabel.innerText = 'Layer 2: ';
  // const rangeSelect = document.createElement('select');
  // rangeSelect.classList.add('olli-range-select');
  // rangeSelect.setAttribute('name', 'olli-range-select');
  // rangeSelect.setAttribute('id', 'olli-range-select');
  // rangeSelectContainer.replaceChildren(rangeSelectLabel, rangeSelect);

  // let rangeSelectOptions = tree.rootTreeItem.olliNode.children[0].children.map((node) => {
  //   const option = document.createElement('option');
  //   option.setAttribute('value', node.id);
  //   option.innerText = node.description;
  //   return option;
  // });
  // rangeSelect.replaceChildren(...rangeSelectOptions);

  // nodeSelect.onchange = () => {
  //   const selectedField = allOptions[nodeSelect.selectedIndex];
  //   const selectedFieldChildren = tree.olliNodeLookup[selectedField.value].children;

  //   let rangeSelectOptions = selectedFieldChildren.map((node) => {
  //     const option = document.createElement('option');
  //     option.setAttribute('value', node.id);
  //     option.innerText = node.description;
  //     return option;
  //   });
  //   rangeSelect.replaceChildren(...rangeSelectOptions);

  //   rangeSelect.onchange = () => {
  //     selectedNodeId = rangeSelect.value;
  //     container.setAttribute('data-state', selectedNodeId);
  //   };

  //   selectedNodeId = rangeSelect.value;
  //   // console.log(finalTreeItems)
  // };

  // selectedNodeId = rangeSelect.value;
  // // console.log(finalTreeItems)

  // container.appendChild(nodeSelectContainer);
  // container.appendChild(rangeSelectContainer);
  // container.setAttribute('data-state', selectedNodeId);
  return container;
}
