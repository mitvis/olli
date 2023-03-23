import { AccessibilityTree, AccessibilityTreeNode, TokenType, tokenType, tokenLength, HierarchyLevel, hierarchyLevel, nodeTypeToHierarchyLevel, hierarchyLevelToTokens } from "../Structure/Types";
import { renderTree, rerenderTreeDescription } from "../Render/TreeView"
import { Tree } from "../Render/TreeView/Tree"
import { tokenDescs, defaultSettingsData } from "./data"
import { srSpeakingHack } from "./commands"

/**
 * Constructs the settings menu from the settings objects above
 * @param node The {@link AccessibilityTreeNode} being displayed
 * @returns An {@link HTMLElement} with the settings menu
 */
export function renderMenu(tree: AccessibilityTree): HTMLElement {
  // Get saved menu settings if they exist, otherwise save the default settings
  const storedData = localStorage.getItem('settingsData');
  let settingsData: { [k in Exclude<HierarchyLevel, 'root'>]: {[k: string]: [TokenType, tokenLength][]}};
  if (storedData) {
    settingsData = JSON.parse(storedData);
  } else {
    settingsData = defaultSettingsData;
    localStorage.setItem('settingsData', JSON.stringify(defaultSettingsData));
  }

  // Make the menu container
  const root = document.createElement("fieldset");
  root.setAttribute("id", "settings");

  const legend = document.createElement("legend");
  legend.setAttribute("tabindex", "0");
  legend.innerText = "Settings Menu";
  root.appendChild(legend);

  const close = document.createElement("button");
  close.addEventListener("click", (event) => {
    root.dispatchEvent(new KeyboardEvent('keydown', {'key': 'Escape'}));
  });
  close.innerText = "Close";
  root.appendChild(close);

  // Make individual menus for each hierarchy level
  Object.keys(settingsData).forEach(hierarchyLevel => {
    // Verbosity options (high, low, custom)
    root.appendChild(makeIndivVerbosityMenu(hierarchyLevel as Exclude<HierarchyLevel, 'root'>, tree));

    // Menu to add custom preset - hidden until 'custom' option is selected
    const cMenu = makeIndivCustomMenu(hierarchyLevel as Exclude<HierarchyLevel, 'root'>, tree);
    cMenu.setAttribute('style', 'display: none');
    cMenu.setAttribute('aria-hidden', 'true');
    root.appendChild(cMenu);
    
  });

  const text = document.createElement('p');
  text.innerText = 'Press escape to close the menu. Press ctrl-m to open it.';
  text.setAttribute('tabindex', '0');
  root.appendChild(text);

  return root;
}

export function renderCommandsMenu() {
  const dropdown = document.createElement('select');
  dropdown.setAttribute('id', 'command-dropdown');

  function createOption(text: string, value: string, container: HTMLElement) {
    let option = document.createElement('option');
    option.innerText = text;
    option.value = value;
    container.appendChild(option);
  }

  // Speak token
  for (const token of tokenType) {
    createOption(token, token, dropdown);
  }

  // 'Focus' token by bringing up to front
  for (const token of tokenType) {
    createOption('focus ' + token, 'focus-' + token, dropdown);
  }
  createOption('clear', 'clear', dropdown);

  // Read current node with different length settings
  for (const length of Object.values(tokenLength)) {
    if (typeof length !== 'string') continue; // values lists both string and numbers
    createOption(length, length, dropdown);
  }

  // Change one hierarchy level's verbosity
  for (const hLevel of hierarchyLevel) {
    if (hLevel === 'root') continue;
    const settingsData: { [k in Exclude<HierarchyLevel, 'root'>]: {[k: string]: [TokenType, tokenLength][]}} = JSON.parse(localStorage.getItem('settingsData')!);
    for (const level of Object.keys(settingsData[(hLevel as Exclude<HierarchyLevel, 'root'>)])) {
     createOption(hLevel.slice(0,1) + level, hLevel + '-' + level, dropdown);
    }
  }

  const label = document.createElement('label');
  label.setAttribute('for', 'command-dropdown');
  label.innerText = 'Choose command';

  const container = document.createElement('div');
  container.setAttribute('id', 'command-dropdown-container')
  container.appendChild(label);
  container.appendChild(dropdown);

  return container;
}

function makeIndivVerbosityMenu(hierarchyLevel: Exclude<HierarchyLevel, 'root'>, tree: AccessibilityTree) {
  const settingsData: { [k in Exclude<HierarchyLevel, 'root'>]: {[k: string]: [TokenType, tokenLength][]}} = JSON.parse(localStorage.getItem('settingsData')!);
  const options: {[k: string]: [TokenType, tokenLength][]} = settingsData[hierarchyLevel];

  // Make the dropdown container
  const dropdown = document.createElement('select');
  dropdown.id = `${hierarchyLevel}-verbosity`
  dropdown.addEventListener('change', (event) => {
    updateVerbosityDescription(dropdown, tree);
  });

  const label = document.createElement('label');
  label.setAttribute('for', `${hierarchyLevel}-verbosity`);
  label.innerText = capitalizeFirst(`${hierarchyLevel} verbosity:`);

  const info = document.createElement('span');
  info.setAttribute('tabindex', '0');
  info.innerText = 'Description: ' + prettifyTokenTuples(options[Object.keys(options)[0]]);

  // Add all preset options, plus 'custom' to make a new preset
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

  dropdown.addEventListener('change', (event) => {
    if (dropdown.value !== 'custom') {
      srSpeakingHack(`${dropdown.id.split("-")[0]} verbosity set to ${dropdown.value}`);
    } else {
      srSpeakingHack('Custom menu open')
    }
  })

  const container = document.createElement('div');
  container.id = `${hierarchyLevel}-verbosity-container`;
  container.appendChild(label);
  container.appendChild(dropdown);
  container.append(info);

  return container;
}

