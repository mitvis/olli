export type Mark = "point" | "bar" | "rect" | "line" | "geoshape" | "circle" | "area";

/**
 * A simple union type that when implemented a concrete adapter class can be used with any visualization library to
 * later be used to create an explorable Accessibility Tree.
 */
 export type AbstractedVis = {
    description: string,
    data: Map<string, any[]>,
    dataFieldsUsed: string[],
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
    field: string | string[]
    scaleType?: string
}

/**
 * Outlines the grammar of graphics information that has to be parsed from a visualization.
 */
export interface ChartInformation extends AbstractedVis {
    axes: Guide[] ,
    legends: Guide[],
    description: string,
    gridNodes: Guide[],
    dataFieldsUsed: string[],
    markUsed?: Mark,
    title? : string
}

/**
 * plots that masy have multiple charts contained within a single specification
 */
export interface MultiViewChart extends AbstractedVis {
    charts: ChartInformation[],
}

/**
 * 
 */
export type VisAdapter = {
    convertToGog: (visObject: any, helperVisInformation: any) => AbstractedVis,
}