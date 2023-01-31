import { AccessibilityTree, AccessibilityTreeNode, TokenType, HierarchyLevel } from "../Structure/Types";
import { Tree } from "../Render/TreeView/Tree";
import { updateVerbosityDescription } from "./index";

export function addMenuCommands(menu: HTMLElement, t: Tree) {
  menu.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      // "Close" menu by moving focus back to the user's previous position in the tree
      t.setFocusToItem(t.lastFocusedItem);
    }
  })
}

export function addTreeCommands(treeElt: HTMLElement, tree: AccessibilityTree) {
  let keylog = '';
  let lastTimePressed = new Date().valueOf();

  treeElt.addEventListener('keydown', (event) => {
    const timePressed = new Date().valueOf();
    if (event.ctrlKey && event.key === 'm') {
      // "Open" menu by moving focus there
      const menu = document.getElementById('settings')!;
      menu.focus();
      menu.setAttribute('aria-selected', 'true');

      keylog = '';
    }

    // If the first time key pressed in 5 seconds, empty previous keylog
    // TODO try out some timings
    if ((timePressed - lastTimePressed) > 5*1000) {
      keylog = '';
    }
    lastTimePressed = timePressed;

    keylog += event.key;

    // Check for commands to change a hierarchy level's verbosity setting
    // for (const hierarchyLevel of HierarchyLevel) {
    for (const hierarchyLevel of ['facet', 'axis', 'section', 'datapoint']) {
      const low = hierarchyLevel.slice(0, 1) + 'low';
      const high = hierarchyLevel.slice(0, 1) + 'high';
      if (keylog.slice(keylog.length - low.length) === low) {
        console.log('l')
        const dropdown = document.getElementById(hierarchyLevel + '-verbosity') as HTMLSelectElement;
        dropdown.value = 'low';
        updateVerbosityDescription(dropdown, tree)
        // TODO may need to set focus
        keylog = '';
        return;
      } else if (keylog.slice(keylog.length - high.length) === high) {
        console.log('h')
        const dropdown = document.getElementById(hierarchyLevel + '-verbosity') as HTMLSelectElement;
        dropdown.value = 'high';
        updateVerbosityDescription(dropdown, tree)
        // TODO may need to set focus
        keylog = '';
        return;
      }
    }

    // Check for commands to generate an individual description token
    for (const token of ["name", "index", "type", "children", "data", "size", "parent", "aggregate"]) {
      if (keylog.slice(keylog.length - token.length) === token) {
        console.log('t')
        const currentNode = document.activeElement! as HTMLElement;
        console.log('curnode is', currentNode);
        const treeNode: AccessibilityTreeNode = htmlNodeToTree(currentNode, tree);
        if (treeNode.description.has(token as TokenType)) {
          // TODO how to speak??
          console.log("I would have spoken", treeNode.description.get(token as TokenType))
        }
        keylog = '';
        return;
      }
    }

    function htmlNodeToTree(node: HTMLElement, tree: AccessibilityTree) {
      let cur = tree.root;
      const path = node.id.split('-').slice(2).map(x => Number(x));
      for (const idx of path) {
        cur = cur.children[idx];
      }
      return cur;
    }
  })
}