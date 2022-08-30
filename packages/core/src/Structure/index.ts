import { Guide, Chart, OlliVisSpec, OlliMark, FacetedChart, chart, Axis, Legend } from "olli-adapters/src/Types";
import { AccessibilityTree, AccessibilityTreeNode, NodeType } from "./Types";

type EncodingFilterValue = string | [number, number];
type GridFilterValue = [EncodingFilterValue, EncodingFilterValue];
type FilterValue = EncodingFilterValue | GridFilterValue;

/**
 * Constructs an {@link AccessibilityTreeNode} based off of a generalized visualization
 * @param olliVisSpec the {@link Chart} or {@link CompositeChart} to transform into a tree
 * @returns The transormed {@link AccessibilityTreeNode}
 */
export function olliVisSpecToTree(olliVisSpec: OlliVisSpec): AccessibilityTree {
    switch (olliVisSpec.type) {
        case "facetedChart":
            return {
                root: olliVisSpecToNode("multiView", olliVisSpec.data, null, olliVisSpec),
                fieldsUsed: getFieldsUsedForChart(olliVisSpec)
            }
        case "chart":
            return {
                root: olliVisSpecToNode("chart", olliVisSpec.data, null, olliVisSpec),
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
function olliVisSpecToNode(type: NodeType, selected: any[], parent: AccessibilityTreeNode | null, olliVisSpec: OlliVisSpec, facetValue?: string, filterValue?: FilterValue, guide?: Guide, index?: number, length?: number): AccessibilityTreeNode {
    let node: AccessibilityTreeNode = {
        type: type,
        parent: parent,
        selected: selected,
        //
        description: type,
        children: [],
    }

    const facetedChart = olliVisSpec as FacetedChart;
    const chart = olliVisSpec as Chart;

    switch (type) {
        case "multiView":
            node.children = [...facetedChart.charts.entries()].map(([facetValue, chart]: [string, Chart], index, array) => {
                return olliVisSpecToNode(
                    "chart",
                    selected.filter((datum: any) => datum[facetedChart.facetedField] === facetValue),
                    node,
                    chart,
                    facetValue,
                    undefined,
                    undefined,
                    index,
                    array.length
                    );
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
                        node,
                        chart,
                        facetValue,
                        undefined,
                        axis);
                }),
                ...chart.legends.map(legend => {
                    return olliVisSpecToNode(
                        'legend',
                        selected,
                        node,
                        chart,
                        facetValue,
                        undefined,
                        legend);
                }),
                ...(chart.mark === 'point' && filteredAxes.length === 2 && filteredAxes.every(axis => axis.type === 'continuous') ? [
                    olliVisSpecToNode('grid', selected, node, chart, facetValue)
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
                            node,
                            chart,
                            facetValue,
                            String(value),
                            axis);
                    });
                    break;
                case "continuous":
                    const intervals = axisValuesToIntervals(axis.values);
                    node.children = intervals.map(([a, b]) => {
                        return olliVisSpecToNode(
                            'filteredData',
                            filterInterval(selected, axis.field, a, b),
                            node,
                            chart,
                            facetValue,
                            [a, b],
                            axis);
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
                            node,
                            chart,
                            facetValue,
                            String(value),
                            legend);
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
                    node,
                    chart,
                    facetValue,
                    [[x1, x2], [y1, y2]]);
            });
            break;
        case "filteredData":
            node.children = selected.map((datum, index, array) => {
                return olliVisSpecToNode(
                    'data',
                    [datum],
                    node,
                    chart,
                    facetValue,
                    undefined,
                    guide,
                    index,
                    array.length
                )
            })
            break;
        case "data":
            // pass; no children to generate
            break;
        default:
            throw `Node type ${type} not handled in olliVisSpecToNode`;
    }

    node.description = nodeToDesc(node, olliVisSpec, facetValue,filterValue, guide, index, length);

    return node;
}

/**
 *
 * @param node The node whose description is being created
 * @returns A description based on the provided {@link AccessibilityTreeNode}
 */
