export type NodeType = "chart" | "xAxis" | "yAxis" | "data" | "filteredData" | "legend" | "grid" | "multiView";

export type NodeDirection = "up" | "down" | "left" | "right"

export type BaseAccessibilityTreeNode = {
    description: string,
    parent: AccessibilityTreeNode | null,
    children: AccessibilityTreeNode[],
    selected: any[],
    lastVisitedChild: AccessibilityTreeNode | null;
    type: NodeType,
    fieldsUsed: string[]
}

export interface VisualEncodingNode extends BaseAccessibilityTreeNode {
    chartType: string
}

export interface StructuralTreeNode extends BaseAccessibilityTreeNode {
    field: string
}

export type AccessibilityTreeNode = BaseAccessibilityTreeNode | VisualEncodingNode | StructuralTreeNode;

/*
TODO:
  - Expand type system to include more meta-data that can be accessed and allow each node to be easily expanded upon
  - Possibly create different types for different nodes that can specifically be accessed in functions to get more information
*/
