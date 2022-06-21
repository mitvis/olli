import { AbstractedVis } from "./Adapters/Types"
import { renderTable } from "./Render/Table"
import { renderTree } from "./Render/TreeView/Tree"
import { TreeLinks } from "./Render/TreeView/TreeLink"
import { abstractedVisToTree } from "./Tree/Encoding"
import { AccessibilityTreeNode } from "./Tree/Types"

/**
 * The configuration object outlining how an accessible visualization should be rendered based on a {@link VisualizationStructure}.
 */
type OlliConfigOptions = {
    visualization: AbstractedVis,
    domId: string,
    renderType?: 'tree' | 'table',
    ariaLabel?: string
}

/**
 * 
 * @param config The {@link OlliConfigOptions} object to specify how an accessible visualization should be generated.
 */
export function olli(config: OlliConfigOptions) {
    let chartEncodingTree: AccessibilityTreeNode = abstractedVisToTree(config.visualization);

    let htmlRendering: HTMLElement;

    switch (config.renderType) {
        case ("table"):
            htmlRendering = renderTable(chartEncodingTree);
            break;
        case ('tree'):
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