import { Scene, Spec, parse, View } from "vega";
import { compile, TopLevelSpec } from "vega-lite"

export async function getVegaScene(spec: Spec): Promise<Scene> {
    const runtime = parse(spec);
    let view = await new View(runtime)
        .renderer('svg')
        .hover()
        .runAsync();

    return (view.scenegraph() as any).root.items[0] as Scene
}