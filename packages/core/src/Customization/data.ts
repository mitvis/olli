import { CustomizeSetting } from './Types';

// Note: when putting a number before a quotation mark, add a space or else VoiceOver will read 
// the quotation mark as feet/inches
export const tokenDescs = {
  'name': 'Name (e.g. "x-axis titled price")',
  'index': 'Index in set (e.g. "1 of 5 ")',
  'type': 'Type of element (e.g. "temporal scale", "line chart")',
  'children': 'Children’s names (e.g. at the root, "axes titled date and price") ',
  'data': 'Data value or range (e.g. "0 to 800 ", "price: 50 ")',
  'size': 'Size of children (e.g. "10 values")',
  'level': 'Level of element in tree (e.g. "level: 3 ")',
  'parent': 'Facet name (e.g. "profit" and "expenditures")',
  'quartile': 'Quartile of current data (e.g. "quartile: 1 ")',
  'aggregate': 'Aggregate statistics including minimum, maximum, and average (e.g. "average: 50 ")',
  'instructions': 'Instructions for accessing data table',
}

export let defaultSetting: CustomizeSetting = {
  'name': true,
  'index': true,
  'type': true,
  'children': true,
  'data': true,
  'size': true,
  'level': true,
  'parent': true,
  'quartile': true,
  'aggregate': true,
  'instructions': true,
}