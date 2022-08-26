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
                root: olliVisSpecToNode("multiView", olliVisSpec.data, null, olliVisSpec),
                fieldsUsed: olliVisSpec.dataFieldsUsed // TODO this should probably not be in the adapter
            }
        case "chart":
            return {
                root: olliVisSpecToNode("chart", olliVisSpec.data, null, olliVisSpec),
                fieldsUsed: olliVisSpec.dataFieldsUsed
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
            throw `olliVisSpec.type ${(olliVisSpec as any).type} not handled in olliVisSpecToTree`;
    }
}



/**
 * Generates the incremental children for each structured element of a visualization
 * @param parent The structured element whose data is being incrmeented
 * @param field The data field used to compare idividual data points
 * @param values The groupings or increments of values for the structured element (ex: for axes these are the array of ticks)
 * @param data The array of data used in the visualization
 * @param markUsed {@link OlliMark} of the visualization
 * @returns an array of {@link AccessibilityTreeNode} to be the given parent's children
 */
function generateStructuredNodeChildren(parent: AccessibilityTreeNode, field: string, values: string[] | number[], data: any[], markUsed: OlliMark): AccessibilityTreeNode[] {
    const lowerCaseDesc: string = parent.description.toLowerCase();
    if (isStringArray(values) && !field.includes("date") || parent.type === "legend") {
        return values.map((grouping: any) => {
            return olliVisSpecToNode(parent, data.filter((node: any) => node[field] === grouping), "filteredData", data.filter((node: any) => node[field] === grouping))
        })
    } else {
        const ticks: number[] = values as number[]
        const filterData = (lowerBound: number, upperBound: number): any[] => {
            return data.filter((val: any) => {
                if ((lowerCaseDesc.includes("date") || lowerCaseDesc.includes("temporal")) && upperBound.toString().length === 4) {
                    const d = new Date(val[field])
                    return d.getFullYear() >= lowerBound && d.getFullYear() < upperBound;
                } else if (val[field] === undefined) {
                    let updatedField = Object.keys(val).find((k: string) => k.includes(field) || field.includes(k))
                    if (updatedField) return val[updatedField] >= lowerBound && val[updatedField] < upperBound;
                }
                return val[field] >= lowerBound && val[field] < upperBound;
            })
        }

        let valueIncrements: any[];
        if (markUsed !== 'bar') {
            valueIncrements = ticks.reduce(getEncodingValueIncrements, []);
        } else {
            if (lowerCaseDesc.includes("date") || field.includes("date")) {
                valueIncrements = ticks.reduce(getEncodingValueIncrements, []);
            } else {
                valueIncrements = ticks.map((val: number) => [val, val]);
            }
        }
        return valueIncrements.map((range: number[]) => {
            let desc = ``
            if ((lowerCaseDesc.includes("date") || field.includes("date") || parent.description.includes("temporal")) && range[0].toString().length > 4) {
                range.forEach((val: number) => desc += `${new Date(val).toLocaleString("en-US", { year: 'numeric', month: 'short', day: 'numeric' })}, `)
            } else {
                desc = `${range},`
            }

            return olliVisSpecToNode(parent, filterData(range[0], range[1]), "filteredData", filterData(range[0], range[1]));
        });
    }
}

/**
 * Generates the incremental children for a pair of axes forming an explorable grid
 * @param parent The structured element whose data is being incrmeented
 * @param field The data fields used to compare idividual data points
 * @param firstValues Array of tick values for the first axis
 * @param secondValues Array of tick values for the second axis
 * @param data The array of data used in the visualization
 * @returns an array of {@link AccessibilityTreeNode} to be the given parent's children
 */
function generateGridChildren(parent: AccessibilityTreeNode, fields: string[], firstValues: number[], secondValues: number[], data: any[]): AccessibilityTreeNode[] {
    let childNodes: AccessibilityTreeNode[] = []
    const filterData = (xLowerBound: number | string, yLowerBound: number | string, xUpperBound?: number | string, yUpperBound?: number | string): any[] => {
        return data.filter((val: any) => {
            const inRange = (field: string, r1: number | string, r2?: number | string): boolean => {
                if (r2) {
                    return val[field] >= r1 && val[field] < r2
                } else {
                    return val[field] === r1
                }
            }
            return inRange(fields[1], xLowerBound, xUpperBound) && inRange(fields[0], yLowerBound, yUpperBound);
        });
    }

    const yIncrements: number[][] | string[][] = firstValues.reduce(getEncodingValueIncrements, []);
    const xIncrements: number[][] | string[][] = secondValues.reduce(getEncodingValueIncrements, []);

    yIncrements.forEach((yIncrement: number[] | string[]) => {
        xIncrements.forEach((xIncrement: number[] | string[]) => {
            const filteredSelection: any[] = filterData(xIncrement[0], yIncrement[0], xIncrement[1], yIncrement[1]);
            childNodes.push(olliVisSpecToNode(parent, filteredSelection, "filteredData", filteredSelection));
        })
    })
    return childNodes;
}

function isStringArray(data: any[]): data is string[] {
    return data.every((pnt: string | number) => typeof pnt === "string")
}

