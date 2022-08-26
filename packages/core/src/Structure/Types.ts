/**
 * Meta-data information to what kind of node is currently visited
 */
export type NodeType = "chart" | "xAxis" | "yAxis" | "data" | "filteredData" | "legend" | "grid" | "multiView";

/**
 * A {@link BaseAccessibilityTreeNode} is a tree representation of a visualization and its data starting from
 * a high-level overview of the visualization to structured elements (ex: axes and legends) to eventually specific data points.
 *
 * description: A verbose description of the node used when rendering
 *
 * parent: The parent node of the tree, null if this node is the root
 *
 * children: The children tree nodes that this element has
 *
 * selected: The array of data points that are contained in this node and all children nodes
 *
 * type: The {@link NodeType} of this element
 *
 * fieldsUsed: The data fields used (assists with rendering data tables)
 */
export type BaseAccessibilityTreeNode = {
    type: NodeType,
    parent: AccessibilityTreeNode | null,
    selected: any[],
    description: string,
    children: AccessibilityTreeNode[],

}

/**
 * Node for visual elements such as marks, or anything that relates to the visual aspects of a chart
 */
export interface VisualEncodingNode extends BaseAccessibilityTreeNode {
    chartType: string,
}

/**
 * Node for structured elements such as axes and legends
 */
export interface StructuralTreeNode extends BaseAccessibilityTreeNode {
    field: string,
}

/**
 * Union type of different tree nodes that all share {@link BaseAccessibilityTreeNode} attributes
 */
export type AccessibilityTreeNode = BaseAccessibilityTreeNode | VisualEncodingNode | StructuralTreeNode;

export type AccessibilityTree = {
    root: AccessibilityTreeNode,
    fieldsUsed: string[]
}

/*
TODO:
  - Expand type system to include more meta-data that can be accessed and allow each node to be easily expanded upon
  - Possibly create different types for different nodes that can specifically be accessed in functions to get more information
*/
