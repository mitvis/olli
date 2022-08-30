import { Guide, Chart, OlliVisSpec, OlliMark, FacetedChart, chart, Axis, Legend } from "olli-adapters/src/Types";
import { AccessibilityTree, AccessibilityTreeNode, NodeType } from "./Types";

/**
 * Constructs an {@link AccessibilityTreeNode} based off of a generalized visualization
 * @param olliVisSpec the {@link Chart} or {@link CompositeChart} to transform into a tree
 * @returns The transormed {@link AccessibilityTreeNode}
 */
export function olliVisSpecToTree(olliVisSpec: OlliVisSpec): AccessibilityTree {
    switch (olliVisSpec.type) {
        case "facetedChart":
            return {
                root: olliVisSpecToNode("multiView", olliVisSpec.data, {}, null, olliVisSpec),
                fieldsUsed: getFieldsUsedForChart(olliVisSpec)
            }
        case "chart":
            return {
                root: olliVisSpecToNode("chart", olliVisSpec.data, {}, null, olliVisSpec),
                fieldsUsed: getFieldsUsedForChart(olliVisSpec)
            }
        default:
            throw `olliVisSpec.type ${(olliVisSpec as any).type} not handled in olliVisSpecToTree`;
    }
}

function getFieldsUsedForChart(olliVisSpec: OlliVisSpec): string[] {
    switch (olliVisSpec.type) {
        case "facetedChart":
            return [olliVisSpec.facetedField, ...[...olliVisSpec.charts.values()].flatMap((chart: Chart) => getFieldsUsedForChart(chart))];
        case "chart":
            return (olliVisSpec.axes as Guide[]).concat(olliVisSpec.legends).reduce((fields: string[], guide: Guide) => fields.concat(guide.field), []);
        default:
            throw `olliVisSpec.type ${(olliVisSpec as any).type} not handled in getFieldsUsedForChart`;
    }
}

const filterInterval = (selection: any[], field: string, lowerBound: number, upperBound: number): any[] => {
    return selection.filter((val: any) => {
        // TODO: commented out date handling and value not found thingy
        // if ((lowerCaseDesc.includes("date") || lowerCaseDesc.includes("temporal")) && upperBound.toString().length === 4) {
        //     const d = new Date(val[field])
        //     return d.getFullYear() >= lowerBound && d.getFullYear() < upperBound;
        // } else if (val[field] === undefined) {
        //     let updatedField = Object.keys(val).find((k: string) => k.includes(field) || field.includes(k))
        //     if (updatedField) return val[updatedField] >= lowerBound && val[updatedField] < upperBound;
        // }
        return val[field] >= lowerBound && val[field] < upperBound;
    })
}

function axisValuesToIntervals(values: string[] | number[]): [number, number][] {

    const ensureAxisValuesNumeric = (values: any[]): number[] => {
        const isStringArr = values.every(v => typeof v === 'string' || v instanceof String);
        if (isStringArr) {
            return values.map(s => Number(s.replaceAll(',', '')));
        }
        return values;
    }

    const getEncodingValueIncrements = (incrementArray: [number, number][], currentValue: number, index: number, array: number[]): [number, number][] => {
        let bounds: [number, number]
        let reducedIndex = index - 1;
        if (index === 0 && currentValue === 0) {
            return incrementArray
        } else if (reducedIndex === -1 && currentValue !== 0) {
            const incrementDifference: number = (array[index + 1] as number) - currentValue
            bounds = [(currentValue - incrementDifference), currentValue];
        } else if (index === array.length - 1) {
            const incrementDifference: number = currentValue - (array[index - 1] as number)
            let finalIncrement;
            // TODO i commented out date handling. it will require changes to typings
            // if (currentValue instanceof Date) {
                // finalIncrement = currentValue.getTime() + incrementDifference;
            // } else {
                finalIncrement = currentValue + incrementDifference;
            // }
            incrementArray.push([array[reducedIndex] as number, currentValue])
            bounds = [currentValue, finalIncrement];

        } else {
            bounds = [array[reducedIndex] as number, array[reducedIndex + 1] as number];
        }
        incrementArray.push([bounds[0], bounds[1]])
        return incrementArray
    }

    values = ensureAxisValuesNumeric(values);
    return values.reduce(getEncodingValueIncrements, []);
}

/**
 * Creates a {@link AccessibilityTreeNode} of the given parameters
 * @param desc The string that will be used when rendering this node
 * @param parent The parent {@link AccessibilityTreeNode} of the node to be generated
 * @param selected Selection of data from this node and its children
 * @param type Meta-data to know what kind of element this node is from a visualization
 * @param childrenInformation changing variable to assist with generating more nodes of the tree
 * @returns The {@link AccessibilityTreeNode} from the provided parameters
 */
