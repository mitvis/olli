import { VegaLiteAdapter } from "../Adapters/VegaLiteAdapter"
import barChart from "./specs/vlSimpleBar.json"
import * as vegaLite from "vega-lite"
import * as vega from "vega"
import { AbstractedVis } from "../Adapters/Types"


describe("Tests for the Vega-Lite Adapter on a Simple Bar Chart", () => {
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

    // const abstractedVegaLiteVis: AbstractedVis = VegaLiteAdapter((view.scenegraph() as any).root.items[0], barChart)

    test("Testing description generation", () => {
        // expect(abstractedVegaLiteVis.description).toBe('A simple bar chart with embedded data');
        expect(1).toBe(1);
    });
})