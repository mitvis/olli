import { KeyboardManager } from "../../Runtime/KeyboardManager";

    /**
    * Build a help dialog
    */
    export function renderHelpDialog(keyboardManager: KeyboardManager): HTMLElement {
        const table = document.createElement("table");
        const tbody = document.createElement("tbody");

        Object.entries(keyboardManager.getActions()).forEach(([keystroke, details]) => {
            const tr = document.createElement("tr");
            const th = document.createElement("th");
            th.style.textAlign = 'left'; 
            th.scope = "row";
            th.textContent = details.keyDescription ?? keystroke;
            tr.appendChild(th);

            const tdKey = document.createElement("td");
            tdKey.textContent = details.description;
            tr.appendChild(tdKey);

            const tdTitle = document.createElement("td");
            tdTitle.textContent = details.title;
            tr.appendChild(tdTitle);

            tbody.appendChild(tr);
        });
        table.appendChild(tbody);

        return table;
    }