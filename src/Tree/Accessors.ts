// import { AccessibilityTreeNode, NodeDirection, NodeType } from "./Types";

// //     Function for finding node based on type
// export function traverseToNode(type: NodeType, base: AccessibilityTreeNode, visitedNodes?: AccessibilityTreeNode[]): AccessibilityTreeNode | undefined {
//     let visited: AccessibilityTreeNode[] = visitedNodes ? visitedNodes : [];
//     if (!visited.includes(base)) {
//         visited.push(base);
//         if (base.type === type) {
//             return base
//         } else {
//             base.children.forEach((child: AccessibilityTreeNode) => {
//                 return traverseToNode(type, child, visitedNodes)
//             });
//         }
//     }
// }

// // addAdjacentNode ->
// //      Adds a provided node adjacent to a specified node with the given direction
// export function addAdjacentNode(adjNode: AccessibilityTreeNode, baseNode: AccessibilityTreeNode, orientation: NodeDirection): AccessibilityTreeNode {
//     if (orientation === "up") {
//         const prevParent = baseNode.parent;
//         prevParent?.children.filter((node: AccessibilityTreeNode) => node !== baseNode);
//         prevParent?.children.push(adjNode);
//         baseNode.parent = adjNode;
//         adjNode.children.push(baseNode);
//     } else if (orientation === "down") {
//         baseNode.children.push(adjNode);
//         adjNode.parent = baseNode;
//     } else if (orientation === "left") {
//         const parent = baseNode.parent;
//         const baseIndex = parent?.children.indexOf(baseNode);
//         baseIndex !== 0 ? parent?.children[0] : parent?.children.unshift(adjNode);
//     } else if (orientation === "right") {
//         const parent = baseNode.parent;
//         const baseIndex = parent?.children.indexOf(baseNode);
//         baseIndex !== parent?.children.length ? parent?.children[0] : parent?.children.push(adjNode);
//     }
//     return baseNode;
// }