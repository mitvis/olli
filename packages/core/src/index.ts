import { OlliSpec } from './Types';
import { ElaboratedOlliNode } from './Structure/Types';
import { OlliRuntime, TreeCallbacks } from './Runtime/OlliRuntime';
import { updateGlobalStateOnInitialRender } from './util/globalState';
import { elaborateSpec } from './util/elaborate';
import { openSelectionDialog, openTableDialog } from './Render/Dialog';

export * from './Types';
export * from './Structure/Types';
export * from './util/types';

export type OlliConfigOptions = {
  onFocus?: (elem: HTMLElement, olliNode: ElaboratedOlliNode) => void;
};

export function olli(olliSpec: OlliSpec, config?: OlliConfigOptions): HTMLElement {
  olliSpec = elaborateSpec(olliSpec);

  const renderContainer: HTMLElement = document.createElement('div');
  renderContainer.classList.add('olli-vis');

  const treeConfig: TreeCallbacks = {
    onFocus: config?.onFocus,
    onTable: (node: ElaboratedOlliNode) => {
      openTableDialog(node, t, renderContainer);
    },
    onSelection: () => {
      openSelectionDialog(t, renderContainer);
    },
  };

  const t = new OlliRuntime(olliSpec, renderContainer, treeConfig);
  t.init();
  updateGlobalStateOnInitialRender(t);

  return renderContainer;
}
