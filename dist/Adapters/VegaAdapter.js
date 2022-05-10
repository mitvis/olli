"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyNode = exports.findScenegraphNodes = exports.VegaVisAdapter = void 0;
let view;
let spec;
/**
* Adapter function that breaks down a Vega visualization into it's basic visual grammar
* @param view The Vega Scenegraph object used in the visualization
* @param spec The Vega Specification used to generate the visualization
* @returns the {@link abstractedVisPlot}, the non-concrete visualization information that can be later used to
* generate the Accessibility Tree Encoding
*/
exports.VegaVisAdapter = {
    convertToGog(visObject, helperVisInformation) {
        view = visObject;
        spec = helperVisInformation;
        if (view.items.some((el) => el.role === "scope")) {
            return parseMultiViewChart();
        }
        else {
            return parseSingleChart(view);
        }
    }
};
function parseMultiViewChart() {
    const filterUniqueNodes = ((nodeArr) => {
        let uniqueNodes = [];
        nodeArr.forEach((node) => {
            if (uniqueNodes.every((un) => JSON.stringify(un) !== JSON.stringify(node))) {
                uniqueNodes.push(node);
            }
        });
        return uniqueNodes;
    });
    const baseVisDescription = vegaVisDescription(spec);
    const axes = filterUniqueNodes(findScenegraphNodes(view, "axis").map((axisNode) => parseAxisInformation(axisNode)));
    const legends = filterUniqueNodes(findScenegraphNodes(view, "legend").map((legendNode) => parseLegendInformation(legendNode)));
    const chartItems = view.items.filter((el) => el.role === "scope")[0].items;
    const charts = chartItems.map((chartNode) => {
        let chart = parseSingleChart(chartNode);
        chart.title = findScenegraphNodes(chartNode, "title-text")[0].items[0].text;
        return chart;
    });
    let multiViewChart = {
        charts: charts,
        data: getData(),
        dataFieldsUsed: getDataFields(axes, legends),
        description: baseVisDescription
    };
    multiViewChart.charts.forEach((chart) => {
        axes.forEach((axis) => {
            const shallowAxisCopy = Object.assign({}, axis);
            shallowAxisCopy.data = JSON.parse(JSON.stringify(axis.data));
            chart.axes.push(shallowAxisCopy);
        });
        legends.forEach((legend) => {
            const shallowLegendCopy = Object.assign({}, legend);
            shallowLegendCopy.data = JSON.parse(JSON.stringify(legend.data));
            chart.axes.push(shallowLegendCopy);
        });
    });
    return multiViewChart;
}
function parseSingleChart(chart) {
    const baseVisDescription = vegaVisDescription(spec);
    const axes = findScenegraphNodes(chart, "axis").map((axisNode) => parseAxisInformation(axisNode));
    const legends = findScenegraphNodes(chart, "legend").map((legendNode) => parseLegendInformation(legendNode));
    const gridNodes = getGridNodes(axes);
    const dataFields = getDataFields(axes, legends);
    const data = getData();
    const chartTitle = findScenegraphNodes(chart, "title")[0] !== undefined ?
        findScenegraphNodes(chart, "title")[0].items[0].items[0].items[0].text
        : null;
    let chartNode = {
        data: data,
        axes: axes,
        legends: legends,
        description: baseVisDescription,
        gridNodes: gridNodes,
        dataFieldsUsed: dataFields
    };
    if (chartTitle) {
        chartNode.title = chartTitle;
    }
    return chartNode;
}
function getData() {
    try {
        let data = new Map();
        const datasets = spec.data?.map((set) => set.name);
        datasets.map((key) => data.set(key, view.context.data[key].values.value));
        return data;
    }
    catch (error) {
        throw new Error(`No data defined in the Vega Spec \n ${error}`);
    }
}
/**
 * @returns the general high-level description of the visualization
 */
function vegaVisDescription(spec) {
    return spec.description ? spec.description : "[Root]";
}
/**
 * @returns a key-value pairing of the axis orientation and the {@link EncodingInformation} of the corresponding axis
 */
