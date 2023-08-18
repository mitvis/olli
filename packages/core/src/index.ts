import { OlliSpec } from './Types';
import { ElaboratedOlliNode } from './Structure/Types';
import { initSettings } from './Customization';
import { OlliRuntime, RuntimeCallbacks } from './Runtime/OlliRuntime';
import { updateGlobalStateOnInitialRender } from './util/globalState';
import { elaborateSpec } from './util/elaborate';
import { LogicalComposition } from 'vega-lite/src/logical';
import { FieldPredicate } from 'vega-lite/src/predicate';

export * from './Types';
export * from './Structure/Types';
export * from './util/types';
export type { OlliGlobalState } from './util/globalState';

export type OlliConfigOptions = {
  onFocus?: (elem: HTMLElement, olliNode: ElaboratedOlliNode) => void;
  onSelection?: (predicate: LogicalComposition<FieldPredicate>) => void;
};

export function olli(olliSpec: OlliSpec, config?: OlliConfigOptions): HTMLElement {
  olliSpec = elaborateSpec(olliSpec);

  const renderContainer: HTMLElement = document.createElement('div');
  renderContainer.classList.add('olli-vis');

  const treeCallbacks: RuntimeCallbacks = {
    onFocus: config?.onFocus,
    onSelection: config?.onSelection,
  };

  initSettings(); // must be before t.init because tree node text pulls from settings
  const t = new OlliRuntime(olliSpec, renderContainer, treeCallbacks);
  t.init();
  updateGlobalStateOnInitialRender(t);

  return renderContainer;
}
