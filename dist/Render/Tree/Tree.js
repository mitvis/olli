"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderTree = void 0;
const TreeStyle_1 = require("./TreeStyle");
function renderTree(tree) {
    const treeDom = document.createElement("ul");
    treeDom.setAttribute("aria-labelledby", "tree1");
    treeDom.setAttribute("id", "treeView");
    treeDom.appendChild(renderInnerTree(tree));
    return treeDom;
}
exports.renderTree = renderTree;
function renderInnerTree(tree) {
    let nodeToAppend = document.createElement("li");
    nodeToAppend.setAttribute("role", "treeitem");
    nodeToAppend.setAttribute("aria-expanded", "false");
    const nestedChildElements = document.createElement("ul");
    const nodeDescription = document.createElement("span");
    nodeDescription.appendChild(document.createTextNode(tree.description));
    const treeChildren = tree.children;
    const dataChildren = treeChildren.filter((child) => child.type === "data");
    if (dataChildren.length > 0) {
        const table = document.createElement("table");
        const tableBody = document.createElement("tbody");
        const rowHeaders = document.createElement("tr");
        tree.fieldsUsed.forEach((key) => {
            const header = document.createElement("th");
            header.setAttribute("class", "tableInformation");
            header.innerText = key;
            rowHeaders.appendChild(header);
        });
        tableBody.appendChild(rowHeaders);
        dataChildren.forEach((dataPoint) => {
            const dataRow = document.createElement("tr");
            tree.fieldsUsed.forEach((key) => {
                const headerData = document.createElement("td");
                headerData.setAttribute("class", "tableInformation");
                headerData.innerText = dataPoint.selected[0][key];
                dataRow.appendChild(headerData);
            });
            tableBody.appendChild(dataRow);
        });
        table.appendChild(tableBody);
        nestedChildElements.appendChild(table);
    }
    nodeToAppend.appendChild(nodeDescription);
    if (treeChildren.length > 0) {
        treeChildren.filter((child) => child.type !== `data`).forEach((child) => {
            nestedChildElements.appendChild(renderTree(child));
        });
        nodeToAppend.appendChild(nestedChildElements);
    }
    const style = document.createElement('style');
    style.innerHTML = TreeStyle_1.treeStyle;
    document.head.appendChild(style);
    return nodeToAppend;
}
