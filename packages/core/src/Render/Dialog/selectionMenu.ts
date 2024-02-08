import { FieldPredicate } from 'vega-lite/src/predicate';
import { UnitOlliSpec } from '../../Types';
import { getDomain, getFieldDef } from '../../util/data';
import { serializeValue } from '../../util/values';
import { pluralize } from '../../util/description';

// this would have been so much easier with some ui framework : \

export function makeSelectionMenu(olliSpec: UnitOlliSpec): HTMLElement {
  const state: FieldPredicate[] = olliSpec.selection
    ? 'and' in olliSpec.selection
      ? (olliSpec.selection.and as FieldPredicate[])
      : [olliSpec.selection]
    : [];

  const menu = document.createElement('div');
  const container = document.createElement('div');

  const predicateContainers = [];

  // set initial values from olliSpec.selection
  if (state.length) {
    state.forEach((predicate, idx) => {
      if (predicateContainers.length <= idx) {
        predicateContainers.push(makePredicateContainer(menu, olliSpec, state, predicateContainers));
      }
      const predicateContainer = predicateContainers[idx];
      setPredicateContainerFromState(predicateContainer, predicate, olliSpec);
    });
  }

  container.replaceChildren(...predicateContainers);

  const addButton = document.createElement('button');
  addButton.innerText = 'Add condition';
  addButton.onclick = () => {
    predicateContainers.push(makePredicateContainer(menu, olliSpec, state, predicateContainers));
    container.replaceChildren(...predicateContainers);
    if (predicateContainers.length > 0) {
      const clearButton = menu.querySelector('.olli-clear-button');
      clearButton.classList.remove('olli-hidden');
      document.querySelector('.olli-status-text').innerHTML = pluralize(predicateContainers.length, 'condition');
    }
  };

  const clearButton = document.createElement('button');
  clearButton.classList.add('olli-clear-button');
  clearButton.innerText = 'Clear conditions';
  if (predicateContainers.length === 0) {
    clearButton.classList.add('olli-hidden');
  }
  clearButton.onclick = () => {
    predicateContainers.forEach((predicateContainer) => {
      predicateContainer.remove();
    });
    predicateContainers.splice(0, predicateContainers.length);
    container.replaceChildren(...predicateContainers);
    state.splice(0, state.length);
    menu.setAttribute('data-state', JSON.stringify(state));
    document.querySelector('.olli-status-text').innerHTML = pluralize(predicateContainers.length, 'condition');
  };

  const statusText = document.createElement('div');
  statusText.setAttribute('role', 'status');
  statusText.classList.add('olli-status-text');
  statusText.innerHTML = pluralize(predicateContainers.length, 'condition');

  menu.replaceChildren(statusText, addButton, container, clearButton);

  menu.setAttribute('data-state', JSON.stringify(state));

  return menu;
}

function predicateOpToValue(op) {
  switch (op) {
    case 'equal':
      return '=';
    case 'range':
      return 'between';
    case 'lt':
      return '<';
    case 'lte':
      return '<=';
    case 'gt':
      return '>';
    case 'gte':
      return '>=';
  }
}

function valueToPredicateOp(op) {
  switch (op) {
    case '=':
      return 'equal';
    case 'between':
      return 'range';
    case '<':
      return 'lt';
    case '<=':
      return 'lte';
    case '>':
      return 'gt';
    case '>=':
      return 'gte';
  }
}

