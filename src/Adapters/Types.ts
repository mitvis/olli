/**
 * Detailing the different marks that can exist in a chart
 */
export type Mark = "point" | "bar" | "rect" | "line" | "geoshape" | "circle" | "area";

/**
 * A simple union type that when implemented a concrete adapter class can be used with any visualization library to
 * later be used to create an explorable Accessibility Tree.
 */
 type BaseOlliVisSpec = {
    type: string,
    description: string,
    data: any[],
    dataFieldsUsed: string[],
 }


/**
 * Outlines the grammar of graphics information that has to be parsed from a visualization.
 */
 export interface Chart extends BaseOlliVisSpec {
    type: "chart",
    axes: Axis[] ,
    legends: Legend[],
    description: string,
    gridNodes: Guide[],
    dataFieldsUsed: string[],
    markUsed?: Mark,
    title? : string
}

/**
 * plots that may have multiple charts contained within a single specification
 */
export interface FacetedChart extends BaseOlliVisSpec {
    type: "facetedChart",
    // maps faceted value to chart
    charts: Map<any, Chart>,
    facetedField: string
}

export interface NestedChart extends BaseOlliVisSpec {
    type: "nestedChart",
    charts: Chart[],
}

export type CompositeChart = FacetedChart | NestedChart;

export type OlliVisSpec = Chart | CompositeChart;

export const chart = (fields: Omit<Chart, 'type'>): Chart => {
    return { ...fields, type: "chart" }
}

export const facetedChart = (fields: Omit<FacetedChart, 'type'>): FacetedChart => {
    return { ...fields, type: "facetedChart" }
}

export const nestedChart = (fields: Omit<NestedChart, 'type'>): NestedChart => {
    return { ...fields, type: "nestedChart" }
}

/**
 * The {@link Guide} is an the information needed for generating various nodes on the Accessibility Tree where
 *   values: is the array of values on the data source (ex: tick values for an Axis)
 *   title: string title describing this information
 *   data: an array of data from the visualization to eventually be filtered using the range
 *   field: the object field that will be used to compare data values to range values
 */
export type Guide = {
    values: string[] | number[]
    title: string
    data: any[]
    field: string | string[],
    markUsed?: Mark,
    scaleType?: string
}

/**
 * Extending the {@link Guide} interface for visualization axes
 */
export interface Axis extends Guide {
    orient: string
}

/**
 * Extending the {@link Guide} interface for visualization legends
 */
export interface Legend extends Guide {
    type: string
}

/**
 * Interface describing how a visualization adapter should be created
 */
export type VisAdapter = (visObject: any, helperVisInformation: any) => OlliVisSpec;