function nodeToDesc(node: AccessibilityTreeNode, olliVisSpec: OlliVisSpec, facetValue?: string, filterValue?: FilterValue, guide?: Guide, index?: number, length?: number): string {
    return _nodeToDesc(node, olliVisSpec, facetValue, filterValue, guide, index, length).replace(/\s+/g, ' ').trim();

    function _nodeToDesc(node: AccessibilityTreeNode, olliVisSpec: OlliVisSpec, facetValue?: string, filterValue?: FilterValue, guide?: Guide, index?: number, length?: number): string {
        const chartType = (olliVisSpec: OlliVisSpec) => {
            if (olliVisSpec.type === 'chart') {
                return _chartType(olliVisSpec);
            }
            if (olliVisSpec.type === 'facetedChart' && facetValue) {
                const chart = olliVisSpec.charts.get(facetValue);
                if (chart) {
                    return _chartType(chart);
                }
            }
            return '';

            function _chartType(chart: Chart) {
                return chart.mark ? `${chart.mark} chart` : '';
            }
        }
        const chartTitle = (chart: OlliVisSpec) => (chart.title || facetValue) ? `titled "${chart.title || facetValue}"` : '';
        const listAxes = (chart: Chart) => chart.axes.length === 1 ? `with axis "${chart.axes[0].title || chart.axes[0].field}"` : `with axes ${chart.axes.map(axis => `"${axis.title || axis.field}"`).join(' and ')}`;
        const guideTitle = (guide: Guide) => `titled "${guide.title || guide.field}"`;
        const axisScaleType = (axis: Axis) => `for a ${axis.scaleType || axis.type} scale`;
        const legendChannel = (legend: Legend) => legend.channel ? `for ${legend.channel}` : '';
        const pluralize = (count: number, noun: string, suffix = 's') => `${count} ${noun}${count !== 1 ? suffix : ''}`;
        const guideValues = (guide: Guide) => guide.type === 'discrete' ?
            (
                guide.values.length === 2 ?
                `with 2 values: "${guide.values[0]}" and "${guide.values[1]}"` :
                `with ${pluralize(guide.values.length, 'value')} starting with "${guide.values[0]}" and ending with "${guide.values[guide.values.length - 1]}"`
            ) :
            `with values from "${guide.values[0]}" to "${guide.values[guide.values.length - 1]}"`;
        const facetValueStr = (facetValue?: string) => facetValue ? `"${facetValue}".` : '';
        const filteredValues = (guideFilterValues?: EncodingFilterValue) => {
            if (!guideFilterValues) return '';
            else if (Array.isArray(guideFilterValues)) {
                return `Range ${guideFilterValues.join(' to ')}.`
            }
            else {
                return `"${guideFilterValues}".`;
            }
        }
        const filteredValuesGrid = (gridFilterValues?: GridFilterValue) => {
            if (!gridFilterValues) return '';
            return `in ${filteredValues(gridFilterValues[0])} and ${gridFilterValues[1]}`;
        }
        const indexStr = (index?: number, length?: number) => index !== undefined && length !== undefined ? `${index + 1} of ${length}.` : '';
        const datum = (datum: any, olliVisSpec: OlliVisSpec, guide?: Guide) => {
            let fieldsUsed = getFieldsUsedForChart(olliVisSpec);
            // put the filter values last, since user already knows the value
            if (guide) {
                fieldsUsed = fieldsUsed.filter(f => f !== guide.field).concat([guide.field]);
            }
            if (olliVisSpec.type === 'facetedChart') {
                fieldsUsed = fieldsUsed.filter(f => f !== olliVisSpec.facetedField).concat([olliVisSpec.facetedField]);
            }
            fieldsUsed.map(field => {
                return `"${field}": "${datum[field]}"`;
            }).join(', ');
        }

        const chart = olliVisSpec as Chart;
        const axis = guide as Axis;
        const legend = guide as Legend;

        switch (node.type) {
            case 'multiView':
                return `A faceted chart ${chartTitle(olliVisSpec)} with ${node.children.length} views.`;
            case 'chart':
                return `${indexStr(index, length)} A ${chartType(chart)} ${chartTitle(chart)} ${listAxes(chart)}.`;
            case 'xAxis':
            case 'yAxis':
                return `${axis.axisType.toUpperCase()}-axis ${guideTitle(axis)} ${axisScaleType(axis)} ${guideValues(axis)}. ${facetValueStr(facetValue)}`;
            case 'legend':
                return `Legend ${guideTitle(legend)} ${legendChannel(legend)} ${guideValues(axis)}. ${facetValueStr(facetValue)}`;
            case 'grid':
                return `Grid view of ${chartType(chart)}. ${facetValueStr(facetValue)}`
            case 'filteredData':
                if (node.parent?.type === 'grid') {
                    return `${pluralize(node.children.length, 'value')} ${filteredValuesGrid(filterValue as GridFilterValue)}. ${facetValueStr(facetValue)}`;
                }
                else {
                    return `${filteredValues(filterValue as EncodingFilterValue)} ${pluralize(node.children.length, 'value')}. ${facetValueStr(facetValue)}`;
                }
            case 'data':
                // note: the datum description is not used by the table renderer
                return `${indexStr(index, length)} ${datum(node.selected[0], olliVisSpec, guide)}`;
            default:
                throw `Node type ${node.type} not handled in nodeToDesc`;
        }
    }
}