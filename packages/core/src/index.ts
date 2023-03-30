import { OlliVisSpec } from "./Types"
import { renderTable } from "./Render/Table"
import { Tree } from "./Render/TreeView/Tree"
import { renderTree } from "./Render/TreeView"
import { olliVisSpecToTree } from "./Structure"
import { AccessibilityTree } from "./Structure/Types"
import { renderMenu, renderCommandsBox } from "./Settings"
import { addMenuCommands, addTreeCommands, addCommandsBoxCommands, log } from "./Settings/commands"
import { updateGlobalStateOnRender } from "./utils"

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

            const commandsMenu = renderCommandsBox();
            commandsMenu.setAttribute('style', 'display: none');
            commandsMenu.setAttribute('aria-hidden', 'true');
            htmlRendering.appendChild(commandsMenu);

            const ul = renderTree(tree);
            const container = document.createElement('div');
            container.classList.add('olli-vis');
            container.setAttribute('role', 'application');
            container.appendChild(ul);
            htmlRendering.appendChild(container);
            const t = new Tree(ul, config.onFocus);
            t.init();
            document.addEventListener('keypress', (e) => {
                if (e.key === 't' && !t.currentlyTypingToken()) {
                    t.setFocusToItem(t.rootTreeItem);
                }
            })

            const submit = document.createElement('button');
            submit.innerText = "Submit logs"
            submit.addEventListener('click', () => {
                const formUrl = 'https://docs.google.com/forms/d/e/1FAIpQLSeNGFhokzskkyxfgZz6hVHK1W-TbItjzgMsOw_LbEICNGxRAg/formResponse?usp=pp_url&entry.1882377581='
                fetch(formUrl + JSON.stringify(log), {
                    mode: 'no-cors',
                    method: 'GET',
                });
            });
            const submitHeader = document.createElement('h5');
            submitHeader.innerText = 'Finish study';
            htmlRendering.appendChild(submitHeader);
            htmlRendering.appendChild(submit);

            addMenuCommands(menu, t);
            addTreeCommands(ul, tree, t);
            addCommandsBoxCommands(commandsMenu, tree, t);
            updateGlobalStateOnRender(t);
            break;
    }

    return htmlRendering;
}
