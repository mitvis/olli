import { AccessibilityTreeNode } from "../../Tree/Types";
import { GridTreeItemLink, TreeItemLink } from "./TreeItemLinks";
/*
*   This content is licensed according to the W3C Software License at
*   https://www.w3.org/Consortium/Legal/2015/copyright-software-and-document
*
*   File:   TreeLinks.ts
*
*   Desc:   Tree widget that implements ARIA Authoring Practices
*           for a tree being used as a file viewer
*/

/*
*   @constructor
*
*   @desc
*       Tree item object for representing the state and user interactions for a
*       tree widget
*
*   @param node
*       An element with the role=tree attribute
*/
export class TreeLinks {
    domNode: any;
    treeitems!: TreeItemLink[];
    firstTreeitem!: TreeItemLink;
    lastTreeitem!: TreeItemLink;
    currentNode!: TreeItemLink;

    constructor(node: HTMLElement | null) {
        // Check whether node is a DOM element
        if (typeof node !== 'object') {
            return;
        }

        this.domNode = node;

        this.treeitems = [];
    }

    init(): void {

        function findTreeitems(node: any, tree: TreeLinks, group: any, treeLevel: number) {

            let elem = node.firstElementChild;
            let ti = group

            while (elem) {

                if ((elem.tagName.toLowerCase() === 'li' && elem.firstElementChild.tagName.toLowerCase() === 'span') ||
                    elem.tagName.toLowerCase() === `tr` || (elem.tagName.toLowerCase() === 'th') || (elem.tagName.toLowerCase() === 'td')) {
                    if (group && group.label.substring(0, 9) === "Grid view") {
                        ti = new GridTreeItemLink(elem, tree, group, treeLevel)
                    } else {
                        ti = new TreeItemLink(elem, tree, group, treeLevel);

                    }
                    ti.init();
                    if (group) group.children.push(ti);
                    tree.treeitems.push(ti);
                }

                if (elem.firstElementChild) {
                    findTreeitems(elem, tree, ti, treeLevel + 1);
                }

                elem = elem.nextElementSibling;
            }
        }

        // initialize pop up menus
        if (!this.domNode.getAttribute('role')) {
            this.domNode.setAttribute('role', 'tree');
        }

        findTreeitems(this.domNode, this, undefined, 0);

        this.updateVisibleTreeitems();
        this.firstTreeitem.domNode.tabIndex = 0;
        this.currentNode = this.firstTreeitem;
    }

    setFocusToItem(treeitem: TreeItemLink) {
        this.currentNode.domNode.tabIndex = 0;
        this.currentNode = treeitem
        this.currentNode.domNode.focus();
    }

    setFocusToAdjacentItem(treeitem: TreeItemLink) {
        this.currentNode.domNode.tabIndex = 0;

        let parent = this.currentNode.parent
        while (parent !== undefined) {
            parent.domNode.setAttribute('aria-expanded', false);
            this.updateVisibleTreeitems();
            parent = parent.parent
        }

        if (!treeitem.isVisible) {
            let node: TreeItemLink = treeitem
            while (!treeitem.isVisible) {
                this.expandTreeitem(node.parent);
                node = node.parent;
            }
        }
        this.currentNode = treeitem
        this.currentNode.domNode.focus();
    }

    setFocusToNextItem() {
        if (this.currentNode.parent) {
            let nodeIndex = this.currentNode.parent.children.indexOf(this.currentNode);
            if (nodeIndex < this.currentNode.parent.children.length - 1) {
                this.setFocusToItem(this.currentNode.parent.children[nodeIndex + 1])
            }
        }
    }

    setFocusToNextLaver(): void {
        if (this.currentNode.lastVisitedChild !== null) {
            this.setFocusToItem(this.currentNode.lastVisitedChild);
        } else {
            this.setFocusToItem(this.currentNode.children[0]);
        }
    }

    setFocusToPreviousItem(): void {
        if (this.currentNode.parent) {
            let nodeIndex = this.currentNode.parent.children.indexOf(this.currentNode);
            if (nodeIndex > 0) {
                this.setFocusToItem(this.currentNode.parent.children[nodeIndex - 1])
            }
        }
    }

    setFocusToParentItem(): void {
        if (this.currentNode.parent) {
            this.currentNode.parent.lastVisitedChild = this.currentNode;
            this.setFocusToItem(this.currentNode.parent);
            if (this.currentNode.isExpandable && this.currentNode.isExpanded) this.collapseTreeitem(this.currentNode)
        }
    }

    setFocusToFirstItem(): void {
        this.setFocusToItem(this.firstTreeitem);
    }

    setFocusToLastItem(): void {
        this.setFocusToItem(this.lastTreeitem);
    }

    expandTreeitem(currentItem: TreeItemLink) {
        if (currentItem.isExpandable) {
            currentItem.domNode.setAttribute('aria-expanded', true);
            this.updateVisibleTreeitems();
        }

    }

    expandAllSiblingItems(currentItem: TreeItemLink) {
        for (let i = 0; i < this.treeitems.length; i++) {
            let ti = this.treeitems[i];

            if ((ti.parent === currentItem.parent) && ti.isExpandable) {
                this.expandTreeitem(ti);
            }
        }

    }

    collapseTreeitem(item: TreeItemLink): void {

        let parent: TreeItemLink;

        if (item.isExpanded()) {
            parent = this.currentNode;
        } else {
            parent = this.currentNode.parent;
        }

        if (parent) {
            parent.domNode.setAttribute('aria-expanded', false);
            this.updateVisibleTreeitems();
            this.setFocusToItem(parent);
        }
    }

    updateVisibleTreeitems(): void {

        this.firstTreeitem = this.treeitems[0];

        for (let i = 0; i < this.treeitems.length; i++) {
            let ti = this.treeitems[i];

            let parent = ti.domNode.parentNode;

            ti.isVisible = true;

            while (parent && (parent !== this.domNode)) {

                if (parent.getAttribute('aria-expanded') == 'false') {
                    ti.isVisible = false;
                }
                parent = parent.parentNode;
            }

            if (ti.isVisible) {
                this.lastTreeitem = ti;
            }
        }

    }

    focusOnSpecificNode(searchStr: string, base: TreeItemLink, visitedNodes?: TreeItemLink[]): void {
        let visited: TreeItemLink[] = visitedNodes ? visitedNodes : [];
        if (!visited.includes(base)) {
            visited.push(base);
            if (base.label.split(" ")[0].toLowerCase() === searchStr) {

                const expandParents = (node: TreeItemLink): void => {
                    if (node) {
                        if (!node.isExpanded()) {
                            this.expandTreeitem(node)
                            expandParents(node.parent)
                        }
                    }
                }

                const collapseChildren = (node: TreeItemLink): void => {
                    if (base !== node) {
                        node.parent.lastVisitedChild = node;
                        this.currentNode = node.parent;
                        this.collapseTreeitem(this.currentNode);
                    }
                }

                expandParents(base.parent);
                if (base.isExpanded()) {
                    collapseChildren(this.currentNode);
                    base.lastVisitedChild = this.currentNode
                    this.collapseTreeitem(this.currentNode);
                }
                this.setFocusToItem(base);

            } else {
                if (base.parent) {
                    this.focusOnSpecificNode(searchStr, base.parent, visited)
                }
                base.children.forEach((child: TreeItemLink) => {
                    return this.focusOnSpecificNode(searchStr, child, visited)
                });
            }
        }
    }
}
