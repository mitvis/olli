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
import { getOlliGlobalState } from '../util/globalState';
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

    this.domNode.addEventListener('keydown', this.handleKeydown.bind(this))
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

  // /* EVENT HANDLERS */
  handleKeydown(event: KeyboardEvent) {
    const { keyboardManager } = getOlliGlobalState();
    if (event.altKey || event.ctrlKey || event.metaKey) {
      return;
    }

    keyboardManager.handleEvents(event, this);
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
