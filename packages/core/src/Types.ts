import { OlliNode } from './structure/Types';

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
  encoding: OlliEncoding;
  title?: string;
  description?: string; // possible chart description included with the spec
  structure: OlliNode | OlliNode[];
}

export interface OlliEncodingFieldDef {
  field: string;
  type: 'quantitative' | 'ordinal' | 'nominal' | 'temporal';
  bin?: boolean | OlliValue[];
}

export enum OlliEncodingChannel {
  x = 'x',
  y = 'y',
  color = 'color',
  facet = 'facet',
}

export function isGuideChannel(channel: OlliEncodingChannel): boolean {
  return ['x', 'y', 'color'].includes(channel);
}

export type OlliEncoding = {
  [channel in OlliEncodingChannel]?: OlliEncodingFieldDef;
};

/**
 * Interface describing how a visualization adapter should be created
 */
export type VisAdapter<T> = (spec: T) => Promise<OlliSpec>;
