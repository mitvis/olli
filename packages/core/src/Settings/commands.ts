import { AccessibilityTree, AccessibilityTreeNode, tokenType, TokenType, hierarchyLevel, HierarchyLevel } from "../Structure/Types";
import { Tree } from "../Render/TreeView/Tree";
import { htmlNodeToTree } from "../Render/TreeView";
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
    hierarchyLevel.forEach((hLevel: HierarchyLevel) => {
    // for (const hierarchyLevel of ['facet', 'axis', 'section', 'datapoint']) {
      const low = hLevel.slice(0, 1) + 'low';
      const high = hLevel.slice(0, 1) + 'high';
      if (keylog.slice(keylog.length - low.length) === low) {
        const dropdown = document.getElementById(hLevel + '-verbosity') as HTMLSelectElement;
        dropdown.value = 'low';
        updateVerbosityDescription(dropdown, tree)
        keylog = '';
        return;
      } else if (keylog.slice(keylog.length - high.length) === high) {
        const dropdown = document.getElementById(hLevel + '-verbosity') as HTMLSelectElement;
        dropdown.value = 'high';
        updateVerbosityDescription(dropdown, tree)
        keylog = '';
        return;
      }
    });

    // Check for commands to generate an individual description token
    // if we've started typing a token command, then don't let other keydown events interrupt it
    if (tokenType.find(token => startEndOverlap(keylog, token) > 0)) {
      console.log('stopping propagation')
      event.stopImmediatePropagation();
    }

    tokenType.forEach((token: TokenType) => {
      if (keylog.slice(keylog.length - token.length) === token) {
        const currentNode = document.activeElement! as HTMLElement;
        console.log('curnode is', currentNode);
        const treeNode: AccessibilityTreeNode = htmlNodeToTree(currentNode, tree);
        console.log('curnode desc, token', treeNode.description, token)
        if (treeNode.description.has(token as TokenType)) {
          srSpeakingHack(treeNode.description.get(token as TokenType)!);
          console.log("speaking:", treeNode.description.get(token as TokenType))
        }
        keylog = '';
        return;
      }
    });

    function startEndOverlap(endOverlaps: string, startOverlaps: string): number {
      console.log("checking overlaps for", endOverlaps, startOverlaps);
      let overlapLen = Math.min(startOverlaps.length, endOverlaps.length);
      while (overlapLen > 0) {
        if (startOverlaps.slice(0, overlapLen) === endOverlaps.slice(-overlapLen)) {
          break;
        }
        overlapLen -= 1;
      }
      return overlapLen;
    }

    function srSpeakingHack(text: string) {
      const elt = document.createElement('div');
      elt.setAttribute('aria-live', 'assertive');
      document.body.appendChild(elt);
      
      window.setTimeout(function () {
        elt.innerText = text;
      }, 100);

      window.setTimeout(function () {
        
        elt.remove();
      }, 1000);
    }
  })
}