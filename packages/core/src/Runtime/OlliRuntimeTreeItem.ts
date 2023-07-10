/*
 *   This content is licensed according to the W3C Software License at
 *   https://www.w3.org/Consortium/Legal/2015/copyright-software-and-document
 *
 *   File:   Treeitem.js
 *
 *   Desc:   Treeitem widget that implements ARIA Authoring Practices
 *           for a tree being used as a file viewer
 */

import { openSelectionDialog, openTableDialog } from '../Render/Dialog';
import { ElaboratedOlliNode } from '../Structure/Types';
import { KeyboardManager } from './KeyboardManager';
import { OlliRuntime } from './OlliRuntime';

/*
 *   @constructor
 *
 *   @desc
 *       Treeitem object for representing the state and user interactions for a
 *       treeItem widget
 *
 *   @param node
 *       An element with the role=tree attribute
 */

export class OlliRuntimeTreeItem {
  tree: OlliRuntime;
  domNode: HTMLElement;
  olliNode: ElaboratedOlliNode;
  isExpandable: boolean;
  inGroup: boolean;
  keyboardManager: KeyboardManager;

  parent?: OlliRuntimeTreeItem;
  children: OlliRuntimeTreeItem[];
  lastVisitedChild?: OlliRuntimeTreeItem;

  constructor(node: HTMLElement, treeObj: OlliRuntime, olliNode: ElaboratedOlliNode, parent?: OlliRuntimeTreeItem) {
    node.tabIndex = -1;
    this.tree = treeObj;
    this.domNode = node;
    this.olliNode = olliNode;

    this.isExpandable = false;
    this.inGroup = false;

    if (parent) {
      this.inGroup = true;
    }

    this.parent = parent;
    this.children = [];

    let elem = node.firstElementChild;

    while (elem) {
      if (elem.tagName.toLowerCase() == 'ul') {
        this.isExpandable = true;
        break;
      }

      elem = elem.nextElementSibling;
    }
  }

  init() {
    this.domNode.tabIndex = -1;

    this.keyboardManager = new KeyboardManager(this.domNode);
    this.keyboardManager.addActions([
      {
        key: 'h',
        title: 'Display help documentation modal',
        action: () => {
          this.keyboardManager.launchHelpDialog();
        }
      },
      {
        key: 'Enter',
        title: 'Expand and collapse the current layer of the tree',
        action: () => {
          if (this.isExpandable) {
            if (this.isExpanded()) {
              this.tree.collapseTreeItem(this);
            } else {
              this.tree.expandTreeItem(this);
            }
          }
        }
      },
      {
        key: ' ',
        keyDescription: 'Space',
        title: 'Expand and collapse the current layer of the tree',
        action: () => {
          if (this.isExpandable) {
            if (this.isExpanded()) {
              this.tree.collapseTreeItem(this);
            } else {
              this.tree.expandTreeItem(this);
            }
          }
        }
      },
      {
        key: 'ArrowDown',
        title: 'Focus on the next layer of the tree',
        action: () => {
          if (this.children.length > 0 && this.isExpandable) {
            this.tree.setFocusToNextLayer(this);
          }
        }
      },
      {
        key: 'ArrowUp',
        title: 'Focus on the previous layer of the tree',
        action: () => {
          if (this.inGroup) {
            this.tree.setFocusToParentItem(this);
          }
        }
      },
      {
        key: 'Escape',
        title: 'Focus on the previous layer of the tree',
        action: () => {
          if (this.inGroup) {
            this.tree.setFocusToParentItem(this);
          }
        }
      },
      {
        key: 'ArrowLeft',
        title: 'Focus on the previous child element of the tree',
        action: () => {
          this.tree.setFocusToPreviousItem(this);
        }
      },
      {
        key: 'ArrowRight',
        title: 'Focus on the next child element of the tree',
        action: () => {
          this.tree.setFocusToNextItem(this);
        }
      },
      {
        key: 'Home',
        title: 'Focus top of the tree',
        action: () => {
          if (this.parent) {
            this.tree.setFocusToFirstInLayer(this);
          }       
        }
      },
      {
        key: 'x',
        title: 'Navigate to the x-axis of the grapg',
        action: () => {
          this.tree.focusOnNodeType('xAxis', this);   
        }
      },
      {
        key: 'y',
        title: 'Navigate to the y-axis of the graph',
        action: () => {
          this.tree.focusOnNodeType('yAxis', this);
        }
      },
      {
        key: 'l',
        title: 'Navigate to the legend of the graph',
        action: () => {
          this.tree.focusOnNodeType('legend', this);
        }
      },
      {
        key: 't',
        title: 'Open table dialog',
        action: () => {
          if ('predicate' in this.olliNode || this.olliNode.nodeType === 'root') {
            openTableDialog(this.olliNode, this.tree);
          }
        }
      },
      {
        key: 'f',
        title: 'Open selection dialog',
        action: () => {
          openSelectionDialog(this.tree);
        }
      },
    ])

    this.domNode.addEventListener('click', this.handleClick.bind(this));
    this.domNode.addEventListener('focus', this.handleFocus.bind(this));
    this.domNode.addEventListener('blur', this.handleBlur.bind(this));

    if (!this.isExpandable) {
      this.domNode.addEventListener('mouseover', this.handleMouseOver.bind(this));
      this.domNode.addEventListener('mouseout', this.handleMouseOut.bind(this));
    }
  }

