import { OlliVisSpec } from "./Types"
import { renderTable } from "./Render/Table"
import { renderTree } from "./Render/TreeView"
import { TreeLinks } from "./Render/TreeView/TreeLink"
import { olliVisSpecToTree } from "./Structure"
import { AccessibilityTree } from "./Structure/Types"

export * from './Types';

/**
 * The configuration object outlining how an accessible visualization should be rendered based on a {@link OlliVisSpec}.
 */
type OlliConfigOptions = {
    renderType?: 'tree' | 'table',
    ariaLabel?: string // TODO
}

/**
 *
 * @param config The {@link OlliConfigOptions} object to specify how an accessible visualization should be generated.
 */
export function olli(olliVisSpec: OlliVisSpec, config?: OlliConfigOptions): HTMLElement {
    const tree: AccessibilityTree = olliVisSpecToTree(olliVisSpec);

    const htmlRendering: HTMLElement = document.createElement("div");
    htmlRendering.classList.add('olli-vis');

    config = {
        renderType: config?.renderType ?? 'tree',
        ariaLabel: config?.ariaLabel ?? undefined
    }

    switch (config.renderType) {
        case ("table"):
            htmlRendering.appendChild(renderTable(tree.root, tree.fieldsUsed));
            break;
        case ('tree'):
        default:
            const ul = renderTree(tree.root);
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