function getEncodingValueIncrements(incrementArray: any[][], currentValue: any, index: number, array: number[] | string[]): any[][] {
    if (isStringArray(array)) {
        incrementArray.push([currentValue])
        return incrementArray
    } else {
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
            if (currentValue instanceof Date) {
                finalIncrement = currentValue.getTime() + incrementDifference;
            } else {
                finalIncrement = currentValue + incrementDifference;
            }
            incrementArray.push([array[reducedIndex] as number, currentValue])
            bounds = [currentValue, finalIncrement];

        } else {
            bounds = [array[reducedIndex] as number, array[reducedIndex + 1] as number];
        }
        incrementArray.push([bounds[0], bounds[1]])
        return incrementArray
    }
}

/**
 * Recursively generates a child node for each data point in the provided range
 * @param childrenNodes The array {@link AccessibilityTreeNode} to eventually return
 * @param filteredSelection The data points to transform into {@link AccessibilityTreeNode} nodes
 * @param parent The parent whose children are being generated
 * @returns
 */
function generateFilteredDataChildren(childrenNodes: AccessibilityTreeNode[], filteredSelection: any[], parent: AccessibilityTreeNode): AccessibilityTreeNode[] {
    if (filteredSelection.length > 0) {
        // const dataPoint: any = filteredSelection.pop();
        const dataPoint: any = filteredSelection.pop();
        let objCopy: any = {};
        Object.keys(dataPoint).forEach((key: string) => {
            if (key.toLowerCase().includes("date")) {
                objCopy[key] = new Date(dataPoint[key]).toLocaleString("en-US", { year: 'numeric', month: 'short', day: 'numeric' });
            } else {
                objCopy[key] = dataPoint[key]
            }
        })
        childrenNodes.push(olliVisSpecToNode(parent, [objCopy], "data"))
        generateFilteredDataChildren(childrenNodes, filteredSelection, parent)
    }
    return childrenNodes
}

/**
 * Creates specific children nodes based on a provided {@link NodeType}
 * @param type The {@link NodeType} of the parent
 * @param parent The parent {@link AccessibilityTreeNode} whose children need to be generated
 * @param generationInformation A changing variable that assists in generating children nodes at all levels
 * @returns an array of {@link AccessibilityTreeNode}
 */
function generateChildNodes(type: NodeType, parent: AccessibilityTreeNode, generationInformation: any): AccessibilityTreeNode[] {
    if (type === "multiView") {
        return generateMultiViewChildren(parent, generationInformation);
    } else if (type === "chart") {
        return generateChartChildren([], parent, generationInformation.axes, generationInformation.legends, generationInformation.gridNodes);
    } else if (type === "xAxis" || type === "yAxis" || type === "legend") {
        return generateStructuredNodeChildren(parent, generationInformation.field, generationInformation.values, generationInformation.data, generationInformation.markUsed);
    } else if (type === "filteredData") {
        return generateFilteredDataChildren([], generationInformation.map((val: any) => Object.assign({}, val)), parent);
    } else if (type === "grid") {
        return generateGridChildren(parent, [generationInformation[0].field, generationInformation[1].field], generationInformation[0].values, generationInformation[1].values, generationInformation[0].data)
    } else {
        return [];
    }
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
function olliVisSpecToNode(type: NodeType, selected: any[], parent: AccessibilityTreeNode | null, olliVisSpec: OlliVisSpec, guide?: Guide): AccessibilityTreeNode {
    let node: AccessibilityTreeNode = {
        type: type,
        parent: parent,
        selected: selected,
        //
        description: nodeToDesc(type, selected, parent, olliVisSpec),
        children: [],
    }

    switch (type) {
        case "multiView":
            const facetedChart = olliVisSpec as FacetedChart;
            node.children = [...facetedChart.charts.entries()].map(([facetValue, chart]: [string, Chart]) => {
                return olliVisSpecToNode(
                    "chart",
                    selected.filter((datum: any) => datum[facetedChart.facetedField] === facetValue),
                    node,
                    chart);
            });
            break;
        case "chart":
            const chart = olliVisSpec as Chart;
            node.children = [
                ...chart.axes.filter(axis => {
                    if (chart.mark === 'bar' && axis.type === 'continuous') {
                        // don't show continuous axis for bar charts
                        return false;
                    }
                    return true;
                }).map(axis => {
                    return olliVisSpecToNode(
                        axis.axisType === 'x' ? 'xAxis' : 'yAxis',
                        selected,
                        node,
                        chart,
                        axis);
                }),
                ...chart.legends.map(legend => {
                    return olliVisSpecToNode(
                        'legend',
                        selected,
                        node,
                        chart,
                        legend);
                }),
                ...chart.gridCells.map(gridCell => {
                    return olliVisSpecToNode(
                        'grid',
                        selected,
                        node,
                        chart,
                        gridCell);
                }),
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
                            chart);
                    });
                    break;
                case "continuous":
                    const intervals = axisValuesToIntervals(axis.values);
                    node.children = axis.values.map(value => {
                        return olliVisSpecToNode(
                            'filteredData',
                            selected.filter(d => d[axis.field] === value),
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
                            selected.filter(d => d[axis.field] === value),
                            node,
                            chart);
                    });
                    break;
                case "continuous":
                    // TODO currently unsupported
                    break;
            }
            break;
        case "filteredData":
            break;
        case "grid":
            break;
        case "data":
            // pass; no children to generate
            break;
        default:
            throw `Node type ${type} not handled in olliVisSpecToNode`;
    }

    return node;
}

/**
 *
 * @param node The node whose description is being created
 * @returns A description based on the provided {@link AccessibilityTreeNode}
 */
function nodeToDesc(type: NodeType, selected: any[], parent: AccessibilityTreeNode | null, olliVisSpec: OlliVisSpec): string {
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
    return "";
}
