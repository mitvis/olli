import { predicateToDescription } from '../../Description';
import { ElaboratedOlliNode } from '../../Structure/Types';
import { OlliSpec } from '../../Types';
import { selectionTest } from '../../util/selection';
import { renderTable } from '../Table';
import { OlliRuntime } from '../../Runtime/OlliRuntime';
import './dialog.css';
import { makeSelectionMenu } from './selectionMenu';

export function makeDialog(
  tree: OlliRuntime,
  title: string,
  instructions: string,
  content: HTMLElement,
  callbacks?: {
    onClose?: () => void;
    onOk?: () => void;
  }
): HTMLElement {
  const dialog = document.createElement('div');
  dialog.setAttribute('class', 'olli-dialog');
  dialog.setAttribute('role', 'dialog');
  dialog.setAttribute('aria-labelledby', 'overlay-title');
  dialog.setAttribute('aria-describedby', 'overlay-instructions');

  const dialogContent = document.createElement('div');
  dialogContent.setAttribute('role', 'document');

  const titleElem = document.createElement('h2');
  titleElem.setAttribute('id', 'overlay-title');
  titleElem.innerText = title;

  const instructionsElem = document.createElement('p');
  instructionsElem.setAttribute('id', 'overlay-instructions');
  instructionsElem.innerText = instructions;

  const closeDialog = () => {
    dialog.remove();
    tree.setFocusToItem(tree.lastFocusedTreeItem);
    if (callbacks?.onClose) {
      callbacks?.onClose();
    }
  };

  dialog.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeDialog();
    }
  });

  const closeButton = document.createElement('button');
  closeButton.innerText = 'Close ' + title;
  closeButton.addEventListener('click', closeDialog);

  const contentContainer = document.createElement('div');
  contentContainer.setAttribute('id', 'olli-dialog-content');
  contentContainer.appendChild(content);

  dialogContent.appendChild(closeButton);
  dialogContent.appendChild(titleElem);
  dialogContent.appendChild(instructionsElem);
  dialogContent.appendChild(contentContainer);

  if (callbacks?.onOk) {
    // add cancel button
    const cancelButton = document.createElement('button');
    cancelButton.innerText = 'Cancel';
    cancelButton.addEventListener('click', closeDialog);
    dialogContent.appendChild(cancelButton);
    // add ok button
    const okButton = document.createElement('button');
    okButton.innerText = 'Ok';
    okButton.addEventListener('click', () => {
      callbacks?.onOk();
      closeDialog();
    });
    dialogContent.appendChild(okButton);
  }

  dialog.appendChild(dialogContent);

  return dialog;
}

function openDialog(dialog: HTMLElement, renderContainer: HTMLElement) {
  renderContainer.querySelectorAll('.olli-dialog').forEach((el) => {
    el.remove();
  });
  renderContainer.appendChild(dialog);

  window.requestAnimationFrame(() => {
    dialog.querySelector('button').focus();
  });
}

export function openTableDialog(olliNode: ElaboratedOlliNode, tree: OlliRuntime) {
  const olliSpec = tree.olliSpec;
  const table = renderTable(
    selectionTest(olliSpec.data, olliNode.fullPredicate),
    olliSpec.fields.map((f) => f.field)
  );
  const dialog = makeDialog(tree, 'Table View', predicateToDescription(olliNode.fullPredicate), table);

  openDialog(dialog, tree.renderContainer);
}

export function openSelectionDialog(tree: OlliRuntime) {
  const menu = makeSelectionMenu(tree.olliSpec);

  const onOk = () => {
    const predicate = { and: JSON.parse(menu.getAttribute('data-state')) };
    tree.setSelection(predicate);
    if (tree.callbacks?.onSelection) {
      tree.callbacks?.onSelection(predicate);
    }
  };

  const dialog = makeDialog(tree, 'Filter Menu', 'Define a custom filter.', menu, { onOk });

  openDialog(dialog, tree.renderContainer);
}
