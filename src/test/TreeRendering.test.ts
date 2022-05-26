import { VegaLiteAdapter } from "../Adapters/VegaLiteAdapter"
import barChart from "./specs/vlSimpleBar.json"
import * as vegaLite from "vega-lite"
import * as vega from "vega"
import { abstractedVisToTree } from "../Tree/Encoding"
import { AccessibilityTreeNode } from "../Tree/Types"
import { renderTree } from "../Render/Tree/Tree"
import { TreeLinks } from "../Render/Tree/TreeLink"


describe("Tests for the Accessibility Tree Creation on a Simple Bar Chart", () => {
    let specToUse: any = barChart
    let vegaSpec = vegaLite.compile(specToUse).spec;
    const runtime = vega.parse(vegaSpec);
    const vegaRender = document.createElement('div')!;
    let view = new vega.View(runtime)
        .logLevel(vega.Warn)
        .renderer('svg')
        .initialize(vegaRender)
        .hover()
        .run();

    // const htmlTreeRendering: HTMLElement =
    // renderTree(abstractedVisToTree(VegaLiteAdapter((view.scenegraph() as any).root.items[0], barChart)))

    // const treeLinks: TreeLinks = new TreeLinks(htmlTreeRendering);
    // treeLinks.init()


    test("Testing encoding generation", () => {
        expect(1).toBe(1);
    });
})