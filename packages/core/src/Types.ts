import { OlliNode } from './Structure/Types';

export type OlliMark = 'point' | 'bar' | 'line';

export type OlliValue = string | number | Date;

export interface OlliDatum {
  [key: string]: OlliValue;
}

export type OlliDataset = OlliDatum[];

/**
 * Spec describing a visualization
 */
export interface OlliSpec {
  // selection?: OlliDataset; // optional: an initial top level selection (subset of data)
  data: OlliDataset;
  mark?: OlliMark;
  axes: OlliAxis[];
  legends: OlliLegend[];
  facetField?: string;
  title?: string;
  description?: string; // possible chart description included with the spec
  structure: OlliNode | OlliNode[];
}

export type MeasureType = 'quantitative' | 'ordinal' | 'nominal' | 'temporal';

type Guide = {
  type: MeasureType;
  field: string;
  ticks?: OlliValue[];
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
  channel?: string; // e.g. color, opacity
}

export interface OlliEncodingFieldDef {
  field: string;
  type: MeasureType;
}

/**
 * Interface describing how a visualization adapter should be created
 */
export type VisAdapter<T> = (spec: T) => Promise<OlliSpec>;
