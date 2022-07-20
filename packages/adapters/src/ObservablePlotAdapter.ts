import { VisAdapter, OlliVisSpec, FacetedChart, Chart, Axis, Legend, Guide } from "./Types";

/**
 * * Adapter to deconstruct ObservablePlot visualizations into an {@link OlliVisSpec}
 * @param plot The ObservablePlot spec to render the visualization
 * @param svg the rendered SVGElement of the visualization 
 * @returns the generated {@link OlliVisSpec}
 */
export const PlotAdapter: VisAdapter = (plot: any, svg: Element): OlliVisSpec => {
    if (hasFacets(plot)) {
        return plotToFacetedChart(plot, svg);
    } else {
        return plotToChart(plot, svg);
    }
}

/**
 * Specifies that the provided visualization information relates to a faceted chart
 * @param plot The ObservablePlot spec to render the visualization
 * @param svg the rendered SVGElement of the visualization 
 * @returns the generated {@link FacetedChart}
 */
function plotToFacetedChart(plot: any, svg: Element): FacetedChart {
    const chartSVG = svg.tagName !== 'svg' ? Object.values(svg.children).find((n) => n.tagName === 'svg')! : svg;
    console.log(chartSVG)
    const axes: Axis[] = ['x-axis', 'y-axis'].reduce((parsedAxes: Axis[], s: string) => {
        let axisSVG = findHtmlElement(chartSVG, s);
        if (axisSVG) {
            parsedAxes.push(parseAxis(plot, axisSVG))
        }
        return parsedAxes
    }, [])
    let legends: Legend[] = []
    if (plot.color && plot.color.legend) legends.push(parseLegend(plot, svg.children[0]))
    const plotMark = plot.marks.filter((mark: any) => mark.ariaLabel !== 'rule')[0]
    let fields = (axes as any[]).concat(legends).reduce((fieldArr: string[], guide: Guide) => fieldArr.concat(guide.field), [])
    let charts: Chart[] = Object.values(chartSVG.children)
        .filter((n) => n.getAttribute('aria-label') === 'line' || n.getAttribute('aria-label') === 'facet')
        .map((n) => { console.log(n); return plotToChart(plot, chartSVG)});
    let facetField = plot.facet ? plot.facet.y ? plot.facet.y : plot.facet.x : '';

    /* TODO
    - get faceted values from SVG of f[y-axis, x-axis] tick values
      - filter data using facetedField anf faceted value
    - find a way to work with line charts when a single line exists
      - if more than one line exists look for stroke value in the mark object

    - find a way to search for the best mark object within the spec
    */

    let facetedChart: FacetedChart = {
        charts: charts,
        data: plotMark.data,
        dataFieldsUsed: fields,
        description: `Faceted chart with ${charts.length} nested charts`,
        facetedField: facetField
    };

    return facetedChart
}

/**
 * Specifies that the provided visualization information relates to a single chart
 * @param plot The ObservablePlot spec to render the visualization
 * @param svg the rendered Element of the visualization 
 * @returns the generated {@link Chart}
 */
function plotToChart(plot: any, svg: Element): Chart {
    const axes: Axis[] = ['x-axis', 'y-axis'].reduce((parsedAxes: Axis[], s: string) => {
        const chartSVG = svg.tagName !== 'svg' ? Object.values(svg.children).find((n) => n.tagName === 'svg')! : svg;
        let axisSVG = findHtmlElement(chartSVG, s);
        if (axisSVG) {
            parsedAxes.push(parseAxis(plot, axisSVG))
        }
        return parsedAxes
    }, [])
    let legends: Legend[] = []
    if (plot.color && plot.color.legend) legends.push(parseLegend(plot, svg.children[0]))
    const plotMark = plot.marks.filter((mark: any) => mark.ariaLabel !== 'rule')[0]
    let fields: string[] = (axes as any[]).concat(legends).reduce((fieldArr: string[], guide: Guide) => fieldArr.concat(guide.field), []) //TODO: Same code as vega-lite adapter, create utility functions that can be reused accross adapters

    let chart: Chart = {
        axes: axes,
        legends: legends,
        data: plotMark.data,
        dataFieldsUsed: fields,
        description: `A chart with ${axes.length} axes and ${legends.length} legends`,
        gridNodes: [],
    }


    return chart
}

