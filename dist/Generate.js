"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAccessibilityTree = void 0;
const VegaAdapter_1 = require("./Adapters/VegaAdapter");
const VegaLiteAdapter_1 = require("./Adapters/VegaLiteAdapter");
const Table_1 = require("./Render/Table");
const Tree_1 = require("./Render/Tree/Tree");
const TreeLink_1 = require("./Render/Tree/TreeLink");
const Encoding_1 = require("./Tree/Encoding");
function createAccessibilityTree(options) {
    let abstractedVisualization;
    switch (options.adapter) {
        case ("vega"):
            abstractedVisualization = VegaAdapter_1.VegaVisAdapter.convertToGog(options.visObject.scenegraph().root.items[0], options.visSpec);
            break;
        case ("vega-lite"):
            abstractedVisualization = VegaLiteAdapter_1.VegaLiteAdapter.convertToGog(options.visObject.scenegraph().root.items[0], options.visSpec);
            break;
    }
    let chartEncodingTree = Encoding_1.abstractedVisToTree(abstractedVisualization);
    let htmlRendering;
    switch (options.renderType) {
        case ("table"):
            htmlRendering = Table_1.renderTable(chartEncodingTree);
            break;
        case ("tree"):
            htmlRendering = Tree_1.renderTree(chartEncodingTree);
            new TreeLink_1.TreeLinks(htmlRendering).init();
    }
    if (options.ariaLabel) {
        htmlRendering.setAttribute("aria-label", options.ariaLabel);
    }
    document.getElementById(options.domId)?.appendChild(htmlRendering);
}
exports.createAccessibilityTree = createAccessibilityTree;
