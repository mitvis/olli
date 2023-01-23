import { AccessibilityTree, AccessibilityTreeNode, nodeTypeToHierarchyLevel, hierarchyLevelToTokens } from "../Structure/Types";
import { renderTree } from "../Render/TreeView"
import { Tree } from "../Render/TreeView/Tree"

const tokenDescs = {
  'index': 'Index ("1 of 5")',
  'type': 'Item type ("line", "temporal")',
  'size': 'Size ("10 values")',
  'relative': 'Quartile',
  'data': 'Data values',
  'aggregate': 'Min, max, and average',
  'parent': 'View name',
  'name': 'Item name',
  'children': 'Child names',
}

const settingsData = {
  'facet': {
    'immutable': false,
    'options': {
      'high': ['index', 'type', 'name', 'children'],
      'low': ['type', 'name', 'children'],
    }
  },
  'axis': {
    'immutable': false,
    'options': {
      'high': ['name', 'type', 'data', 'size', 'parent', 'aggregate'],
      'low': ['name', 'type', 'data'],
    }
  },
  'section': {
    'immutable': false,
    'options': {
      'high': ['data', 'index', 'size', 'parent'],
      'low': ['data', 'size'],
    }
  },
  'datapoint': {
    'immutable': false,
    'options': {
      'high': ['data', 'parent'],
      'low': ['data']
    }
  }
}

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
    document.addEventListener('keypress', (e) => {
        if (e.key === 't') {
            t.setFocusToItem(t.rootTreeItem);
        }
    })
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
 * Given a node with all possible description tokens, return those which the settings
 * define as currently visible
 * 
 * @param node A {@link AccessibilityTreeNode} with a description map
 * @returns An array of description token strings 
 */
export function getDescriptionWithSettings(node: AccessibilityTreeNode): string[] {
  const checkbox = document.getElementById('settings-checkbox') as HTMLInputElement;
  const setting = checkbox ? (checkbox.checked ? 'low' : 'high') : 'high';

  const hierarchyLevel = nodeTypeToHierarchyLevel[node.type];
  let include: string[];
  if (!(hierarchyLevel in settingsData)) {
    // Cannot be changed by user; use default settings
    include = hierarchyLevelToTokens[hierarchyLevel as keyof typeof hierarchyLevelToTokens]
  } else {
    include = settingsData[hierarchyLevel as keyof typeof settingsData]['options'][setting];
  }

  const description = [];
  for (const [token, desc] of node.description.entries()) {
    if (include.includes(token as string)) {
      description.push(desc);
    }
  }
  
  return description;
}