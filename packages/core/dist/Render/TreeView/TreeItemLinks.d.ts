import { TreeLinks } from "./TreeLink";
export declare class TreeItemLink {
    tree: TreeLinks;
    level: number;
    parent: TreeItemLink;
    children: TreeItemLink[];
    domNode: any;
    label: string;
    stopDefaultClick: boolean;
    isExpandable: boolean;
    isVisible: boolean;
    inGroup: boolean;
    lastVisitedChild: TreeItemLink | null;
    keyCode: Readonly<{
        RETURN: number;
        SPACE: number;
        PAGEUP: number;
        PAGEDOWN: number;
        END: number;
        HOME: number;
        LEFT: number;
        UP: number;
        RIGHT: number;
        DOWN: number;
        X: number;
        Y: number;
        G: number;
        L: number;
        W: number;
        A: number;
        S: number;
        D: number;
        ESCAPE: number;
        PLUS: number;
        MINUS: number;
    }>;
    constructor(node: any, treeObj: any, group: any, level: number);
    init(): void;
    isExpanded(): boolean;
    handleKeydown(event: any): void;
    checkBaseKeys(event: any): void;
    handleClick(event: any): void;
    handleFocus(event: any): void;
    handleBlur(event: any): void;
    handleMouseOver(event: any): void;
    handleMouseOut(event: any): void;
    private getRootNode;
    private shiftToNode;
}
export declare class GridTreeItemLink extends TreeItemLink {
    private gridIndex;
    private gridWidth;
    rowPosition: number;
    constructor(node: any, treeObj: any, group: any, level: number);
    handleKeydown(event: any): void;
}
//# sourceMappingURL=TreeItemLinks.d.ts.map