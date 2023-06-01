import { OlliSpec } from './Types';
import { ElaboratedOlliNode } from './Structure/Types';
import { Tree } from './Render/TreeView/Tree';
import { renderTree } from './Render/TreeView';
import { olliSpecToTree, treeToNodeLookup } from './Structure';
import { updateGlobalStateOnRender } from './util/globalState';
import { generateDescriptions } from './Description';
import { predicateToSelectionStore } from './util/selection';
import { inferStructure } from './Structure/infer';

export * from './Types';
export * from './Structure/Types';
export * from './util/types';

/**
 * The configuration object outlining how an accessible visualization should be rendered based on a {@link OlliSpec}.
 */
export type OlliConfigOptions = {
  onFocus?: (elem: HTMLElement) => void;
};

/**
 *
 * @param config The {@link OlliConfigOptions} object to specify how an accessible visualization should be generated.
 */
export function olli(olliSpec: OlliSpec, config?: OlliConfigOptions): HTMLElement {
  const namespace = (Math.random() + 1).toString(36).substring(7);

  if (!olliSpec.structure) {
    olliSpec.structure = inferStructure(olliSpec);
  }

  const tree: ElaboratedOlliNode = olliSpecToTree(olliSpec, namespace);
  const lookup = treeToNodeLookup(tree);

  // console.log('tree', tree);

  const htmlRendering: HTMLElement = document.createElement('div');
  htmlRendering.classList.add('olli-vis');

  config = {
    onFocus: config?.onFocus,
  };

  const ul = renderTree(tree);
  htmlRendering.appendChild(ul);

  generateDescriptions(olliSpec, tree);

  const t = new Tree(ul, lookup, config.onFocus);
  t.init();
  updateGlobalStateOnRender(t);

  return htmlRendering;
}
