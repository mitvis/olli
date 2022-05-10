"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VegaLiteAdapter = void 0;
const VegaAdapter_1 = require("./VegaAdapter");
const vegaLite = __importStar(require("vega-lite"));
exports.VegaLiteAdapter = {
    convertToGog(visObject, helperVisInformation) {
        const compiledVega = vegaLite.compile(helperVisInformation).spec;
        let vis = VegaAdapter_1.VegaVisAdapter.convertToGog(visObject, compiledVega);
        vis.markUsed = helperVisInformation.mark;
        if (vis.charts !== undefined) {
            const facetField = helperVisInformation.encoding.facet.field;
            vis.dataFieldsUsed.push(facetField);
            vis.charts.forEach((chart) => {
                modifyVisFromMark(chart, helperVisInformation.mark, helperVisInformation);
                for (let key in chart.data.keys()) {
                    let data = chart.data.get(key);
                    chart.data.set(key, data.filter((val) => val[facetField] === chart.title));
                }
            });
        }
        else {
            modifyVisFromMark(vis, helperVisInformation.mark, helperVisInformation);
        }
        return vis;
    }
};
function modifyVisFromMark(vis, mark, spec) {
    switch (mark) {
        case 'bar':
            /*
            Filtering Axes for band scales (potential to be implemented into the Vega Adapter)
            const bandScale = spec.scales?.filter((scale: Scale) => scale.type === "band")[0]!;
            console.log(bandScale)
            const bandAxis = spec.axes?.filter((axis: Axis) => axis.scale === bandScale.name)[0]!
            console.log(bandAxis)
            vis.axes = vis.axes.filter((visAxis: EncodingInformation) => visAxis.title === bandAxis.title)
            */
            const nomAxis = Object.keys(spec.encoding).filter((key) => {
                return spec.encoding[key].type === "nominal" || spec.encoding[key].aggregate === undefined;
            })[0];
            vis.axes = vis.axes.filter((visAxis) => visAxis.field === spec.encoding[nomAxis].field);
            break;
        case 'geoshape':
            break;
        case 'point':
            if (vis.title) {
                vis.title = `Scatter plot with title ${vis.title} `;
            }
            vis.gridNodes = vis.axes;
            break;
    }
}
