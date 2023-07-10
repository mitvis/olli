// Adapted from: https://www.w3.org/WAI/ARIA/apg/patterns/treeview/examples/treeview-1b/
import { ElaboratedOlliNode, OlliNodeLookup } from '../Structure/Types';
import { OlliNodeType } from '../Structure/Types';
import { OlliSpec } from '../Types';
import { setOlliGlobalState } from '../util/globalState';
import { OlliRuntimeTreeItem } from './OlliRuntimeTreeItem';
import { olliSpecToTree, treeToNodeLookup } from '../Structure';
import { generateDescriptions } from '../description';
import { renderTree } from '../Render/TreeView';
import { LogicalAnd, LogicalComposition } from 'vega-lite/src/logical';
import { FieldPredicate } from 'vega-lite/src/predicate';
import { selectionTest } from '../util/selection';
/*
 *   This content is licensed according to the W3C Software License at
 *   https://www.w3.org/Consortium/Legal/2015/copyright-software-and-document
 *
 *   File:   Tree.js
 *
 *   Desc:   Tree widget that implements ARIA Authoring Practices
 *           for a tree being used as a file viewer
 */

export interface RuntimeCallbacks {
  onFocus?: (el: HTMLElement, olliNode: ElaboratedOlliNode) => void;
  onSelection?: (predicate: LogicalComposition<FieldPredicate>) => void;
}

export class OlliRuntime {
  olliSpec: OlliSpec;
  renderContainer: HTMLElement;
  rootDomNode: HTMLElement;
  olliNodeLookup: OlliNodeLookup;
  treeItems: OlliRuntimeTreeItem[];
  rootTreeItem: OlliRuntimeTreeItem;
  lastFocusedTreeItem: OlliRuntimeTreeItem;
  callbacks: RuntimeCallbacks;

  constructor(olliSpec: OlliSpec, renderContainer: HTMLElement, callbacks: RuntimeCallbacks) {
    this.olliSpec = olliSpec;
    this.renderContainer = renderContainer;
    this.callbacks = callbacks;
    this.treeItems = [];
  }

  init(): void {
    function findTreeitems(node, tree: OlliRuntime, lookup: OlliNodeLookup, group: OlliRuntimeTreeItem | undefined) {
      let elem = node.firstElementChild;
      let ti = group;

      while (elem) {
        if (elem.tagName.toLowerCase() === 'li') {
          ti = new OlliRuntimeTreeItem(elem, tree, lookup[elem.id], group);
          ti.init();
          if (group) {
            group.children.push(ti);
          }
          tree.treeItems.push(ti);
        }

        if (elem.firstElementChild) {
          findTreeitems(elem, tree, lookup, ti);
        }

        elem = elem.nextElementSibling;
      }
    }

    const tree: ElaboratedOlliNode = olliSpecToTree(this.olliSpec);
    this.olliNodeLookup = treeToNodeLookup(tree);

    generateDescriptions(this.olliSpec, tree);

    const ul = renderTree(tree);
    this.rootDomNode = ul;
    this.renderContainer.replaceChildren(ul);

    this.treeItems = [];

    findTreeitems(this.rootDomNode, this, this.olliNodeLookup, undefined);

    this.rootTreeItem = this.treeItems[0];
    this.rootTreeItem.domNode.tabIndex = 0;

    const helpComment = "Press 'h' to open the Olli Help Menu for a list of controls.";
    const helpElement = document.createElement("em");
    helpElement.textContent = helpComment;
    this.rootDomNode.appendChild(helpElement);
  }

  renderTreeDescription() {
    _renderTreeDescription(this.rootDomNode, this.olliNodeLookup);

    function _renderTreeDescription(ul: HTMLElement, lookup: OlliNodeLookup) {
      if (ul.children.length) {
        for (const li of ul.children) {
          const label = li.firstElementChild! as HTMLElement;
          if (lookup[li.id]) {
            label.innerText = lookup[li.id].description;
            if (li.children[1]) {
              _renderTreeDescription(li.children[1] as HTMLElement, lookup);
            }
          }
        }
      }
    }
  }

