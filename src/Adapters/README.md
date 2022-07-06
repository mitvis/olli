# Deconstructing Visualizations

The adapter pattern is at the core in the design of Olli, being used to deconstruct visualizations into a VisualizationStructure object. Since every visualization grammar contains its own complexities, in order to make a wider set of visualizations accessible, adapters are used to create a common object that can then be rendered into different accessible formats. Generating a screen-reader accessible structure for multiple visualization libraries is streamlined as the rendering no longer has to work with the concrete implementation of external libraries. The type system is comprised of a primary VisualizationStructure describing the structure of a chart with Guides. The types bring out the perceived or hierarchical elements of a chart that are rarely explicitely outlined in a specificatio

## `VisualizationStructure`

The VisualizationStructure is the output of the adapters deconstructing a visualization from its original specification into a more generalized format. A Visualization will either be a faceted view of nested charts or simply be a single chart depending on the hierarchy of information. Each object also contains a high-level description of the visualization and the data that being visualized. Within a lone chart, the VisualizationStructure also outlines the structured elements of the chart including axes and legend, but also visual information such as the mark being used and the title of the chart, if any.

Interface for the base `VisualizationInformation`:

```js
type AbstractedVis = {
    description: string,
    data: Map<string, any[]>,
    dataFieldsUsed: string[],
}
```

Interface for `ChartInformation`:

```js
interface ChartInformation extends AbstractedVis {
    axes: Axis[] ,
    legends: Legend[],
    description: string,
    gridNodes: Guide[],
    dataFieldsUsed: string[],
    markUsed?: Mark,
    title? : string
    facetedValue?: any
}
```

Interface for `FacetedChart`:

```js
interface FacetedChart extends AbstractedVis {
    charts: ChartInformation[],
    facetedField: string
}
```

### `Guides`

Guides contain information on the structured elements of charts. The axes and legends of a visualization share many common attributes throughout visualization grammars, and Olli reflects those similarities.

Interface for `Guides`:

```js
type Guide = {
    values: string[] | number[]
    title: string
    data: any[]
    field: string | string[],
    markUsed?: Mark,
    scaleType?: string
}
```