function olliVisSpecToNode(type: NodeType, selected: any[], filterValues: any, parent: AccessibilityTreeNode | null, olliVisSpec: OlliVisSpec, guide?: Guide): AccessibilityTreeNode {
    let node: AccessibilityTreeNode = {
        type: type,
        parent: parent,
        selected: selected,
        filterValues: filterValues,
        //
        description: type,
        children: [],
    }

    const facetedChart = olliVisSpec as FacetedChart;
    const chart = olliVisSpec as Chart;

    switch (type) {
        case "multiView":
            node.children = [...facetedChart.charts.entries()].map(([facetValue, chart]: [string, Chart]) => {
                return olliVisSpecToNode(
                    "chart",
                    selected.filter((datum: any) => datum[facetedChart.facetedField] === facetValue),
                    { ...filterValues, facet: facetValue },
                    node,
                    chart);
            });
            break;
        case "chart":
            // remove some axes depending on mark type
            const filteredAxes = chart.axes.filter(axis => {
                if (chart.mark === 'bar' && axis.type === 'continuous') {
                    // don't show continuous axis for bar charts
                    return false;
                }
                return true;
            });
            node.children = [
                ...filteredAxes.map(axis => {
                    return olliVisSpecToNode(
                        axis.axisType === 'x' ? 'xAxis' : 'yAxis',
                        selected,
                        filterValues,
                        node,
                        chart,
                        axis);
                }),
                ...chart.legends.map(legend => {
                    return olliVisSpecToNode(
                        'legend',
                        selected,
                        filterValues,
                        node,
                        chart,
                        legend);
                }),
                ...(chart.mark === 'point' && filteredAxes.length === 2 ? [
                    olliVisSpecToNode('grid', selected, filterValues, node, chart)
                ] : [])
            ]
            break;
        case "xAxis":
        case "yAxis":
            const axis = guide as Axis;
            switch (axis.type) {
                case "discrete":
                    node.children = axis.values.map(value => {
                        return olliVisSpecToNode(
                            'filteredData',
                            selected.filter(d => d[axis.field] === value),
                            { ...filterValues, guide: value },
                            node,
                            chart);
                    });
                    break;
                case "continuous":
                    const intervals = axisValuesToIntervals(axis.values);
                    node.children = intervals.map(([a, b]) => {
                        return olliVisSpecToNode(
                            'filteredData',
                            filterInterval(selected, axis.field, a, b),
                            { ...filterValues, guide: [a, b] },
                            node,
                            chart);
                    });
                    break;
            }
            break;
        case "legend":
            const legend = guide as Legend;
            switch (legend.type) {
                case "discrete":
                    node.children = legend.values.map(value => {
                        return olliVisSpecToNode(
                            'filteredData',
                            selected.filter(d => d[legend.field] === value),
                            { ...filterValues, guide: value },
                            node,
                            chart);
                    });
                    break;
                case "continuous":
                    // TODO currently unsupported
                    break;
            }
            break;
        case "grid":
            const xAxis = chart.axes.find(axis => axis.axisType === 'x')!;
            const yAxis = chart.axes.find(axis => axis.axisType === 'y')!;
            const xIntervals = axisValuesToIntervals(xAxis.values);
            const yIntervals = axisValuesToIntervals(yAxis.values);
            const cartesian = (...a: any[][]) => a.reduce((a: any[], b: any[]) => a.flatMap((d: any) => b.map((e: any) => [d, e].flat())));
            node.children = cartesian(xIntervals, yIntervals).map(([x1, x2, y1, y2]) => {
                return olliVisSpecToNode(
                    'filteredData',
                    filterInterval(
                        filterInterval(selected, xAxis.field, x1, x2),
                        yAxis.field,
                        y1,
                        y2),
                    { ...filterValues, grid: [[x1, x2], [y1, y2]] },
                    node,
                    chart);
            });
            break;
        case "filteredData":
            node.children = selected.map(datum => {
                return olliVisSpecToNode(
                    'data',
                    [datum],
                    filterValues,
                    node,
                    chart
                )
            })
            break;
        case "data":
            // pass; no children to generate
            break;
        default:
            throw `Node type ${type} not handled in olliVisSpecToNode`;
    }

    node.description = nodeToDesc(node, olliVisSpec, guide);

    return node;
}

/**
 *
 * @param node The node whose description is being created
 * @returns A description based on the provided {@link AccessibilityTreeNode}
 */