  setSelection(selection: LogicalAnd<FieldPredicate> | FieldPredicate) {
    const lastNode = this.lastFocusedTreeItem?.olliNode;
    this.olliSpec.selection = selection;
    this.init();
    if (lastNode) {
      // find the nearest node to the last selected node and set focus to it
      if (lastNode.nodeType === 'root') {
        this.setFocusToItem(this.rootTreeItem);
      } else {
        const items = this.treeItems.filter((ti) => ti.olliNode.nodeType === lastNode.nodeType);
        if ('groupby' in lastNode) {
          const item = items.find((ti) => ti.olliNode.groupby === lastNode.groupby);
          this.setFocusToItem(item || this.rootTreeItem);
        } else if ('predicate' in lastNode) {
          const pitems = items.filter((ti) => 'predicate' in ti.olliNode);
          const lastNodeSelection = selectionTest(this.olliSpec.data, { and: [selection, lastNode.predicate] });
          const item = pitems.find((ti) => {
            const tiSelection = selectionTest(this.olliSpec.data, { and: [selection, ti.olliNode.predicate] });
            return tiSelection.some((d) => lastNodeSelection.includes(d));
          });
          this.setFocusToItem(item || this.rootTreeItem);
        } else {
          this.setFocusToItem(this.rootTreeItem);
        }
      }
    }
  }

  setFocusToItem(treeitem: OlliRuntimeTreeItem) {
    for (var i = 0; i < this.treeItems.length; i++) {
      var ti = this.treeItems[i];

      if (ti === treeitem) {
        this.expandParents(ti);
        this.collapseChildren(ti);
        ti.domNode.tabIndex = 0;
        ti.domNode.focus();
        ti.domNode.setAttribute('aria-selected', 'true');
        this.lastFocusedTreeItem = ti;
        if (this.callbacks.onFocus) {
          this.callbacks.onFocus(ti.domNode, ti.olliNode);
        }
        setOlliGlobalState({ lastVisitedInstance: this });
      } else {
        ti.domNode.tabIndex = -1;
        ti.domNode.setAttribute('aria-selected', 'false');
      }
    }
  }

  setFocusToNextItem(currentItem: OlliRuntimeTreeItem) {
    if (currentItem.parent) {
      const nodeIndex = currentItem.parent.children.indexOf(currentItem);
      if (nodeIndex < currentItem.parent.children.length - 1) {
        this.setFocusToItem(currentItem.parent.children[nodeIndex + 1]);
      }
    }
  }

  setFocusToPreviousItem(currentItem: OlliRuntimeTreeItem) {
    if (currentItem.parent) {
      let nodeIndex = currentItem.parent.children.indexOf(currentItem);
      if (nodeIndex > 0) {
        this.setFocusToItem(currentItem.parent.children[nodeIndex - 1]);
      }
    }
  }

  setFocusToNextLayer(currentItem: OlliRuntimeTreeItem) {
    if (currentItem.lastVisitedChild) {
      this.setFocusToItem(currentItem.lastVisitedChild);
    } else {
      this.setFocusToItem(currentItem.children[0]);
    }
  }

  setFocusToParentItem(currentItem: OlliRuntimeTreeItem) {
    if (currentItem.parent) {
      currentItem.parent.lastVisitedChild = currentItem;
      this.setFocusToItem(currentItem.parent);
    }
  }

  setFocusToFirstInLayer(currentItem: OlliRuntimeTreeItem) {
    if (currentItem.parent) {
      this.setFocusToItem(currentItem.parent.children[0]);
    }
  }

  setFocusToLastInLayer(currentItem: OlliRuntimeTreeItem) {
    if (currentItem.parent) {
      this.setFocusToItem(currentItem.parent.children[currentItem.parent.children.length - 1]);
    }
  }

  expandTreeItem(currentItem: OlliRuntimeTreeItem) {
    if (currentItem.isExpandable) {
      if (currentItem.parent) {
        currentItem.parent.children.forEach((item) => {
          if (item !== currentItem) {
            item.domNode.setAttribute('aria-expanded', 'false');
          }
        });
      }
      currentItem.domNode.setAttribute('aria-expanded', 'true');
    }
  }

  collapseTreeItem(item: OlliRuntimeTreeItem): void {
    if (item && item.isExpanded()) {
      item.domNode.setAttribute('aria-expanded', 'false');
    }
  }

  expandParents(node: OlliRuntimeTreeItem) {
    if (node.parent) {
      if (node.parent.isExpandable && !node.parent.isExpanded()) {
        this.expandParents(node.parent);
        this.expandTreeItem(node.parent);
      }
    }
  }

  collapseChildren(node: OlliRuntimeTreeItem) {
    node?.children?.forEach((child) => {
      if (child.isExpandable && child.isExpanded()) {
        this.collapseChildren(child);
        this.collapseTreeItem(child);
      }
    });
    this.collapseTreeItem(node);
  }

  focusOnNodeType(nodeType: OlliNodeType, currentItem: OlliRuntimeTreeItem) {
    let iterItem: OlliRuntimeTreeItem = currentItem;
    while (iterItem) {
      if (iterItem.olliNode.nodeType === nodeType) {
        this.setFocusToItem(iterItem);
        break;
      }
      iterItem = iterItem.parent;
    }
  }
}
