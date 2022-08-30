/**
 * Detailing the different marks that can exist in a chart
 */
 export type OlliMark = "point" | "bar" | "line" | undefined;

 export type OlliValue = string | number | Date;

 export interface OlliDatum {
     [key: string]: OlliValue;
 }

 export type OlliDataset = OlliDatum[];

 /**
  * A simple union type that when implemented a concrete adapter class can be used with any visualization library to
  * later be used to create an explorable Accessibility Tree.
  */
 type BaseOlliVisSpec = {
     type: "chart" | "facetedChart",
     data: OlliDataset,
     title? : string
 }


 /**
  * Outlines the grammar of graphics information that has to be parsed from a visualization.
  */
  export interface Chart extends BaseOlliVisSpec {
     type: "chart",
     axes: Axis[] ,
     legends: Legend[],
     mark: OlliMark
 }

 /**
  * plots that may have multiple charts contained within a single specification
  */
 export interface FacetedChart extends BaseOlliVisSpec {
     type: "facetedChart",
     // maps faceted value to chart
     charts: Map<string, Chart>,
     facetedField: string,
 }

 export type OlliVisSpec = Chart | FacetedChart;

 export const chart = (fields: Omit<Chart, 'type'>): Chart => {
  return { ...fields, type: "chart" }
}

export const facetedChart = (fields: Omit<FacetedChart, 'type'>): FacetedChart => {
  return { ...fields, type: "facetedChart" }
}

 /**
 * The {@link Guide} is an the information needed for generating various nodes on the Accessibility Tree where
 *   values: is the array of values on the data source (ex: tick values for an Axis)
 *   title: string title describing this information
 *   data: an array of data from the visualization to eventually be filtered using the range
 *   field: the object field that will be used to compare data values to range values
 */
export type Guide = {
  type: 'discrete' | 'continuous',
  values: string[] | number[],
  field: string,
  title?: string,
}

/**
* Extending the {@link Guide} interface for visualization axes
*/
export interface Axis extends Guide {
  axisType: 'x' | 'y',
  scaleType?: string // e.g. linear, logarithmic, band
}

/**
* Extending the {@link Guide} interface for visualization legends
*/
export interface Legend extends Guide {
  channel?: string // e.g. color, opacity
}

/**
* Interface describing how a visualization adapter should be created
*/
export type VisAdapter<T> = (spec: T) => Promise<OlliVisSpec>;
