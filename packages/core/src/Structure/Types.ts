import { OlliEncodingFieldDef } from '../Types';
import { FieldPredicate } from 'vega-lite/src/predicate';
import { LogicalAnd } from 'vega-lite/src/logical';

/**
 * Node types describing an Olli tree structure
 */
export interface OlliGroupNode {
  groupby: OlliEncodingFieldDef;
  children: OlliNode[];
}

export interface OlliPredicateNode {
  predicate: FieldPredicate;
  children: OlliNode[];
}

export type OlliNode = OlliGroupNode | OlliPredicateNode;

export type OlliNodeType = 'root' | 'facet' | 'xAxis' | 'yAxis' | 'legend' | 'filteredData' | 'other';

export interface ElaboratedOlliNode {
  id: string;
  nodeType: OlliNodeType;
  fullPredicate: LogicalAnd<FieldPredicate>;
  parent?: ElaboratedOlliNode;
  children: ElaboratedOlliNode[];
  groupby?: OlliEncodingFieldDef;
  predicate?: FieldPredicate;
  description?: string;
}

export type OlliNodeLookup = { [id: string]: ElaboratedOlliNode };
