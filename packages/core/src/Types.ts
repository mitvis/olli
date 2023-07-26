import { LogicalAnd } from 'vega-lite/src/logical';
import { OlliNode } from './Structure/Types';
import { FieldPredicate } from 'vega-lite/src/predicate';
import { TimeUnit } from 'vega-lite/src/timeunit';

export type OlliValue = string | number | Date;

export interface OlliDatum {
  [key: string]: OlliValue;
}

export type OlliDataset = OlliDatum[];

export type OlliMark = 'point' | 'bar' | 'line';

/**
 * Spec describing a visualization
 */
export interface UnitOlliSpec {
  // required: data and fields
  data: OlliDataset;
  // semi-required: specification of the fields/typings and structure (inferred if not provided)
  fields?: OlliFieldDef[];
  structure?: OlliNode | OlliNode[];
  // optional information about the chart's visual encodings for descriptions
  mark?: OlliMark;
  axes?: OlliAxis[];
  legends?: OlliLegend[];
  facet?: string;
  // an optional initial top level selection query
  selection?: LogicalAnd<FieldPredicate> | FieldPredicate;
  // additional optional info used for description
  title?: string;
  description?: string;
}

export type OlliSpec = UnitOlliSpec | UnitOlliSpec[];

type Guide = {
  field: string;
  title?: string; // optional human-readable title used for description
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
  type?: MeasureType; // optional, but will be inferred if not provided
  timeUnit?: TimeUnit;
}

/**
 * Interface describing how a visualization adapter should be created
 */
export type VisAdapter<T> = (spec: T) => Promise<OlliSpec>;
