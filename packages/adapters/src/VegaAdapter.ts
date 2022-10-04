import { Spec, ScaleDataRef, Scale, ScaleData, Scene, SceneItem, isString, SignalRef, ScaleMultiFieldsRef } from "vega";
import { OlliVisSpec, VisAdapter, chart, Chart, Axis, Legend, facetedChart, FacetedChart, OlliMark, OlliDataset } from "olli";
import { filterUniqueNodes, findScenegraphNodes, getData, getVegaScene, guideTypeFromScale, isNumeric, SceneGroup } from "./utils";

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

function parseFacets(spec: Spec, scene: SceneGroup, data: OlliDataset): FacetedChart {
    const axes = filterUniqueNodes(findScenegraphNodes(scene, "axis").map((axisNode: any) => parseAxisInformation(spec, axisNode)));
    const legends = filterUniqueNodes(findScenegraphNodes(scene, "legend").map((legendNode: any) => parseLegendInformation(spec, legendNode, data)));
    const chartItems = scene.items.filter((el: any) => el.role === "scope")[0].items;
    let facetField: string
    const facetMarkSpec = spec.marks?.find((m: any, i: number) => m.from && m.from.facet)! as any;

    const mark = vegaMarkToOlliMark(facetMarkSpec.marks[0].type);

    const facetDef = (facetMarkSpec.from! as any).facet.groupby

    if (Array.isArray(facetDef)) {
        facetField = facetDef[0]
    } else {
        facetField = facetDef
    }

    const charts: Map<string, Chart> = new Map(
        chartItems.map((chartNode) => {
            const chart: Chart = parseSingleChart(spec, chartNode, data);
            const key = (chartNode.datum as any)[facetField];
            chart.title = findScenegraphNodes(chartNode, "title-text").length > 0 ?
                findScenegraphNodes(chartNode, "title-text")[0].items[0].text : '';
            chart.axes = axes;
            chart.legends = legends;
            chart.mark = mark;
            return [key, chart]
        }))

    let multiViewChart = facetedChart({
        charts: charts,
        data,
        facetedField: facetField
    })

    return multiViewChart;
}

function parseSingleChart(spec: Spec, scene: Scene | SceneItem, data: OlliDataset): Chart {
    const axes = findScenegraphNodes(scene, "axis").map((axisNode: any) => parseAxisInformation(spec, axisNode));
    const legends = findScenegraphNodes(scene, "legend").map((legendNode: any) => parseLegendInformation(spec, legendNode, data))
    const chartTitle: string | undefined = findScenegraphNodes(scene, "title").length > 0 ?
        findScenegraphNodes(scene, "title")[0].items[0].items[0].items[0].text
        : undefined;

    const mark = vegaMarkToOlliMark(spec.marks?.map(mark => mark.type)[0]); // TODO write a better way to get the mark type

    let chartNode = chart({
        data,
        mark,
        axes,
        legends
    })
    if (chartTitle) {
        chartNode.title = chartTitle;
    }
    return chartNode;
}

function vegaMarkToOlliMark(mark?: string): OlliMark | undefined {
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
    const ticks: any[] = axisView.items.find((n: any) => n.role === 'axis-tick').items.map((n: any) => n.datum.value);
    const title: string = axisView.items.find((n: any) => n.role === "axis-title")?.items?.[0]?.text;
    const scaleName: string = axisView.datum.scale;
    const scaleSpec = spec.scales?.find((specScale: Scale) => specScale.name === scaleName)!;

    // TODO make finding the field more robust to different kinds of scale domain specs
    let scaleDomain: any = scaleSpec?.domain as ScaleData

    if (!scaleDomain) {
        spec.marks?.forEach((m: any) => {
            const markScales: Scale[] = m.scales;
            if (markScales) {
                let s = markScales.find((specScale: Scale) => specScale.name === scaleName)
                if (s) scaleDomain = s.domain as ScaleData
            }
        })
    }

    let field: string;
    if (scaleDomain?.field && !scaleDomain?.field?.signal) {
        field = (scaleDomain as ScaleDataRef).field as string;
    } else if (scaleDomain.data && scaleDomain.fields) {
        if (scaleDomain.fields.length === 2 && (scaleDomain.fields[0] as string).endsWith('_start') && (scaleDomain.fields[1] as string).endsWith('_end')) {
            // stack transform for stacked bars
            const str = (scaleDomain as ScaleMultiFieldsRef).fields[0] as string;
            field = str.substring(0, str.indexOf('_start'));
        }
        else {
            // TODO think this case through
            field = scaleDomain.fields[0];
        }
    } else {
        // TODO
        field = scaleDomain.fields[0].field;
    }
    //

    const type = scaleSpec?.type ? guideTypeFromScale(scaleSpec.type) : (
        ticks.every((t: string | number) => !isString(t) || (isString(t) && isNumeric(t))) ? 'continuous' : 'discrete'
    );

    const axisType = axisView.orient === "bottom" || axisView.orient === "top" ? "x" : "y";

    return {
        type,
        values: ticks,
        title: title,
        field: field,
        scaleType: scaleSpec?.type,
        axisType: axisType
    }
}

/**
 * @returns a key-value pairing of the legend name and the {@link Guide} of the corresponding axis
 */
function parseLegendInformation(spec: Spec, legendNode: any, data: OlliDataset): Legend {
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

    const type = scaleSpec?.type ? guideTypeFromScale(scaleSpec.type) : (
        values.every((t: string | number) => !isString(t) || (isString(t) && isNumeric(t))) ? 'continuous' : 'discrete'
    );

    return {
        type,
        values,
        title: title,
        field: (field as string)
    }

}