function parseAxisInformation(axis) {
    const axisView = axis.items[0];
    const ticks = axisView.items.find((n) => n.role === 'axis-tick').items.map((n) => n.datum.value);
    const title = axisView.items.find((n) => n.role === "axis-title");
    const scale = axisView.datum.scale;
    let scaleDomain = spec.scales?.find((specScale) => specScale.name === scale)?.domain;
    let fields;
    if (scaleDomain.field !== undefined) {
        fields = scaleDomain.field;
    }
    else {
        fields = scaleDomain.fields;
    }
    const axisStr = axisView.orient === "bottom" || axisView.orient === "top" ? "X-Axis" : "Y-Axis";
    const orient = axisView.orient;
    return {
        values: ticks,
        title: title === undefined ? axisStr : `${axisStr} titled '${title.items[0].text}'`,
        data: getScaleData(getData(), scale),
        field: fields,
        hasGrid: false,
        scaleType: spec.scales?.find((specScale) => specScale.name === scale)?.type
    };
}
/**
 * @returns a key-value pairing of the legend name and the {@link EncodingInformation} of the corresponding axis
 */
function parseLegendInformation(legendNode) {
    let legendLabels = legendNode.items[0].items.find((n) => n.role === "legend-entry").items[0].items[0].items;
    let legendTitle = legendNode.items[0].items.find((n) => n.role === "legend-title").items[0].text;
    let scale = legendNode.items[0].datum.scales[Object.keys(legendNode.items[0].datum.scales)[0]];
    const field = spec.scales?.find((specScale) => specScale.name === scale)?.domain.field;
    return {
        values: legendLabels.map((n) => n.items.find((el) => el.role === "legend-label").items[0].datum.value),
        title: legendTitle,
        data: getScaleData(getData(), scale),
        field: field,
        hasGrid: false,
        scaleType: spec.scales?.find((specScale) => specScale.name === scale)?.type
    };
}
/**
 * Finds the corresponding data that a scale refers to
 * @param scale The name of the scale to compare in the Vega Spec
 * @returns The array of objects that the scale uses.
 */
function getScaleData(data, scale) {
    const scaleDomain = spec.scales?.find((s) => scale === s.name).domain;
    const dataRef = scaleDomain.data;
    return data.get(dataRef);
}
/**
 * Determines if the chart has the eligible qualities to have a navigable grid node
 * @returns the {@link EncodingInformation} nodes of that are used for the grid
 */
function getGridNodes(axes) {
    const gridAxes = view.items.filter((el) => el.role === "axis" && el.items[0].items.some((it) => it.role === "axis-grid"));
    return gridAxes.map((axis) => {
        return axes[axis.items[0].orient];
    });
}
/**
 * @returns the fields of the data object that are used throughout the visualization axes legends
 */
function getDataFields(axes, legends) {
    let fields = [];
    const pushFields = (obj) => {
        Object.keys(obj).forEach((key) => {
            const usedFields = obj[key].field;
            if (typeof usedFields !== "string") {
                usedFields.forEach((field) => {
                    fields.push(field);
                });
            }
            else {
                fields.push(usedFields);
            }
        });
    };
    pushFields(axes);
    pushFields(legends);
    return fields;
}
function findScenegraphNodes(scenegraphNode, passRole) {
    let nodes = [];
    const cancelRoles = ["cell", "axis-grid"];
    if (scenegraphNode.items === undefined) {
        return nodes;
    }
    scenegraphNode.items.forEach((nestedItem) => {
        if (nestedItem.role !== undefined) {
            if (nestedItem.role === passRole && verifyNode(nestedItem, cancelRoles)) {
                nodes.push(nestedItem);
            }
            else {
                nodes = nodes.concat(findScenegraphNodes(nestedItem, passRole));
            }
        }
        else {
            nodes = nodes.concat(findScenegraphNodes(nestedItem, passRole));
        }
    });
    return nodes;
}
exports.findScenegraphNodes = findScenegraphNodes;
function verifyNode(scenegraphNode, cancelRoles) {
    if (scenegraphNode.role !== undefined && !cancelRoles.some((role) => scenegraphNode.role.includes(role))) {
        if (scenegraphNode.items.every((item) => verifyNode(item, cancelRoles)) || scenegraphNode.items === undefined) {
            return true;
        }
        else {
            return false;
        }
    }
    else if (scenegraphNode.role === undefined && scenegraphNode.items !== undefined) {
        return scenegraphNode.items.every((item) => verifyNode(item, cancelRoles));
    }
    else if (scenegraphNode.role === undefined && scenegraphNode.items === undefined) {
        return true;
    }
    else {
        return false;
    }
}
exports.verifyNode = verifyNode;
