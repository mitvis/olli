import { OlliSpec } from './Types';
import { ElaboratedOlliNode } from './Structure/Types';
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
  const renderContainer: HTMLElement = document.createElement('div');
  renderContainer.classList.add('olli-vis');

  elaborateSpec(olliSpec).then((elaboratedSpec) => {
    const treeCallbacks: RuntimeCallbacks = {
      onFocus: config?.onFocus,
      onSelection: config?.onSelection,
    };

    const t = new OlliRuntime(elaboratedSpec, renderContainer, treeCallbacks);
    t.init();
    updateGlobalStateOnInitialRender(t);
  });

  return renderContainer;
}
