/*
 * ATTENTION: The "eval" devtool has been used (maybe by default in mode: "development").
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/Adapters/VegaAdapter.ts":
/*!*************************************!*\
  !*** ./src/Adapters/VegaAdapter.ts ***!
  \*************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"VegaAdapter\": () => (/* binding */ VegaAdapter),\n/* harmony export */   \"findScenegraphNodes\": () => (/* binding */ findScenegraphNodes),\n/* harmony export */   \"verifyNode\": () => (/* binding */ verifyNode)\n/* harmony export */ });\nlet view;\r\nlet spec;\r\n/**\r\n* Adapter function that breaks down a Vega visualization into it's basic visual grammar\r\n* @param view The Vega Scenegraph object used in the visualization\r\n* @param spec The Vega Specification used to generate the visualization\r\n* @returns the {@link OlliVisSpec}, the non-concrete visualization information that can be later used to\r\n* generate the Accessibility Tree Encoding\r\n*/\r\nconst VegaAdapter = (visObject, helperVisInformation) => {\r\n    view = visObject;\r\n    spec = helperVisInformation;\r\n    if (view.items.some((el) => el.role === \"scope\")) {\r\n        return parseMultiViewChart();\r\n    }\r\n    else {\r\n        return parseSingleChart(view);\r\n    }\r\n};\r\nfunction parseMultiViewChart() {\r\n    const filterUniqueNodes = ((nodeArr) => {\r\n        let uniqueNodes = [];\r\n        nodeArr.forEach((node) => {\r\n            if (uniqueNodes.every((un) => JSON.stringify(un) !== JSON.stringify(node))) {\r\n                uniqueNodes.push(node);\r\n            }\r\n        });\r\n        return uniqueNodes;\r\n    });\r\n    const baseVisDescription = vegaVisDescription(spec);\r\n    const axes = filterUniqueNodes(findScenegraphNodes(view, \"axis\").map((axisNode) => parseAxisInformation(axisNode)));\r\n    const legends = filterUniqueNodes(findScenegraphNodes(view, \"legend\").map((legendNode) => parseLegendInformation(legendNode)));\r\n    const chartItems = view.items.filter((el) => el.role === \"scope\")[0].items;\r\n    const charts = chartItems.map((chartNode) => {\r\n        let chart = parseSingleChart(chartNode);\r\n        chart.title = findScenegraphNodes(chartNode, \"title-text\")[0].items[0].text;\r\n        return chart;\r\n    });\r\n    let multiViewChart = {\r\n        charts: charts,\r\n        data: getData(),\r\n        dataFieldsUsed: getDataFields(axes, legends),\r\n        description: baseVisDescription,\r\n        facetedField: \"\"\r\n    };\r\n    const shallowCopyArray = (objToCopy, arrToPush) => {\r\n        objToCopy.forEach((obj) => {\r\n            const objCopy = Object.assign({}, obj);\r\n            objCopy.data = JSON.parse(JSON.stringify(obj.data));\r\n            arrToPush.push(objCopy);\r\n        });\r\n    };\r\n    multiViewChart.charts.forEach((chart) => {\r\n        shallowCopyArray(axes, chart.axes);\r\n        shallowCopyArray(legends, chart.legends);\r\n    });\r\n    return multiViewChart;\r\n}\r\nfunction parseSingleChart(chart) {\r\n    const baseVisDescription = vegaVisDescription(spec);\r\n    const axes = findScenegraphNodes(chart, \"axis\").map((axisNode) => parseAxisInformation(axisNode));\r\n    const legends = findScenegraphNodes(chart, \"legend\").map((legendNode) => parseLegendInformation(legendNode));\r\n    const gridNodes = getGridNodes(axes);\r\n    const dataFields = getDataFields(axes, legends);\r\n    const data = getData();\r\n    const chartTitle = findScenegraphNodes(chart, \"title\")[0] !== undefined ?\r\n        findScenegraphNodes(chart, \"title\")[0].items[0].items[0].items[0].text\r\n        : null;\r\n    let chartNode = {\r\n        data: data,\r\n        axes: axes,\r\n        legends: legends,\r\n        description: baseVisDescription,\r\n        gridNodes: gridNodes,\r\n        dataFieldsUsed: dataFields\r\n    };\r\n    if (chartTitle) {\r\n        chartNode.title = chartTitle;\r\n    }\r\n    return chartNode;\r\n}\r\nfunction getData() {\r\n    try {\r\n        // let data: Map<string, any[]> = new Map()\r\n        // const datasets = spec.data?.map((set: any) => set.name)!\r\n        // datasets.map((key: string) => data.set(key, view.context.data[key].values.value));\r\n        // return data\r\n        return view.context.data['source_0'].values.value;\r\n        // TODO hardcoded dataset name\r\n    }\r\n    catch (error) {\r\n        throw new Error(`No data defined in the Vega Spec \\n ${error}`);\r\n    }\r\n}\r\n/**\r\n * @returns the general high-level description of the visualization\r\n */\r\nfunction vegaVisDescription(spec) {\r\n    return spec.description ? spec.description : \"[Root]\";\r\n}\r\n/**\r\n * @returns a key-value pairing of the axis orientation and the {@link Guide} of the corresponding axis\r\n */\r\nfunction parseAxisInformation(axis) {\r\n    const axisView = axis.items[0];\r\n    const ticks = axisView.items.find((n) => n.role === 'axis-tick').items.map((n) => n.datum.value);\r\n    const title = axisView.items.find((n) => n.role === \"axis-title\");\r\n    const scale = axisView.datum.scale;\r\n    let scaleDomain = spec.scales?.find((specScale) => specScale.name === scale)?.domain;\r\n    let fields;\r\n    if (scaleDomain.field !== undefined) {\r\n        fields = scaleDomain.field;\r\n    }\r\n    else {\r\n        fields = scaleDomain.fields;\r\n    }\r\n    const axisStr = axisView.orient === \"bottom\" || axisView.orient === \"top\" ? \"X-Axis\" : \"Y-Axis\";\r\n    const orient = axisView.orient;\r\n    return {\r\n        values: ticks,\r\n        title: title === undefined ? axisStr : `${axisStr} titled '${title.items[0].text}'`,\r\n        data: getData(),\r\n        field: fields,\r\n        scaleType: spec.scales?.find((specScale) => specScale.name === scale)?.type,\r\n        orient: orient\r\n    };\r\n}\r\n/**\r\n * @returns a key-value pairing of the legend name and the {@link Guide} of the corresponding axis\r\n */\r\nfunction parseLegendInformation(legendNode) {\r\n    let scale = legendNode.items[0].datum.scales[Object.keys(legendNode.items[0].datum.scales)[0]];\r\n    let data = getData();\r\n    let labels = legendNode.items[0].items.find((n) => n.role === \"legend-entry\").items[0].items[0].items;\r\n    let title = legendNode.items[0].items.find((n) => n.role === \"legend-title\").items[0].text;\r\n    let field;\r\n    const legendDomain = spec.scales?.find((specScale) => specScale.name === scale)?.domain;\r\n    if (legendDomain.field) {\r\n        field = legendDomain.field;\r\n    }\r\n    else {\r\n        if (Object.keys(data[0]).some((key) => key.toLocaleString() === title.toLocaleLowerCase())) {\r\n            field = title.toLocaleLowerCase();\r\n        }\r\n    }\r\n    return {\r\n        values: labels.map((n) => n.items.find((el) => el.role === \"legend-label\").items[0].datum.value),\r\n        title: title,\r\n        data: data,\r\n        field: field,\r\n        scaleType: spec.scales?.find((specScale) => specScale.name === scale)?.type,\r\n        type: \"\"\r\n    };\r\n}\r\n/**\r\n * Finds the corresponding data that a scale refers to\r\n * @param scale The name of the scale to compare in the Vega Spec\r\n * @returns The array of objects that the scale uses.\r\n */\r\nfunction getScaleData(data, scale) {\r\n    const scaleDomain = spec.scales?.find((s) => scale === s.name).domain;\r\n    const dataRef = scaleDomain.data;\r\n    return data.get(dataRef);\r\n}\r\n/**\r\n * Determines if the chart has the eligible qualities to have a navigable grid node\r\n * @returns the {@link Guide} nodes of that are used for the grid\r\n */\r\nfunction getGridNodes(axes) {\r\n    const gridAxes = view.items.filter((el) => el.role === \"axis\" && el.items[0].items.some((it) => it.role === \"axis-grid\"));\r\n    return gridAxes.map((axis) => {\r\n        return axes[axis.items[0].orient];\r\n    });\r\n}\r\n/**\r\n * @returns the fields of the data object that are used throughout the visualization axes legends\r\n */\r\nfunction getDataFields(axes, legends) {\r\n    let fields = [];\r\n    const pushFields = (obj) => {\r\n        Object.keys(obj).forEach((key) => {\r\n            const usedFields = obj[key].field;\r\n            if (typeof usedFields !== \"string\") {\r\n                usedFields.forEach((field) => {\r\n                    fields.push(field);\r\n                });\r\n            }\r\n            else {\r\n                fields.push(usedFields);\r\n            }\r\n        });\r\n    };\r\n    pushFields(axes);\r\n    pushFields(legends);\r\n    return fields;\r\n}\r\nfunction findScenegraphNodes(scenegraphNode, passRole) {\r\n    let nodes = [];\r\n    const cancelRoles = [\"cell\", \"axis-grid\"];\r\n    if (scenegraphNode.items === undefined) {\r\n        return nodes;\r\n    }\r\n    scenegraphNode.items.forEach((nestedItem) => {\r\n        if (nestedItem.role !== undefined) {\r\n            if (nestedItem.role === passRole && verifyNode(nestedItem, cancelRoles)) {\r\n                nodes.push(nestedItem);\r\n            }\r\n            else {\r\n                nodes = nodes.concat(findScenegraphNodes(nestedItem, passRole));\r\n            }\r\n        }\r\n        else {\r\n            nodes = nodes.concat(findScenegraphNodes(nestedItem, passRole));\r\n        }\r\n    });\r\n    return nodes;\r\n}\r\nfunction verifyNode(scenegraphNode, cancelRoles) {\r\n    if (scenegraphNode.role !== undefined && !cancelRoles.some((role) => scenegraphNode.role.includes(role))) {\r\n        if (scenegraphNode.items.every((item) => verifyNode(item, cancelRoles)) || scenegraphNode.items === undefined) {\r\n            return true;\r\n        }\r\n        else {\r\n            return false;\r\n        }\r\n    }\r\n    else if (scenegraphNode.role === undefined && scenegraphNode.items !== undefined) {\r\n        return scenegraphNode.items.every((item) => verifyNode(item, cancelRoles));\r\n    }\r\n    else if (scenegraphNode.role === undefined && scenegraphNode.items === undefined) {\r\n        return true;\r\n    }\r\n    else {\r\n        return false;\r\n    }\r\n}\r\nwindow.VegaAdapter = VegaAdapter;\r\n\n\n//# sourceURL=webpack://olli/./src/Adapters/VegaAdapter.ts?");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The require scope
/******/ 	var __webpack_require__ = {};
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module can't be inlined because the eval devtool is used.
/******/ 	var __webpack_exports__ = {};
/******/ 	__webpack_modules__["./src/Adapters/VegaAdapter.ts"](0, __webpack_exports__, __webpack_require__);
/******/ 	
/******/ })()
;