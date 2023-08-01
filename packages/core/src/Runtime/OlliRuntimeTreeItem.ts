/*
 *   This content is licensed according to the W3C Software License at
 *   https://www.w3.org/Consortium/Legal/2015/copyright-software-and-document
 *
 *   File:   Treeitem.js
 *
 *   Desc:   Treeitem widget that implements ARIA Authoring Practices
 *           for a tree being used as a file viewer
 */

import { openSelectionDialog, openTableDialog, openTargetedNavigationDialog } from '../Render/Dialog';
import { ElaboratedOlliNode } from '../Structure/Types';
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

    this.domNode.addEventListener('keydown', this.handleKeydown.bind(this));
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
        if (event.shiftKey) {
          if (this.tree.isLateralPossible()) {
            this.tree.setFocusToLateralItem(this, 'left');
          }
        } else {
        this.tree.setFocusToPreviousItem(this);
        }
        break;
      case 'ArrowRight':
        if (event.shiftKey) {
          if (this.tree.isLateralPossible()) {
            this.tree.setFocusToLateralItem(this, 'right');
          }
        } else {
        this.tree.setFocusToNextItem(this);
        }
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
        openSelectionDialog(this.olliNode, this.tree);
        break;
      case 'r':
        openTargetedNavigationDialog(this.tree);
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
