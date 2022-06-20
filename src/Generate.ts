import { AbstractedVis } from "./Adapters/Types"
import { VegaAdapter } from "./Adapters/VegaAdapter"
import { VegaLiteAdapter } from "./Adapters/VegaLiteAdapter"
import { renderTable } from "./Render/Table"
import { renderTree } from "./Render/Tree/Tree"
import { TreeLinks } from "./Render/Tree/TreeLink"
import { abstractedVisToTree } from "./Tree/Encoding"
import { AccessibilityTreeNode } from "./Tree/Types"

type TreeConfigOptions = {
    visualization: AbstractedVis,
    domId: string,
    renderType?: "table",
    ariaLabel?: string
}

export function olli(config: TreeConfigOptions) {
    let chartEncodingTree: AccessibilityTreeNode = abstractedVisToTree(config.visualization);

    let htmlRendering: HTMLElement;

    switch (config.renderType) {
        case ("table"):
            htmlRendering = renderTable(chartEncodingTree);
            break;
        default:
            htmlRendering = renderTree(chartEncodingTree);
            new TreeLinks(htmlRendering).init();
    }

    if (config.ariaLabel) {
        htmlRendering.setAttribute("aria-label", config.ariaLabel);
    }


    document.getElementById(config.domId)?.appendChild(htmlRendering);
}

(window as any).olli = olli;