import { OlliVisSpec } from "./Types"
import { renderTable } from "./Render/Table"
import { Tree } from "./Render/TreeView/Tree"
import { renderTree } from "./Render/TreeView"
import { olliVisSpecToTree } from "./Structure"
import { AccessibilityTree } from "./Structure/Types"
import { renderMenu } from "./Settings"
import { addMenuCommands, addTreeCommands } from "./Settings/commands"

export * from './Types';

/**
 * The configuration object outlining how an accessible visualization should be rendered based on a {@link OlliVisSpec}.
 */
export type OlliConfigOptions = {
    renderType?: 'tree' | 'table',
    onFocus?: (elem: HTMLElement) => void
}

/**
 *
 * @param config The {@link OlliConfigOptions} object to specify how an accessible visualization should be generated.
 */
export function olli(olliVisSpec: OlliVisSpec, config?: OlliConfigOptions): HTMLElement {
    const tree: AccessibilityTree = olliVisSpecToTree(olliVisSpec);

    const htmlRendering: HTMLElement = document.createElement("div");

    config = {
        renderType: config?.renderType || 'tree',
        onFocus: config?.onFocus
    }

    switch (config.renderType) {
        case ("table"):
            htmlRendering.appendChild(renderTable(tree.root.selected, tree.fieldsUsed));
            break;
        case ('tree'):
        default:
            const menu = renderMenu(tree);
            menu.setAttribute('style', 'display: none');
            menu.setAttribute('aria-hidden', 'true');
            htmlRendering.appendChild(menu);

            // TODO formalize
            const dropdown = document.createElement('select');
            dropdown.setAttribute('id', 'command-dropdown');
            for (const option of ['name', 'parent', 'children', 'size', 'etc']) {
                let opt = document.createElement('option');
                opt.innerText = option;
                opt.value = option;
                dropdown.appendChild(opt);
            }
            dropdown.setAttribute('style', 'display: none');
            dropdown.setAttribute('aria-hidden', 'true');
            htmlRendering.appendChild(dropdown);


            const ul = renderTree(tree);
            const container = document.createElement('div');
            container.classList.add('olli-vis');
            container.appendChild(ul);
            htmlRendering.appendChild(container);
            const t = new Tree(ul, config.onFocus);
            t.init();
            document.addEventListener('keypress', (e) => {
                if (e.key === 't' && !t.currentlyTypingToken()) {
                    t.setFocusToItem(t.rootTreeItem);
                }
            })

            // TODO formalize
            dropdown.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' || event.key === 'Escape') {
                    dropdown.setAttribute('style', 'display: none');
                    dropdown.setAttribute('aria-hidden', 'true');
                    t.setFocusToItem(t.lastFocusedItem);
                }

                if (event.key === "Tab") {
                    event.preventDefault();
                }
            });

            addMenuCommands(menu, t);
            addTreeCommands(ul, tree, t);
            break;
    }

    return htmlRendering;
}
