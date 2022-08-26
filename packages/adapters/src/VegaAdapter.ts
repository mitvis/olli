import { Spec, ScaleDataRef, Scale, ScaleData, Scene, SceneItem, Mark } from "vega";
import { isNumeric } from "vega-lite";
import { AnyMark } from "vega-lite/build/src/mark";
import { Guide, OlliVisSpec, VisAdapter, chart, Chart, Axis, Legend, facetedChart, FacetedChart, OlliMark } from "./Types";
import { findScenegraphNodes, getData, getVegaScene, axisTypeFromScale, SceneGroup } from "./utils";

/**
* Adapter function that breaks down a Vega visualization into it's basic visual grammar
* @param spec The Vega Specification used to generate the visualization
* @returns the {@link OlliVisSpec}, the non-concrete visualization information that can be later used to
* generate the Accessibility Tree Encoding
*/
export const VegaAdapter: VisAdapter<Spec> = async (vSpec: Spec): Promise<OlliVisSpec> => {
    const scene = await getVegaScene(vSpec);
    const data = getData(scene);
    if (scene.items.some((el: any) => el.role === "scope")) {
        return parseFacets(vSpec, scene, data);
    } else {
        return parseSingleChart(vSpec, scene, data);
    }
}

function parseFacets(spec: Spec, scene: SceneGroup, data: any[]): FacetedChart {
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

    const axes = filterUniqueNodes(findScenegraphNodes(scene, "axis").map((axisNode: any) => parseAxisInformation(spec, axisNode)));
    const legends = filterUniqueNodes(findScenegraphNodes(scene, "legend").map((legendNode: any) => parseLegendInformation(spec, legendNode, data)));
    const chartItems = scene.items.filter((el: any) => el.role === "scope")[0].items;
    const fields: string[] = getDataFields(axes, legends);
    let facetField: string
    const facetMark = (spec.marks?.find((m: any, i: number) => m.from && m.from.facet)!.from! as any).facet.groupby
    if (Array.isArray(facetMark)) {
        facetField = facetMark[0]
    } else {
        facetField = facetMark
    }
    fields.push(facetField)

    const charts: Map<any, Chart> = new Map(
        chartItems.map((chartNode) => {
            const chart: Chart = parseSingleChart(spec, chartNode, data);
            const key = (chartNode.datum as any)[facetField];
            chart.title = findScenegraphNodes(chartNode, "title-text").length > 0 ?
                findScenegraphNodes(chartNode, "title-text")[0].items[0].text : '';
            shallowCopyArray(axes, chart.axes);
            shallowCopyArray(legends, chart.legends);
            return [key, chart]
        }))

    let multiViewChart = facetedChart({
        charts: charts,
        data,
        dataFieldsUsed: fields,
        facetedField: facetField
    })

    return multiViewChart;
}

function parseSingleChart(spec: Spec, scene: Scene | SceneItem, data: any[]): Chart {
    const axes = findScenegraphNodes(scene, "axis").map((axisNode: any) => parseAxisInformation(spec, axisNode));
    const legends = findScenegraphNodes(scene, "legend").map((legendNode: any) => parseLegendInformation(spec, legendNode, data))
    const dataFields: string[] = getDataFields(axes, legends);
    const chartTitle: string | undefined = findScenegraphNodes(scene, "title").length > 0 ?
        findScenegraphNodes(scene, "title")[0].items[0].items[0].items[0].text
        : undefined;

    let mark: OlliMark = vegaMarkToOlliMark(spec.marks?.map(mark => mark.type)[0]); // TODO this is very lazy, write a better way to get the mark type

    let chartNode = chart({
        data,
        mark,
        axes,
        legends,
        gridCells: [],
        dataFieldsUsed: dataFields
    })
    if (chartTitle) {
        chartNode.title = chartTitle;
    }
    return chartNode;
}

function vegaMarkToOlliMark(mark?: string): OlliMark {
    switch (mark) {
        case 'symbol': return 'point';
        case 'line': return 'line';
        case 'rect': return 'bar';
        default: return undefined;
    }
}

/**
 * @returns a key-value pairing of the axis orientation and the {@link Guide} of the corresponding axis
 */
function parseAxisInformation(spec: Spec, axis: any): Axis {
    const axisView = axis.items[0]
    const ticks = axisView.items.find((n: any) => n.role === 'axis-tick').items.map((n: any) => n.datum.value);
    const title: string = axisView.items.find((n: any) => n.role === "axis-title")?.items?.[0]?.text;
    const scaleName: string = axisView.datum.scale;
    const scaleSpec = spec.scales?.find((specScale: Scale) => specScale.name === scaleName)!;

    // TODO make finding the field more robust to different kinds of scale domain specs
    let scaleDomain: any = scaleSpec?.domain!

    if (!scaleDomain) {
        spec.marks?.forEach((m: any) => {
            const markScales: Scale[] = m.scales;
            if (markScales) {
                let s = markScales.find((specScale: Scale) => specScale.name === scaleName)
                if (s) scaleDomain = s.domain as ScaleData
            }
        })
    }

    let fields: string;
    if (scaleDomain.field !== undefined) {
        fields = scaleDomain.field
    } else {
        fields = scaleDomain.fields[1] // TODO hardcoded
    }
    //

    const type = scaleSpec?.type ? axisTypeFromScale(scaleSpec) : (
        ticks.every((t: any) => isNumeric(t)) ? 'continuous' : 'discrete'
    );

    const axisType = axisView.orient === "bottom" || axisView.orient === "top" ? "x" : "y";

    return {
        type,
        values: ticks,
        title: title,
        field: fields,
        scaleType: scaleSpec?.type,
        axisType: axisType
    }
}

/**
 * @returns a key-value pairing of the legend name and the {@link Guide} of the corresponding axis
 */
function parseLegendInformation(spec: Spec, legendNode: any, data: any[]): Legend {
    const scaleName: string = legendNode.items[0].datum.scales[Object.keys(legendNode.items[0].datum.scales)[0]];
    const scaleSpec = spec.scales?.find((specScale: any) => specScale.name === scaleName);
    const labels: any[] = legendNode.items[0].items.find((n: any) => n.role === "legend-entry").items[0].items[0].items;
    const title: string = legendNode.items[0].items.find((n: any) => n.role === "legend-title").items[0].text;

    let field: string | undefined
    const legendDomain = scaleSpec?.domain
    if ((legendDomain as ScaleDataRef).field) {
        field = (legendDomain as ScaleDataRef)!.field as string;
    } else {
        if (Object.keys(data[0]).some((key: string) => key.toLocaleString() === title.toLocaleLowerCase())) {
            field = title.toLocaleLowerCase();
        }
    }

    const values = labels.map((n: any) => n.items.find((el: any) => el.role === "legend-label").items[0].datum.value);

    const type = scaleSpec?.type ? axisTypeFromScale(scaleSpec) : (
        values.every((t: any) => isNumeric(t)) ? 'continuous' : 'discrete'
    );

    return {
        type,
        values,
        title: title,
        field: (field as string),
        scaleType: spec.scales?.find((specScale: any) => specScale.name === scaleName)?.type,
        legendType: "symbol" // TODO hardcoded legend type
    }

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
