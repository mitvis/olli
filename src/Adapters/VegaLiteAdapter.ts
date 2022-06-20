import { Spec } from "vega";
import {
    VisAdapter,
    AbstractedVis,
    ChartInformation,
    Mark,
    Guide,
    FactedChart,
    Axis,
    Legend
} from "./Types";

export const VegaLiteAdapter: VisAdapter = (visObject: any, helperVisInformation: any): AbstractedVis => {
    if (visObject.items.some((node: any) => node.role === 'scope')) {
        return parseMultiView(visObject, helperVisInformation)
    } else {
        return parseChart(visObject, helperVisInformation)
    }
}

function parseMultiView(scenegraph: any, spec: any): AbstractedVis {
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
    let nestedHeirarchies: ChartInformation[] = scenegraph.items.filter((el: any) => el.role === "scope")[0].items
        .map((chart: any) => {
            let chartData = parseChart(chart, spec)
            shallowCopyArray(axes, chartData.axes)
            shallowCopyArray(legends, chartData.legends)
            chartData.facetedValue = chart.datum[facetedField];
            modifyVisFromMark(chartData, chartData.markUsed!, spec)
            return chartData
        });

    let node: FactedChart = {
        description: "",
        data: getVisualizationData(scenegraph, spec),
        dataFieldsUsed: fields,
        charts: nestedHeirarchies,
        facetedField: facetedField
    }

    node.dataFieldsUsed.push(facetedField)
    node.charts.forEach((chart: ChartInformation) => {
        for (let key in chart.data.keys()) {
            let data = chart.data.get(key)!
            chart.data.set(key, data.filter((val: any) => val[facetedField] === chart.title))
        }
    })

    constructChartDescription(node, spec)
    return node;
}

function parseChart(scenegraph: any, spec: any): ChartInformation {
    let axes: Axis[] = findScenegraphNodes(scenegraph, "axis").map((axis: any) => parseAxis(scenegraph, axis, spec))
    let legends: Legend[] = findScenegraphNodes(scenegraph, "legend").map((legend: any) => parseLegend(scenegraph, legend, spec))
    let fields: string[] = (axes as any[]).concat(legends).reduce((fieldArr: string[], guide: Guide) => fieldArr.concat(guide.field), [])
    let mark: Mark = spec.mark
    let node: ChartInformation = {
        axes: axes.filter((axis: Axis) => axis.field !== undefined),
        legends: legends,
        description: "",
        dataFieldsUsed: fields,
        gridNodes: [],
        data: getVisualizationData(scenegraph, spec),
        markUsed: mark
    }
    constructChartDescription(node, spec);
    modifyVisFromMark(node, mark, spec);
    return node
}

function parseAxis(scenegraph: any, axisScenegraphNode: any, spec: any): Axis {
    const axisView = axisScenegraphNode.items[0]
    const orient = axisView.orient
    const encodingKey = orient === 'bottom' ? 'x' : 'y';
    const ticks = axisView.items.find((n: any) => n.role === 'axis-tick').items.map((n: any) => n.datum.value);
    const title = spec.encoding[encodingKey].title;
    const scale = axisView.datum.scale
    const axisData = getScaleData(getVisualizationData(scenegraph, spec), scale, spec)
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

function parseLegend(scenegraph: any, legendScenegraphNode: any, spec: any): Legend {
    let scale = legendScenegraphNode.items[0].datum.scales[Object.keys(legendScenegraphNode.items[0].datum.scales)[0]];
    let data: any[] = getScaleData(getVisualizationData(scenegraph, spec), scale, spec)
    if (data === undefined) {
        data = getVisualizationData(scenegraph, spec).get("source_0")!;
    }
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

function constructChartDescription(node: AbstractedVis, spec: any): void {
    let desc: string = spec.description ? spec.description : "";
    if ((node as FactedChart).charts !== undefined) {
        desc = `${desc} with ${(node as FactedChart).charts.length} nested charts.`
        node.description = spec.description;
    } else {
        node.description = `${desc}`;
    }
}

/**
 * Finds the corresponding data that a scale refers to
 * @param scale The name of the scale to compare in the Vega Spec
 * @returns The array of objects that the scale uses.
 */
function getScaleData(data: Map<string, any[]>, scale: string, spec: any): any[] {
    // const scaleDomain = spec.scales?.find((s: any) => scale === s.name)!.domain;
    // const dataRef = scaleDomain.data

    return data.get('source_0')!;
}

function getVisualizationData(view: any, spec: any): Map<string, any[]> {
    try {
        let data: Map<string, any[]> = new Map()
        Object.keys(view.context.data).forEach((key: string) => {
            data.set(key, view.context.data[key].values.value)
        })
        return data
    } catch (error) {
        throw new Error(`No data defined in the Spec \n ${error}`)
    }
}

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

export function verifyNode(scenegraphNode: any, cancelRoles: string[]): boolean {
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

function modifyVisFromMark(vis: ChartInformation, mark: Mark, spec: any): void {
    switch (mark) {
        case 'bar':
            /*
            Filtering Axes for band scales (potential to be implemented into the Vega Adapter)
            const bandScale = spec.scales?.filter((scale: Scale) => scale.type === "band")[0]!;
            console.log(bandScale)
            const bandAxis = spec.axes?.filter((axis: Axis) => axis.scale === bandScale.name)[0]!
            console.log(bandAxis)
            vis.axes = vis.axes.filter((visAxis: Guide) => visAxis.title === bandAxis.title)
            */
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