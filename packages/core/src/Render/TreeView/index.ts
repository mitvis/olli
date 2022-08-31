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
  const labelId = `${namespace}-${node.type}-label`;

  root.setAttribute('role', 'tree');
  root.setAttribute('aria-labelledby', labelId);

  const childContainer = document.createElement('ul');
  childContainer.setAttribute('role', 'group');

  childContainer.appendChild(_renderTree(node, namespace, 1, 1, 1));

  root.appendChild(childContainer);

  childContainer.querySelector('span')?.setAttribute('id', labelId);

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

      const dataChildren = node.children.filter(n => n.type === 'data');
      const treeChildren = node.children.filter(n => n.type !== 'data');

      if (dataChildren.length) {
        childContainer.appendChild(createDataTable(dataChildren, level + 1));
      }

      treeChildren.forEach((n, index, array) => {
        childContainer.appendChild(_renderTree(n, namespace, level + 1, index + 1, array.length));
      })

      item.appendChild(childContainer);
    }

    return item;
  }

  function createDataTable(dataNodes: AccessibilityTreeNode[], level: number) {
    const table = document.createElement("table");

    const thead = document.createElement("thead");
    const theadtr = document.createElement("tr");

    dataNodes[0].tableKeys?.forEach((key: string) => {
      const th = document.createElement("th");
      th.setAttribute('scope', 'col');
      th.innerText = key
      theadtr.appendChild(th);
    });

    thead.appendChild(theadtr);
    table.appendChild(thead);

    //

    const tableBody = document.createElement("tbody");

    dataNodes.forEach((node) => {
      const dataRow = document.createElement("tr")
      node.tableKeys?.forEach((key: string) => {
        const td = document.createElement("td")
        const value = fmtValue(node.selected[0][key]);
        td.innerText = value;
        dataRow.appendChild(td);
      })
      tableBody.appendChild(dataRow);
    });

    table.appendChild(tableBody);

    const item = document.createElement('li');

    item.setAttribute('role', 'treeitem');
    item.setAttribute('aria-level', String(level));
    item.setAttribute('aria-setsize', "1");
    item.setAttribute('aria-posinset', "1");
    item.setAttribute('aria-expanded', 'false');
    item.setAttribute('aria-selected', 'false');

    item.appendChild(table);

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
