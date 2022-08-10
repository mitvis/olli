import { TreeItemLink } from "./TreeItemLinks";
export declare class TreeLinks {
    domNode: any;
    treeitems: TreeItemLink[];
    firstTreeitem: TreeItemLink;
    lastTreeitem: TreeItemLink;
    currentNode: TreeItemLink;
    constructor(node: HTMLElement | null);
    init(): void;
    setFocusToItem(treeitem: TreeItemLink): void;
    setFocusToAdjacentItem(treeitem: TreeItemLink): void;
    setFocusToNextItem(): void;
    setFocusToNextLaver(): void;
    setFocusToPreviousItem(): void;
    setFocusToParentItem(): void;
    setFocusToFirstItem(): void;
    setFocusToLastItem(): void;
    expandTreeitem(currentItem: TreeItemLink): void;
    expandAllSiblingItems(currentItem: TreeItemLink): void;
    collapseTreeitem(item: TreeItemLink): void;
    updateVisibleTreeitems(): void;
    focusOnSpecificNode(searchStr: string, base: TreeItemLink, visitedNodes?: TreeItemLink[]): void;
}
//# sourceMappingURL=TreeLink.d.ts.map