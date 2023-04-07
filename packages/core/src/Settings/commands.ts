import { AccessibilityTree, AccessibilityTreeNode, tokenType, TokenType, tokenLength, hierarchyLevel, HierarchyLevel, nodeTypeToHierarchyLevel } from "../Structure/Types";
import { Tree } from "../Render/TreeView/Tree";
import { htmlNodeToTree, rerenderTreeDescription } from "../Render/TreeView";
import { getDescriptionWithSettings, updateVerbosityDescription, getCurrentCustom, prettifyTokenTuples, focusTokens } from "./index";
import { nodeIsTextInput } from "../utils";

export const log: {[k: string]: string}[] = [];

export function addMenuCommands(menu: HTMLElement, t: Tree) {
  menu.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      // "Close" menu by hiding it and moving focus back to the user's previous position in the tree
      const menu = document.getElementById('settings')!;
      menu.setAttribute('style', 'display: none');
      menu.setAttribute('aria-hidden', 'true');
      t.setFocusToItem(t.lastFocusedItem);

      log.push({'action': 'close', 'target': 'settings'});

    } else if (event.altKey && event.key === 'ArrowLeft') {
      // Reorder custom preset items
      const thisItem = document.activeElement as HTMLSelectElement;

      if (thisItem && thisItem.nodeName === "SELECT") {
        const thisDiv = thisItem.parentNode! as HTMLElement;
        const previousDiv = thisDiv.previousElementSibling;
        if (previousDiv != null) {
          // Change menu ordering
          // Note: don't want to call insertBefore(thisDiv, previousDiv)
          // because first parameter to insertBefore loses focus
          thisDiv.insertAdjacentElement('afterend', previousDiv);
          thisItem.focus();
          thisItem.setAttribute('aria-active', 'true');

          const hierarchyLevel = thisItem.id.split('-')[0];
          srSpeakingHack(prettifyTokenTuples(getCurrentCustom(hierarchyLevel)));
        }
      }
    } else if (event.altKey && event.key === 'ArrowRight') {
      const thisItem = document.activeElement as HTMLSelectElement;
      if (thisItem && thisItem.nodeName === "SELECT") {
        const thisDiv = thisItem.parentNode! as HTMLElement;
        const nextDiv = thisDiv.nextElementSibling;
        if (nextDiv != null) {
          thisDiv.parentNode!.insertBefore(nextDiv, thisDiv);

          const hierarchyLevel = thisItem.id.split('-')[0];
          srSpeakingHack(prettifyTokenTuples(getCurrentCustom(hierarchyLevel)));
        }
      }
    }
  });

  // Keep settings menu a closed environment by blocking tab-forward at end and tab-back at beginning
  const first = menu.querySelector(':enabled')! as HTMLElement;
  const last = [...menu.querySelectorAll('select:enabled')].filter(x => !(x.parentElement as any).closest('#settings > div[aria-hidden="true"]')).reverse()[0]! as HTMLElement;
  first.addEventListener('keydown', (event) => {
    if (event.key === "Tab" && event.shiftKey || event.key === 'ArrowUp') {
      event.preventDefault();
    }
  });

  last.addEventListener('keydown', (event) => {
    if (event.key === "Tab" && !event.shiftKey || event.key === 'ArrowDown') {
      event.preventDefault();
    }
  });
}

export function addTreeCommands(treeElt: HTMLElement, tree: AccessibilityTree, t: Tree) {
  treeElt.addEventListener('keydown', (event) => {
    if (!nodeIsTextInput(document.activeElement)) {
      if (event.key === 'm') {
        // "Open" menu by making it visible and moving focus there
        const menu = document.getElementById('settings')!;
        const legend = menu.firstElementChild! as HTMLElement;
        menu.setAttribute('style', 'display: block');
        menu.setAttribute('aria-hidden', 'false');
        setTimeout(() => {
          (menu.querySelector(':enabled') as any)?.focus();
        }, 0);

        log.push({'action': 'open', 'target': 'settings'});
      }

      if (event.key === 'i') {
        // "Open" command dropdown by making it visible and moving focus there
        const dropdown = document.getElementById('command-dropdown-container')!;
        dropdown.setAttribute('style', 'display: block');
        dropdown.setAttribute('aria-hidden', 'false');
        setTimeout(() => {
          (dropdown.firstElementChild! as HTMLElement).focus();
          dropdown.setAttribute('aria-selected', 'true');
        }, 0);

        log.push({'action': 'open', 'target': 'commands'});
      }
    }
  })
}

