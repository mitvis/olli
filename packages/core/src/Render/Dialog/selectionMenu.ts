import { FieldPredicate } from 'vega-lite/src/predicate';
import { OlliSpec } from '../../Types';
import { getDomain, getFieldDef } from '../../util/data';
import { serializeValue } from '../../util/values';

export function makeSelectionMenu(olliSpec: OlliSpec): HTMLElement {
  const menu = document.createElement('div');

  const predicateContainer = document.createElement('div');

  const fieldSelect = document.createElement('select');
  fieldSelect.setAttribute('id', 'olli-field-select');
  fieldSelect.setAttribute('name', 'olli-field-select');

  const opSelect = document.createElement('select');
  opSelect.setAttribute('id', 'olli-op-select');
  opSelect.setAttribute('name', 'olli-op-select');

  const valueContainer = document.createElement('span');

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

  opSelect.onchange = () => {
    const selectedField = fieldSelect.value;
    const selectedOp = opSelect.value;
    const fieldDef = getFieldDef(selectedField, olliSpec.fields);
    if (selectedOp === '=' && (fieldDef.type === 'nominal' || fieldDef.type === 'ordinal')) {
      const domain = getDomain(selectedField, olliSpec.data);
      const valueSelect = document.createElement('select');
      const valueOptions = domain.map((value) => {
        const option = document.createElement('option');
        option.setAttribute('value', serializeValue(value, fieldDef));
        option.innerText = String(value);
        return option;
      });
      valueSelect.replaceChildren(...valueOptions);
      valueContainer.replaceChildren(valueSelect);
      valueSelect.onchange = () => {
        const value = valueSelect.value;
        const predicate: FieldPredicate = { field: selectedField, equal: value };
        state.and[0] = predicate;
        menu.setAttribute('data-state', JSON.stringify(state));
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
          state.and[0] = predicate;
          menu.setAttribute('data-state', JSON.stringify(state));
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
          state.and[0] = predicate;
          menu.setAttribute('data-state', JSON.stringify(state));
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
          state.and[0] = predicate;
          menu.setAttribute('data-state', JSON.stringify(state));
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
          state.and[0] = predicate;
          menu.setAttribute('data-state', JSON.stringify(state));
        };
      }
    }
  };

  predicateContainer.replaceChildren(fieldSelect, opSelect, valueContainer);
  menu.replaceChildren(predicateContainer);
  fieldSelect.onchange(null);

  const state: { and: Partial<FieldPredicate>[] } = olliSpec.selection
    ? 'and' in olliSpec.selection
      ? olliSpec.selection
      : { and: [olliSpec.selection as any] }
    : { and: [] };
  menu.setAttribute('data-state', JSON.stringify(state));

  // set initial values from initialPredicate
  // TODO handle 'and', nesting, etc
  if (state.and.length) {
    const predicate = state.and[0] as FieldPredicate;

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
