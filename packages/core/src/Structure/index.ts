import { Guide, Chart, OlliVisSpec, FacetedChart, Axis, Legend, OlliDatum, OlliDataset } from "../Types";
import { fmtValue } from "../utils";
import { AccessibilityTree, AccessibilityTreeNode, NodeType, TokenType, nodeTypeToHierarchyLevel, hierarchyLevelToTokens, FilterValue, EncodingFilterValue, GridFilterValue } from "./Types";

/**
 * Constructs an {@link AccessibilityTree} from a visualization spec
 * @param olliVisSpec the {@link OlliVisSpec} to transform into a tree
 * @returns An {@link AccessibilityTree} for that spec
 */
export function olliVisSpecToTree(olliVisSpec: OlliVisSpec): AccessibilityTree {
    const fieldsUsed = getFieldsUsedForChart(olliVisSpec);
    switch (olliVisSpec.type) {
        case "facetedChart":
            return {
                root: olliVisSpecToNode("multiView", olliVisSpec.selection || olliVisSpec.data, null, olliVisSpec, fieldsUsed),
                fieldsUsed
            }
        case "chart":
            return {
                root: olliVisSpecToNode("chart", olliVisSpec.selection || olliVisSpec.data, null, olliVisSpec, fieldsUsed),
                fieldsUsed
            }
        default:
            throw `olliVisSpec.type ${(olliVisSpec as any).type} not handled in olliVisSpecToTree`;
    }
}

function getFieldsUsedForChart(olliVisSpec: OlliVisSpec): string[] {
    switch (olliVisSpec.type) {
        case "facetedChart":
            return [...new Set([olliVisSpec.facetedField, ...[...olliVisSpec.charts.values()].flatMap((chart: Chart) => getFieldsUsedForChart(chart))])];
        case "chart":
            return [...new Set((olliVisSpec.axes as Guide[]).concat(olliVisSpec.legends).reduce((fields: string[], guide: Guide) => fields.concat(guide.field), []))];
        default:
            throw `olliVisSpec.type ${(olliVisSpec as any).type} not handled in getFieldsUsedForChart`;
    }
}

const filterInterval = (selection: OlliDataset, field: string, lowerBound: number | Date, upperBound: number | Date): OlliDataset => {
    return selection.filter((datum: any) => {
        let value = datum[field];
        if (value instanceof Date) {
            const lowerBoundStr = String(lowerBound);
            const upperBoundStr = String(upperBound);
            if (lowerBoundStr.length === 4 && upperBoundStr.length === 4) {
                value = value.getFullYear();
            }
        }
        return value >= lowerBound && value < upperBound;
    })
}

function axisValuesToIntervals(values: string[] | number[]): ([number, number] | [Date, Date])[] {

    const ensureAxisValuesNumeric = (values: any[]): {values: number[], isDate?: boolean} => {
        const isStringArr = values.every(v => typeof v === 'string' || v instanceof String);
        if (isStringArr) {
            return {
                values: values.map(s => Number(s.replaceAll(',', '')))
            };
        }
        const isDateArr = values.every(v => v instanceof Date);
        if (isDateArr) {
            return {
                values: values.map(d => d.getTime()),
                isDate: true
            };
        }
        return {
            values
        };
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
            const finalIncrement = currentValue + incrementDifference;
            incrementArray.push([array[reducedIndex] as number, currentValue])
            bounds = [currentValue, finalIncrement];

        } else {
            bounds = [array[reducedIndex] as number, array[reducedIndex + 1] as number];
        }
        incrementArray.push([bounds[0], bounds[1]])
        return incrementArray
    }

    const res = ensureAxisValuesNumeric(values);
    const increments = res.values.reduce(getEncodingValueIncrements, []);
    if (res.isDate) {
        return increments.map(value => [new Date(value[0]), new Date(value[1])])
    }
    return increments;
}

