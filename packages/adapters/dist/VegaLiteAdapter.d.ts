import { VisAdapter } from "./Types";
/**
 * Adapter to deconstruct Vega-Lite visualizations into an {@link OlliVisSpec}
 * @param vlView The Vega Scenegraph from the view
 * @param spec The Vega-Lite Spec that rendered the visualization
 * @returns An {@link OlliVisSpec} of the deconstructed Vega-Lite visualization
 */
export declare const VegaLiteAdapter: VisAdapter;
/**
 * Traverses a provided scenegraph node for nodes of a specific role.
 * @param scenegraphNode The root scenegraph node to traverse
 * @param passRole The string of the node role to search for
 * @returns an array of ndoes that contain the specified role
 */
export declare function findScenegraphNodes(scenegraphNode: any, passRole: string): any[];
//# sourceMappingURL=VegaLiteAdapter.d.ts.map