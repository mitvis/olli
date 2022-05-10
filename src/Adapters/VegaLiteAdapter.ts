import { Spec } from "vega";
import { VisAdapter, AbstractedVis, ChartInformation, Mark, EncodingInformation } from "./Types";
import { VegaVisAdapter } from "./VegaAdapter";
import * as vegaLite from "vega-lite"

export const VegaLiteAdapter: VisAdapter = {

    convertToGog(visObject: any, helperVisInformation: any): AbstractedVis {
        const compiledVega: Spec = vegaLite.compile(helperVisInformation).spec;
        let vis: any = VegaVisAdapter.convertToGog(visObject, compiledVega);
        vis.markUsed = helperVisInformation.mark
        if (vis.charts !== undefined) {
            const facetField = helperVisInformation.encoding.facet.field
            vis.dataFieldsUsed.push(facetField)
            vis.charts.forEach((chart: ChartInformation) => {
                modifyVisFromMark(chart, helperVisInformation.mark, helperVisInformation)
                for (let key in chart.data.keys()) {
                    let data = chart.data.get(key)!
                    chart.data.set(key, data.filter((val: any) => val[facetField] === chart.title))
                }
            })
        } else {
            modifyVisFromMark(vis, helperVisInformation.mark, helperVisInformation)
        }
        return vis;
    }
}

function modifyVisFromMark(vis: ChartInformation, mark: Mark, spec: any): void {
    switch (mark) {
        case 'bar':
            /*
            Filtering Axes for band scales (potential to be implemented into the Vega Adapter)
            const bandScale = spec.scales?.filter((scale: Scale) => scale.type === "band")[0]!;
            console.log(bandScale)
            const bandAxis = spec.axes?.filter((axis: Axis) => axis.scale === bandScale.name)[0]!
            console.log(bandAxis)
            vis.axes = vis.axes.filter((visAxis: EncodingInformation) => visAxis.title === bandAxis.title)
            */
            const nomAxis = Object.keys(spec.encoding).filter((key: string) => {
                return spec.encoding[key].type === "nominal" || spec.encoding[key].aggregate === undefined
            })[0]
            vis.axes = vis.axes.filter((visAxis: EncodingInformation) => visAxis.field === spec.encoding[nomAxis].field)
            break;
        case 'geoshape':
            break;
        case 'point':
            if (vis.title) {
                vis.title = `Scatter plot with title ${vis.title} `;
            }
            vis.gridNodes = vis.axes;
            break;
    }
}