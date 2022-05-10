"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.abstractedVisToTree = void 0;
function abstractedVisToTree(visualizationInformation) {
    let node;
    if (visualizationInformation.charts === undefined) {
        node = informationToNode(visualizationInformation.description, null, visualizationInformation.axes[0].data, "chart", visualizationInformation);
    }
    else {
        node = informationToNode(visualizationInformation.description, null, [], "multiView", visualizationInformation);
    }
    node.children.forEach((child) => updateDescriptions(child, visualizationInformation));
    return node;
}
exports.abstractedVisToTree = abstractedVisToTree;
function generateMultiViewChildren(parent, multiViewChart) {
    return multiViewChart.charts.map((singleChart) => informationToNode(`${singleChart.title}Chart ${multiViewChart.charts.indexOf(singleChart) + 1} of ${multiViewChart.charts.length}`, parent, [], "chart", singleChart));
}
function generateChartChildren(childrenNodes, parent, axes, legends, grids) {
    if (axes.length > 0) {
        const axis = axes.pop();
        const scaleType = axis.scaleType ? `for a ${axis.scaleType} scale ` : "";
        const axisField = Array.isArray(axis.field) ? axis.field[1] : axis.field;
        let minValue = axis.data.reduce((currentMin, currentVal) => {
            if (currentVal[axisField] < currentMin) {
                return currentVal[axisField];
            }
            else {
                return currentMin;
            }
        }, axis.data[0][axisField]);
        let maxValue = axis.data.reduce((currentMax, currentVal) => {
            if (currentVal[axisField] > currentMax) {
                return currentVal[axisField];
            }
            else {
                return currentMax;
            }
        }, axis.data[0][axisField]);
        if (axisField.toLowerCase().includes("date")) {
            minValue = new Date(minValue).toLocaleString("en-US", { year: 'numeric', month: 'short', day: 'numeric' });
            maxValue = new Date(maxValue).toLocaleString("en-US", { year: 'numeric', month: 'short', day: 'numeric' });
        }
        const description = `${axis.title} ${scaleType}with values from ${minValue} to ${maxValue}`;
        childrenNodes.push(informationToNode(description, parent, axis.data, axis.title.includes("Y-Axis") ? "yAxis" : "xAxis", axis));
        return generateChartChildren(childrenNodes, parent, axes, legends, grids);
    }
    else if (legends.length > 0) {
        const legend = legends.pop();
        const scaleType = legend.scaleType ? `for ${legend.scaleType} scale ` : "";
        let node = informationToNode(legend.title, parent, legend.data, "legend", legend);
        node.description = `Legend titled '${node.description}' ${scaleType}with ${node.children.length} values`;
        childrenNodes.push(node);
        return generateChartChildren(childrenNodes, parent, axes, legends, grids);
    }
    else if (grids.length > 0 && grids.length === 2) {
        const grid = [grids.pop(), grids.pop()];
        childrenNodes.push(informationToNode("Grid view of the data", parent, grid[0].data, "grid", grid));
        return generateChartChildren(childrenNodes, parent, axes, legends, grids);
    }
    else {
        return childrenNodes;
    }
}
function generateStructuredNodeChildren(parent, field, values, data) {
    if (isValueArrayString(values)) {
        return values.map((grouping) => {
            return informationToNode(`${[[grouping]]}`, parent, data.filter((node) => node[field] === grouping), "filteredData", data.filter((node) => node[field] === grouping));
        });
    }
    else {
        const filterData = (lowerBound, upperBound) => {
            return data.filter((val) => {
                return val[field] >= lowerBound && val[field] < upperBound;
            });
        };
        const valueIncrements = values.reduce(getEncodingValueIncrements, []);
        return valueIncrements.map((range) => {
            let desc = ``;
            if (parent.description.includes("date")) {
                range.forEach((val) => desc += `${new Date(val).toLocaleString("en-US", { year: 'numeric', month: 'short', day: 'numeric' })}, `);
            }
            else {
                desc = `${range},`;
            }
            return informationToNode(desc, parent, filterData(range[0], range[1]), "filteredData", filterData(range[0], range[1]));
        });
    }
}
function generateGridChildren(parent, fields, firstValues, secondValues, data) {
    let childNodes = [];
    const filterData = (xLowerBound, xUpperBound, yLowerBound, yUpperBound) => {
        return data.filter((val) => {
            return (val[fields[1]] >= xLowerBound && val[fields[1]] < xUpperBound) &&
                (val[fields[0]] >= yLowerBound && val[fields[0]] < yUpperBound);
        });
    };
    const yIncrements = firstValues.reduce(getEncodingValueIncrements, []);
    const xIncrements = secondValues.reduce(getEncodingValueIncrements, []);
    yIncrements.forEach((yIncrement) => {
        xIncrements.forEach((xIncrement) => {
            const filteredSelection = filterData(xIncrement[0], xIncrement[1], yIncrement[0], yIncrement[1]);
            childNodes.push(informationToNode(`${[yIncrement, xIncrement]}`, parent, filteredSelection, "filteredData", filteredSelection));
        });
    });
    return childNodes;
}
function isValueArrayString(data) {
    return data.every((pnt) => typeof pnt === "string");
}
function getEncodingValueIncrements(incrementArray, currentValue, index, array) {
    let bounds;
    let reducedIndex = index - 1;
    if (reducedIndex === -1 && currentValue !== 0) {
        const incrementDifference = array[index + 1] - currentValue;
        bounds = [(currentValue - incrementDifference), currentValue];
    }
    else if (index === array.length - 1) {
        const incrementDifference = currentValue - array[index - 1];
        let finalIncrement;
        if (currentValue instanceof Date) {
            finalIncrement = currentValue.getTime() + incrementDifference;
        }
        else {
            finalIncrement = currentValue + incrementDifference;
        }
        bounds = [currentValue, finalIncrement];
    }
    else {
        bounds = [array[reducedIndex], array[reducedIndex + 1]];
    }
    incrementArray.push([bounds[0], bounds[1]]);
    return incrementArray;
}
function generateFilteredDataChildren(childrenNodes, filteredSelection, parent) {
    if (filteredSelection.length > 0) {
        const dataPoint = filteredSelection.pop();
        let objCopy = {};
        Object.keys(dataPoint).forEach((key) => {
            if (key.toLowerCase().includes("date")) {
                objCopy[key] = new Date(dataPoint[key]).toLocaleString("en-US", { year: 'numeric', month: 'short', day: 'numeric' });
            }
            else {
                objCopy[key] = dataPoint[key];
            }
        });
        childrenNodes.push(informationToNode(nodeToDesc(dataPoint), parent, [objCopy], "data"));
        generateFilteredDataChildren(childrenNodes, filteredSelection, parent);
    }
    return childrenNodes;
}
function generateChildNodes(type, parent, generationInformation) {
    if (type === "multiView") {
        return generateMultiViewChildren(parent, generationInformation);
    }
    else if (type === "chart") {
        let gridNodes = generationInformation.markUsed === 'point' ? generationInformation.gridNodes : [];
        if (parent.parent) {
            const chartTitle = generationInformation.title.substring(24);
            generationInformation.axes.forEach((axis) => {
                axis.data = axis.data.filter((val) => {
                    return Object.keys(val).some((key) => {
                        return chartTitle.includes(val[key]);
                    });
                });
            });
        }
        return generateChartChildren([], parent, generationInformation.axes, generationInformation.legends, gridNodes);
    }
    else if (type === "xAxis" || type === "yAxis" || type === "legend") {
        return generateStructuredNodeChildren(parent, generationInformation.field, generationInformation.values, generationInformation.data);
    }
    else if (type === "filteredData") {
        return generateFilteredDataChildren([], generationInformation.map((val) => val), parent);
    }
    else if (type === "grid") {
        return generateGridChildren(parent, [generationInformation[0].field, generationInformation[1].field], generationInformation[0].values, generationInformation[1].values, generationInformation[0].data);
    }
    else {
        return [];
    }
}
function informationToNode(desc, parent, selected, type, childrenInformation) {
    let node = {
        description: desc,
        parent: parent,
        children: [],
        selected: selected,
        lastVisitedChild: null,
        type: type,
        fieldsUsed: parent !== null ? parent.fieldsUsed : childrenInformation.dataFieldsUsed
    };
    if (childrenInformation)
        node.children = generateChildNodes(type, node, childrenInformation);
    node.description = nodeToDesc(node);
    return node;
}
function nodeToDesc(node) {
    if (node.type === "multiView" || node.type === "chart") {
        return node.description;
    }
    else if (node.type === "xAxis" || node.type === "yAxis") {
        return node.description;
    }
    else if (node.type === `legend`) {
        return node.description;
    }
    else if (node.type === "filteredData") {
        return `Range ${node.description} ${node.selected.length} values in the interval`;
    }
    else if (node.type === `grid`) {
        return node.description;
    }
    else if (node.type === 'data') {
        return node.fieldsUsed.reduce((desc, currentKey) => `${desc} ${currentKey}: ${node.selected[0][currentKey]}`, "");
    }
    return "";
}
function updateDescriptions(node, chartInformation) {
    if (node.type === "filteredData" && chartInformation.markUsed === "line") {
        node.description = `${node.description}.`; //with [Trend Information];
    }
    node.children.forEach((child) => updateDescriptions(child, chartInformation));
}
