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
    const chartEncodingRoot: AccessibilityTreeNode = olliVisSpecToTree(olliVisSpec).root;

    const htmlRendering: HTMLElement = document.createElement("div");
    htmlRendering.classList.add('olli-vis');

    config = {
        renderType: config?.renderType ?? 'tree',
        ariaLabel: config?.ariaLabel ?? undefined
    }

    switch (config.renderType) {
        case ("table"):
            htmlRendering.appendChild(renderTable(chartEncodingRoot));
            break;
        case ('tree'):
        default:
            const ul = renderTree(chartEncodingRoot);
            htmlRendering.appendChild(ul);
            new TreeLinks(ul).init();
            break;
    }

    if (config.ariaLabel) {
        htmlRendering.setAttribute("aria-label", config.ariaLabel);
    }

    document.addEventListener('keypress', (keyStroke) => {
        if (keyStroke.key.toLowerCase() === 't') {
            const treeview = document.getElementById('treeView');
            if (treeview !== null) {
                (treeview as any).firstChild!.focus()
            }
        }
    })

    return htmlRendering;
}
