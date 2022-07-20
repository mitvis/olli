import { Scene } from "vega";
import { TopLevelSpec } from "vega-lite";
import {
    VisAdapter,
    OlliVisSpec,
    Chart,
    Mark,
    Guide,
    FacetedChart,
    Axis,
    Legend,
    facetedChart,
    chart
} from "./Types";

/**
 * Adapter to deconstruct Vega-Lite visualizations into an {@link OlliVisSpec}
 * @param visObject The Vega Scenegraph from the view
 * @param helperVisInformation The Vega-Lite Spec that rendered the visualization
 * @returns An {@link OlliVisSpec} of the deconstructed Vega-Lite visualization
 */
export const VegaLiteAdapter: VisAdapter = (visObject: Scene, helperVisInformation: TopLevelSpec): OlliVisSpec => {
    if (visObject.items.some((node: any) => node.role === 'scope')) {
        return parseMultiView(visObject, helperVisInformation)
    } else {
        return parseChart(visObject, helperVisInformation)
    }
}

/**
 * @param scenegraph The Vega Scenegraph from the view
 * @param spec The Vega-Lite Spec that rendered the visualization
 * @returns An {@link OlliVisSpec} of the deconstructed Vega-Lite visualization
 */
function parseMultiView(scenegraph: any, spec: any): OlliVisSpec {
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

    let axes: Axis[] = filterUniqueNodes(findScenegraphNodes(scenegraph, "axis").map((axis: any) => parseAxis(scenegraph, axis, spec)))
    let legends: Legend[] = filterUniqueNodes(findScenegraphNodes(scenegraph, "legend").map((legend: any) => parseLegend(scenegraph, legend, spec)))
    let fields = (axes as any[]).concat(legends).reduce((fieldArr: string[], guide: Guide) => fieldArr.concat(guide.field), [])
    let facetedField = spec.encoding.facet !== undefined ? spec.encoding.facet.field : spec.encoding['color'].field
    let nestedHeirarchies: Map<any, Chart> = new Map(scenegraph.items.filter((el: any) => el.role === "scope")[0].items
        .map((chart: any) => {
            let chartData = parseChart(chart, spec)
            shallowCopyArray(axes, chartData.axes)
            shallowCopyArray(legends, chartData.legends)
            modifyVisFromMark(chartData, chartData.markUsed!, spec)
            return [chart.datum[facetedField], chartData]
        })
    );

    let node = facetedChart({
        description: "",
        data: getVisualizationData(scenegraph, spec),
        dataFieldsUsed: fields,
        charts: nestedHeirarchies,
        facetedField: facetedField
    })

    node.dataFieldsUsed.push(facetedField)
    node.charts.forEach((chart: Chart) => {
        chart.data = chart.data.filter((val: any) => val[facetedField] === chart.title)
    })

    constructChartDescription(node, spec)
    return node;
}

/**
 * @param scenegraph The Vega Scenegraph from the view
 * @param spec The Vega-Lite Spec that rendered the visualization
 * @returns An {@link OlliVisSpec} of the deconstructed Vega-Lite visualization
 */
function parseChart(scenegraph: any, spec: any): Chart {
    let axes: Axis[] = findScenegraphNodes(scenegraph, "axis").map((axis: any) => parseAxis(scenegraph, axis, spec))
    let legends: Legend[] = findScenegraphNodes(scenegraph, "legend").map((legend: any) => parseLegend(scenegraph, legend, spec))
    let fields: string[] = (axes as any[]).concat(legends).reduce((fieldArr: string[], guide: Guide) => fieldArr.concat(guide.field), [])
    let mark: Mark = spec.mark
    let node = chart({
        axes: axes.filter((axis: Axis) => axis.field !== undefined),
        legends: legends,
        description: "",
        dataFieldsUsed: fields,
        gridNodes: [],
        data: getVisualizationData(scenegraph, spec),
        markUsed: mark
    })
    constructChartDescription(node, spec);
    modifyVisFromMark(node, mark, spec);
    return node
}

/**
 *
 * @param scenegraph The Vega Scenegraph from the view
 * @param axisScenegraphNode The specific scenegraph node of an axis
 * @param spec The Vega-Lite Spec that rendered the visualization
 * @returns A {@link Axis} from the converted axisScenegraphNode
 */
function parseAxis(scenegraph: any, axisScenegraphNode: any, spec: any): Axis {
    const axisView = axisScenegraphNode.items[0]
    const orient = axisView.orient
    const encodingKey = orient === 'bottom' ? 'x' : 'y';
    const ticks = axisView.items.find((n: any) => n.role === 'axis-tick').items.map((n: any) => n.datum.value);
    const title = spec.encoding[encodingKey].title;
    const scale = axisView.datum.scale
    const axisData = getVisualizationData(scenegraph, spec);
    const axisStr = axisView.orient === "bottom" || axisView.orient === "top" ? "X-Axis" : "Y-Axis";
    let field;

    if (spec.encoding[encodingKey].aggregate) {
        field = Object.keys(axisData[0]).filter((key: string) => key.includes(spec.encoding[encodingKey].field))
    } else {
        field = spec.encoding[encodingKey].field
    }

    return {
        values: ticks,
        title: title === undefined ? axisStr : `${axisStr} titled '${title}'`,
        data: axisData,
        field: field,
        scaleType: spec.encoding[encodingKey].type,
        orient: orient,
        markUsed: spec.mark
    }
}

