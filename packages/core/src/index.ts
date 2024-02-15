import { OlliSpec } from './Types';
import { ElaboratedOlliNode } from './Structure/Types';
import { OlliRuntime, RuntimeCallbacks } from './Runtime/OlliRuntime';
import { updateGlobalStateOnInitialRender } from './util/globalState';
import { elaborateSpec } from './util/elaborate';
import { LogicalComposition } from 'vega-lite/src/logical';
import { FieldPredicate } from 'vega-lite/src/predicate';
import { bin } from './Annotation';

export * from './Types';
export * from './Structure/Types';
export * from './util/types';
export type { OlliGlobalState } from './util/globalState';

export type OlliConfigOptions = {
  onFocus?: (elem: HTMLElement, olliNode: ElaboratedOlliNode) => void;
  onSelection?: (predicate: LogicalComposition<FieldPredicate>) => void;
};

export function olli(olliSpec: OlliSpec, onUpdated, config?: OlliConfigOptions): HTMLElement {
  olliSpec = elaborateSpec(olliSpec);

  const renderContainer: HTMLElement = document.createElement('div');
  renderContainer.classList.add('olli-vis');

  const treeCallbacks: RuntimeCallbacks = {
    onFocus: config?.onFocus,
    onSelection: config?.onSelection,
  };

  const t = new OlliRuntime(olliSpec, renderContainer, treeCallbacks);
  t.init();
  updateGlobalStateOnInitialRender(t);

  // Use bin function and .then() to handle the promise
  if (onUpdated){
    bin(olliSpec).then(binNodes => {
      console.log(olliSpec)
      olliSpec.structure.push(...binNodes);
      olliSpec = elaborateSpec(olliSpec);
      console.log(olliSpec)
      // After bin nodes are added, initialize and render the updated tree
      const t_2 = new OlliRuntime(olliSpec, renderContainer, treeCallbacks);
      t_2.init();
      updateGlobalStateOnInitialRender(t_2);
  
      // Notify the caller that the renderContainer has been updated
      if (typeof onUpdated === 'function') {
          onUpdated(renderContainer);
      }
    });
  }

  // Return the initial render container immediately
  return renderContainer;

}
