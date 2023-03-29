import { Tree } from "./Render/TreeView/Tree";
import { OlliValue } from "./Types";

export const fmtValue = (value: OlliValue): string => {
  if (value instanceof Date) {
      return value.toLocaleString("en-US", { year: 'numeric', month: 'short', day: 'numeric' });
  }
  else if (typeof value !== 'string' && (!isNaN(value) && value % 1 != 0)) {
      return Number(value).toFixed(2);
  }
  return String(value);
}

export interface OlliGlobalState {
  keyListenerAttached: boolean
  lastVisitedTree: Tree
  treesOnPage: Tree[]
}

export const getOlliGlobalState = (): OlliGlobalState => {
  if (!(window as any)._olli) {
    (window as any)._olli = {};
  }
  return (window as any)._olli;
}

export const setOlliGlobalState = (state: Partial<OlliGlobalState>) => {
  (window as any)._olli = {
    ...(window as any)._olli,
    ...state
  };
}

export const nodeIsTextInput = (activeElement: Element | null): boolean => {
  switch (activeElement?.nodeName) {
    case 'INPUT':
    case 'TEXTAREA':
    case 'SELECT':
    case 'OPTION':
      return true;
  }
  if (typeof activeElement?.getAttribute('contenteditable') === 'string') return true;
  return false;
}

export const updateGlobalStateOnRender = (t: Tree) => {
  // append t to list of trees on page
  setOlliGlobalState({
    treesOnPage: (getOlliGlobalState().treesOnPage || []).concat([t])
  });

  // add key listener if not already attached
  if (!getOlliGlobalState().keyListenerAttached) {
    document.addEventListener('keydown', (e: any) => {
      if (!nodeIsTextInput(document.activeElement)) {
        const {lastVisitedTree, treesOnPage} = getOlliGlobalState();
        switch (e.code) {
          case 'KeyT':
            const currentTree = lastVisitedTree || treesOnPage[0];
            if (currentTree.domNode.firstElementChild.getAttribute('aria-selected') === 'true') {
              // we are currently focusing on the root of this tree
              const idx = treesOnPage.indexOf(currentTree);
              if (e.shiftKey) {
                // shift + t means jump to the prev one
                if (idx > 0) {
                  const prev = treesOnPage[idx - 1];
                  prev.setFocusToItem(prev.rootTreeItem);
                }
                else {
                  // TODO play some sort of earcon / notification to indicate you are at a boundary
                }
              }
              else {
                // jump to the next one
                if (idx < treesOnPage.length - 1) {
                  const next = treesOnPage[idx + 1];
                  next.setFocusToItem(next.rootTreeItem);
                }
                else {
                  // TODO play some sort of earcon / notification to indicate you are at a boundary
                }
              }
            }
            else {
              // we are not focused on the root of the tree, so jump there
              currentTree.setFocusToItem(currentTree.rootTreeItem);
            }
            break;
        }
       }
    });
    setOlliGlobalState({keyListenerAttached: true});
  }
}