/**
 * Creates an {@link Axis} from the provided spec and svg
 * @param plot The ObservablePlot spec to render the visualization
 * @param svg the SVG element of an axis 
 * @returns A {@link Axis} of the visualization
 */
function parseAxis(plot: any, svg: Element): Axis {
    const axisType = svg?.getAttribute('aria-label') === 'y-axis' ? 'y' : 'x'
    const orient = axisType === 'y' ? 'left' : 'bottom';
    const plotMark = plot.marks.filter((mark: any) => mark.ariaLabel !== 'rule')[0]
    const channel = plotMark.channels.find((c: any) => c.scale === axisType)
    const field: string = typeof channel.value === 'object' ? channel.value.label : channel.value
    const ticks: string[] | number[] = Object.keys(svg.children).reduce((tArr: number[] | string[], k: string) => {
        const cObj: Element = svg.children[parseInt(k)]
        let tickValue: string = '';
        if (cObj.classList[0] === 'tick') {
            cObj.childNodes.forEach((innerChild: ChildNode) => {
                if (innerChild.textContent !== '') {
                    tickValue = innerChild.textContent!
                }
            })
        }

        if (tickValue !== '') {
            if (isNaN(parseInt(tickValue))) {
                //@ts-ignore
                tArr.push(tickValue)
            } else {
                //@ts-ignore
                tArr.push(parseFloat(tickValue));
            }
        }
        return tArr
    }, [])

    let guide: Axis = {
        values: [...ticks] as string[] | number[],
        title: `${svg?.getAttribute('aria-label')} titled ${field}`,
        data: plotMark.data,
        field: field,
        orient: orient
    }

    if (channel.type) {
        guide.scaleType = channel.type
    }

    return guide
}

/**
 * Creates an {@link Legend} from the provided spec and svg
 * @param plot The ObservablePlot spec to render the visualization
 * @param svg the SVG element of an legend 
 * @returns A {@link Legend} of the visualization
 */
function parseLegend(plot: any, svg: Element): Legend { //TODO: Does not support 'ramp' legend types when the legend is rendered as an SVG
    const plotMark = plot.marks.filter((mark: any) => mark.ariaLabel !== 'rule')[0];
    const channel = plotMark.channels.find((c: any) => c.scale === 'color');
    const values: string[] | number[] = Object.keys(svg.children).reduce((a: string[] | number[], k: string) => {
        let c = svg.children[parseInt(k)];
        if (c.nodeName !== 'STYLE') {
            if (isNaN(parseInt(c.textContent!))) {
                a.push(c.textContent as never);
            } else {
                a.push(parseInt(c.textContent!) as never);
            }
        }

        return a
    }, [])

    let guide: Legend = {
        values: values,
        data: plotMark.data,
        field: channel.value,
        title: channel.value,
        type: 'ordinal',
        markUsed: plotMark.ariaLabel,
    }

    if (plot.color.type) guide.type = plot.color.type
    return guide
}

/**
 * Finds a specified HTML element from a provided string
 * @param svg the root HTML Element to begin the search
 * @param label the string of the HTML element to search for
 * @returns the found HTML Element or undefined if no element was found
 */
function findHtmlElement(svg: Element, label: string): Element | undefined {
    const attributeToCompare = 'aria-label';
    let returnedElement: Element | undefined;
    Object.keys(svg.children).forEach((k: string) => {
        let childElement: Element = svg.children[parseInt(k)];
        if (childElement.getAttribute(attributeToCompare) === label) {
            returnedElement = childElement;
        }
    })
    return returnedElement;
}


/**
 * Determines if the provided ObservablePlot object is a faceted chart.
 * @param plot The spec to check
 * @returns True if any facets exist and false otherwise
 */
function hasFacets(plot: any): boolean {
    return plot.facet || plot.marks.some((mark: any) => mark.ariaLabel === 'line')
}

(window as any).PlotAdapter = PlotAdapter;
