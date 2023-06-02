import { OlliSpec } from './Types';
import { ElaboratedOlliNode } from './Structure/Types';
import { Tree, TreeCallbacks } from './Render/TreeView/Tree';
import { renderTree } from './Render/TreeView';
import { olliSpecToTree, treeToNodeLookup } from './Structure';
import { updateGlobalStateOnRender } from './util/globalState';
import { generateDescriptions } from './Description';
import { elaborateSpec } from './util/elaborate';
import { openTableDialog } from './Render/Dialog';

export * from './Types';
export * from './Structure/Types';
export * from './util/types';

/**
 * The configuration object outlining how an accessible visualization should be rendered based on a {@link OlliSpec}.
 */
export type OlliConfigOptions = {
  onFocus?: (elem: HTMLElement, olliNode: ElaboratedOlliNode) => void;
};

/**
 *
 * @param config The {@link OlliConfigOptions} object to specify how an accessible visualization should be generated.
 */
export function olli(olliSpec: OlliSpec, config?: OlliConfigOptions): HTMLElement {
  console.log('olliSpec', olliSpec);
  olliSpec = elaborateSpec(olliSpec);
  const tree: ElaboratedOlliNode = olliSpecToTree(olliSpec);
  const lookup = treeToNodeLookup(tree);

  generateDescriptions(olliSpec, tree);

  console.log('tree', tree);

  const renderContainer: HTMLElement = document.createElement('div');
  renderContainer.classList.add('olli-vis');
  const ul = renderTree(tree, olliSpec, renderContainer);
  renderContainer.appendChild(ul);

  const treeConfig: TreeCallbacks = {
    onFocus: config?.onFocus,
    onTable: (node: ElaboratedOlliNode) => {
      openTableDialog(node, olliSpec, renderContainer);
    },
  };

  const t = new Tree(ul, lookup, treeConfig);
  t.init();
  updateGlobalStateOnRender(t);

  return renderContainer;
}
