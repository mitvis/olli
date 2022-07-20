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

/***/ "./src/Adapters/ObservablePlotAdapter.ts":
/*!***********************************************!*\
  !*** ./src/Adapters/ObservablePlotAdapter.ts ***!
  \***********************************************/
/***/ (() => {

eval("\r\n// import { EncodingNodeData, VisualizationAdapter } from \"./AdapterTypes\";\r\n// export class ObervablePlotAdapter implements VisualizationAdapter {\r\n//     private chartObject: any;\r\n//     private plotObject: any;\r\n//     private data: any[];\r\n//     private isSvg: boolean;\r\n//     /**\r\n//      * Constructs the adapter between an Observable Plot visualization and the Accessibile Tree Encoding\r\n//      * @param chartObject The Figure object returned by doing Plot.plot([Options])\r\n//      * @param data The object containing the array of data for the visualization\r\n//      * @param plotObject (Optional) - the object of various Plot options \r\n//      */\r\n//     constructor(chartObject: any, data: any[], plotObject?: any) {\r\n//         this.isSvg = chartObject.nodeName === \"svg\" ? true : false;\r\n//         this.chartObject = chartObject;\r\n//         this.plotObject = plotObject ? plotObject : null;\r\n//         this.data = data;\r\n//     }\r\n//     public getAxes(): Map<string, EncodingNodeData> {\r\n//         let axes = new Map<string, EncodingNodeData>()\r\n//         let svgObject = this.isSvg ? this.chartObject : this.chartObject.childNodes[1];\r\n//         axes.set(\"left\", this.parseAxes(svgObject.childNodes[1]))\r\n//         axes.set(\"bottom\", this.parseAxes(svgObject.childNodes[2]))\r\n//         return axes\r\n//     }\r\n//     private parseAxes(svgNode: any): EncodingNodeData {\r\n//         const childNodes = svgNode.childNodes\r\n//         const range = new Array()\r\n//         childNodes.forEach((node: any) => {\r\n//             if (node.className.baseVal === \"tick\") {\r\n//                 let val: any = isNaN(node.textContent) ? node.textContent : Number(node.textContent)\r\n//                 range.push(val)\r\n//             }\r\n//         })\r\n//         const title = childNodes[childNodes.length - 1].textContent.split(\" \").reduce((prevVal: string, currVal: string) => {\r\n//             return prevVal.length > currVal.length ? prevVal : currVal\r\n//         });\r\n//         return {\r\n//             values: range,\r\n//             title: title,\r\n//             data: this.data,\r\n//             field: title,\r\n//             hasGrid: false\r\n//         }\r\n//     }\r\n//     public getLegends(): Map<string, EncodingNodeData> {\r\n//         let legends = new Map<string, EncodingNodeData>();\r\n//         if (!this.isSvg) {\r\n//             let legendElements: any[] = [];\r\n//             this.chartObject.childNodes[0].childNodes.forEach((node: any) => {\r\n//                 if(node.localName === \"span\") {\r\n//                     legendElements.push(node)\r\n//                 }\r\n//             });\r\n//             const legendValues: string[] = legendElements.map((node: any) => node.innerText)\r\n//             let field = \"\"\r\n//             Object.keys(this.data[0]).forEach((key: string) => {\r\n//                 if (legendValues.some((legendVal: string) => legendVal === this.data[0][key])) {\r\n//                     field = key\r\n//                 }\r\n//             })\r\n//             legends.set(field, {\r\n//                 values: legendValues,\r\n//                 title: field,\r\n//                 data: this.data,\r\n//                 field: field,\r\n//                 hasGrid: false\r\n//             })\r\n//         }\r\n//         return legends\r\n//     }\r\n//     public getDescription(): string {\r\n//         return \"Observable Plot Chart\"\r\n//     }\r\n//     public getGrid(): EncodingNodeData[] {\r\n//         return []\r\n//     }\r\n//     public getDataFields(): string[] {\r\n//         let fields: string[] = []\r\n//         for (const node of this.getAxes().values()) {\r\n//             fields.push(node.field)\r\n//         }\r\n//         for (const node of this.getLegends().values()) {\r\n//             fields.push(node.field)\r\n//         }\r\n//         return fields\r\n//     }\r\n// }\r\n\n\n//# sourceURL=webpack://olli/./src/Adapters/ObservablePlotAdapter.ts?");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module can't be inlined because the eval devtool is used.
/******/ 	var __webpack_exports__ = {};
/******/ 	__webpack_modules__["./src/Adapters/ObservablePlotAdapter.ts"]();
/******/ 	
/******/ })()
;