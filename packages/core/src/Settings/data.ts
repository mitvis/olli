import { TokenType, HierarchyLevel, tokenLength} from "../Structure/Types";

const Short = tokenLength.Short
const Long = tokenLength.Long

// Note: when putting a number before a quotation mark, add a space or else VoiceOver will read 
// the quotation mark as feet/inches
export const tokenDescs = {
  'index': 'Index in set (e.g. "1 of 5 ")',
  'type': 'Type of element (e.g. "temporal scale", "line chart")',
  'size': 'Size of children (e.g. "10 values")',
  'data': 'Data value or range (e.g. "0 to 800 ", "price: 50 ")',
  'aggregate': 'Aggregate statistics including minimum, maximum, and average (e.g. "average: 50 ")',
  'facet': 'Facet name (e.g. "profit" and "expenditures")',
  'name': 'Name (e.g. "x-axis titled price")',
  'children': 'Children’s names (e.g. at the root, "axes titled date and price") ',
  'quantile': 'Quantile of current data (e.g. "quartile: 1 ")',
  'depth': 'Depth of element in tree (e.g. "depth: 3 ")',
}

export let defaultSettingsData: { [k in Exclude<HierarchyLevel, 'root'>]: {[k: string]: [TokenType, tokenLength][]}} = {
  'facet': {
    'high': [['index', Long], ['type', Long], ['name', Long], ['children', Long], ['depth', Long]],
    'medium': [['type', Long], ['name', Long], ['children', Long]],
    'low': [['type', Short], ['name', Short], ['children', Short]],
  },
  'axis': {
    'high': [['name', Long], ['type', Long], ['data', Long], ['size', Long], ['facet', Long], ['aggregate', Long], ['depth', Long]],
    'medium': [['name', Long], ['type', Long], ['data', Long]],
    'low': [['name', Short], ['type', Short], ['data', Short]],
  },
  'section': {
    'high': [['data', Long], ['index', Long], ['size', Long], ['facet', Long], ['aggregate', Long], ['quantile', Long], ['depth', Long]],
    'medium': [['data', Long], ['size', Long], ['aggregate', Short], ['quantile', Short]],
    'low': [['data', Short], ['size', Short]],
  },
  'datapoint': {
    'high': [['data', Long], ['facet', Long], ['quantile', Long]],
    'medium': [['data', Long]],
    'low': [['data', Short]],
  }
}