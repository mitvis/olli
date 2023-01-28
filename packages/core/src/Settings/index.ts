import { AccessibilityTree, AccessibilityTreeNode, TokenType, nodeTypeToHierarchyLevel, hierarchyLevelToTokens } from "../Structure/Types";
import { renderTree } from "../Render/TreeView"
import { Tree } from "../Render/TreeView/Tree"
import { tokenDescs, settingsData } from "./data"

/**
 * Constructs the settings menu from the settings objects above
 * @param node The {@link AccessibilityTreeNode} being displayed
 * @returns An {@link HTMLElement} with the settings menu
 */
export function renderMenu(tree: AccessibilityTree): HTMLElement {
  const root = document.createElement("fieldset");
  root.setAttribute("id", "settings");
  root.setAttribute("tabindex", "0");
  root.setAttribute("accesskey", "m");

  const legend = document.createElement("legend");
  legend.innerText = "Settings Menu";
  root.appendChild(legend);

  const checkbox = document.createElement("input");
  checkbox.setAttribute("type", "checkbox");
  checkbox.setAttribute("id", "settings-checkbox");

  checkbox.addEventListener('change', (event) => {
    const newUl = renderTree(tree);
    const t = new Tree(newUl);
    t.init();

    document.getElementById("0")?.replaceWith(newUl);
    // TODO this resets focus, probably should do something about that
  });

  const checkboxLabel = document.createElement("label");
  checkboxLabel.setAttribute("for", "settings-checkbox");
  checkboxLabel.innerText = "Verbosity (default high, check for low)";
  root.appendChild(checkboxLabel);
  root.appendChild(checkbox);

  return root;
}

/**
 * Given a node with all possible description tokens, return a formatted string
 * including only those tokens which the settings define as currently visible
 * 
 * @param node A {@link AccessibilityTreeNode} with a description map
 * @returns A formatted string description for the node
 */
export function getDescriptionWithSettings(node: AccessibilityTreeNode): string {
  const checkbox = document.getElementById('settings-checkbox') as HTMLInputElement;
  const setting = checkbox ? (checkbox.checked ? 'low' : 'high') : 'high';

  const hierarchyLevel = nodeTypeToHierarchyLevel[node.type];
  let include: TokenType[];
  if (hierarchyLevel === 'root') {
    // Cannot be changed by user; use default settings
    include = hierarchyLevelToTokens[hierarchyLevel]
  } else {
    include = settingsData[hierarchyLevel][setting];
  }

  const description = [];
  for (const [token, desc] of node.description.entries()) {
    if (include.includes(token)) {
      description.push(desc);
    }
  }

  function formatDescTokens(description: string[]) {
    return description.map(capitalizeFirst).join('. ') + '.';

    function capitalizeFirst(s: string) {
      return s.slice(0, 1).toUpperCase() + s.slice(1)
    }
  }
  
  return formatDescTokens(description);
}