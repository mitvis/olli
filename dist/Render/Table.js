"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderTable = void 0;
function renderTable(tree) {
    const table = document.createElement("table");
    const tableBody = document.createElement("tbody");
    const tableHeaders = document.createElement("tr");
    tree.fieldsUsed.forEach((field) => {
        const header = document.createElement("th");
        header.innerText = field;
        tableHeaders.appendChild(header);
    });
    tableBody.appendChild(tableHeaders);
    tree.selected.forEach((data) => {
        const dataRow = document.createElement("tr");
        tree.fieldsUsed.forEach((field) => {
            const tableData = document.createElement("td");
            tableData.innerText = data[field];
            dataRow.appendChild(tableData);
        });
        tableBody.appendChild(dataRow);
    });
    table.appendChild(tableBody);
    return table;
}
exports.renderTable = renderTable;
