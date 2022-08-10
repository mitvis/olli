import { OlliVisSpec } from "olli-adapters/src/Types"
import { renderTable } from "./Render/Table"
import { renderTree } from "./Render/TreeView"
import { TreeLinks } from "./Render/TreeView/TreeLink"
import { olliVisSpecToTree } from "./Structure"
import { AccessibilityTreeNode } from "./Structure/Types"

/**
 * The configuration object outlining how an accessible visualization should be rendered based on a {@link OlliVisSpec}.
 */
type OlliConfigOptions = {
    renderType?: 'tree' | 'table',
    ariaLabel?: string
}

/**
 *
 * @param config The {@link OlliConfigOptions} object to specify how an accessible visualization should be generated.
 */
export function olli(olliVisSpec: OlliVisSpec, config?: OlliConfigOptions): HTMLElement {
    let chartEncodingTree: AccessibilityTreeNode = olliVisSpecToTree(olliVisSpec);

    let htmlRendering: HTMLElement;

    if (config) {
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
    } else {
        htmlRendering = document.createElement("ul").appendChild(renderTree(chartEncodingTree));
        new TreeLinks(htmlRendering).init();
    }

    document.addEventListener('keypress', (keyStroke) => {
        if (keyStroke.key.toLowerCase() === 't') {
            const treeview = document.getElementById('treeView');
            if (treeview !== null) {
                (treeview as any).firstChild!.focus()
            }
        }
    })

    return htmlRendering
}
