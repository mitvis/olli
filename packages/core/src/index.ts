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

  // Create a live region for accessibility notifications
  const liveRegion = document.createElement('div');
  liveRegion.setAttribute('aria-live', 'assertive');
  liveRegion.setAttribute('role', 'alert'); // Enhances semantic meaning for assistive technologies
  liveRegion.style.position = 'absolute'; // Position off-screen if visually hidden
  liveRegion.style.left = '-9999px';
  liveRegion.style.width = '1px';
  liveRegion.style.height = '1px';
  liveRegion.style.overflow = 'hidden';

  // Append the live region to the document body or another appropriate container
  document.body.appendChild(liveRegion); // Adjust as necessary

  const treeCallbacks: RuntimeCallbacks = {
    onFocus: config?.onFocus,
    onSelection: config?.onSelection,
  };

  let t = new OlliRuntime(olliSpec, renderContainer, treeCallbacks);
  t.init();
  updateGlobalStateOnInitialRender(t);

  // Use bin function and .then() to handle the promise
  if (onUpdated){
    bin(olliSpec).then(binNodes => {
      
      olliSpec.structure.push(...binNodes);
      olliSpec = elaborateSpec(olliSpec);
      console.log(olliSpec)

      // After bin nodes are added, initialize and render the updated tree
      t = new OlliRuntime(olliSpec, renderContainer, treeCallbacks);
      t.init();
      updateGlobalStateOnInitialRender(t);
      // Restart focus onto new render container. 
      t.setFocusToItem(t.rootTreeItem);

      // Update the live region with a notification message
      liveRegion.textContent = 'Semantic bins now available. Press O to see updated Olli tree.'; // This will be announced by screen readers
  
      // Notify the caller that the renderContainer has been updated
      if (typeof onUpdated === 'function') {
          onUpdated(renderContainer);
      }
    });
  }

  // Return the initial render container immediately
  return renderContainer;

}