function makePredicateContainer(menu: HTMLElement, olliSpec: UnitOlliSpec, state, predicateContainers: HTMLElement[]) {
  const predicateContainer = document.createElement('div');

  const fieldSelect = document.createElement('select');
  fieldSelect.classList.add('olli-field-select');
  fieldSelect.setAttribute('name', 'olli-field-select');

  const opSelect = document.createElement('select');
  opSelect.classList.add('olli-op-select');
  opSelect.setAttribute('name', 'olli-op-select');

  const valueContainer = document.createElement('span');
  valueContainer.classList.add('olli-value-container');

  const fieldOptions = olliSpec.fields.map((field) => {
    const option = document.createElement('option');
    option.setAttribute('value', field.field);
    option.innerText = field.field;
    return option;
  });
  fieldSelect.replaceChildren(...fieldOptions);
  fieldSelect.onchange = () => {
    const selectedField = fieldSelect.value;
    const fieldDef = getFieldDef(selectedField, olliSpec.fields);
    let ops = ['='];
    if (fieldDef.type === 'quantitative' || fieldDef.type === 'temporal') {
      ops = ['between', '<', '<=', '>', '>=', '='];
    }
    const opOptions = ops.map((op) => {
      const option = document.createElement('option');
      option.setAttribute('value', op);
      option.innerText = op;
      return option;
    });
    opSelect.replaceChildren(...opOptions);
    opSelect.onchange(null);
  };

  function updateState(predicate) {
    const index = predicateContainers.indexOf(predicateContainer);
    state[index] = predicate;
    menu.setAttribute('data-state', JSON.stringify(state));
  }

  opSelect.onchange = () => {
    const selectedField = fieldSelect.value;
    const selectedOp = opSelect.value;
    const fieldDef = getFieldDef(selectedField, olliSpec.fields);
    if (selectedOp === '=' && (fieldDef.type === 'nominal' || fieldDef.type === 'ordinal')) {
      const domain = getDomain(fieldDef, olliSpec.data);
      const valueSelect = document.createElement('select');
      const valueOptions = domain.map((value) => {
        const option = document.createElement('option');
        option.setAttribute('value', String(value));
        option.innerText = String(value);
        return option;
      });
      valueSelect.replaceChildren(...valueOptions);
      valueContainer.replaceChildren(valueSelect);
      valueSelect.onchange = () => {
        const value = valueSelect.value;
        const predicate: FieldPredicate = { field: selectedField, equal: serializeValue(value, fieldDef) };
        updateState(predicate);
      };
    } else if (selectedOp === 'between') {
      if (fieldDef.type === 'quantitative') {
        // two numeric inputs
        const valueInput1 = document.createElement('input');
        valueInput1.setAttribute('type', 'number');
        const valueInput2 = document.createElement('input');
        valueInput2.setAttribute('type', 'number');
        valueContainer.replaceChildren(valueInput1, valueInput2);
        valueInput1.onchange = valueInput2.onchange = () => {
          const value1 = Number(valueInput1.value);
          const value2 = Number(valueInput2.value);
          const predicate: FieldPredicate = { field: selectedField, range: [value1, value2] };
          updateState(predicate);
        };
      } else if (fieldDef.type === 'temporal') {
        // two datetime inputs
        const valueInput1 = document.createElement('input');
        valueInput1.setAttribute('type', 'datetime-local');
        const valueInput2 = document.createElement('input');
        valueInput2.setAttribute('type', 'datetime-local');
        valueContainer.replaceChildren(valueInput1, valueInput2);
        valueInput1.onchange = valueInput2.onchange = () => {
          const value1 = serializeValue(new Date(valueInput1.value), fieldDef);
          const value2 = serializeValue(new Date(valueInput2.value), fieldDef);
          const predicate: FieldPredicate = { field: selectedField, range: [value1, value2] };
          updateState(predicate);
        };
      }
    } else {
      if (fieldDef.type === 'quantitative') {
        // numeric input
        const valueInput = document.createElement('input');
        valueInput.setAttribute('type', 'number');
        valueContainer.replaceChildren(valueInput);
        valueInput.onchange = () => {
          const value = Number(valueInput.value);
          const op = valueToPredicateOp(selectedOp);
          const predicate = { field: selectedField, [op]: value };
          updateState(predicate);
        };
      } else if (fieldDef.type === 'temporal') {
        // datetime input
        const valueInput = document.createElement('input');
        valueInput.setAttribute('type', 'datetime-local');
        valueContainer.replaceChildren(valueInput);
        valueInput.onchange = () => {
          const value = serializeValue(new Date(valueInput.value), fieldDef);
          const op = valueToPredicateOp(selectedOp);
          const predicate = { field: selectedField, [op]: value };
          updateState(predicate);
        };
      }
    }
  };

  predicateContainer.replaceChildren(fieldSelect, opSelect, valueContainer);

  const removeButton = document.createElement('button');
  removeButton.innerText = 'Remove condition';
  removeButton.onclick = () => {
    const index = predicateContainers.indexOf(predicateContainer);
    predicateContainers.splice(index, 1);
    state.splice(index, 1);
    menu.setAttribute('data-state', JSON.stringify(state));
    predicateContainer.remove();
    if (predicateContainers.length === 0) {
      const clearButton = menu.querySelector('.olli-clear-button');
      clearButton.classList.add('olli-hidden');
    }
    document.querySelector('.olli-status-text').innerHTML = pluralize(predicateContainers.length, 'condition');
  };
  predicateContainer.appendChild(removeButton);

  fieldSelect.onchange(null);
  return predicateContainer;
}

function setPredicateContainerFromState(
  predicateContainer: HTMLElement,
  predicate: FieldPredicate,
  olliSpec: UnitOlliSpec
) {
  const fieldSelect: HTMLSelectElement = predicateContainer.querySelector('.olli-field-select');
  const opSelect: HTMLSelectElement = predicateContainer.querySelector('.olli-op-select');
  const valueContainer = predicateContainer.querySelector('.olli-value-container');

  const field = predicate.field;
  const fieldDef = getFieldDef(field, olliSpec.fields);
  const op = Object.keys(predicate).find((key) => key !== 'field');
  const value = predicate[op];

  fieldSelect.value = field;
  fieldSelect.onchange(null);
  opSelect.value = predicateOpToValue(op);
  opSelect.onchange(null);

  if (op === 'range') {
    const valueInput1 = value[0];
    const valueInput2 = value[1];
    const valueInputs = valueContainer.querySelectorAll('input');
    if (fieldDef.type === 'temporal') {
      const valueInputDate1 = new Date(value[0]);
      valueInputDate1.setMinutes(valueInputDate1.getMinutes() - valueInputDate1.getTimezoneOffset());
      valueInputs[0].value = valueInputDate1.toISOString().slice(0, 16);
      const valueInputDate2 = new Date(value[1]);
      valueInputDate2.setMinutes(valueInputDate2.getMinutes() - valueInputDate2.getTimezoneOffset());
      valueInputs[1].value = valueInputDate2.toISOString().slice(0, 16);
    } else {
      valueInputs[0].value = valueInput1;
      valueInputs[1].value = valueInput2;
    }
  } else if (op === 'equal' && valueContainer.querySelector('select')) {
    const valueSelect = valueContainer.querySelector('select');
    valueSelect.value = value;
  } else {
    const valueInput = valueContainer.querySelector('input');
    if (fieldDef.type === 'temporal') {
      const valueInputDate = new Date(value);
      valueInputDate.setMinutes(valueInputDate.getMinutes() - valueInputDate.getTimezoneOffset());
      valueInput.value = valueInputDate.toISOString().slice(0, 16);
    } else {
      valueInput.value = value;
    }
  }
}
