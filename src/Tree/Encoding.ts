import { EncodingInformation, ChartInformation, MultiViewChart } from "../Adapters/Types";
import { AccessibilityTreeNode, NodeType } from "./Types";

export function abstractedVisToTree(visualizationInformation: any): AccessibilityTreeNode {
    let node: AccessibilityTreeNode
    if (visualizationInformation.charts === undefined) {
        node = informationToNode(visualizationInformation.description, null, visualizationInformation.axes[0].data, "chart", visualizationInformation);
    } else {
        node = informationToNode(visualizationInformation.description, null, [], "multiView", visualizationInformation);
    }
    node.children.forEach((child: AccessibilityTreeNode) => updateDescriptions(child, visualizationInformation))
    return node
}

function generateMultiViewChildren(parent: AccessibilityTreeNode, multiViewChart: MultiViewChart): AccessibilityTreeNode[] {
    return multiViewChart.charts.map((singleChart: ChartInformation) => informationToNode(
        `${singleChart.title}Chart ${multiViewChart.charts.indexOf(singleChart) + 1} of ${multiViewChart.charts.length}`,
        parent,
        [],
        "chart",
        singleChart));
}

function generateChartChildren(childrenNodes: AccessibilityTreeNode[], parent: AccessibilityTreeNode,
    axes: EncodingInformation[], legends: EncodingInformation[], grids: EncodingInformation[]): AccessibilityTreeNode[] {
    if (axes.length > 0) {
        const axis: EncodingInformation = axes.pop()!;
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
        const legend: EncodingInformation = legends.pop()!;
        const scaleType = legend.scaleType ? `for ${legend.scaleType} scale ` : "";
        let node: AccessibilityTreeNode = informationToNode(legend.title, parent, legend.data, "legend", legend)
        node.description = `Legend titled '${node.description}' ${scaleType}with ${node.children.length} values`;
        childrenNodes.push(node);
        return generateChartChildren(childrenNodes, parent, axes, legends, grids);
    } else if (grids.length > 0 && grids.length === 2) {
        const grid: EncodingInformation[] = [grids.pop()!, grids.pop()!];
        childrenNodes.push(informationToNode("Grid view of the data", parent, grid[0].data, "grid", grid))
        return generateChartChildren(childrenNodes, parent, axes, legends, grids);
    } else {
        return childrenNodes;
    }
}

function generateStructuredNodeChildren(parent: AccessibilityTreeNode, field: string, values: string[] | number[], data: any[]): AccessibilityTreeNode[] {
    if (isValueArrayString(values) || parent.type === "legend") {
        return values.map((grouping: any) => {
            return informationToNode(`${[[grouping]]}`, parent, data.filter((node: any) => node[field] === grouping), "filteredData", data.filter((node: any) => node[field] === grouping))
        })
    } else {
        const filterData = (lowerBound: number, upperBound: number): any[] => {
            return data.filter((val: any) => {
                return val[field] >= lowerBound && val[field] < upperBound;
            })
        }
        const valueIncrements: number[][] = (values as number[]).reduce(getEncodingValueIncrements, []);
        return valueIncrements.map((range: number[]) => {
            let desc = ``
            if (parent.description.includes("date")) {
                range.forEach((val: number) => desc += `${new Date(val).toLocaleString("en-US", { year: 'numeric', month: 'short', day: 'numeric' })}, `)
            } else {
                desc = `${range},`
            }
            return informationToNode(desc, parent, filterData(range[0], range[1]), "filteredData", filterData(range[0], range[1]));
        });
    }
}

function generateGridChildren(parent: AccessibilityTreeNode, fields: string[], firstValues: number[], secondValues: number[], data: any[]): AccessibilityTreeNode[] {
    let childNodes: AccessibilityTreeNode[] = []
    const filterData = (xLowerBound: number, xUpperBound: number, yLowerBound: number, yUpperBound: number): any[] => {
        return data.filter((val: any) => {
            return (val[fields[1]] >= xLowerBound && val[fields[1]] < xUpperBound) &&
                (val[fields[0]] >= yLowerBound && val[fields[0]] < yUpperBound);
        });
    }

    const yIncrements: number[][] = firstValues.reduce(getEncodingValueIncrements, []);
    const xIncrements: number[][] = secondValues.reduce(getEncodingValueIncrements, []);

    yIncrements.forEach((yIncrement: number[]) => {
        xIncrements.forEach((xIncrement: number[]) => {
            const filteredSelection: any[] = filterData(xIncrement[0], xIncrement[1], yIncrement[0], yIncrement[1]);
            childNodes.push(informationToNode(`${[yIncrement, xIncrement]}`, parent, filteredSelection, "filteredData", filteredSelection));
        })
    })
    return childNodes;
}

