"use strict";
/*
*   This content is licensed according to the W3C Software License at
*   https://www.w3.org/Consortium/Legal/2015/copyright-software-and-document
*
*   File:   TreeItemLink.js
*
*   Desc:   Treeitem widget that implements ARIA Authoring Practices
*           for a tree being used as a file viewer
*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.GridTreeItemLink = exports.TreeItemLink = void 0;
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
class TreeItemLink {
    constructor(node, treeObj, group, level) {
        node.tabIndex = -1;
        this.tree = treeObj;
        this.parent = group;
        this.domNode = node;
        this.label = node.textContent.trim();
        this.stopDefaultClick = false;
        this.level = level;
        this.children = [];
        this.lastVisitedChild = null;
        // Check whether node is a DOM element
        if (typeof node !== 'object') {
            return;
        }
        if (node.getAttribute('aria-label')) {
            this.label = node.getAttribute('aria-label').trim();
        }
        this.isExpandable = false;
        this.isVisible = false;
        this.inGroup = false;
        if (group) {
            this.inGroup = true;
        }
        let elem = node.firstElementChild;
        while (elem) {
            if (elem.tagName.toLowerCase() == 'ul') {
                elem.setAttribute('role', 'group');
                this.isExpandable = true;
                break;
            }
            elem = elem.nextElementSibling;
        }
        this.keyCode = Object.freeze({
            RETURN: 13,
            SPACE: 32,
            PAGEUP: 33,
            PAGEDOWN: 34,
            END: 35,
            HOME: 36,
            LEFT: 37,
            UP: 38,
            RIGHT: 39,
            DOWN: 40,
            X: 88,
            Y: 89,
            L: 76,
            G: 71,
            W: 87,
            A: 65,
            S: 83,
            D: 68,
            ESCAPE: 27,
            PLUS: 107,
            MINUS: 189
        });
    }
    init() {
        this.domNode.tabIndex = -1;
        if (!this.domNode.getAttribute('role')) {
            this.domNode.setAttribute('role', 'treeitem');
        }
        this.domNode.addEventListener('keydown', this.handleKeydown.bind(this));
        this.domNode.addEventListener('click', this.handleClick.bind(this));
        this.domNode.addEventListener('focus', this.handleFocus.bind(this));
        this.domNode.addEventListener('blur', this.handleBlur.bind(this));
        if (this.isExpandable) {
            this.domNode.firstElementChild.addEventListener('mouseover', this.handleMouseOver.bind(this));
            this.domNode.firstElementChild.addEventListener('mouseout', this.handleMouseOut.bind(this));
        }
        else {
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
    handleKeydown(event) {
        this.stopDefaultClick = false;
        if (event.altKey || event.ctrlKey || event.metaKey) {
            return;
        }
        if (event.shift) {
            if (event.keyCode == this.keyCode.SPACE || event.keyCode == this.keyCode.RETURN) {
                event.stopPropagation();
                this.stopDefaultClick = true;
            }
        }
        else {
            this.checkBaseKeys(event);
        }
    }
    checkBaseKeys(event) {
        let flag = false;
        switch (event.keyCode) {
            case this.keyCode.SPACE:
            case this.keyCode.RETURN:
                if (this.isExpandable) {
                    if (this.isExpanded()) {
                        this.tree.collapseTreeitem();
                    }
                    else {
                        this.tree.expandTreeitem(this);
                    }
                    flag = true;
                }
                else {
                    event.stopPropagation();
                    this.stopDefaultClick = true;
                }
                break;
            case this.keyCode.DOWN:
                if (this.children.length > 0) {
                    if (this.isExpandable)
                        this.tree.expandTreeitem(this);
                    this.tree.setFocusToNextLaver();
                }
                flag = true;
                break;
            case this.keyCode.LEFT:
                this.tree.setFocusToPreviousItem();
                flag = true;
                break;
            case this.keyCode.RIGHT:
                this.tree.setFocusToNextItem();
                flag = true;
                break;
            case this.keyCode.ESCAPE:
            case this.keyCode.UP:
                if (this.isExpandable && this.isExpanded()) {
                    this.tree.setFocusToParentItem();
                    this.tree.collapseTreeitem();
                    flag = true;
                }
                else {
                    if (this.inGroup) {
                        this.tree.setFocusToParentItem();
                        flag = true;
                    }
                }
                break;
            case this.keyCode.HOME:
                this.tree.setFocusToItem(this.parent.children[0]);
                flag = true;
                break;
            case this.keyCode.END:
                this.tree.setFocusToItem(this.parent.children[this.parent.children.length - 1]);
                flag = true;
                break;
            case this.keyCode.X:
                this.tree.focusOnSpecificNode("x-axis", this);
                break;
            case this.keyCode.Y:
                this.tree.focusOnSpecificNode("y-axis", this);
                break;
            case this.keyCode.L:
                this.tree.focusOnSpecificNode("legend", this);
                break;
        }
        if (flag) {
            event.stopPropagation();
            event.preventDefault();
        }
    }
    handleClick(event) {
        // only process click events that directly happened on this treeitem
        if (event.target !== this.domNode && event.target !== this.domNode.firstElementChild) {
            return;
        }
        if (this.isExpandable) {
            if (this.isExpanded()) {
                this.tree.setFocusToItem(this);
                this.tree.collapseTreeitem();
            }
            else {
                if (this.isExpandable && !this.isExpanded()) {
                    this.tree.expandTreeitem(this);
                    this.tree.setFocusToItem(this);
                }
                this.tree.setFocusToNextLaver();
            }
            event.stopPropagation();
        }
    }
    handleFocus(event) {
        let node = this.domNode;
        if (this.isExpandable) {
            node = node.firstElementChild;
        }
        node.classList.add('focus');
    }
    handleBlur(event) {
        let node = this.domNode;
        if (this.isExpandable) {
            node = node.firstElementChild;
        }
        node.classList.remove('focus');
    }
    handleMouseOver(event) {
        event.currentTarget.classList.add('hover');
    }
    handleMouseOut(event) {
        event.currentTarget.classList.remove('hover');
    }
}
exports.TreeItemLink = TreeItemLink;
class GridTreeItemLink extends TreeItemLink {
    constructor(node, treeObj, group, level) {
        super(node, treeObj, group, level);
        const getNodeFromString = (partialLabelString) => {
            return this.parent.parent.children.reduce((returnVal, currentNode) => {
                if (currentNode.label.includes(partialLabelString)) {
                    return currentNode;
                }
                else {
                    return returnVal;
                }
            });
        };
        this.gridIndex = this.parent.children.length;
        this.gridWidth = getNodeFromString("X-Axis").children.length;
        ;
        const getRowPosition = () => {
            if (this.gridIndex !== 0) {
                let prevPosition = this.parent.children[this.gridIndex - 1].rowPosition;
                return prevPosition <= this.gridWidth ? prevPosition + 1 : 1;
            }
            else {
                return 1;
            }
        };
        this.rowPosition = getRowPosition();
    }
    handleKeydown(event) {
        super.handleKeydown(event);
        let currentChildIndex = this.parent.children.indexOf(this);
        switch (event.keyCode) {
            case this.keyCode.W:
                if (currentChildIndex + this.gridWidth <= this.parent.children.length) {
                    this.tree.setFocusToItem(this.parent.children[currentChildIndex + this.gridWidth]);
                }
                break;
            case this.keyCode.S:
                if (currentChildIndex - this.gridWidth >= 0) {
                    this.tree.setFocusToItem(this.parent.children[currentChildIndex - this.gridWidth]);
                }
                break;
            case this.keyCode.A:
                if (this.rowPosition > 1) {
                    this.tree.setFocusToItem(this.parent.children[currentChildIndex - 1]);
                }
                break;
            case this.keyCode.D:
                if (this.rowPosition < this.gridWidth) {
                    this.tree.setFocusToItem(this.parent.children[currentChildIndex + 1]);
                }
                break;
        }
    }
}
exports.GridTreeItemLink = GridTreeItemLink;
