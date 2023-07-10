import type { KeyboardAction, KeyRegistration } from "../Types";

export const keyboardEventToString = (e: KeyboardEvent) => {
    return `${e.altKey ? "Alt+" : ""}${e.ctrlKey ? "Ctrl+" : ""}${
        e.shiftKey ? "Shift+" : ""
    }${e.key}`;
};

/**
 * The KeyboardManager handles adding new keyboard events and controls,
 * and displaying a help documentation modal
 */
export class KeyboardManager {
    private actions: {
        [event: string]: KeyboardAction;
    };
    private target: HTMLElement;
    private helpModal: HTMLDialogElement | null;

    constructor(target: HTMLElement) {
        this.target = target;
        this.target.addEventListener('keydown', (event) => {
            this.handleEvents(event);
        });
        if (!this.target.hasAttribute("tabIndex")) {
            this.target.setAttribute("tabIndex", "0");
        }
        this.helpModal = null;
        this.actions = {};
    }

    private handleEvents(e: KeyboardEvent): void {
        const keyPress = keyboardEventToString(e)
        if (keyPress in this.actions) {
            this.actions[keyPress].action();
            e.preventDefault();
        } else if (keyPress.toUpperCase() in this.actions) {
            this.actions[keyPress.toUpperCase()].action();
            e.stopPropagation();
            e.preventDefault();
        }
    }

    public addAction({
        key,
        action,
        caseSensitive,
        description,
        force,
        keyDescription,
        title,
    }: KeyRegistration): void {
        const checkKey = caseSensitive ? key : key.toUpperCase();
        if (!force && checkKey in this.actions) {
            return;
        }
        this.actions[checkKey] = {
            title,
            description,
            action,
            keyDescription
        };
    }

    public addActions(keyList: KeyRegistration[]): void {
        keyList.forEach((key: KeyRegistration) => {
            this.addAction(key);
        })
    }

    /**
    * Build a help dialog
    */
    public generateHelpDialog() {
        const dialog = document.createElement("dialog");

        const closeButton = document.createElement("button");
        closeButton.textContent = "X";
        closeButton.ariaLabel = "Close";
        closeButton.style.position = "absolute";
        closeButton.style.top = "10px";
        closeButton.style.right = "10px";
        closeButton.addEventListener("click", () => {
            dialog.close();
        });
        dialog.appendChild(closeButton);

        const heading = "Olli Help Menu";
        const h1 = document.createElement("h1");
        h1.textContent = heading;
        dialog.setAttribute("aria-live", heading);
        dialog.appendChild(h1);

        const table = document.createElement("table");
        const tbody = document.createElement("tbody");
        Object.entries(this.actions).forEach(([keystroke, details]) => {
            const tr = document.createElement("tr");
            const th = document.createElement("th");
            th.scope = "row";
            th.textContent = details.title;
            tr.appendChild(th);

            const td1 = document.createElement("td");
            td1.textContent = details.keyDescription ?? keystroke;
            tr.appendChild(td1);

            const td2 = document.createElement("td");
            td2.textContent = details.description;
            tr.appendChild(td2);

            tbody.appendChild(tr);
        });
        table.appendChild(tbody);

        dialog.appendChild(table);
        return dialog;
    }

    /**
     * Launch help dialog
     */
    public launchHelpDialog() {
        if (this.helpModal === null) {
            this.helpModal = this.generateHelpDialog();
            document.body.appendChild(this.helpModal);
        }
        this.helpModal.showModal();
        this.helpModal.focus();
    }
}