/**
 *
 * @param scenegraph The Vega Scenegraph from the view
 * @param legendScenegraphNode The specific scenegraph node of a legend
 * @param spec The Vega-Lite Spec that rendered the visualization
 * @returns A {@link legend} from the converted legendScenegraphNode
 */
function parseLegend(scenegraph: any, legendScenegraphNode: any, spec: any): Legend {
    let scale = legendScenegraphNode.items[0].datum.scales[Object.keys(legendScenegraphNode.items[0].datum.scales)[0]];
    let data: any[] = getVisualizationData(scenegraph, spec);
    let labels: any[] = legendScenegraphNode.items[0].items.find((n: any) => n.role === "legend-entry").items[0].items[0].items;

    return {
        values: labels.map((n: any) => n.items.find((el: any) => el.role === "legend-label").items[0].datum.value),
        title: spec.encoding['color'].title ? spec.encoding['color'].title : spec.encoding['color'].field,
        data: data,
        field: spec.encoding['color'].field,
        scaleType: spec.scales?.find((specScale: any) => specScale.name === scale)?.type,
        type: spec.encoding['color'].type,
        markUsed: spec.mark
    }
}

/**
 *
 * @param node The {@link OlliVisSpec} whose description is being modified
 * @param spec The specification of the Vega-Lite visualization being deconstructed
 */
function constructChartDescription(node: OlliVisSpec, spec: any): void {
    let desc: string = spec.description ? spec.description : "";
    if (node.type === "facetedChart") {
        desc = `${desc} with ${node.charts.size} faceted charts.`
        node.description = spec.description;
    } else if (node.type === "nestedChart") {
        desc = `${desc} with ${node.charts.length} nested charts.`
        node.description = spec.description;
    } else {
        node.description = `${desc}`;
    }
}

/**
 * A Map of data used in the visualization
 * @param view The Vega Scenegraph of this visualization
 * @param spec The Vega-Lite specification for the visualization
 * @returns A key-value pair of the data defined in this visualization
 */
function getVisualizationData(view: any, spec: any): any[] {
    try {
        // TODO fix hardcoded dataset name
        const source_0 = view.context.data['source_0'].values.value;
        // let data: Map<string, any[]> = new Map()
        // Object.keys(view.context.data).forEach((key: string) => {
        //     data.set(key, view.context.data[key].values.value)
        // })
        // return data
        return source_0;
    } catch (error) {
        throw new Error(`No data defined in the Spec \n ${error}`)
    }
}

/**
 * Traverses a provided scenegraph node for nodes of a specific role.
 * @param scenegraphNode The root scenegraph node to traverse
 * @param passRole The string of the node role to search for
 * @returns an array of ndoes that contain the specified role
 */
export function findScenegraphNodes(scenegraphNode: any, passRole: string): any[] {
    let nodes: any[] = [];
    const cancelRoles: string[] = ["cell", "axis-grid"]
    if (scenegraphNode.items === undefined) {
        return nodes;
    }
    scenegraphNode.items.forEach((nestedItem: any) => {
        if (nestedItem.role !== undefined) {
            if (nestedItem.role === passRole && verifyNode(nestedItem, cancelRoles)) {
                nodes.push(nestedItem);
            } else {
                nodes = nodes.concat(findScenegraphNodes(nestedItem, passRole))
            }
        } else {
            nodes = nodes.concat(findScenegraphNodes(nestedItem, passRole))
        }
    })
    return nodes
}

/**
 * Checks if a scenegraph node or its children do not have any specified role names
 * @param scenegraphNode The scenegraph ndoe to traverse
 * @param cancelRoles Roles of Scenegraph Nodes that should not be parsed
 * @returns True if the provided scenegraph node and its children do not contain any of the cancelRols
 */
function verifyNode(scenegraphNode: any, cancelRoles: string[]): boolean {
    if (scenegraphNode.role !== undefined && !cancelRoles.some((role: string) => scenegraphNode.role.includes(role))) {
        if (scenegraphNode.items.every((item: any) => verifyNode(item, cancelRoles)) || scenegraphNode.items === undefined) {
            return true
        } else {
            return false
        }
    } else if (scenegraphNode.role === undefined && scenegraphNode.items !== undefined) {
        return scenegraphNode.items.every((item: any) => verifyNode(item, cancelRoles));
    } else if (scenegraphNode.role === undefined && scenegraphNode.items === undefined) {
        return true
    } else {
        return false
    }
}

/**
 *
 * @param vis The {@link ChartInformation} to update
 * @param mark The {@link Mark} used in the provided {@Link ChartInformation}
 * @param spec The Vega-Lite specification of the provided visualization
 */
function modifyVisFromMark(vis: Chart, mark: Mark, spec: any): void {
    switch (mark) {
        case 'bar':
            const nomAxis = Object.keys(spec.encoding).filter((key: string) => {
                return spec.encoding[key].type === "nominal" || spec.encoding[key].aggregate === undefined
            })[0]
            vis.axes = vis.axes.filter((visAxis: Guide) => visAxis.title.toLowerCase().includes(`${nomAxis}-axis`))
            break;
        case 'geoshape':
            break;
        case 'point':
            if (vis.title) {
                vis.title = `Scatter plot with title ${vis.title} `;
            }
            vis.gridNodes = [...vis.axes];
            break;
    }
}

(window as any).VegaLiteAdapter = VegaLiteAdapter