  isExpanded() {
    if (this.isExpandable) {
      return this.domNode.getAttribute('aria-expanded') === 'true';
    }
    return false;
  }

  /* EVENT HANDLERS */
  handleKeydown(event: KeyboardEvent) {
    if (event.altKey || event.ctrlKey || event.metaKey) {
      return;
    }

    this.checkBaseKeys(event);
  }

  checkBaseKeys(event: KeyboardEvent) {
    switch (event.key) {
      case 'Enter':
      case ' ':
        if (this.isExpandable) {
          if (this.isExpanded()) {
            this.tree.collapseTreeItem(this);
          } else {
            this.tree.expandTreeItem(this);
          }
        }
        break;
      case 'ArrowDown':
        if (this.children.length > 0 && this.isExpandable) {
          this.tree.setFocusToNextLayer(this);
        }
        break;
      case 'Escape':
      case 'ArrowUp':
        if (this.inGroup) {
          this.tree.setFocusToParentItem(this);
        }
        break;
      case 'ArrowLeft':
        this.tree.setFocusToPreviousItem(this);
        break;
      case 'ArrowRight':
        this.tree.setFocusToNextItem(this);
        break;
      case 'Home':
        if (this.parent) {
          this.tree.setFocusToFirstInLayer(this);
        }
        break;

      case 'End':
        if (this.parent) {
          this.tree.setFocusToLastInLayer(this);
        }
        break;
      case 'x':
        this.tree.focusOnNodeType('xAxis', this);
        break;
      case 'y':
        this.tree.focusOnNodeType('yAxis', this);
        break;
      case 'l':
        this.tree.focusOnNodeType('legend', this);
        break;
      case 't':
        if ('predicate' in this.olliNode || this.olliNode.nodeType === 'root') {
          openTableDialog(this.olliNode, this.tree);
        }
        break;
      case 'f':
        openSelectionDialog(this.tree);
        break;
      default:
        // return to avoid preventing default event action
        return;
    }

    event.stopPropagation();
    event.preventDefault();
  }

  handleClick(event: MouseEvent) {
    if (this.isExpandable) {
      if (this.isExpanded()) {
        this.tree.collapseTreeItem(this);
      } else {
        this.tree.expandTreeItem(this);
      }
      event.stopPropagation();
    } else {
      this.tree.setFocusToItem(this);
      event.stopPropagation();
    }
  }

  handleFocus() {
    let node: any = this.domNode;
    if (this.isExpandable) {
      node = node.firstElementChild;
    }
    node.classList.add('focus');
  }

  handleBlur() {
    let node: any = this.domNode;
    if (this.isExpandable) {
      node = node.firstElementChild;
    }
    node.classList.remove('focus');
  }

  handleMouseOver(event: any) {
    event.currentTarget.classList.add('hover');
  }

  handleMouseOut(event: any) {
    event.currentTarget.classList.remove('hover');
  }
}
