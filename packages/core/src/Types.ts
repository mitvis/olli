import { LogicalComposition } from 'vega-lite/src/logical';
import { OlliNode } from './Structure/Types';
import { FieldPredicate } from 'vega-lite/src/predicate';

export type OlliValue = string | number | Date;

export interface OlliDatum {
  [key: string]: OlliValue;
}

export type OlliDataset = OlliDatum[];

export type OlliMark = 'point' | 'bar' | 'line';

/**
 * Spec describing a visualization
 */
export interface OlliSpec {
  selection?: LogicalComposition<FieldPredicate>; // optional: an initial top level selection (subset of data)
  data: OlliDataset;
  fields: OlliFieldDef[];
  structure?: OlliNode | OlliNode[];
  mark?: OlliMark;
  axes?: OlliAxis[];
  legends?: OlliLegend[];
  facet?: string;
  title?: string;
  description?: string; // possible chart description included with the spec
}

type Guide = {
  field: string;
  title?: string;
};

/**
 * Extending the {@link Guide} interface for visualization axes
 */
export interface OlliAxis extends Guide {
  axisType: 'x' | 'y';
  scaleType?: string; // e.g. linear, logarithmic, band
}

/**
 * Extending the {@link Guide} interface for visualization legends
 */
export interface OlliLegend extends Guide {
  channel: 'color' | 'opacity' | 'size';
}

export type MeasureType = 'quantitative' | 'ordinal' | 'nominal' | 'temporal';

export interface OlliFieldDef {
  field: string;
  type?: MeasureType;
}

/**
 * Interface describing how a visualization adapter should be created
 */
export type VisAdapter<T> = (spec: T) => Promise<OlliSpec>;
