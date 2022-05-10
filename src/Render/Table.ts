import { AccessibilityTreeNode } from "../Tree/Types";

export function renderTable(tree: AccessibilityTreeNode): HTMLElement {
    const table = document.createElement("table");
    const tableBody = document.createElement("tbody");
    const tableHeaders = document.createElement("tr");
    tree.fieldsUsed.forEach((field: string) => {
        const header = document.createElement("th");
        header.innerText = field;
        tableHeaders.appendChild(header);
    })

    tableBody.appendChild(tableHeaders)
    tree.selected.forEach((data: any) => {
        const dataRow = document.createElement("tr")
        tree.fieldsUsed.forEach((field: string) => {
            const tableData = document.createElement("td")
            tableData.innerText = data[field];
            dataRow.appendChild(tableData);
        })
        
        tableBody.appendChild(dataRow);
    })
    table.appendChild(tableBody)

    return table
}