import { openSelectionDialog, openTableDialog } from "../Render/Dialog";
import { OlliRuntime } from "./OlliRuntime";
import { OlliRuntimeTreeItem } from "./OlliRuntimeTreeItem";

export type KeyboardAction = {
    action: (treeItem: OlliRuntimeTreeItem) => void;
    title?: string;
    keyDescription?: string;
    description?: string;
    force?: boolean;
    caseSensitive?: boolean;
    shiftKey?: boolean;
    ctrlKey?: boolean;
    altKey?: boolean;
    metaKey?: boolean;
}

export type KeyRegistration = {
  key: string;
} & KeyboardAction;

export const checkKeys = (e: KeyboardEvent, action: KeyboardAction) => {
  let hasAlt: boolean = true;
  let hasShift: boolean = true;
  let hasCtrl: boolean = true;
  let hasMeta: boolean = true;

  if (action.altKey) {
    hasAlt = e.altKey === action.altKey;
  }
  if (action.shiftKey) {
    hasShift = e.shiftKey === action.shiftKey;
  }
  if (action.ctrlKey) {
    hasCtrl = e.ctrlKey === action.ctrlKey;
  }
  if (action.metaKey) {
    hasMeta = e.metaKey === action.metaKey;
  }

  return hasAlt && hasCtrl && hasMeta && hasShift;
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
        if (!this.target.hasAttribute("tabIndex")) {
            this.target.setAttribute("tabIndex", "0");
        }
        this.helpModal = null;
        this.actions = {};
    }

    public handleEvents(e: KeyboardEvent, tree: OlliRuntimeTreeItem): void {
        const keyPress = e.key;
        let keyboardAction: KeyboardAction;

        if (keyPress in this.actions) {
          keyboardAction = this.actions[keyPress];
        } else if (keyPress.toUpperCase() in this.actions) {
          keyboardAction = this.actions[keyPress.toUpperCase()];
        }

        if (checkKeys(e, keyboardAction)) {
          keyboardAction.action(tree);
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
        shiftKey,
        ctrlKey,
        altKey,
        metaKey,
    }: KeyRegistration): void {
        const checkKey = caseSensitive ? key : key.toUpperCase();
        if (!force && checkKey in this.actions) {
            return;
        }
        this.actions[checkKey] = {
            title,
            description,
            action,
            keyDescription,
            shiftKey,
            ctrlKey,
            altKey,
            metaKey,
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
            th.style.textAlign = 'left'; 
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

export const initKeyboardManager = (olliInstance: OlliRuntime) => {

    const kb = new KeyboardManager(olliInstance.rootDomNode);
    kb.addActions([
      {
        key: 'h',
        title: 'Display help documentation modal',
        action: () => {
          kb.launchHelpDialog();
        },
      },
      {
        key: 'Enter',
        title: 'Expand and collapse the current layer of the tree',
        action: (treeItem) => {
          if (treeItem.isExpandable) {
            if (treeItem.isExpanded()) {
              treeItem.tree.collapseTreeItem(treeItem);
            } else {
              treeItem.tree.expandTreeItem(treeItem);
            }
          }
        },
      },
      {
        key: ' ',
        keyDescription: 'Space',
        title: 'Expand and collapse the current layer of the tree',
        action: (treeItem) => {
          if (treeItem.tree.lastFocusedTreeItem.isExpandable) {
            if (treeItem.tree.lastFocusedTreeItem.isExpanded()) {
              treeItem.tree.collapseTreeItem(treeItem);
            } else {
              treeItem.tree.expandTreeItem(treeItem);
            }
          }
        },
      },
      {
        key: 'ArrowDown',
        title: 'Focus on the next layer of the tree',
        action: (treeItem) => {
          if (treeItem.children.length > 0 && treeItem.isExpandable) {
            treeItem.tree.setFocusToNextLayer(treeItem);
          }
        },
      },
      {
        key: 'ArrowUp',
        title: 'Focus on the previous layer of the tree',
        action: (treeItem) => {
          if (treeItem.inGroup) {
            treeItem.tree.setFocusToParentItem(treeItem);
          }
        },
      },
      {
        key: 'Escape',
        title: 'Focus on the previous layer of the tree',
        action: (treeItem) => {
          if (treeItem.inGroup) {
            treeItem.tree.setFocusToParentItem(treeItem);
          }
        },
      },
      {
        key: 'ArrowLeft',
        title: 'Focus on the previous child element of the tree',
        action: (treeItem) => {
          treeItem.tree.setFocusToPreviousItem(treeItem);
        },
      },
      {
        key: 'ArrowRight',
        title: 'Focus on the next child element of the tree',
        action: (treeItem) => {
          treeItem.tree.setFocusToNextItem(treeItem);
        },
      },
      {
        key: 'Home',
        title: 'Focus top of the tree',
        action: (treeItem) => {
          if (treeItem.parent) {
            treeItem.tree.setFocusToFirstInLayer(treeItem);
          }       
        },
      },
      {
        key: 'x',
        title: 'Navigate to the x-axis of the graph',
        action: (treeItem) => {
          treeItem.tree.focusOnNodeType('xAxis', treeItem);   
        },
      },
      {
        key: 'y',
        title: 'Navigate to the y-axis of the graph',
        action: (treeItem) => {
          treeItem.tree.focusOnNodeType('yAxis', treeItem);
        },
      },
      {
        key: 'l',
        title: 'Navigate to the legend of the graph',
        action: (treeItem) => {
          treeItem.tree.focusOnNodeType('legend', treeItem);
        },
      },
      {
        key: 't',
        title: 'Open table dialog',
        action: (treeItem) => {
          if ('predicate' in treeItem.olliNode || treeItem.olliNode.nodeType === 'root') {
            openTableDialog(treeItem.olliNode, treeItem.tree);
          }
        },
      },
      {
        key: 'f',
        title: 'Open selection dialog',
        action: (treeItem) => {
          openSelectionDialog(treeItem.tree);
        },
      },
    ])
  
    return kb;
}
