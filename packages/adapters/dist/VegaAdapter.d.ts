import { VisAdapter } from "./Types";
/**
* Adapter function that breaks down a Vega visualization into it's basic visual grammar
* @param view The Vega Scenegraph object used in the visualization
* @param spec The Vega Specification used to generate the visualization
* @returns the {@link OlliVisSpec}, the non-concrete visualization information that can be later used to
* generate the Accessibility Tree Encoding
*/
export declare const VegaAdapter: VisAdapter;
export declare function findScenegraphNodes(scenegraphNode: any, passRole: string): any[];
export declare function verifyNode(scenegraphNode: any, cancelRoles: string[]): boolean;
//# sourceMappingURL=VegaAdapter.d.ts.map