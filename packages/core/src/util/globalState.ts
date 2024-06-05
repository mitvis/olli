import { openTableDialog } from '../Render/Dialog';
import { OlliRuntime } from '../Runtime/OlliRuntime';
import { nodeIsTextInput } from './events';

export interface OlliGlobalState {
  keyListenerAttached: boolean;
  lastVisitedInstance: OlliRuntime;
  instancesOnPage: OlliRuntime[];
}

export const getOlliGlobalState = (): OlliGlobalState => {
  if (!(window as any)._olli) {
    (window as any)._olli = {};
  }
  return (window as any)._olli;
};

export const setOlliGlobalState = (state: Partial<OlliGlobalState>) => {
  (window as any)._olli = {
    ...(window as any)._olli,
    ...state,
  };
};

export const updateGlobalStateOnInitialRender = (t: OlliRuntime) => {
  // append t to list of trees on page
  setOlliGlobalState({
    instancesOnPage: (getOlliGlobalState().instancesOnPage || []).concat([t]),
  });

  // add key listener if not already attached
  if (!getOlliGlobalState().keyListenerAttached) {
    document.addEventListener('keydown', (e: any) => {
      if (!nodeIsTextInput(document.activeElement)) {
        const { lastVisitedInstance, instancesOnPage } = getOlliGlobalState();
        switch (e.code) {
          case 'KeyO':
            const currentInstance =
              (lastVisitedInstance && document.body.contains(lastVisitedInstance.rootDomNode)
                ? lastVisitedInstance
                : false) || (instancesOnPage.length ? instancesOnPage[0] : null);
            if (currentInstance) {
              if (document.activeElement === currentInstance.rootDomNode) {
                // we are currently focusing on the root of this tree
                const idx = instancesOnPage.indexOf(currentInstance);
                if (e.shiftKey) {
                  // shift + t means jump to the prev one
                  if (idx > 0) {
                    const prev = instancesOnPage[idx - 1];
                    prev.setFocusToItem(prev.rootTreeItem);
                  } else {
                    // TODO play some sort of earcon / notification to indicate you are at a boundary
                  }
                } else {
                  // jump to the next one
                  if (idx < instancesOnPage.length - 1) {
                    const next = instancesOnPage[idx + 1];
                    next.setFocusToItem(next.rootTreeItem);
                  } else {
                    // TODO play some sort of earcon / notification to indicate you are at a boundary
                  }
                }
              } else {
                if (
                  !currentInstance.lastFocusedTreeItem ||
                  document.activeElement === currentInstance.lastFocusedTreeItem.domNode
                ) {
                  // we are not focused on the root of the tree, so jump there
                  currentInstance.setFocusToItem(currentInstance.rootTreeItem);
                } else {
                  // we are focused somewhere else, so jump back to the last focused item
                  currentInstance.setFocusToItem(currentInstance.lastFocusedTreeItem);
                }
              }
            }
            break;
        }
      }

      ////
      const { lastVisitedInstance, instancesOnPage } = getOlliGlobalState();
      const currentInstance =
        (lastVisitedInstance && document.body.contains(lastVisitedInstance.rootDomNode)
          ? lastVisitedInstance
          : false) || (instancesOnPage.length ? instancesOnPage[0] : null);
      const currentItem = currentInstance.lastFocusedTreeItem || currentInstance.rootTreeItem;

      switch (e.key) {
        case 'Enter':
        case ' ':
          if (currentItem.isExpandable) {
            if (currentItem.isExpanded()) {
              currentInstance.collapseTreeItem(currentItem);
            } else {
              currentInstance.expandTreeItem(currentItem);
            }
          }
          break;
        case 'ArrowDown':
          if (currentItem.children.length > 0 && currentItem.isExpandable) {
            currentInstance.setFocusToNextLayer(currentItem);
          }
          break;
        case 'Escape':
        case 'ArrowUp':
          if (currentItem.inGroup) {
            currentInstance.setFocusToParentItem(currentItem);
          }
          break;
        case 'ArrowLeft':
          if (e.shiftKey) {
            if (currentInstance.isLateralPossible()) {
              currentInstance.setFocusToLateralItem(currentItem, 'left');
            }
          } else {
            currentInstance.setFocusToPreviousItem(currentItem);
          }
          break;
        case 'ArrowRight':
          if (e.shiftKey) {
            if (currentInstance.isLateralPossible()) {
              currentInstance.setFocusToLateralItem(currentItem, 'right');
            }
          } else {
            currentInstance.setFocusToNextItem(currentItem);
          }
          break;
        case 'Home':
          if (currentItem.parent) {
            currentInstance.setFocusToFirstInLayer(currentItem);
          }
          break;

        case 'End':
          if (currentItem.parent) {
            currentInstance.setFocusToLastInLayer(currentItem);
          }
          break;
        case 'x':
          currentInstance.focusOnNodeType('xAxis', currentItem);
          break;
        case 'y':
          currentInstance.focusOnNodeType('yAxis', currentItem);
          break;
        case 'l':
          currentInstance.focusOnNodeType('legend', currentItem);
          break;
        case 't':
          openTableDialog(currentItem.olliNode, currentInstance);
          break;
        // case 'f':
        //   openSelectionDialog(this.olliNode, getOlliGlobalState().lastVisitedInstance);
        //   break;
        // case 'r':
        //   openTargetedNavigationDialog(getOlliGlobalState().lastVisitedInstance);
        //   break;
        default:
          // return to avoid preventing default event action
          return;
      }
    });
    setOlliGlobalState({ keyListenerAttached: true });
  }
};
