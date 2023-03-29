// Adapted from: https://w3c.github.io/aria-practices/examples/treeview/treeview-1/treeview-1b.html

import { AccessibilityTree, AccessibilityTreeNode, tokenLength } from "../../Structure/Types";
import { getDescriptionWithSettings, getSettingsInfoForTable } from "../../Settings"
import { fmtValue } from "../../utils";
import "./TreeStyle.css";

/**
 *
 * @param node A {@link AccessibilityTreeNode} to generate a navigable tree view from
 * @returns An {@link HTMLElement} ARIA TreeView of the navigable tree view for a visualization
 */
 export function renderTree(tree: AccessibilityTree): HTMLElement {
  const namespace = (Math.random() + 1).toString(36).substring(7);

  const node = tree.root;

  const root = document.createElement('ul');
  const labelId = `${namespace}-${node.type}-label`;

  root.setAttribute('role', 'tree');
  root.setAttribute('aria-labelledby', labelId);
  root.setAttribute('id', 'tree-root');

  // const childContainer = document.createElement('ul');
  // childContainer.setAttribute('role', 'group');

  // childContainer.appendChild(_renderTree(node, namespace, 1, 1, 1));

  // root.appendChild(childContainer);

  // childContainer.querySelector('span')?.setAttribute('id', labelId);

  root.appendChild(_renderTree(node, namespace, 1, 1, 1, "root"));
  root.querySelector('span')?.setAttribute('id', labelId);

  return root;

  function _renderTree(node: AccessibilityTreeNode, namespace: string, level: number, posinset: number, setsize: number, idPrefix: string): HTMLElement {
    const item = document.createElement('li');
    const id = idPrefix + '-' + (posinset - 1);
    item.setAttribute('role', 'treeitem');
    item.setAttribute('aria-level', String(level));
    item.setAttribute('aria-setsize', String(setsize));
    item.setAttribute('aria-posinset', String(posinset));
    item.setAttribute('aria-expanded', 'false');
    item.setAttribute('data-nodetype', node.type);
    item.setAttribute('id', id);
    if (node.gridIndex) {
      item.setAttribute('data-i', String(node.gridIndex.i));
      item.setAttribute('data-j', String(node.gridIndex.j));
    }
    if (node.filterValue) {
      item.setAttribute('data-filterValue', JSON.stringify(node.filterValue));
    }

    const label = document.createElement('span');
    label.textContent = getDescriptionWithSettings(node);
    item.appendChild(label);

    if (node.children.length) {

      const dataChildren = node.children.filter(n => n.type === 'data');
      const treeChildren = node.children.filter(n => n.type !== 'data');

      const childContainer = document.createElement('ul');
      childContainer.setAttribute('role', 'group');

      if (dataChildren.length) {
        childContainer.appendChild(createDataTable(dataChildren, level + 1));
      }
      else {
        treeChildren.forEach((n, index, array) => {
          childContainer.appendChild(_renderTree(n, namespace, level + 1, index + 1, array.length, id));
        })
      }
      item.appendChild(childContainer);

    }

    return item;
  }
}

/**
 *
 * @param tree The {@link AccessibilityTreeNode} whose description is being re-rendered
 * @param ul The {@link HTMLElement} corresponding to the tree root
 */
export function rerenderTreeDescription(tree: AccessibilityTree, ul: HTMLElement){
  // Tree structure is:
  // ul -> li[] | table
  // li -> [span, ul] | span
  // span, table have no children

  if (ul.children.length) {
    for (const li of ul.children) {
      if (li.nodeName === 'TABLE') {
        const parentLi = ul.parentElement!; // the parent li stores the relevant ID
        const tableData = htmlNodeToTree(parentLi, tree).children.filter(n => n.type === 'data');
        li.replaceWith(createDataTable(tableData, parentLi.id.split('-').length))
      } else {
        const label = li.firstElementChild! as HTMLElement;
        label.innerText = getDescriptionWithSettings(htmlNodeToTree(li as HTMLElement, tree));
        if (li.children[1]) {
          rerenderTreeDescription(tree, li.children[1] as HTMLElement);
        }
      }
    }
  }
}

/**
 *
 * @param node The {@link HTMLElement} to find in the tree
 * @param tree The {@link AccessibilityTree} to look for the node in
 * @returns An {@link AccessibilityTreeNode} matching the HTML node input
 */
export function htmlNodeToTree(node: HTMLElement, tree: AccessibilityTree): AccessibilityTreeNode {
  let cur = tree.root;
  const path = node.id.split('-').slice(2).map(x => Number(x));
  for (const idx of path) {
    cur = cur.children[idx];
  }
  return cur;
}

function createDataTable(dataNodes: AccessibilityTreeNode[], level: number) {
  // Figure out which keys to include
  const ordering = getSettingsInfoForTable();
  const tableKeys: string[] = [];
  const tableKeysMap: string[] = [];

  dataNodes[0].tableKeys!.forEach((name: string, idx: number) => {
      const key = dataNodes[0].tableKeysMap![idx];
      const include = ordering[key];
      if (include < 0) return;
      // extra check for quantile since sometimes settings turn it on, but it is not generated (e.g. wrong axis)
      if (key == 'quantile' && !(dataNodes[0].description.get('quantile')![0])) return;

      tableKeys.push(name);
      tableKeysMap.push(key);
  })

  // Reorder keys according to their indices (values of `ordering`)
  const orderedTableKeys: string[] = []
  const orderedTableKeysMap: string[] = []

  for (let [token, _] of Object.entries(ordering).sort((a, b) => a[1] - b[1])) {
    const origIdx = tableKeysMap.indexOf(token);
    if (origIdx < 0) continue;

    orderedTableKeysMap.push(token);
    orderedTableKeys.push(tableKeys[origIdx]);
    if (token === 'data') { // appears twice in a row
      orderedTableKeysMap.push(token);
      orderedTableKeys.push(tableKeys[origIdx + 1]);
    }
  }

  // Create HTML table
  // Container + header
  const table = document.createElement("table");
  table.setAttribute('aria-label', `Table with ${dataNodes.length} rows`);
  table.setAttribute('aria-level', String(level));
  table.setAttribute('aria-posinset', '1');
  table.setAttribute('aria-setsize', '1');

  const tableBody = document.createElement("tbody");
  const thead = document.createElement("thead");
  const theadtr = document.createElement("tr");
  theadtr.setAttribute('aria-label', `${orderedTableKeys?.join(', ')}`);

  orderedTableKeys?.forEach((key: string) => {
    const th = document.createElement("th");
    th.setAttribute('scope', 'col');
    th.innerText = key;
    th.setAttribute('aria-label', key);
    theadtr.appendChild(th);
  });

  thead.appendChild(theadtr);
  table.appendChild(thead);

  // Individual rows
  dataNodes.forEach((node, _) => {
    const dataRow = document.createElement("tr")
    dataRow.setAttribute('aria-label', `${orderedTableKeys?.map((key, idx) => `${key}: ${orderedTableKeysMap[idx] === 'quantile' ? node.description.get('quantile')![0] : fmtValue(node.selected[0][key])}`).join(', ')}`);
    orderedTableKeys?.forEach((key: string, idx: number) => {
      let value;

      if (orderedTableKeysMap[idx] === 'quantile') {
        value = node.description.get('quantile')![0];
      } else {
        value = fmtValue(node.selected[0][key]);
      }

      const td = document.createElement("td")
      td.innerText = value;
      td.setAttribute('aria-label', value);
      dataRow.appendChild(td);
    })
    tableBody.appendChild(dataRow);
  });

  table.appendChild(tableBody);
  return table;
}