/**
 * Creates a {@link AccessibilityTreeNode} of the given parameters.
 * This function recursively constructs a tree and returns the root node of the tree.
 *
 * @param type The {@link NodeType} to construct
 * @param selected filtered list of data rows selected by the node
 * @param parent The parent {@link AccessibilityTreeNode} of the node
 * @param olliVisSpec The spec for the visualization
 * @param fieldsUsed The data fields that are used by encodings in the olliVisSpec
 * @param facetValue? If the spec is a faceted chart, the data value to facet on
 * @param filterValue? if the current node being constructed is a filteredData node, the FilterValue to filter on
 * @param guide? if the current node is associated with a guide, the guide spec
 * @param index? the index of the current node in its sibling list
 * @param length? the length of the list containing the current node and its siblings
 * @param gridIndex? if the current node being constructed is a grid node, the row/col coordinates of the node
 *
 * @returns The {@link AccessibilityTreeNode} from the provided parameters
 */
function olliVisSpecToNode(type: NodeType, selected: OlliDatum[], parent: AccessibilityTreeNode | null, olliVisSpec: OlliVisSpec, fieldsUsed: string[], height: number = 0, facetValue?: string, filterValue?: FilterValue, guide?: Guide, index?: number, length?: number, gridIndex?: {i: number, j: number}): AccessibilityTreeNode {
    let node: AccessibilityTreeNode = {
        type,
        parent,
        selected,
        filterValue,
        gridIndex,
        //
        description: new Map<TokenType, string[]>(),
        children: [],
    }

    const facetedChart = olliVisSpec as FacetedChart;
    const chart = olliVisSpec as Chart;

    let sampleTableInfo: string[][] = [];

    switch (type) {
        case "multiView":
            node.children = [...facetedChart.charts.entries()].map(([facetValue, chart]: [string, Chart], index, array) => {
                return olliVisSpecToNode(
                    "chart",
                    selected.filter((datum: any) => String(datum[facetedChart.facetedField]) === facetValue),
                    node,
                    chart,
                    fieldsUsed,
                    height + 1,
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
                        fieldsUsed,
                        height + 1,
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
                        fieldsUsed,
                        height + 1,
                        facetValue,
                        undefined,
                        legend);
                }),
                ...(chart.mark === 'point' && filteredAxes.length === 2 && filteredAxes.every(axis => axis.type === 'continuous') ? [
                    olliVisSpecToNode('grid', selected, node, chart, fieldsUsed, height + 1, facetValue)
                ] : [])
            ]
            break;
        case "xAxis":
        case "yAxis":
            const axis = guide as Axis;
            switch (axis.type) {
                case "discrete":
                    node.children = axis.values.map((value, idx)=> {
                        return olliVisSpecToNode(
                            'filteredData',
                            selected.filter(d => String(d[axis.field]) === String(value)),
                            node,
                            chart,
                            fieldsUsed,
                            height + 1,
                            facetValue,
                            String(value),
                            axis,
                            idx,
                            axis.values.length);
                    });
                    break;
                case "continuous":
                    const intervals = axisValuesToIntervals(axis.values);
                    node.children = intervals.map(([a, b], idx) => {
                        return olliVisSpecToNode(
                            'filteredData',
                            filterInterval(selected, axis.field, a, b),
                            node,
                            chart,
                            fieldsUsed,
                            height + 1,
                            facetValue,
                            [a, b],
                            axis,
                            idx,
                            intervals.length);
                    });
                    break;
            }
            break;
        case "legend":
            const legend = guide as Legend;
            switch (legend.type) {
                case "discrete":
                    node.children = legend.values.map((value, idx) => {
                        return olliVisSpecToNode(
                            'filteredData',
                            selected.filter(d => String(d[legend.field]) === String(value)),
                            node,
                            chart,
                            fieldsUsed,
                            height + 1,
                            facetValue,
                            String(value),
                            legend,
                            idx,
                            legend.values.length);
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
            node.children = cartesian(xIntervals, yIntervals).map(([x1, x2, y1, y2], index) => {
                return olliVisSpecToNode(
                    'filteredData',
                    filterInterval(
                        filterInterval(selected, xAxis.field, x1, x2),
                        yAxis.field,
                        y1,
                        y2),
                    node,
                    chart,
                    fieldsUsed,
                    height + 1,
                    facetValue,
                    [[x1, x2], [y1, y2]],
                    undefined, undefined, undefined, {i: Math.floor(index / yIntervals.length), j: index % yIntervals.length});
            });
            break;
        case "filteredData":
            node.children = selected.map((datum, index, array) => {
                return olliVisSpecToNode(
                    'data',
                    [datum],
                    node,
                    chart,
                    fieldsUsed,
                    height + 1,
                    facetValue,
                    undefined,
                    guide,
                    index,
                    array.length
                )
            })
            break;
        case "data":
            // set the ordering of the fields for rendering to a table
            // put the filter values last, since user already knows the value
            node.tableKeys = fieldsUsed;
            node.tableKeysMap = node.tableKeys.map(x => "data");
            if (guide) {
                node.tableKeys = node.tableKeys.filter(f => f !== guide.field).concat([guide.field]);
            }
            if (facetValue) {
                const facetedField = fieldsUsed[0];
                node.tableKeys = node.tableKeys.filter(f => f !== facetedField).concat([facetedField]);
                node.tableKeysMap[node.tableKeys.length - 1] = "facet";
            }
            node.tableKeys.push("quartile");
            node.tableKeysMap.push("quantile");

            break;
        default:
            throw `Node type ${type} not handled in olliVisSpecToNode`;
    }

    node.description = nodeToDesc(node, olliVisSpec, facetValue, guide, index, length, height);

    return node;
}

function findNumericField(node: AccessibilityTreeNode, axis: Axis): string | undefined {
    let field = undefined;
    if (node.type !== 'data') return field;

    for (const [idx, key] of node.tableKeys!.entries()) {
        if (node.tableKeysMap![idx] === 'facet' ||  // ignore special fields
        node.tableKeysMap![idx] === 'quartile' ||
            key === axis.field || // don't want to compute on the current axis field
            !isNumeric('' + node.selected[0][key])) {  // can only compute numeric quantiles
            continue;
        }

        field = key;
    }

    return field;
}

function findFirstDataChild(node: AccessibilityTreeNode): AccessibilityTreeNode | undefined {
    if (node.type === 'data') return node;
    if (!node.children) return undefined;
    for (const child of node.children) {
        if (child.type === 'data') return child;
        const recurse = findFirstDataChild(child);
        if (recurse) return recurse;
    }
}

/**
 *
 * @param node The node whose description is being created
 * @returns A description based on the provided {@link AccessibilityTreeNode}
 */
function nodeToDesc(node: AccessibilityTreeNode, olliVisSpec: OlliVisSpec, facetValue?: string, guide?: Guide, idx?: number, length?: number, height?: number): Map<TokenType, string[]> {
    return _nodeToDesc(node, olliVisSpec, facetValue, guide, idx, length, height);

    function _nodeToDesc(node: AccessibilityTreeNode, olliVisSpec: OlliVisSpec, facetValue?: string, guide?: Guide, idx?: number, length?: number, height?: number): Map<TokenType, string[]> {
        const chartType = (chart: Chart) => {
            if (chart.mark === 'point') {
                if (chart.axes.every(axis => axis.type === 'continuous')) {
                    return 'scatterplot';
                }
                else {
                    return 'dot plot';
                }
            }
            return chart.mark ? `${chart.mark} chart` : '';
        }
        const chartTitle = (chart: OlliVisSpec) => (chart.title || facetValue) ? `"${chart.title || facetValue}"` : '';
        const authorDescription = (chart: OlliVisSpec) => {
            if (chart.description) {
                let str = chart.description.trim();
                if (!/.*[.?!]/g.test(str)) {
                    str += '.';
                }
                return str + ' ';
            }
            return '';
        }
        const guideTitle = (guide: Guide) => `titled "${guide.title || guide.field}"`;
        const axisScaleType = (axis: Axis) => `${axis.scaleType || axis.type} scale`;
        const legendChannel = (legend: Legend) => legend.channel ? `for ${legend.channel}` : '';
        const pluralize = (count: number, noun: string, suffix = 's') => `${count} ${noun}${count !== 1 ? suffix : ''}`;
        function ordinal_suffix_of(i: number) { // st, nd, rd, th
            var j = i % 10,
                k = i % 100;
            if (j == 1 && k != 11) {
                return i + "st";
            }
            if (j == 2 && k != 12) {
                return i + "nd";
            }
            if (j == 3 && k != 13) {
                return i + "rd";
            }
            return i + "th";
        }
        const a_or_an_scale = (scaleType: string) => {
            if (scaleType.charAt(0) === 'o') {
                return `an ${scaleType}`;
            }
            return `a ${scaleType}`
        }
        const facetValueStr = (facetValue?: string) => facetValue ? `${facetValue}` : '';
        const filteredValues = (guideFilterValues?: EncodingFilterValue) => {
            if (!guideFilterValues) return '';
            else if (Array.isArray(guideFilterValues)) {
                return `${guideFilterValues.map(v => fmtValue(v)).join(' to ')}`
            }
            else {
                return `"${fmtValue(guideFilterValues)}"`;
            }
        }
        const filteredValuesGrid = (gridFilterValues?: GridFilterValue) => {
            if (!gridFilterValues) return '';
            return `${filteredValues(gridFilterValues[0])} and ${filteredValues(gridFilterValues[1])}`;
        }
        const indexStr = (index?: number, length?: number) => index !== undefined && length !== undefined ? `${index + 1} of ${length}` : '';
        const datum = (datum: OlliDatum, node: AccessibilityTreeNode) => {
            return node.tableKeys?.map(field => {
                // maybe just literally filter out symbol here, so it can be returned in parent function like it should be?
                // would then need some new way to concat data and parent in settings format but that's ok probably
                const value = fmtValue(datum[field]);
                return `"${field}": "${value}"`;
            }).join(', ');
        }
        const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

        const averageValue = (data: OlliDatum[], field: string) => {
            return fmtValue(data.reduce((a, b) => a + Number(b[field]), 0)
                    /data.length);
        }

        const maximumValue = (data: OlliDatum[], field: string) => {
            return fmtValue(data.reduce((a, b) => Math.max(a,  Number(b[field])),
                                        Number(data[0][field])));
        }

        const minimumValue = (data: OlliDatum[], field: string) => {
            return fmtValue(data.reduce((a, b) => Math.min(a,  Number(b[field])),
                                        Number(data[0][field])));
        }

        const chart = olliVisSpec as Chart;
        const axis = guide as Axis;
        const legend = guide as Legend;

        function name(node: AccessibilityTreeNode):string[] {
            switch (node.type) {
                case 'multiView':
                    let title = chartTitle(olliVisSpec);
                    return [`faceted chart ${title}, ${node.children.length} views`, `a faceted chart ${title.length > 0 ? `titled ${title}`: title} with ${node.children.length} views`];
                case 'chart':
                    title = chartTitle(olliVisSpec);
                    return [title, title.length > 0 ? `titled ${title}` : title]
                case 'xAxis':
                case 'yAxis':
                    return Array(2).fill(`${axis.axisType}-axis ${guideTitle(axis)}`);
                case 'legend':
                    return Array(2).fill(`legend ${guideTitle(legend)}`);
                case 'grid':
                    return ['grid', `grid view of ${chartType(chart)}`];
                default:
                    throw `Node type ${node.type} does not have the token name.`;
            }
        }

        function index(node: AccessibilityTreeNode):string[] {
            switch (node.type) {
                case 'chart':
                case 'filteredData':
                    return Array(2).fill(indexStr(idx, length));
                default:
                    throw `Node type ${node.type} does not have the token index.`;
            }
        }

        function type(node: AccessibilityTreeNode):string[] {
            switch (node.type) {
                case 'chart':
                    return Array(2).fill(chartType(chart));
                case 'xAxis':
                case 'yAxis':
                    return [axisScaleType(axis), 'for ' + a_or_an_scale(axisScaleType(axis))];
                case 'legend':
                    return Array(2).fill(legendChannel(legend));
                case 'grid':
                    return ['', '']; // grid is weird
                default:
                    throw `Node type ${node.type} does not have the token type.`;
            }
        }

        function children(node: AccessibilityTreeNode):string[] {
            switch (node.type) {
                case 'chart':
                    const first = chart.axes[0].title || chart.axes[0].field;
                    const all = chart.axes.map(axis => `"${axis.title || axis.field}"`);

                    return chart.axes.length === 1 ?
                    [`axis ${first}`, `with axis ${first}`] :
                    [`axes ${all.join(', ')}`, `with axes ${all.join(' and ')}`]
                default:
                    throw `Node type ${node.type} does not have the token children.`;
            }
        }

        function data(node: AccessibilityTreeNode):string[] {
            switch (node.type) {
                case 'xAxis':
                case 'yAxis':
                case 'legend':
                    const start = fmtValue(axis.values[0]);
                    const next = fmtValue(axis.values[1]);
                    const end = fmtValue(axis.values[axis.values.length - 1]);
                    // const total = pluralize(axis.values.length, 'value');
                    return (axis.type === 'discrete') ?
                    (
                        (axis.values.length === 2) ?
                        [`2 values: ${start}, ${next}`, `with 2 values: "${start}" and "${next}"`] :
                        [`from ${start} to ${end}`, `values starting with "${start}" and ending with "${end}"`]
                    ) :
                    [`from ${start} to ${end}`, `with values from "${start}" to "${end}"`]
                case 'grid':
                    return ['', '']; // grid is weird
                case 'filteredData':
                    if (node.parent?.type === 'grid') {
                        const range = filteredValuesGrid(node.filterValue as GridFilterValue);
                        return [range, `Values from ${range}`]
                    }
                    else {
                        const range = filteredValues(node.filterValue as EncodingFilterValue);
                        return [range, `Values from ${range}`]
                    }
                case 'data':
                    return Array(2).fill(datum(node.selected[0], node)!);
                default:
                    throw `Node type ${node.type} does not have the token data.`;
            }
        }

        function size(node: AccessibilityTreeNode):string[] {
            switch (node.type) {
                case 'xAxis':
                case 'yAxis':
                case 'legend':
                case 'grid':
                case 'filteredData':
                    return Array(2).fill(pluralize(node.children.length, 'value'));
                default:
                    throw `Node type ${node.type} does not have the token size.`;
            }
        }

        function facet(node: AccessibilityTreeNode):string[] {
            switch (node.type) {
                case 'xAxis':
                case 'yAxis':
                case 'legend':
                case 'grid':
                case 'filteredData':
                case 'data':
                    const fvs = facetValueStr(facetValue);
                    return [fvs, fvs.length > 0 ? `"${fvs}"` : fvs];
                default:
                    throw `Node type ${node.type} does not have the token parent.`;
            }
        }

        function depth(node: AccessibilityTreeNode):string[] {
            return [`depth ${height}`, `the tree depth is ${height}`];
        }

        function aggregate(node: AccessibilityTreeNode):string[] {
            switch (node.type) {
                case 'xAxis':
                case 'yAxis':
                case 'filteredData':
                    const sampleChild = findFirstDataChild(node);
                    if (!sampleChild || !axis  || !node.selected.length) return ['', ''];
                    let maybeField = findNumericField(sampleChild, axis);
                    if (maybeField === undefined) return ['', ''];
                    let field: string = String(maybeField);

                    const avg = averageValue(node.selected, field);
                    const max = maximumValue(node.selected, field);
                    const min = minimumValue(node.selected, field);
                    return [`average ${avg}, maximum ${max}, minimum ${min}`,
                    `the average for the "${field}" field is ${avg}, the maximum is ${max}, and the minimum is ${min}`];
                case 'legend':
                case 'grid':
                    return ['', '']; // grid is weird
                default:
                    throw `Node type ${node.type} does not have the token aggregate.`;
            }
        }

        function quantile(node: AccessibilityTreeNode):string[] {
            switch (node.type) {
                case 'filteredData':
                    // figure out what field we're calculating the quantile over
                    let sampleChild = findFirstDataChild(node);
                    if (!sampleChild || !axis || !node.parent || !node.selected.length) return ['', ''];
                    let maybeField = findNumericField(sampleChild, axis);
                    if (maybeField === undefined) return ['', ''];
                    let field: string = String(maybeField)

                    // Identify the sections we're comparing against
                    // Note - copy of the olliVisSpecToNode logic for guide types
                    let sections;
                    switch (node.parent.type) {
                        case "xAxis":
                        case "yAxis":
                            const axis = guide as Axis;
                            switch (axis.type) {
                                case "discrete":
                                    sections = axis.values.map((value, idx)=>
                                        node.parent!.selected.filter(d => String(d[axis.field]) === String(value))
                                    );
                                    break;
                                case "continuous":
                                    const intervals = axisValuesToIntervals(axis.values);
                                    sections = intervals.map(([a, b], idx) =>
                                        filterInterval(node.parent!.selected, axis.field, a, b)
                                    );
                                    break;
                            }
                            break;
                        case "legend":
                            const legend = guide as Legend;
                            switch (legend.type) {
                                case "discrete":
                                    sections = legend.values.map((value, idx) =>
                                        node.parent!.selected.filter(d => String(d[legend.field]) === String(value))
                                    );
                                    break;
                                case "continuous":
                                return ['', ''];
                            }
                            break;
                        case "grid":
                            return ['', ''] // weird and don't want to deal with this
                    }

                    if (!sections) {
                        return ['', ''];
                    }

                    // Actually calculate the averages and then the quantile
                    const avgs: number[] = []
                    sections.forEach(interval => {
                        if (interval.length == 0) {
                            avgs.push(0);
                            return;
                        }
                        const avg = averageValue(interval, field);
                        avgs.push(Number(avg));
                    });

                    avgs.sort(function(a, b) {
                        return a - b;
                      });
                    const thisAvg = node.selected.length == 0 ? 0 : averageValue(node.selected, field)
                    const sectionsPos = avgs.indexOf(Number(thisAvg))/avgs.length;
                    const sectionsQuart = Math.max(1, Math.ceil(sectionsPos * 4)); // pos is btwn 0 and 1, no quartile 0
                    return [`${ordinal_suffix_of(sectionsQuart)} quartile by average`, `This section's average ${field} is in the ${ordinal_suffix_of(sectionsQuart)} quartile  of all sections`]


                case 'data':
                    // figure out what field we're calculating the quantile over
                    if (!axis) return ['', '']
                    maybeField = findNumericField(node, axis);
                    if (maybeField === undefined) return ['', ''];
                    field = String(maybeField);
                    node.tableKeys![node.tableKeys!.indexOf('quartile')] = `quartile (${field})`;

                    // actually calculate it
                    const data = node.parent!.selected.map(x => x[field]);
                    data.sort(function(a, b) {
                        return Number(a) - Number(b); // we checked they are numeric so this is fine
                      });
                    const dataPos = data.indexOf(node.selected[0][field])/data.length;
                    const dataQuart: string = '' + Math.max(1, Math.ceil(dataPos * 4));
                    return [dataQuart, dataQuart];
                default:
                    throw `Node type ${node.type} does not have the token context.`;
            }
        }

        const tokenFunctions = {
            'name': name,
            'index': index,
            'type': type,
            'children': children,
            'data': data,
            'size': size,
            'facet': facet,
            'depth': depth,
            'aggregate': aggregate,
            'quantile': quantile
        }

        const description = new Map<TokenType, string[]>();
        try {
            const tokens = hierarchyLevelToTokens[nodeTypeToHierarchyLevel[node.type]];
            for (const token of tokens) {
                description.set(token, tokenFunctions[token](node));
            }
        } catch (e) {
            throw `Node type ${node.type} not handled in nodeToDesc, threw: ${e}`;
        }
        return description;
    }
}

export function isNumeric(value: number | string): boolean {
    if (typeof value === 'number') {
        return true;
    }
    return !isNaN(value as any) && !isNaN(parseFloat(value));
}