import { openTableDialog } from '.';
import { OlliRuntime } from '../../Runtime/OlliRuntime';
import { OlliNodeLookup } from '../../Structure/Types';
import { predicateToDescription } from '../../description';
import { selectionTest } from '../../util/selection';

export function makeSpatialNavMenu(tree: OlliRuntime): HTMLElement {
  const olliNodeLookup = tree.olliNodeLookup;
  const menu = document.createElement('div');

  const nodeList = [...Object.values(olliNodeLookup)];

  const xAxisPreds = nodeList.find((node) => node.nodeType === 'xAxis')?.children.map((node) => node.predicate) || [];
  const yAxisPreds =
    nodeList
      .find((node) => node.nodeType === 'yAxis')
      ?.children.map((node) => node.predicate)
      .reverse() || [];

  console.log(xAxisPreds, yAxisPreds);

  const table = document.createElement('table');
  const tableBody = document.createElement('tbody');

  const xHeader = document.createElement('tr');
  xHeader.appendChild(document.createElement('td'));
  xAxisPreds.forEach((xPred) => {
    const th = document.createElement('th');
    th.setAttribute('scope', 'col');
    th.innerText = `${predicateToDescription(xPred)}`;
    xHeader.appendChild(th);
  });
  tableBody.appendChild(xHeader);

  yAxisPreds.forEach((yPred) => {
    console.log('yPred', yPred);
    const dataRow = document.createElement('tr');
    const th = document.createElement('th');
    th.setAttribute('scope', 'row');
    th.innerText = `${predicateToDescription(yPred)}`;
    dataRow.appendChild(th);
    xAxisPreds.forEach((xPred) => {
      console.log('xPred', xPred);
      const td = document.createElement('td');
      const pred = { and: [xPred, yPred] };
      const selection = selectionTest(tree.olliSpec.data, pred);
      const span = document.createElement('span');
      span.innerText = `${selection.length} values`;
      td.setAttribute('style', `background: rgba(0,0,0,${selection.length / (0.5 * tree.olliSpec.data.length)})`);
      td.appendChild(span);
      const button = document.createElement('button');
      button.innerText = 'View table';
      button.addEventListener('click', () => {
        openTableDialog(pred, tree);
      });
      td.appendChild(button);
      dataRow.appendChild(td);
    });
    tableBody.appendChild(dataRow);
  });

  table.appendChild(tableBody);
  menu.appendChild(table);

  return menu;
}
