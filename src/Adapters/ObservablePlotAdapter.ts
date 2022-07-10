import { VisAdapter, OlliVisSpec, FacetedChart, Chart } from "./Types";

/**
 * 
 * @param visObject 
 * @param helperVisInformation 
 */
export const PlotAdapter: VisAdapter = (plot: any, svg: HTMLElement): OlliVisSpec => {
    if (hasFacets(plot)) {
        return plotToFacetedChart(plot, svg);
    } else {
        return plotToChart(plot, svg);
    }
}

function plotToFacetedChart(plot: any, svg: HTMLElement): FacetedChart {
    return {} as FacetedChart
}

function plotToChart(plot: any, svg: HTMLElement): Chart {
    return {} as Chart
}

function hasFacets(plot: any): boolean {
    return plot.facet || plot.marks.some((mark: any) => mark.ariaLabel === 'line')
}