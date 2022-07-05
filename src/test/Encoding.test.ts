import { VegaLiteAdapter } from "../Adapters/VegaLiteAdapter"
import barChart from "./specs/vlSimpleBar.json"
import barleyTrellis from "./specs/vlBarley.json"
import multiSeriesLine from './specs/vlStockLine.json'
import stackedBar from './specs/vlStackedBar.json'
import * as vegaLite from "vega-lite"
import * as vega from "vega"
import { olliVisSpecToTree } from "../Tree/Encoding"
import { AccessibilityTreeNode } from "../Tree/Types"


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

    // const accessibilityTree: AccessibilityTreeNode = abstractedVisToTree(VegaLiteAdapter((view.scenegraph() as any).root.items[0], barChart))

    test("Testing encoding generation", () => {
        expect(1).toBe(1);
    });
})

describe("Tests for the Accessibility Tree Creation on a faceted charts", () => {

    test("Testing faceted encoding generation", async () => {
        let specToUse: any = barleyTrellis
        let vegaSpec = vegaLite.compile(specToUse).spec;
        const runtime = vega.parse(vegaSpec);
        const vegaRender = document.createElement('div')!;
        let view = await new vega.View(runtime)
            .logLevel(vega.Warn)
            .renderer('svg')
            .initialize(vegaRender)
            .hover()
            .runAsync()

        const accessibilityTree: AccessibilityTreeNode = olliVisSpecToTree(VegaLiteAdapter((view.scenegraph() as any).root.items[0], specToUse))

        expect(1).toBe(1);
    });

    test("Testing Multi-Series Line Charts", async () => {
        let specToUse: any = multiSeriesLine
        let vegaSpec = vegaLite.compile(specToUse).spec;
        const runtime = vega.parse(vegaSpec);
        const vegaRender = document.createElement('div')!;
        let view = await new vega.View(runtime)
            .logLevel(vega.Warn)
            .renderer('svg')
            .initialize(vegaRender)
            .hover()
            .runAsync()

        const accessibilityTree: AccessibilityTreeNode = olliVisSpecToTree(VegaLiteAdapter((view.scenegraph() as any).root.items[0], specToUse))

        expect(1).toBe(1);
    });

    test("Testing Stacked Bar Charts", async () => {
        let specToUse: any = stackedBar
        let vegaSpec = vegaLite.compile(specToUse).spec;
        const runtime = vega.parse(vegaSpec);
        const vegaRender = document.createElement('div')!;
        let view = await new vega.View(runtime)
            .logLevel(vega.Warn)
            .renderer('svg')
            .initialize(vegaRender)
            .hover()
            .runAsync()

        const accessibilityTree: AccessibilityTreeNode = olliVisSpecToTree(VegaLiteAdapter((view.scenegraph() as any).root.items[0], specToUse))

        expect(1).toBe(1);
    });
})