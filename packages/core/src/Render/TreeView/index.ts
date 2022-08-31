// Adapted from: https://w3c.github.io/aria-practices/examples/treeview/treeview-navigation.html

import { AccessibilityTree, AccessibilityTreeNode } from "../../Structure/Types";
import { fmtValue } from "../../utils";
import "./TreeStyle.css";

/**
 *
 * @param node A {@link AccessibilityTreeNode} to generate a navigable tree view from
 * @returns An {@link HTMLElement} ARIA TreeView of the navigable tree view for a visualization
 */
 export function renderTree(tree: AccessibilityTree, namespace: string): HTMLElement {
  const node = tree.root;

  const root = document.createElement('ul');
  const rootLabel = document.createElement('span');
  const labelId = `${namespace}-${node.type}-label`;

  root.setAttribute('role', 'tree');
  root.setAttribute('aria-labelledby', labelId);
  rootLabel.textContent = node.description;
  rootLabel.setAttribute('id', labelId)

  const item = document.createElement('li');
  item.setAttribute('role', 'treeitem');
  item.setAttribute('aria-level', "1");
  item.setAttribute('aria-setsize', "1");
  item.setAttribute('aria-posinset', "1");
  item.setAttribute('aria-expanded', 'false');
  item.setAttribute('aria-selected', 'false');
  item.appendChild(rootLabel);

  root.appendChild(item);

  if (node.children.length) {
    const childContainer = document.createElement('ul');
    childContainer.setAttribute('role', 'group');

    node.children.forEach((n, index, array) => {
      childContainer.appendChild(_renderTree(n, namespace, 2, index + 1, array.length));
    })

    item.appendChild(childContainer);
  }

  return root;

  function _renderTree(node: AccessibilityTreeNode, namespace: string, level: number, posinset: number, setsize: number): HTMLElement {
    const item = document.createElement('li');
    item.setAttribute('role', 'treeitem');
    item.setAttribute('aria-level', String(level));
    item.setAttribute('aria-setsize', String(setsize));
    item.setAttribute('aria-posinset', String(posinset));
    item.setAttribute('aria-expanded', 'false');
    item.setAttribute('aria-selected', 'false');

    const label = document.createElement('span');
    label.textContent = node.description;
    item.appendChild(label);

    if (node.children.length) {
      const childContainer = document.createElement('ul');
      childContainer.setAttribute('role', 'group');

      node.children.forEach((n, index, array) => {
        childContainer.appendChild(_renderTree(n, namespace, level + 1, index + 1, array.length));
      })

      item.appendChild(childContainer);
    }

    return item;

  }
}


// /**
//  *
//  * @param node A {@link AccessibilityTreeNode} to generate a navigable tree view from
//  * @returns An {@link HTMLElement} ARIA TreeView of the navigable tree view for a visualization
//  */
//  export function renderTree(node: AccessibilityTreeNode): HTMLElement {
//     const nodeToAppend: HTMLElement = document.createElement("li")
//     nodeToAppend.setAttribute("role", "treeitem");
//     nodeToAppend.setAttribute("aria-expanded", "false");

//     const nestedChildElements: HTMLElement = document.createElement("ul")

//     const nodeDescription: HTMLElement = document.createElement("span");
//     nodeDescription.appendChild(document.createTextNode(node.description));

//     const treeChildren: AccessibilityTreeNode[] = node.children;
//     const dataChildren: AccessibilityTreeNode[] = treeChildren.filter((child: AccessibilityTreeNode) => child.type === "data")
//     if (dataChildren.length > 0) {
//         const table: HTMLElement = document.createElement("table");

//         const tableBody = document.createElement("tbody");
//         const rowHeaders = document.createElement("tr");
//         dataChildren[0].tableKeys?.forEach((key: string) => {
//             const header = document.createElement("th")
//             header.setAttribute("class", "tableInformation");
//             header.innerText = key
//             rowHeaders.appendChild(header);
//         })
//         tableBody.appendChild(rowHeaders)

//         dataChildren.forEach((node: AccessibilityTreeNode) => {
//             const dataRow = document.createElement("tr")
//             node.tableKeys?.forEach((key: string) => {
//                 const headerData = document.createElement("td")
//                 headerData.setAttribute("class", "tableInformation");
//                 const value = fmtValue(node.selected[0][key]);
//                 headerData.innerText = value;
//                 dataRow.appendChild(headerData);
//             })
//             tableBody.appendChild(dataRow)
//         })

//         table.appendChild(tableBody);

//         nestedChildElements.appendChild(table);
//     }

//     nodeToAppend.appendChild(nodeDescription);

//     if (treeChildren.length > 0) {
//         treeChildren.filter((child: AccessibilityTreeNode) => child.type !== `data`).forEach((child: AccessibilityTreeNode) => {
//             nestedChildElements.appendChild(renderTree(child));
//         })
//         nodeToAppend.appendChild(nestedChildElements);
//     }

//     const treeDom = document.createElement("ul");
//     treeDom.appendChild(nodeToAppend);
//     return treeDom;
// }