export function updateVerbosityDescription(dropdown: HTMLSelectElement, tree: AccessibilityTree) {
  const settingsData: { [k in Exclude<HierarchyLevel, 'root'>]: {[k: string]: [TokenType, tokenLength][]}} = JSON.parse(localStorage.getItem('settingsData')!);
  const hierarchyLevel = dropdown.id.split('-')[0] as Exclude<HierarchyLevel, 'root'>;
  const customMenu = document.getElementById(`${hierarchyLevel}-custom`)!;
  const descriptionText = dropdown.nextElementSibling! as HTMLElement;

  if (dropdown.value === 'custom') {
    // Open the customization menu
    customMenu.setAttribute('style', 'display: block');
    customMenu.setAttribute('aria-hidden', 'false');
    descriptionText.innerText = "Create a custom preset using the preset menu. Set verbosity for each element; use alt/option-left and alt/option-right to reorder elements."
  } else {
    // Close custom menu (if it was open)
    customMenu.setAttribute('style', 'display: none');
    customMenu.setAttribute('aria-hidden', 'true');

    // Updates based on the new setting:
    // description tokens listed in the menu
    descriptionText.innerText = 'Description: ' + prettifyTokenTuples(settingsData[hierarchyLevel][dropdown.value]);
    // node description in the tree
    rerenderTreeDescription(tree, document.getElementById('tree-root')!);
  }
}

function makeIndivCustomMenu(hierarchyLevel: Exclude<HierarchyLevel, 'root'>, tree: AccessibilityTree) {
  const tokens = hierarchyLevelToTokens[hierarchyLevel];

  // Create overall container, plus one just for length dropdowns
  const container = document.createElement('div');
  container.id = `${hierarchyLevel}-custom`;

  const checkboxContainer = document.createElement('div');
  checkboxContainer.id = `${hierarchyLevel}-custom-options`;

  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.id = `${hierarchyLevel}-custom-name`;

  const nameLabel = document.createElement('label');
  nameLabel.setAttribute('for', `${hierarchyLevel}-custom-name`);
  nameLabel.innerText = 'Custom preset name';

  // Create individual dropdowns
  for (let token of tokens) {
    const dropdown = document.createElement('select');
    dropdown.id = `${hierarchyLevel}-${token}`;

    for (const option of ['off', 'short', 'long']) {
      let opt = document.createElement('option');
      opt.innerText = option;
      opt.value = option;
      dropdown.appendChild(opt);
    }
    
    const label = document.createElement('label');
    label.setAttribute('for', `${hierarchyLevel}-${token}`);
    label.innerText = tokenDescs[token];

    const div = document.createElement('div');
    div.appendChild(dropdown);
    div.appendChild(label);
    checkboxContainer.append(div);
  }

  const saveButton = document.createElement('button');
  saveButton.innerText = 'Save';
  saveButton.addEventListener('click', (event) => {
    savePreset(hierarchyLevel, tree);
  });

  container.append(checkboxContainer);
  container.appendChild(nameLabel);
  container.appendChild(nameInput);
  container.appendChild(saveButton);
  return container;
}

function savePreset(hierarchyLevel: Exclude<HierarchyLevel, 'root'>, tree: AccessibilityTree) {
  const customMenu = document.getElementById(`${hierarchyLevel}-custom`)!;

  // Close the custom menu since user is done with it
  customMenu.setAttribute('style', 'display: none');
  customMenu.setAttribute('aria-hidden', 'true');
  
  // Store the new preset in settingsData
  const settingsData: { [k in Exclude<HierarchyLevel, 'root'>]: {[k: string]: [TokenType, tokenLength][]}} = JSON.parse(localStorage.getItem('settingsData')!);
  const presetName = (document.getElementById(`${hierarchyLevel}-custom-name`)! as HTMLInputElement).value;
  settingsData[hierarchyLevel][presetName] = getCurrentCustom(hierarchyLevel);
  localStorage.setItem('settingsData', JSON.stringify(settingsData));
  updateVerbosityDropdown(hierarchyLevel);
  
  // Set the dropdown to this preset and update the description accordingly 
  // (acting as though user had selected their new preset from the dropdown menu)
  const dropdown = document.getElementById(`${hierarchyLevel}-verbosity`)! as HTMLSelectElement;
  dropdown.value = presetName;
  updateVerbosityDescription(dropdown, tree);
  dropdown.focus();
  dropdown.setAttribute('aria-active', 'true');

  function updateVerbosityDropdown(hierarchyLevel: string) {
    const settingsData: { [k in Exclude<HierarchyLevel, 'root'>]: {[k: string]: [TokenType, tokenLength][]}} = JSON.parse(localStorage.getItem('settingsData')!);
    const oldMenu = document.getElementById(`${hierarchyLevel}-verbosity-container`);
    oldMenu!.replaceWith(makeIndivVerbosityMenu(hierarchyLevel as Exclude<HierarchyLevel, 'root'>, tree));
  }

  // add to the command prompt
  const commands = document.getElementById('command-dropdown')!;
  let option = document.createElement('option');
  option.innerText = presetName;
  option.value = presetName;
  commands.appendChild(option);
}

