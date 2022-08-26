import { TopLevelSpec, compile, isNumeric } from "vega-lite";
import {
    VisAdapter,
    OlliVisSpec,
    Chart,
    OlliMark,
    Guide,
    Axis,
    Legend,
    facetedChart,
    chart
} from "./Types";
import { findScenegraphNodes, getData, getVegaScene, axisTypeFromScale, SceneGroup } from "./utils";

/**
 * Adapter to deconstruct Vega-Lite visualizations into an {@link OlliVisSpec}
 * @param spec The Vega-Lite Spec that rendered the visualization
 * @returns An {@link OlliVisSpec} of the deconstructed Vega-Lite visualization
 */
export const VegaLiteAdapter: VisAdapter<TopLevelSpec> = async (spec: TopLevelSpec): Promise<OlliVisSpec> => {
    const scene: SceneGroup = await getVegaScene(compile(spec).spec);
    const data = getData(scene);
    if (scene.items.some((node: any) => node.role === 'scope')) {
        // looking for role === 'scope' means we're using parseMultiView to handle
        // both faceted charts and multi-series lines
        return parseMultiView(spec, scene, data)
    } else {
        return parseChart(spec, scene, data)
    }
}

/**
 * @param scenegraph The Vega Scenegraph from the view
 * @param spec The Vega-Lite Spec that rendered the visualization
 * @returns An {@link OlliVisSpec} of the deconstructed Vega-Lite visualization
 */
function parseMultiView(spec: any, scene: SceneGroup, data: any[]): OlliVisSpec {
    const filterUniqueNodes = ((nodeArr: any[]) => {
        let uniqueNodes: any[] = []
        nodeArr.forEach((node: any) => {
            if (uniqueNodes.every((un: any) => JSON.stringify(un) !== JSON.stringify(node))) {
                uniqueNodes.push(node)
            }
        })

        return uniqueNodes
    })
    const shallowCopyArray = (objToCopy: any[], arrToPush: any[]): void => {
        objToCopy.forEach((obj: any) => {
            const objCopy = Object.assign({}, obj);
            objCopy.data = JSON.parse(JSON.stringify(obj.data))
            arrToPush.push(objCopy);
        })
    }

    let axes: Axis[] = filterUniqueNodes(findScenegraphNodes(scene, "axis").map((axis: any) => parseAxis(scene, axis, spec, data)))
    let legends: Legend[] = filterUniqueNodes(findScenegraphNodes(scene, "legend").map((legend: any) => parseLegend(legend, spec)))
    let fields = (axes as any[]).concat(legends).reduce((fieldArr: string[], guide: Guide) => fieldArr.concat(guide.field), [])
    let facetedField = spec.encoding.facet !== undefined ? spec.encoding.facet.field : spec.encoding['color'].field
    let nestedHeirarchies: Map<any, Chart> = new Map(scene.items.filter((el: any) => el.role === "scope")[0].items
        .map((chart: any) => {
            let chartData = parseChart(chart, spec, data)
            shallowCopyArray(axes, chartData.axes)
            shallowCopyArray(legends, chartData.legends)
            modifyVisFromMark(chartData, chartData.mark!, spec)
            chartData.dataFieldsUsed = [...fields]
            return [chart.datum[facetedField], chartData]
        })
    );

    let node = facetedChart({
        data,
        dataFieldsUsed: fields,
        charts: nestedHeirarchies,
        facetedField: facetedField
    })

    node.dataFieldsUsed.push(facetedField)
    return node;
}

/**
 * @param scene The Vega Scenegraph from the view
 * @param spec The Vega-Lite Spec that rendered the visualization
 * @returns An {@link OlliVisSpec} of the deconstructed Vega-Lite visualization
 */
