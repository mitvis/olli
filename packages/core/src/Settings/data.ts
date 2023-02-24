import { TokenType, HierarchyLevel, tokenLength} from "../Structure/Types";

const Short = tokenLength.Short
const Long = tokenLength.Long

export const tokenDescs = {
  'index': 'Index ("1 of 5")',
  'type': 'Item type ("line", "temporal")',
  'size': 'Size ("10 values")',
  'relative': 'Quartile',
  'data': 'Data values',
  'aggregate': 'Min, max, and average',
  'parent': 'View name',
  'name': 'Item name',
  'children': 'Child names',
}

export let defaultSettingsData: { [k in Exclude<HierarchyLevel, 'root'>]: {[k: string]: [TokenType, tokenLength][]}} = {
  'facet': {
    'high': [['index', Long], ['type', Long], ['name', Long], ['children', Long]],
    'low': [['type', Long], ['name', Long], ['children', Long]],
  },
  'axis': {
    'high': [['name', Long], ['type', Long], ['data', Long], ['size', Long], ['parent', Long], ['aggregate', Long]],
    'low': [['name', Long], ['type', Long], ['data', Long]],
  },
  'section': {
    'high': [['data', Long], ['index', Long], ['size', Long], ['parent', Long]],
    'low': [['data', Long], ['size', Long]],
  },
  'datapoint': {
    'high': [['data', Long], ['parent', Long]],
    'low': [['data', Long]]
  }
}