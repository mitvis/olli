import { FieldPredicate } from 'vega-lite/src/predicate';
import { LogicalAnd } from 'vega-lite/src/logical';

/**
 * Node types describing an Olli tree structure
 */
export interface OlliGroupNode {
  groupby: string;
  children?: OlliNode[];
}

export interface OlliPredicateNode {
  predicate: FieldPredicate;
  children?: OlliNode[];
}

export interface OlliAnnotationNode {
  annotations: OlliNode[];
  name?: string;
}

export type OlliNode = OlliGroupNode | OlliPredicateNode | OlliAnnotationNode;

export type OlliNodeType =
  | 'root'
  | 'view'
  | 'xAxis'
  | 'yAxis'
  | 'legend'
  | 'guide'
  | 'filteredData'
  | 'annotations'
  | 'other';

export interface ElaboratedOlliNode {
  id: string;
  nodeType: OlliNodeType;
  specIndex?: number;
  viewType?: 'facet' | 'layer' | 'concat';
  fullPredicate: LogicalAnd<FieldPredicate>;
  parent?: ElaboratedOlliNode;
  children: ElaboratedOlliNode[];
  groupby?: string;
  name?: string;
  predicate?: FieldPredicate;
  description: Map<string, string>;
  level: number;
}

export type OlliNodeLookup = { [id: string]: ElaboratedOlliNode };