function isValueArrayString(data: any[]): data is string[] {
    return data.every((pnt: string | number) => typeof pnt === "string")
}

function getEncodingValueIncrements(incrementArray: any[][], currentValue: any, index: number, array: number[]): any[][] {
    let bounds: [number, number]
    let reducedIndex = index - 1;
    if (reducedIndex === -1 && currentValue !== 0) {
        const incrementDifference: number = array[index + 1] - currentValue
        bounds = [(currentValue - incrementDifference), currentValue];
    } else if (index === array.length - 1) {
        const incrementDifference: number = currentValue - array[index - 1]
        let finalIncrement;
        if (currentValue instanceof Date) {
            finalIncrement = currentValue.getTime() + incrementDifference;
        } else {
            finalIncrement = currentValue + incrementDifference;
        }
        bounds = [currentValue, finalIncrement];

    } else {
        bounds = [array[reducedIndex], array[reducedIndex + 1]];
    }
    incrementArray.push([bounds[0], bounds[1]])
    return incrementArray
}

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

function generateChildNodes(type: NodeType, parent: AccessibilityTreeNode, generationInformation: any): AccessibilityTreeNode[] {
    if (type === "multiView") {
        return generateMultiViewChildren(parent, generationInformation);
    } else if (type === "chart") {
        let gridNodes = generationInformation.markUsed === 'point' ? generationInformation.gridNodes : []
        if (parent.parent) {
            const chartTitle = generationInformation.title.substring(24);
            generationInformation.axes.forEach((axis: EncodingInformation) => {
                axis.data = axis.data.filter((val: any) => {
                   return Object.keys(val).some((key: string) => {
                       return chartTitle.includes(val[key]);
                   })
                })
            })
            generationInformation.legends.forEach((legend: EncodingInformation) => {
                legend.data = legend.data.filter((val: any) => {
                   return Object.keys(val).some((key: string) => {
                       return chartTitle.includes(val[key]);
                   })
                })
            })
        }
        return generateChartChildren([], parent, generationInformation.axes, generationInformation.legends, gridNodes);
    } else if (type === "xAxis" || type === "yAxis" || type === "legend") {
        return generateStructuredNodeChildren(parent, generationInformation.field, generationInformation.values, generationInformation.data);
    } else if (type === "filteredData") {
        return generateFilteredDataChildren([], generationInformation.map((val: any) => Object.assign({}, val)), parent);
    } else if (type === "grid") {
        return generateGridChildren(parent, [generationInformation[0].field, generationInformation[1].field], generationInformation[0].values, generationInformation[1].values, generationInformation[0].data)
    } else {
        return [];
    }
}

function informationToNode(desc: string, parent: AccessibilityTreeNode | null, selected: any[], type: NodeType, childrenInformation?: any): AccessibilityTreeNode {
    let node: AccessibilityTreeNode = {
        description: desc,
        parent: parent,
        children: [],
        selected: selected,
        lastVisitedChild: null,
        type: type,
        fieldsUsed: parent !== null ? parent.fieldsUsed : childrenInformation.dataFieldsUsed
    }

    if (childrenInformation) node.children = generateChildNodes(type, node, childrenInformation);
    node.description = nodeToDesc(node);
    return node
}

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

function updateDescriptions(node: AccessibilityTreeNode, chartInformation: ChartInformation): void {
    if (node.type === "filteredData" && chartInformation.markUsed === "line") {
        node.description = `${node.description}.` //with [Trend Information];
    }
    node.children.forEach((child: AccessibilityTreeNode) => updateDescriptions(child, chartInformation));
}
