import { openHelpDialog, openSelectionDialog, openTableDialog } from "../Render/Dialog";
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
  let hasKeys = {
    altKey: true,
    shiftKey: true,
    ctrlKEy: true,
    metaKey: true,
  }

  Object.keys(hasKeys).forEach((key: string) => {
    if (action[key]) {
      hasKeys[key] = e[key] === action[key];
    }
  })

  return Object.keys(hasKeys).every((key: string) => hasKeys[key]);
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
     * Return list of possible actions
     */
    public getActions(): { [event: string]: KeyboardAction; } {
      return this.actions;
    }
}

export const initKeyboardManager = (olliInstance: OlliRuntime) => {

    const kb = new KeyboardManager(olliInstance.rootDomNode);

    kb.addActions([
      {
        key: 'h',
        title: 'Display help documentation modal',
        action: (treeItem) => {
          openHelpDialog(treeItem.tree);
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
