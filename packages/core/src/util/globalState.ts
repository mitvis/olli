import { KeyboardManager, initKeyboardManager } from '../Runtime/KeyboardManager';
import { OlliRuntime } from '../Runtime/OlliRuntime';
import { nodeIsTextInput } from './events';

export interface OlliGlobalState {
  keyListenerAttached: boolean;
  lastVisitedInstance: OlliRuntime;
  instancesOnPage: OlliRuntime[];
  keyboardManager: KeyboardManager;
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
    });
    setOlliGlobalState({ keyListenerAttached: true, keyboardManager: initKeyboardManager(t) });
  }
};