function nodeToDesc(node: AccessibilityTreeNode, olliVisSpec: OlliVisSpec, guide?: Guide): string {
    return _nodeToDesc(node, olliVisSpec, guide).replace(/\s+/g, ' ').trim();

    function _nodeToDesc(node: AccessibilityTreeNode, olliVisSpec: OlliVisSpec, guide?: Guide): string {
        const chartType = (olliVisSpec: OlliVisSpec, node: AccessibilityTreeNode) => {
            if (olliVisSpec.type === 'chart') {
                return _chartType(olliVisSpec);
            }
            if (olliVisSpec.type === 'facetedChart' && node.filterValues.facet) {
                const chart = olliVisSpec.charts.get(node.filterValues.facet);
                if (chart) {
                    return _chartType(chart);
                }
            }
            return '';

            function _chartType(chart: Chart) {
                return chart.mark ? `${chart.mark} chart` : '';
            }
        }
        const chartTitle = (chart: OlliVisSpec) => chart.title ? `titled "${chart.title}"` : '';
        const listAxes = (chart: Chart) => chart.axes.length === 1 ? `with axis "${chart.axes[0].title ?? chart.axes[0].field}"` : `with axes ${chart.axes.map(axis => `"${axis.title ?? axis.field}"`).join(' and ')}`;
        const multiViewIndex = (node: AccessibilityTreeNode) => node.parent?.type === 'multiView' ? `${node.parent.children.indexOf(node) + 1} of ${node.parent.children.length}.` : '';
        const guideTitle = (guide: Guide) => `titled "${guide.title ?? guide.field}"`;
        const axisScaleType = (axis: Axis) => `for a ${axis.scaleType ?? axis.type} scale`;
        const legendChannel = (legend: Legend) => legend.channel ? `for ${legend.channel}` : '';
        const pluralize = (count: number, noun: string, suffix = 's') => `${count} ${noun}${count !== 1 ? suffix : ''}`;
        const guideValues = (guide: Guide) => guide.type === 'discrete' ?
            (
                guide.values.length === 2 ?
                `with 2 values: "${guide.values[0]}" and "${guide.values[1]}"` :
                `with ${pluralize(guide.values.length, 'value')} starting with "${guide.values[0]}" and ending with "${guide.values[guide.values.length - 1]}"`
            ) :
            `with values from "${guide.values[0]}" to "${guide.values[guide.values.length - 1]}"`;
        const facetValue = (node: AccessibilityTreeNode) => `"${node.filterValues.facet}".` ?? '';
        const filteredValues = (guideFilterValues: string | [number, number] | undefined) => {
            if (guideFilterValues === undefined) return '';
            else if (Array.isArray(guideFilterValues)) {
                return `Range ${guideFilterValues.join(' to ')}.`
            }
            else {
                return `"${guideFilterValues}".`;
            }
        }
        const filteredValuesGrid = (gridFilterValues: [string | [number, number], string | [number, number]] | undefined) => {
            if (gridFilterValues === undefined) return '';
            return `in ${filteredValues(gridFilterValues[0])} and ${gridFilterValues[1]}`;
        }
        const datumIndex = (node: AccessibilityTreeNode) => node.parent ? `${node.parent.children.indexOf(node) + 1} of ${node.parent.children.length}.` : '';
        const datum = (datum: any) => Object.entries(datum).map(([k, v]) => {
            return `"${k}": "${v}"`;
        }).join(', ');

        const chart = olliVisSpec as Chart;
        const axis = guide as Axis;
        const legend = guide as Legend;

        switch (node.type) {
            case 'multiView':
                return `A faceted chart ${chartTitle(olliVisSpec)} with ${node.children.length} views.`;
            case 'chart':
                return `${multiViewIndex(node)} A ${chartType(chart, node)} ${chartTitle(chart)} ${listAxes(chart)}.`;
            case 'xAxis':
            case 'yAxis':
                return `${axis.axisType.toUpperCase()}-axis ${guideTitle(axis)} ${axisScaleType(axis)} ${guideValues(axis)}. ${facetValue(node)}`;
            case 'legend':
                return `Legend ${guideTitle(legend)} ${legendChannel(legend)} ${guideValues(axis)}. ${facetValue(node)}`;
            case 'grid':
                return `Grid view of ${chartType(chart, node)}. ${facetValue(node)}`
            case 'filteredData':
                if (node.parent?.type === 'grid') {
                    return `${pluralize(node.children.length, 'value')} ${filteredValuesGrid(node.filterValues.grid)}. ${facetValue(node)}`;
                }
                else {
                    return `${filteredValues(node.filterValues.guide)} ${pluralize(node.children.length, 'value')}. ${facetValue(node)}`;
                }
                break;
            case 'data':
                return `${datumIndex(node)} ${datum(node.selected[0])}`;
            default:
                throw `Node type ${node.type} not handled in nodeToDesc`;
        }
        // if (node.type === "multiView" || node.type === "chart") {
        //     return node.description
        // } else if (node.type === "xAxis" || node.type === "yAxis") {
        //     return node.description
        // } else if (node.type === `legend`) {
        //     return node.description
        // } else if (node.type === "filteredData") {
        //     return `Range ${node.description} ${node.selected.length} ${node.selected.length === 1 ? 'value' : 'values'} in the interval`
        // } else if (node.type === `grid`) {
        //     return node.description
        // } else if (node.type === 'data') {
        //     return node.fieldsUsed.reduce((desc: string, currentKey: string) => `${desc} ${currentKey}: ${node.selected[0][currentKey]}`, "");
        // }
        return node.type;
    }
}