import { OlliVisSpec } from "@olli/adapters/src/Types"
import { renderTable } from "./Render/Table"
import { renderTree } from "./Render/TreeView"
import { TreeLinks } from "./Render/TreeView/TreeLink"
import { olliVisSpecToTree } from "./Structure"
import { AccessibilityTreeNode } from "./Structure/Types"

/**
 * The configuration object outlining how an accessible visualization should be rendered based on a {@link VisualizationStructure}.
 */
type OlliConfigOptions = {
    visualization: OlliVisSpec,
    domId: string,
    renderType?: 'tree' | 'table',
    ariaLabel?: string
}

/**
 *
 * @param config The {@link OlliConfigOptions} object to specify how an accessible visualization should be generated.
 */
export function olli(config: OlliConfigOptions) {
    let chartEncodingTree: AccessibilityTreeNode = olliVisSpecToTree(config.visualization);

    let htmlRendering: HTMLElement;

    switch (config.renderType) {
        case ("table"):
            htmlRendering = renderTable(chartEncodingTree);
            break;
        case ('tree'):
        default:
            htmlRendering = document.createElement("ul").appendChild(renderTree(chartEncodingTree));
            new TreeLinks(htmlRendering).init();
    }

    if (config.ariaLabel) {
        htmlRendering.setAttribute("aria-label", config.ariaLabel);
    }


    document.getElementById(config.domId)?.appendChild(htmlRendering);
}

(window as any).olli = olli
