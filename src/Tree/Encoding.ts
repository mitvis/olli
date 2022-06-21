import { Guide, ChartInformation, FactedChart } from "../Adapters/Types";
import { AccessibilityTreeNode, NodeType } from "./Types";
import { Mark } from '../Adapters/Types'

/**
 * Constructs an {@link AccessibilityTreeNode} based off of a generalized visualization
 * @param visualizationInformation the {@link ChartInformation} or {@link FactedChart} to transform into a tree
 * @returns The transormed {@link AccessibilityTreeNode}
 */
export function abstractedVisToTree(visualizationInformation: any): AccessibilityTreeNode {
    let node: AccessibilityTreeNode
    if (visualizationInformation.charts !== undefined) {
        node = informationToNode(visualizationInformation.description, null, visualizationInformation.data.get('source_0'), "multiView", visualizationInformation);
        node.description += ` With ${node.children.length} nested charts`
    } else {
        const axesString: string = visualizationInformation.axes.length > 0 ? ` ${visualizationInformation.axes.length} axes and` : '';
        const legendsString: string = visualizationInformation.legends.length > 0 ? ` ${visualizationInformation.legends.length} legends` : ''
        node = informationToNode(visualizationInformation.description, null, [], "chart", visualizationInformation);
        node.description += ` with ${axesString} ${legendsString}`
    }
    node.children.forEach((child: AccessibilityTreeNode) => updateDescriptions(child, visualizationInformation))
    return node
}

/**
 * Generates children tree nodes for the given parent node.
 * @param parent The root faceted chart to be the parent of each nested chart
 * @param multiViewChart The {@link FactedChart} of the abstracted visualization
 * @returns an array of {@link AccessibilityTreeNode} to be the given parent's children
 */
function generateMultiViewChildren(parent: AccessibilityTreeNode, multiViewChart: FactedChart): AccessibilityTreeNode[] {
    return multiViewChart.charts.map((singleChart: ChartInformation) => informationToNode(
        `A facet titled ${singleChart.facetedValue}, ${multiViewChart.charts.indexOf(singleChart) + 1} of ${multiViewChart.charts.length}`,
        parent,
        [],
        "chart",
        singleChart));
}

/**
 * Recursively generates children nodes of a chart's structured elements for the provided parent
 * @param childrenNodes the array of children nodes to eventually return to the parent
 * @param parent The root chart to be the parent of each nested chart
 * @param axes The {@link Guide}s of axes to be transformed into {@link AccessibilityTreeNode}s
 * @param legends The {@link Guide}s of legends to be transformed into {@link AccessibilityTreeNode}s
 * @param grids The {@link Guide}s of axes with grid lines to be transformed into {@link AccessibilityTreeNode}s
 * @returns an array of {@link AccessibilityTreeNode} to be the given parent's children
 */
function generateChartChildren(childrenNodes: AccessibilityTreeNode[], parent: AccessibilityTreeNode,
    axes: Guide[], legends: Guide[], grids: Guide[]): AccessibilityTreeNode[] {
    if (axes.length > 0) {
        const axis: Guide = axes.pop()!;
        const scaleType = axis.scaleType ? `for a ${axis.scaleType} scale ` : "";
        const axisField: string = Array.isArray(axis.field) ? axis.field[1] : (axis.field as string);
        let minValue = axis.data.reduce((currentMin: any, currentVal: any) => {
            if (currentVal[axisField] < currentMin) {
                return currentVal[axisField]
            } else {
                return currentMin
            }
        }, axis.data[0][axisField])
        let maxValue = axis.data.reduce((currentMax: any, currentVal: any) => {
            if (currentVal[axisField] > currentMax) {
                return currentVal[axisField]
            } else {
                return currentMax
            }
        }, axis.data[0][axisField])
        if (axisField.toLowerCase().includes("date")) {
            minValue = new Date(minValue).toLocaleString("en-US", { year: 'numeric', month: 'short', day: 'numeric' });
            maxValue = new Date(maxValue).toLocaleString("en-US", { year: 'numeric', month: 'short', day: 'numeric' });
        }

        const description = `${axis.title} ${scaleType}with values from ${minValue} to ${maxValue}`;
        childrenNodes.push(informationToNode(description, parent, axis.data, axis.title.includes("Y-Axis") ? "yAxis" : "xAxis", axis));
        return generateChartChildren(childrenNodes, parent, axes, legends, grids);
    } else if (legends.length > 0) {
        const legend: Guide = legends.pop()!;
        const scaleType = legend.scaleType ? `for ${legend.scaleType} scale ` : "";
        let node: AccessibilityTreeNode = informationToNode(legend.title, parent, legend.data, "legend", legend)
        node.description = `Legend titled '${node.description}' ${scaleType}with ${node.children.length} values`;
        childrenNodes.push(node);
        return generateChartChildren(childrenNodes, parent, axes, legends, grids);
    } else if (grids.length > 0 && grids.length === 2) {
        const grid: Guide[] = [grids.pop()!, grids.pop()!];
        childrenNodes.push(informationToNode("Grid view of the data", parent, grid[0].data, "grid", grid))
        return generateChartChildren(childrenNodes, parent, axes, legends, grids);
    } else {
        return childrenNodes;
    }
}