export function getCurrentCustom(hierarchyLevel: string) {
  const tokens: [TokenType, tokenLength][] = []
  for (let tokenOption of document.getElementById(`${hierarchyLevel}-custom-options`)!.children) {
    const dropdown = tokenOption!.firstElementChild! as HTMLInputElement;
    if (dropdown.value === 'long') {
      tokens.push([dropdown.id.split('-')[1] as TokenType, tokenLength.Long]);
    } else if (dropdown.value === 'short') {
      tokens.push([dropdown.id.split('-')[1] as TokenType, tokenLength.Short]);
    } // otherwise it's 'off', so don't push
  }
  return tokens;
}

export const focusTokens = Object.fromEntries(tokenType.map(token => [token, false]));

/**
 * Given a node with all possible description tokens, return a formatted string
 * including only those tokens which the settings define as currently visible
 * 
 * @param node A {@link AccessibilityTreeNode} with a description map
 * @returns A formatted string description for the node
 */
export function getDescriptionWithSettings(node: AccessibilityTreeNode, lengthFlag: string|undefined = undefined): string {
  const hierarchyLevel = nodeTypeToHierarchyLevel[node.type];
  let includeOrder: TokenType[];
  let tokenLengths: {[k in string]: tokenLength} = {}; // TODO string is actually TokenType but gave up on typing
  const settingsData: { [k in Exclude<HierarchyLevel, 'root'>]: {[k: string]: [TokenType, tokenLength][]}} = JSON.parse(localStorage.getItem('settingsData')!);

  if (hierarchyLevel === 'root') {
    // Cannot be changed by user; use default settings
    includeOrder = hierarchyLevelToTokens[hierarchyLevel];
    tokenLengths = Object.fromEntries(includeOrder.map(token => [token as TokenType, tokenLength.Long]));
  } else {
    const dropdown = document.getElementById(`${hierarchyLevel}-verbosity`) as HTMLSelectElement;
    const value = dropdown ? dropdown.value : 'high'; // If not yet initialized, use default of 'high' setting
    includeOrder = settingsData[hierarchyLevel][value].map(x => x[0]);
    tokenLengths = Object.fromEntries(settingsData[hierarchyLevel][value]);
  }

  const description = [];
  for (const [token, desc] of node.description.entries()) {
    if (includeOrder.includes(token) || focusTokens[token]) {
      let length = 0; // default to short if no info
      if (lengthFlag) {
        // lengthFlag is a string from tokenLength enum; convert to its corresponding number
        length = Number(Object.values(tokenLength).find(v => typeof v === 'number' && tokenLength[v] === lengthFlag))
      } else if (tokenLengths[token]) {
        length = tokenLengths[token];
      }

      if (focusTokens[token]) { // put it up front
        description.unshift(desc[length]);
      } else { // use original order
        description[includeOrder.indexOf(token)] = desc[length];
      }
    }
  }

  function formatDescTokens(description: string[]) {
    return description.filter(x => x.length > 0).map(capitalizeFirst).join('. ') + '.';
  }
  
  return formatDescTokens(description);
}

export function getSettingsInfoForTable() {
  const settingsData: { [k in Exclude<HierarchyLevel, 'root'>]: {[k: string]: [TokenType, tokenLength][]}} = JSON.parse(localStorage.getItem('settingsData')!);
  const dropdown = document.getElementById(`datapoint-verbosity`) as HTMLSelectElement;
  const value = dropdown ? dropdown.value : 'high'; // If not yet initialized, use default of 'high' setting
  const includeOrder = settingsData['datapoint'][value].map(x => x[0]);

  const allTokens = settingsData['datapoint']['high'].map(x => x[0]);

  const settingOrders: {[k: string]: number} = {}
  for (let token of allTokens) {
    settingOrders[token] = includeOrder.indexOf(token);
  }
  return settingOrders;
}

function capitalizeFirst(s: string) {
  return s.slice(0, 1).toUpperCase() + s.slice(1)
}

export function prettifyTokenTuples(tups: [TokenType, tokenLength][]) {
  let result = '';
  for (const [option, length] of tups) {
    result += `${option} (${tokenLength[length]}), `
  }
 return result.slice(0, -2);
}
