import { AccessibilityTree, AccessibilityTreeNode, TokenType, HierarchyLevel, nodeTypeToHierarchyLevel, hierarchyLevelToTokens } from "../Structure/Types";
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


  // checkbox.addEventListener('change', (event) => {
  //   const newUl = renderTree(tree);
  //   const t = new Tree(newUl);
  //   t.init();

  //   document.getElementById("0")?.replaceWith(newUl);
  //   // TODO this resets focus, probably should do something about that
  // });

  Object.keys(settingsData).forEach(control => {
    root.appendChild(makeIndivVerbosityMenu(control as Exclude<HierarchyLevel, 'root'>, tree));

    const cMenu = makeIndivCustomMenu(control as Exclude<HierarchyLevel, 'root'>, tree);
    cMenu.setAttribute('style', 'display: none');
    cMenu.setAttribute('aria-hidden', 'true');
    root.appendChild(cMenu);
    
  });

  return root;
}

function makeIndivVerbosityMenu(control: Exclude<HierarchyLevel, 'root'>, tree: AccessibilityTree) {
  const options: {[k: string]: TokenType[]} = settingsData[control];

  const dropdown = document.createElement('select');
  dropdown.id = `${control}-verbosity`
  dropdown.addEventListener('change', (event) => {
    updateVerbosityDescription(dropdown, tree);
  });

  for (let option of Object.keys(options)) {
    let opt = document.createElement('option');
    opt.innerText = option;
    opt.value = option;
    dropdown.appendChild(opt);
  }
  const custom = document.createElement('option');
  custom.innerText = 'custom';
  custom.value = 'custom';
  dropdown.appendChild(custom);

  const label = document.createElement('label');
  label.setAttribute('for', `${control}-verbosity`);
  label.innerText = capitalizeFirst(`${control} verbosity:`);

  const info = document.createElement('span');
  info.setAttribute('tabindex', '0')
  info.innerText = `Description: ${options[Object.keys(options)[0]].join(', ')}`;

  const container = document.createElement('div');
  container.id = `${control}-verbosity-container`;
  container.appendChild(label);
  container.appendChild(dropdown);
  container.append(info);

  return container;
}

function updateVerbosityDescription(dropdown: HTMLSelectElement, tree: AccessibilityTree) {
  const control = dropdown.id.split('-')[0] as Exclude<HierarchyLevel, 'root'>;
  const customMenu = document.getElementById(`${control}-custom`);
  const descriptionText = dropdown.nextElementSibling as HTMLElement;

  if (customMenu === null || descriptionText === null) {
    return; // TODO
  }

  if (dropdown.value === 'custom') {
    // Open the customization menu
    customMenu.setAttribute('style', 'display: block');
    customMenu.setAttribute('aria-hidden', 'false');
    descriptionText.innerText = "Create a custom preset using the preset menu (next element)."
  } else {
    // Close custom menu (if it was open)
    customMenu.setAttribute('style', 'display: none');
    customMenu.setAttribute('aria-hidden', 'true');

    // Update the current description based on the new setting
    descriptionText.innerText =
      `Description: ${settingsData[control][dropdown.value].join(', ')}`;
    
    // TODO this is a hack and also screws with focus
    const newUl = renderTree(tree);
    const t = new Tree(newUl);
    t.init();
    document.getElementById('tree-root')!.replaceWith(newUl);
  }
}

function makeIndivCustomMenu(control: Exclude<HierarchyLevel, 'root'>, tree: AccessibilityTree) {
  const tokens = hierarchyLevelToTokens[control];
  const container = document.createElement('div');
  container.id = `${control}-custom`;

  const checkboxContainer = document.createElement('div');
  checkboxContainer.id = `${control}-custom-options`;

  for (let token of tokens) {
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.id = `${control}-${token}`;

    const label = document.createElement('label');
    label.setAttribute('for', `${control}-${token}`);
    label.innerText = tokenDescs[token];

    const div = document.createElement('div');
    div.appendChild(input);
    div.appendChild(label);
    checkboxContainer.append(div);
  }

  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.id = `${control}-custom-name`;

  const nameLabel = document.createElement('label');
  nameLabel.setAttribute('for', `${control}-custom-name`);
  nameLabel.innerText = 'Custom preset name';

  const saveButton = document.createElement('button');
  saveButton.innerText = 'Save';
  saveButton.addEventListener('click', (event) => {
    savePreset(control, tree);
  });

  container.append(checkboxContainer);
  container.appendChild(nameLabel);
  container.appendChild(nameInput);
  container.appendChild(saveButton);
  return container;
}

function savePreset(control: Exclude<HierarchyLevel, 'root'>, tree: AccessibilityTree) {
  const customMenu = document.getElementById(`${control}-custom`);
  if (customMenu === null) {
    return; // TODO
  }
  customMenu.setAttribute('style', 'display: none');
  customMenu.setAttribute('aria-hidden', 'true');
  
  const presetName = (document.getElementById(`${control}-custom-name`)! as HTMLInputElement).value;
  settingsData[control][presetName] = getCurrentlyChecked(control);
  updateVerbosityDropdown(control); // TODO

  const dropdown = document.getElementById(`${control}-verbosity`)! as HTMLSelectElement;
  dropdown.value = presetName;
  updateVerbosityDescription(dropdown, tree);
  dropdown.focus();
  dropdown.setAttribute('aria-active', 'true');

  function getCurrentlyChecked(control: string) {
    const tokens: TokenType[] = []
    for (let tokenOption of document.getElementById(`${control}-custom-options`)!.children) {
      const checkbox = tokenOption!.firstElementChild! as HTMLInputElement;
      if (checkbox.checked) {  // checkbox
        tokens.push(checkbox.id.split('-')[1] as TokenType);
      }
    }
    return tokens;
  }

  function updateVerbosityDropdown(control: string) {
    const oldMenu = document.getElementById(`${control}-verbosity-container`);
    oldMenu!.replaceWith(makeIndivVerbosityMenu(control as Exclude<HierarchyLevel, 'root'>, tree));
  }
}

/**
 * Given a node with all possible description tokens, return a formatted string
 * including only those tokens which the settings define as currently visible
 * 
 * @param node A {@link AccessibilityTreeNode} with a description map
 * @returns A formatted string description for the node
 */
export function getDescriptionWithSettings(node: AccessibilityTreeNode): string {
  const hierarchyLevel = nodeTypeToHierarchyLevel[node.type];
  let include: TokenType[];
  if (hierarchyLevel === 'root') {
    // Cannot be changed by user; use default settings
    include = hierarchyLevelToTokens[hierarchyLevel];
  } else {
    const dropdown = document.getElementById(`${hierarchyLevel}-verbosity`) as HTMLSelectElement;
    if (dropdown) {
      include = settingsData[hierarchyLevel][dropdown.value];
    } else { // Not yet initialized - use default of 'high' setting
      include = settingsData[hierarchyLevel]['high'];
    }
  }

  const description = [];
  for (const [token, desc] of node.description.entries()) {
    if (include.includes(token)) {
      description.push(desc);
    }
  }

  function formatDescTokens(description: string[]) {
    return description.map(capitalizeFirst).join('. ') + '.';
  }
  
  return formatDescTokens(description);
}

function capitalizeFirst(s: string) {
  return s.slice(0, 1).toUpperCase() + s.slice(1)
}