/**
 * Generates the incremental children for each structured element of a visualization
 * @param parent The structured element whose data is being incrmeented
 * @param field The data field used to compare idividual data points
 * @param values The groupings or increments of values for the structured element (ex: for axes these are the array of ticks)
 * @param data The array of data used in the visualization
 * @param markUsed {@link Mark} of the visualization
 * @returns an array of {@link AccessibilityTreeNode} to be the given parent's children
 */
function generateStructuredNodeChildren(parent: AccessibilityTreeNode, field: string, values: string[] | number[], data: any[], markUsed: Mark): AccessibilityTreeNode[] {
    if (isStringArray(values) || parent.type === "legend") {
        return values.map((grouping: any) => {
            return informationToNode(`${[[grouping]]}`, parent, data.filter((node: any) => node[field] === grouping), "filteredData", data.filter((node: any) => node[field] === grouping))
        })
    } else {
        const filterData = (lowerBound: number, upperBound: number): any[] => {
            return data.filter((val: any) => {
                return val[field] >= lowerBound && val[field] < upperBound;
            })
        }

        let valueIncrements: any[];
        if (markUsed !== 'bar') {
            valueIncrements = (values as number[]).reduce(getEncodingValueIncrements, []);
        } else {
            valueIncrements = values.map((val: number) => [val, val]);
        }
        return valueIncrements.map((range: number[]) => {
            let desc = ``
            if (parent.description.includes("date") || parent.description.includes("temporal")) {
                range.forEach((val: number) => desc += `${new Date(val).toLocaleString("en-US", { year: 'numeric', month: 'short', day: 'numeric' })}, `)
            } else {
                desc = `${range},`
            }
            return informationToNode(desc, parent, filterData(range[0], range[1]), "filteredData", filterData(range[0], range[1]));
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
            childNodes.push(informationToNode(`${[yIncrement, xIncrement]}`, parent, filteredSelection, "filteredData", filteredSelection));
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
        if (reducedIndex === -1 && currentValue !== 0) {
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
        const dataPoint: any = filteredSelection.pop();
        let objCopy: any = {};
        Object.keys(dataPoint).forEach((key: string) => {
            if (key.toLowerCase().includes("date")) {
                objCopy[key] = new Date(dataPoint[key]).toLocaleString("en-US", { year: 'numeric', month: 'short', day: 'numeric' });
            } else {
                objCopy[key] = dataPoint[key]
            }
        })
        childrenNodes.push(informationToNode(nodeToDesc(dataPoint), parent, [objCopy], "data"))
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
        if (parent.parent) {
            generationInformation.axes.forEach((axis: Guide) => {
                axis.data = axis.data.filter((val: any) => {
                    return Object.keys(val).some((key: string) => val[key] === generationInformation.facetedValue)
                })
            })
            generationInformation.legends.forEach((legend: Guide) => {
                legend.data = legend.data.filter((val: any) => {
                    return Object.keys(val).some((key: string) => val[key] === generationInformation.facetedValue)
                })
            })
        }
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
function informationToNode(desc: string, parent: AccessibilityTreeNode | null, selected: any[], type: NodeType, childrenInformation?: any): AccessibilityTreeNode {
    let node: AccessibilityTreeNode = {
        description: desc,
        parent: parent,
        children: [],
        selected: selected,
        type: type,
        fieldsUsed: parent !== null ? parent.fieldsUsed : childrenInformation.dataFieldsUsed
    }

    if (childrenInformation) node.children = generateChildNodes(type, node, childrenInformation);
    node.description = nodeToDesc(node);
    return node
}

/**
 * 
 * @param node The node whose description is being created
 * @returns A description based on the provided {@link AccessibilityTreeNode}
 */
function nodeToDesc(node: AccessibilityTreeNode): string {
    if (node.type === "multiView" || node.type === "chart") {
        return node.description
    } else if (node.type === "xAxis" || node.type === "yAxis") {
        return node.description
    } else if (node.type === `legend`) {
        return node.description
    } else if (node.type === "filteredData") {
        return `Range ${node.description} ${node.selected.length} values in the interval`
    } else if (node.type === `grid`) {
        return node.description
    } else if (node.type === 'data') {
        return node.fieldsUsed.reduce((desc: string, currentKey: string) => `${desc} ${currentKey}: ${node.selected[0][currentKey]}`, "");
    }
    return "";
}

/**
 * Creates a more verbose description for nodes after the tree has been created
 * @param node The node whose description is being updating
 * @param chartInformation The {@link ChartInformation} to help creating a more verbose description
 */
function updateDescriptions(node: AccessibilityTreeNode, chartInformation: ChartInformation): void {
    if (node.type === "filteredData" && chartInformation.markUsed === "line") {
        node.description = `${node.description}.` //with [Trend Information];
    }
    node.children.forEach((child: AccessibilityTreeNode) => updateDescriptions(child, chartInformation));
}
