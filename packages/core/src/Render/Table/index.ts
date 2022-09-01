import { OlliDataset, OlliDatum } from "../../Types";
import { fmtValue } from "../../utils";

/**
 *
 * @param tree The {@link AccessibilityTreeNode} to generate a table from
 * @returns An {@link HTMLElement} table of the data used in a visualization
 */
export function renderTable(data: OlliDataset, fieldsUsed: string[]): HTMLElement {
    const table = document.createElement("table");
    const thead = document.createElement("thead");
    const theadtr = document.createElement("tr");

    fieldsUsed.forEach((field: string) => {
        const th = document.createElement("th");
        th.setAttribute('scope', 'col');
        th.innerText = field;
        theadtr.appendChild(th);
    });

    thead.appendChild(theadtr);
    table.appendChild(thead);

    const tableBody = document.createElement("tbody");

    data.forEach((data: OlliDatum) => {
        const dataRow = document.createElement("tr")
        fieldsUsed.forEach((field: string) => {
            const td = document.createElement("td")
            td.innerText = fmtValue(data[field]);
            dataRow.appendChild(td);
        })
        tableBody.appendChild(dataRow);
    })
    table.appendChild(tableBody)

    return table
}
