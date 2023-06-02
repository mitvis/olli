import { predicateToDescription } from '../../Description';
import { ElaboratedOlliNode } from '../../Structure/Types';
import { OlliSpec } from '../../Types';
import { selectionTest } from '../../util/selection';
import { renderTable } from '../Table';
import './dialog.css';

export function makeDialog(
  title: string,
  instructions: string,
  content: HTMLElement,
  onClose: () => void
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
    onClose();
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

  dialog.appendChild(dialogContent);

  return dialog;
}

export function openTableDialog(olliNode: ElaboratedOlliNode, olliSpec: OlliSpec, renderContainer: HTMLElement) {
  const table = renderTable(
    selectionTest(olliSpec.data, olliNode.fullPredicate),
    olliSpec.fields.map((f) => f.field)
  );
  const dialog = makeDialog('Table View', predicateToDescription(olliNode.fullPredicate), table, () => {
    dialog.remove();
  });

  renderContainer.querySelectorAll('.olli-dialog').forEach((el) => {
    el.remove();
  });
  renderContainer.appendChild(dialog);

  window.requestAnimationFrame(() => {
    dialog.querySelector('button').focus();
  });
}
