import { VisAdapter, OlliVisSpec, FacetedChart, Chart, Legend, OlliMark, OlliDataset } from "olli";
import * as Highcharts from 'highcharts';

/*
    NOTE: this Highcharts Adapter is an initial prototype and is currently overfit to one specific example.
*/

export const HighchartsAdapter: VisAdapter<Highcharts.Options> = async (highchartsSpec: Highcharts.Options): Promise<OlliVisSpec> => {
    return new Promise(function(resolve, reject) {
        document.addEventListener("DOMContentLoaded", function(event) {
            const div = document.createElement('div');
            const highchartsOutput: Highcharts.Chart = Highcharts.chart(div, highchartsSpec);
            resolve(toChart(highchartsSpec, highchartsOutput));
         });
      });
}

// function toFacetedChart(highchartsSpec: Highcharts.Options, highchartsOutput: Highcharts.Chart): FacetedChart {
//     throw new Error('[HighchartsAdapter] toFacetedChart not implemented');
// }

function toChart(highchartsSpec: Highcharts.Options, highchartsOutput: Highcharts.Chart): Chart {
    const axes = highchartsOutput.axes.map(axis => {
        return {
            type: getAxisGuideType(axis),
            values: axis.categories ? axis.categories : Object.values(axis.ticks).map(tick => strip((tick.label as any).textStr)),
            axisType: getAxisType(axis),
            title: axis.isXAxis ? (highchartsSpec.xAxis as any)?.title?.text : (highchartsSpec.yAxis as any)?.title?.text,
            field: axis.isXAxis ? 'categories' : 'y', // TODO this is hardcoded lmao
        }
    });
    let legends: Legend[] = [
        {
            type: 'discrete',
            values: highchartsOutput.legend.allItems.map(item => item.name),
            field: 'name' // TODO hardcoded lol
        }
    ];

    const chart: Chart = {
        type: "chart",
        mark: highchartsTypeToOlliMark(highchartsSpec.chart?.type),
        title: highchartsSpec.title?.text,
        description: (highchartsSpec.chart as any)?.description,
        legends,
        axes,
        data: assembleData(highchartsSpec)
    }

    console.log(chart.data);

    return chart
}

function highchartsTypeToOlliMark(m?: string): OlliMark | undefined {
    switch (m) {
        case ('scatter'):
            return "point";
        case ('bar'):
            return "bar";
        case ('line'):
            return "line";
        default:
            return undefined
    }
}

function strip(html: string){
    let doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || "";
 }

 function getAxisType(axis: Highcharts.Axis): 'x' | 'y' {
    return axis.isXAxis ? 'x' : 'y';
 }

 function getAxisGuideType(axis: Highcharts.Axis): 'discrete' | 'continuous' {
    return axis.categories ? 'discrete' : 'continuous'
 }

 function assembleData(highchartsSpec: Highcharts.Options): OlliDataset {
    let data: OlliDataset = [];
    // TODO this is overfit to the AT2030 example
    if (highchartsSpec.series && !Array.isArray(highchartsSpec.xAxis) && highchartsSpec.xAxis?.categories) {
        const categories = highchartsSpec.xAxis?.categories;
        const series = highchartsSpec.series.map(s => {
            const {data, ...withoutData} = {...s as Highcharts.SeriesBarOptions};
            return (s as Highcharts.SeriesBarOptions).data?.map(d => {
                return {...(d as Highcharts.PointOptionsObject), ...withoutData}
            });
        })
        const seriesWithCategories = series.map(s => {
            return s?.map((d, idx) => {
                return {...d, categories: categories[idx]}
            })
        });
        data = seriesWithCategories.flat() as any;
    }
    return data;
 }