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

export type OlliConfigOptions = {
  onFocus?: (elem: HTMLElement, olliNode: ElaboratedOlliNode) => void;
};

export function olli(olliSpec: OlliSpec, config?: OlliConfigOptions): HTMLElement {
  olliSpec = elaborateSpec(olliSpec);
  const tree: ElaboratedOlliNode = olliSpecToTree(olliSpec);
  const lookup = treeToNodeLookup(tree);

  generateDescriptions(olliSpec, tree);

  const renderContainer: HTMLElement = document.createElement('div');
  renderContainer.classList.add('olli-vis');
  const ul = renderTree(tree);
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
