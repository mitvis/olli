import { AbstractedVis } from "./Adapters/Types"
import { VegaAdapter } from "./Adapters/VegaAdapter"
import { VegaLiteAdapter } from "./Adapters/VegaLiteAdapter"
import { renderTable } from "./Render/Table"
import { renderTree } from "./Render/Tree/Tree"
import { TreeLinks } from "./Render/Tree/TreeLink"
import { abstractedVisToTree } from "./Tree/Encoding"
import { AccessibilityTreeNode } from "./Tree/Types"

type TreeConfigOptions = {
    adapter: "vega" | "vega-lite",
    renderType: "tree" | "table",
    domId: string,
    visObject: any,
    visSpec: any,
    ariaLabel?: string
}

export function createAccessibilityTree(options: TreeConfigOptions) {
    let abstractedVisualization: AbstractedVis
    switch (options.adapter) {
        case ("vega"):
            abstractedVisualization = VegaAdapter(options.visObject.scenegraph().root.items[0], options.visSpec);
            break;
        case ("vega-lite"):
            abstractedVisualization = VegaLiteAdapter(options.visObject.scenegraph().root.items[0], options.visSpec);
            break;
    }

    let chartEncodingTree: AccessibilityTreeNode = abstractedVisToTree(abstractedVisualization);

    let htmlRendering: HTMLElement;

    switch (options.renderType) {
        case ("table"):
            htmlRendering = renderTable(chartEncodingTree);
            break;
        case ("tree"):
            htmlRendering = renderTree(chartEncodingTree);
            new TreeLinks(htmlRendering).init();
    }

    if (options.ariaLabel) {
        htmlRendering.setAttribute("aria-label", options.ariaLabel);
    }


    document.getElementById(options.domId)?.appendChild(htmlRendering);
}

(window as any).createAccessibilityTree = createAccessibilityTree;