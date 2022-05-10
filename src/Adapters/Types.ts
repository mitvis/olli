export type Mark = "point" | "bar" | "rect" | "line" | "geoshape" | "circle" | "area";

/**
 * The {@link EncodingInformation} is an the information needed for generating various nodes on the Accessibility Tree where
 *   values: is the array of values on the data source (ex: tick values for an Axis)
 *   title: string title describing this information
 *   data: an array of data from the visualization to eventually be filtered using the range
 *   field: the object field that will be used to compare data values to range values   
 */
export type EncodingInformation = {
    values: string[] | number[]
    title: string
    data: any[]
    field: string | string[]
    hasGrid: boolean
    scaleType?: string
}

/**
 * Outlines the grammar of graphics information that has to be parsed from a visualization.
 */
export type ChartInformation = {
    data: Map<string, any[]>,
    axes: EncodingInformation[] ,
    legends: EncodingInformation[],
    description: string,
    gridNodes: EncodingInformation[],
    dataFieldsUsed: string[],
    markUsed?: Mark,
    title? : string
}

/**
 * plots that masy have multiple charts contained within a single specification
 */
export type MultiViewChart = {
    charts: ChartInformation[],
    description: string,
    data: Map<string, any[]>,
    axes?: { [key: string]: EncodingInformation },
    legends?: { [key: string]: EncodingInformation },
    dataFieldsUsed: string[],
}

/**
 * A simple union type that when implemented a concrete adapter class can be used with any visualization library to
 * later be used to create an explorable Accessibility Tree.
 */
export type AbstractedVis = MultiViewChart | ChartInformation

/**
 * 
 */
export type VisAdapter = {
    convertToGog: (visObject: any, helperVisInformation: any) => AbstractedVis,
}