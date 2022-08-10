import { Spec, ScaleDataRef, Scale, ScaleData } from "vega";
import { Guide, OlliVisSpec, VisAdapter, chart, Chart, Axis, Legend, facetedChart, FacetedChart } from "./Types";

let view: any;
let spec: Spec;

/**
* Adapter function that breaks down a Vega visualization into it's basic visual grammar
* @param view The Vega Scenegraph object used in the visualization
* @param spec The Vega Specification used to generate the visualization
* @returns the {@link OlliVisSpec}, the non-concrete visualization information that can be later used to
* generate the Accessibility Tree Encoding
*/
export const VegaAdapter: VisAdapter = (view: any, spec: Spec): OlliVisSpec => {
    view = view.scenegraph().root.items[0];
    spec = spec;
    if (view.items.some((el: any) => el.role === "scope")) {
        return parseFacets();
    } else {
        return parseSingleChart(view);
    }
}

function parseFacets(): FacetedChart {
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

    const baseVisDescription = vegaVisDescription(spec);
    const axes = filterUniqueNodes(findScenegraphNodes(view, "axis").map((axisNode: any) => parseAxisInformation(axisNode)));
    const legends = filterUniqueNodes(findScenegraphNodes(view, "legend").map((legendNode: any) => parseLegendInformation(legendNode)));
    const chartItems = view.items.filter((el: any) => el.role === "scope")[0].items;
    const fields: string[] = getDataFields(axes, legends);
    let facetField: string
    const facetMark = (spec.marks?.find((m: any, i: number) => m.from && m.from.facet)!.from! as any).facet.groupby
    if(Array.isArray(facetMark)) {
        facetField = facetMark[0]
    } else {
        facetField = facetMark
    }
    fields.push(facetField)

    const charts: Map<any, Chart> = new Map(
        chartItems.map((chartNode: any) => {
            let chart: Chart = parseSingleChart(chartNode);
            let key = chartNode.datum[facetField];
            chart.title = findScenegraphNodes(chartNode, "title-text").length > 0 ?
                findScenegraphNodes(chartNode, "title-text")[0].items[0].text : '';
            shallowCopyArray(axes, chart.axes);
            shallowCopyArray(legends, chart.legends);
            return [key, chart]
        }))

    let multiViewChart = facetedChart({
        charts: charts,
        data: getData(),
        dataFieldsUsed: fields,
        description: baseVisDescription,
        facetedField: facetField
    })

    return multiViewChart;
}

function parseSingleChart(ch: any): Chart {
    const baseVisDescription = vegaVisDescription(spec);
    const axes = findScenegraphNodes(ch, "axis").map((axisNode: any) => parseAxisInformation(axisNode));
    const legends = findScenegraphNodes(ch, "legend").map((legendNode: any) => parseLegendInformation(legendNode))
    const gridNodes: Guide[] = []// getGridNodes(axes);
    const dataFields: string[] = getDataFields(axes, legends);
    const data: any[] = getData();
    const chartTitle: string | undefined = findScenegraphNodes(ch, "title").length > 0 ?
        findScenegraphNodes(ch, "title")[0].items[0].items[0].items[0].text
        : undefined;
    let chartNode = chart({
        data: data,
        axes: axes,
        legends: legends,
        description: baseVisDescription,
        gridNodes: gridNodes,
        dataFieldsUsed: dataFields
    })
    if (chartTitle) {
        chartNode.title = chartTitle;
    }
    return chartNode;
}

function getData(): any[] {
    try {
        // let data: Map<string, any[]> = new Map()
        // const datasets = spec.data?.map((set: any) => set.name)!
        // datasets.map((key: string) => data.set(key, view.context.data[key].values.value));
        // return data
        return [...view.context.data['source_0'].values.value]
        // TODO hardcoded dataset name
    } catch (error) {
        throw new Error(`No data defined in the Vega Spec \n ${error}`)
    }
}

/**
 * @returns the general high-level description of the visualization
 */
function vegaVisDescription(spec: Spec): string {
    return spec.description ? spec.description : "[Root]";
}

/**
 * @returns a key-value pairing of the axis orientation and the {@link Guide} of the corresponding axis
 */
