import { OlliDataset, OlliDatum, OlliFieldDef } from '../../Types';
import { fmtValue } from '../../util/values';

export function renderTable(data: OlliDataset, fields: OlliFieldDef[]): HTMLElement {
  const table = document.createElement('table');
  const thead = document.createElement('thead');
  const theadtr = document.createElement('tr');

  fields.forEach((fieldDef: OlliFieldDef) => {
    const th = document.createElement('th');
    th.setAttribute('scope', 'col');
    th.innerText = fieldDef.field;
    theadtr.appendChild(th);
  });

  thead.appendChild(theadtr);
  table.appendChild(thead);

  const tableBody = document.createElement('tbody');

  data.forEach((data: OlliDatum) => {
    const dataRow = document.createElement('tr');
    fields.forEach((fieldDef: OlliFieldDef) => {
      const td = document.createElement('td');
      td.innerText = fmtValue(data[fieldDef.field], fieldDef);
      dataRow.appendChild(td);
    });
    tableBody.appendChild(dataRow);
  });
  table.appendChild(tableBody);

  return table;
}