function parseChart(spec: any, scene: SceneGroup, data: any[]): Chart {
    let axes: Axis[] = findScenegraphNodes(scene, "axis").map((axis: any) => parseAxis(scene, axis, spec, data))
    let legends: Legend[] = findScenegraphNodes(scene, "legend").map((legend: any) => parseLegend(legend, spec))
    let fields: string[] = (axes as any[]).concat(legends).reduce((fieldArr: string[], guide: Guide) => fieldArr.concat(guide.field), [])
    let mark: any = spec.mark // TODO vega-lite mark type exceeds olli mark type, should do some validation
    let node = chart({
        axes: axes.filter((axis: Axis) => axis.field !== undefined),
        legends: legends,
        dataFieldsUsed: fields,
        gridCells: [],
        data,
        mark
    })
    modifyVisFromMark(node, mark, spec);
    return node
}

/**
 *
 * @param scene The Vega Scenegraph from the view
 * @param axisScenegraphNode The specific scenegraph node of an axis
 * @param spec The Vega-Lite Spec that rendered the visualization
 * @returns A {@link Axis} from the converted axisScenegraphNode
 */
function parseAxis(scene: SceneGroup, axisScenegraphNode: any, spec: any, data: any[]): Axis {
    const axisView = axisScenegraphNode.items[0]
    const orient = axisView.orient
    const encodingKey = orient === 'bottom' ? 'x' : 'y';
    const encoding = spec.encoding[encodingKey];
    const ticks = axisView.items.find((n: any) => n.role === 'axis-tick').items.map((n: any) => n.datum.value);
    const title = encoding.title;
    const axisType = axisView.orient === "bottom" || axisView.orient === "top" ? "x" : "y";
    let field;

    if (encoding.aggregate) {
        field = Object.keys(data[0]).filter((key: string) => key.includes(encoding.field))
    } else {
        field = encoding.field
    }

    const type = (encoding.type === 'quantitative' || encoding.aggregate) ? 'continuous' : 'discrete';

    return {
        type,
        values: ticks,
        title: title,
        field: field,
        scaleType: encoding.type,
        axisType: axisType
    }
}

/**
 *
 * @param scenegraph The Vega Scenegraph from the view
 * @param legendScenegraphNode The specific scenegraph node of a legend
 * @param spec The Vega-Lite Spec that rendered the visualization
 * @returns A {@link legend} from the converted legendScenegraphNode
 */
function parseLegend(legendScenegraphNode: any, spec: any): Legend {
    const scaleName = legendScenegraphNode.items[0].datum.scales[Object.keys(legendScenegraphNode.items[0].datum.scales)[0]];
    const labels: any[] = legendScenegraphNode.items[0].items.find((n: any) => n.role === "legend-entry").items[0].items[0].items;

    const values = labels.map((n: any) => n.items.find((el: any) => el.role === "legend-label").items[0].datum.value);

    const scaleSpec = spec.scales?.find((specScale: any) => specScale.name === scaleName);

    const type = scaleSpec?.type ? axisTypeFromScale(scaleSpec): (
        values.every((t: any) => isNumeric(t)) ? 'continuous' : 'discrete'
    );

    return {
        type,
        values,
        title: spec.encoding['color'].title ? spec.encoding['color'].title : spec.encoding['color'].field,
        field: spec.encoding['color'].field,
        scaleType: scaleSpec?.type,
        legendType: spec.encoding['color'].type
    }
}

/**
 *
 * @param vis The {@link ChartInformation} to update
 * @param mark The {@link OlliMark} used in the provided {@Link ChartInformation}
 * @param spec The Vega-Lite specification of the provided visualization
 */
function modifyVisFromMark(vis: Chart, mark: OlliMark, spec: any): void {
    switch (mark) {
        case 'bar':
            // const nomAxis = Object.keys(spec.encoding).filter((key: string) => {
            //     return spec.encoding[key].type === "nominal" || spec.encoding[key].aggregate === undefined
            // })[0]
            // vis.axes = vis.axes.filter((visAxis: Guide) => visAxis.title.toLowerCase().includes(`${nomAxis}-axis`))
            break;
        case 'point':
            if (vis.title) {
                vis.title = `Scatter plot with title ${vis.title} `;
            }
            vis.gridCells = [...vis.axes];
            break;
    }
}
