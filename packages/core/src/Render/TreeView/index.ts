// Adapted from: https://w3c.github.io/aria-practices/examples/treeview/treeview-1/treeview-1b.html

import { nodeToDescription } from '../../Description';
import { ElaboratedOlliNode, OlliNode, OlliNodeLookup } from '../../Structure/Types';
import { OlliSpec } from '../../Types';
import { selectionTest } from '../../util/selection';
import { fmtValue } from '../../util/values';
import { makeDialog, openTableDialog } from '../Dialog';
import { renderTable } from '../Table';
import './TreeStyle.css';

/**
 *
 * @param node A {@link AccessibilityTreeNode} to generate a navigable tree view from
 * @returns An {@link HTMLElement} ARIA TreeView of the navigable tree view for a visualization
 */
export function renderTree(node: ElaboratedOlliNode, olliSpec: OlliSpec, renderContainer: HTMLElement): HTMLElement {
  const root = document.createElement('ul');
  const labelId = `${node.id}-label`;

  root.setAttribute('role', 'tree');
  root.setAttribute('aria-labelledby', labelId);

  root.appendChild(_renderTree(node, 1, 1, 1));
  root.querySelector('span')?.setAttribute('id', labelId);

  return root;

  function _renderTree(node: ElaboratedOlliNode, level: number, posinset: number, setsize: number): HTMLElement {
    const item = document.createElement('li');
    item.setAttribute('role', 'treeitem');
    item.setAttribute('aria-level', String(level));
    item.setAttribute('aria-setsize', String(setsize));
    item.setAttribute('aria-posinset', String(posinset));
    item.setAttribute('aria-expanded', 'false');
    item.setAttribute('data-nodetype', node.nodeType);
    item.setAttribute('id', node.id);

    const label = document.createElement('span');
    // label.textContent = nodeToDescription(node);
    item.appendChild(label);

    if (node.children.length) {
      const childContainer = document.createElement('ul');
      childContainer.setAttribute('role', 'group');

      node.children.forEach((n, index, array) => {
        childContainer.appendChild(_renderTree(n, level + 1, index + 1, array.length));
      });
      item.appendChild(childContainer);
    }

    return item;
  }
}
