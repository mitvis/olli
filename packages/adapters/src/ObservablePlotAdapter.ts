// import { EncodingNodeData, VisualizationAdapter } from "./AdapterTypes";

// export class ObervablePlotAdapter implements VisualizationAdapter {
//     private chartObject: any;
//     private plotObject: any;
//     private data: any[];
//     private isSvg: boolean;

//     /**
//      * Constructs the adapter between an Observable Plot visualization and the Accessibile Tree Encoding
//      * @param chartObject The Figure object returned by doing Plot.plot([Options])
//      * @param data The object containing the array of data for the visualization
//      * @param plotObject (Optional) - the object of various Plot options 
//      */
//     constructor(chartObject: any, data: any[], plotObject?: any) {
//         this.isSvg = chartObject.nodeName === "svg" ? true : false;
//         this.chartObject = chartObject;
//         this.plotObject = plotObject ? plotObject : null;
//         this.data = data;
//     }

//     public getAxes(): Map<string, EncodingNodeData> {
//         let axes = new Map<string, EncodingNodeData>()
//         let svgObject = this.isSvg ? this.chartObject : this.chartObject.childNodes[1];
//         axes.set("left", this.parseAxes(svgObject.childNodes[1]))
//         axes.set("bottom", this.parseAxes(svgObject.childNodes[2]))
//         return axes
//     }

//     private parseAxes(svgNode: any): EncodingNodeData {
//         const childNodes = svgNode.childNodes
//         const range = new Array()
//         childNodes.forEach((node: any) => {
//             if (node.className.baseVal === "tick") {
//                 let val: any = isNaN(node.textContent) ? node.textContent : Number(node.textContent)
//                 range.push(val)
//             }
//         })
//         const title = childNodes[childNodes.length - 1].textContent.split(" ").reduce((prevVal: string, currVal: string) => {
//             return prevVal.length > currVal.length ? prevVal : currVal
//         });
//         return {
//             values: range,
//             title: title,
//             data: this.data,
//             field: title,
//             hasGrid: false
//         }
//     }

//     public getLegends(): Map<string, EncodingNodeData> {
//         let legends = new Map<string, EncodingNodeData>();
//         if (!this.isSvg) {
//             let legendElements: any[] = [];
//             this.chartObject.childNodes[0].childNodes.forEach((node: any) => {
//                 if(node.localName === "span") {
//                     legendElements.push(node)
//                 }
//             });
//             const legendValues: string[] = legendElements.map((node: any) => node.innerText)
//             let field = ""
//             Object.keys(this.data[0]).forEach((key: string) => {
//                 if (legendValues.some((legendVal: string) => legendVal === this.data[0][key])) {
//                     field = key
//                 }
//             })
//             legends.set(field, {
//                 values: legendValues,
//                 title: field,
//                 data: this.data,
//                 field: field,
//                 hasGrid: false
//             })
//         }
//         return legends
//     }

//     public getDescription(): string {
//         return "Observable Plot Chart"
//     }

//     public getGrid(): EncodingNodeData[] {
//         return []
//     }

//     public getDataFields(): string[] {
//         let fields: string[] = []
//         for (const node of this.getAxes().values()) {
//             fields.push(node.field)
//         }
//         for (const node of this.getLegends().values()) {
//             fields.push(node.field)
//         }
//         return fields
//     }

// }