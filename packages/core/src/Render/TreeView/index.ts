import { AccessibilityTreeNode } from "../../Structure/Types";
import "./TreeStyle.css";

/**
 *
 * @param tree A {@link AccessibilityTreeNode} to generate a navigable tree view from
 * @returns An {@link HTMLElement} ARIA TreeView of the navigable tree view for a visualization
 */
 export function renderTree(tree: AccessibilityTreeNode): HTMLElement {
    const nodeToAppend: HTMLElement = document.createElement("li")
    nodeToAppend.setAttribute("role", "treeitem");
    nodeToAppend.setAttribute("aria-expanded", "false");

    const nestedChildElements: HTMLElement = document.createElement("ul")

    const nodeDescription: HTMLElement = document.createElement("span");
    nodeDescription.appendChild(document.createTextNode(tree.description));

    const treeChildren: AccessibilityTreeNode[] = tree.children;
    const dataChildren: AccessibilityTreeNode[] = treeChildren.filter((child: AccessibilityTreeNode) => child.type === "data")
    if (dataChildren.length > 0) {
        const table: HTMLElement = document.createElement("table");

        const tableBody = document.createElement("tbody");
        const rowHeaders = document.createElement("tr");
        tree.fieldsUsed.forEach((key: string) => {
            const header = document.createElement("th")
            header.setAttribute("class", "tableInformation");
            header.innerText = key
            rowHeaders.appendChild(header);
        })
        tableBody.appendChild(rowHeaders)

        dataChildren.forEach((dataPoint: AccessibilityTreeNode) => {
            const dataRow = document.createElement("tr")
            tree.fieldsUsed.forEach((key: string) => {
                const headerData = document.createElement("td")
                headerData.setAttribute("class", "tableInformation");
                const value = dataPoint.selected[0][key];
                if (!isNaN(value) && value % 1 != 0) {
                    headerData.innerText = Number(value).toFixed(2);
                } else {
                    headerData.innerText = dataPoint.selected[0][key]
                }
                dataRow.appendChild(headerData);
            })
            tableBody.appendChild(dataRow)
        })

        table.appendChild(tableBody);

        nestedChildElements.appendChild(table);
    }

    nodeToAppend.appendChild(nodeDescription);

    if (treeChildren.length > 0) {
        treeChildren.filter((child: AccessibilityTreeNode) => child.type !== `data`).forEach((child: AccessibilityTreeNode) => {
            nestedChildElements.appendChild(renderTree(child));
        })
        nodeToAppend.appendChild(nestedChildElements);
    }

    const treeDom = document.createElement("ul");
    treeDom.appendChild(nodeToAppend);
    return treeDom;
}

// function appendStyle() {
//     const style = document.createElement('style')
//     style.innerHTML = treeStyle;
//     document.head.appendChild(style)

// }