export function addCommandsBoxCommands(commandsBox: HTMLElement, tree: AccessibilityTree, t: Tree) {
  const dropdown = commandsBox.children[1] as HTMLSelectElement;

  commandsBox.addEventListener("change", () => {
    srSpeakingHack(dropdown.selectedOptions[0].text);
  });

  commandsBox.addEventListener('keydown', (event) => {
    const settingsData: { [k in Exclude<HierarchyLevel, 'root'>]: {[k: string]: [TokenType, tokenLength][]}} = JSON.parse(localStorage.getItem('settingsData')!);

    if (event.key === 'Enter') {
      const command = dropdown.selectedOptions[0].value;
      log.push({'action': 'dropdown', 'target': 'commands', 'value': command});

      for (const token of tokenType) {
        if (command === token) {
          // Read out the token for the current node in the tree
          const currentNode = t.lastFocusedItem.domNode;
          const treeNode: AccessibilityTreeNode = htmlNodeToTree(currentNode, tree);
          if (treeNode.description.has(command as TokenType)) {
            const hLevel = nodeTypeToHierarchyLevel[treeNode.type] as HierarchyLevel;
            if (hLevel === 'root') {
              srSpeakingHack(treeNode.description.get(command as TokenType)![1]);
            } else {
              const verbosity = (document.getElementById(`${hLevel}-verbosity`) as HTMLSelectElement).value;
              const length = settingsData[hLevel][verbosity].find(x => x[0] === command)![1];
              srSpeakingHack(treeNode.description.get(command as TokenType)![length]);
            }
          } else {
            srSpeakingHack(`No ${token} available`);
          }
        } else if (command === 'focus-' + token) {
          // 'Focus' the token by bringing it to the front
          focusTokens.unshift(token);
          rerenderTreeDescription(tree, document.getElementById('tree-root')!);
        }
      }
      if (command === 'clear') { // Clear all focus
        focusTokens.splice(0, focusTokens.length);
        rerenderTreeDescription(tree, document.getElementById('tree-root')!);
      }

      // Change one hierarchy level's verbosity
      hierarchyLevel.forEach((hLevel: HierarchyLevel) => {
        if (hLevel === 'root') { return; }
        const dropdown = document.getElementById(hLevel + '-verbosity') as HTMLSelectElement;
        const settingLevels = Object.keys(settingsData[hLevel as Exclude<HierarchyLevel, 'root'>]);

        for (const sLevel of settingLevels) {
          if (command === hLevel + '-' + sLevel) {
            dropdown.value = sLevel;
            updateVerbosityDescription(dropdown, tree);
            srSpeakingHack(`${dropdown.id.split("-")[0]} verbosity set to ${dropdown.value}`);
            return;
          }
        }
      });

      for (let length of Object.values(tokenLength)) {
        if (typeof length !== 'string') continue;
        const num = Number(Object.values(tokenLength).find(v => typeof v === 'number' && tokenLength[v] === length));
        const enumLength = tokenLength[num];
        if (command === length) {
          const currentNode = t.lastFocusedItem.domNode;
          const treeNode: AccessibilityTreeNode = htmlNodeToTree(currentNode, tree);
          srSpeakingHack(getDescriptionWithSettings(treeNode, enumLength));
        }
      }
    }

    // Close menu and return to previous position in tree
    if (event.key === 'Enter' || event.key === 'Escape') {
      commandsBox.setAttribute('style', 'display: none');
      commandsBox.setAttribute('aria-hidden', 'true');
      t.setFocusToItem(t.lastFocusedItem);
      log.push({'action': 'close', 'target': 'commands'});
    }

    // Closed environment, can't tab out
    if (event.key === "Tab") {
        event.preventDefault();
    }
});
}

export function srSpeakingHack(text: string) {
  console.log('speaking:', text);
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