function parseAxisInformation(axis: any): Axis {
    const axisView = axis.items[0]
    const ticks = axisView.items.find((n: any) => n.role === 'axis-tick').items.map((n: any) => n.datum.value);
    const title = axisView.items.find((n: any) => n.role === "axis-title");
    const scale = axisView.datum.scale
    let scaleDomain: any = (spec.scales?.find((specScale: Scale) => specScale.name === scale)?.domain as ScaleData)!

    if (!scaleDomain) {
        spec.marks?.forEach((m: any) => {
            const markScales: Scale[] = m.scales;
            if (markScales) {
                let s = markScales.find((specScale: Scale) => specScale.name === scale)
                if (s) scaleDomain = s.domain as ScaleData
            }
        })
    }

    let fields: string | string[]
    if (scaleDomain.field !== undefined) {
        fields = scaleDomain.field
    } else {
        fields = scaleDomain.fields
    }
    const axisStr = axisView.orient === "bottom" || axisView.orient === "top" ? "X-Axis" : "Y-Axis";
    const orient = axisView.orient

    return {
        values: ticks,
        title: title === undefined ? axisStr : `${axisStr} titled '${title.items[0].text}'`,
        data: getData(),
        field: fields,
        scaleType: spec.scales?.find((specScale: any) => specScale.name === scale)?.type,
        orient: orient
    }
}

/**
 * @returns a key-value pairing of the legend name and the {@link Guide} of the corresponding axis
 */
function parseLegendInformation(legendNode: any): Legend {
    let scale = legendNode.items[0].datum.scales[Object.keys(legendNode.items[0].datum.scales)[0]];
    let data: any[] = getData();
    let labels: any[] = legendNode.items[0].items.find((n: any) => n.role === "legend-entry").items[0].items[0].items;
    let title: string = legendNode.items[0].items.find((n: any) => n.role === "legend-title").items[0].text;
    let field: string | undefined
    const legendDomain = spec.scales?.find((specScale: any) => specScale.name === scale)?.domain
    if ((legendDomain as ScaleDataRef).field) {
        field = (legendDomain as ScaleDataRef)!.field as string;
    } else {
        if (Object.keys(data[0]).some((key: string) => key.toLocaleString() === title.toLocaleLowerCase())) {
            field = title.toLocaleLowerCase();
        }
    }


    return {
        values: labels.map((n: any) => n.items.find((el: any) => el.role === "legend-label").items[0].datum.value),
        title: title,
        data: data,
        field: (field as string),
        scaleType: spec.scales?.find((specScale: any) => specScale.name === scale)?.type,
        type: ""
    }

}

/**
 * Finds the corresponding data that a scale refers to
 * @param scale The name of the scale to compare in the Vega Spec
 * @returns The array of objects that the scale uses.
 */
function getScaleData(data: Map<string, any[]>, scale: string): any[] {
    const scaleDomain = (spec.scales?.find((s: Scale) => scale === s.name)!.domain as ScaleData);
    const dataRef = (scaleDomain as ScaleDataRef).data

    return data.get(dataRef)!;
}

/**
 * Determines if the chart has the eligible qualities to have a navigable grid node
 * @returns the {@link Guide} nodes of that are used for the grid
 */
function getGridNodes(axes: Guide[]): Guide[] {
    const gridAxes = view.items.filter((el: any) => el.role === "axis" && el.items[0].items.some((it: any) => it.role === "axis-grid"))
    return gridAxes.map((axis: any) => {
        return axes[axis.items[0].orient]
    })
}

/**
 * @returns the fields of the data object that are used throughout the visualization axes legends
 */
function getDataFields(axes: Guide[], legends: Guide[]): string[] {
    let fields: string[] = [];
    const pushFields = (obj: any) => {
        Object.keys(obj).forEach((key: string) => {
            const usedFields = obj[key].field;
            if (typeof usedFields !== "string") {
                usedFields.forEach((field: string) => {
                    fields.push(field);
                })
            } else {
                fields.push(usedFields);
            }
        })
    }
    pushFields(axes);
    pushFields(legends);
    return fields;
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
