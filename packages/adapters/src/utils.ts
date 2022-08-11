import { Scene, Spec, parse, View } from "vega";
import { compile, TopLevelSpec } from "vega-lite"

export async function getVegaScene(spec: TopLevelSpec | Spec): Promise<Scene> {
    let renderSpec: Spec;

    if (spec.$schema?.includes("vega-lite")) {
        renderSpec = compile(spec as TopLevelSpec).spec
    } else {
        renderSpec = spec as Spec;
    }

    const runtime = parse(renderSpec);
    let view = await new View(runtime)
        .renderer('svg')
        .hover()
        .runAsync();

    return (view.scenegraph() as any).root.items[0] as Scene
}