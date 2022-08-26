import { Scene, Spec, parse, View, SceneItem, SceneContext, Scale } from "vega";

export async function getVegaScene(spec: Spec): Promise<SceneGroup> {
    const runtime = parse(spec);
    let view = await new View(runtime)
        .renderer('svg')
        .hover()
        .runAsync();

    return (view.scenegraph() as any).root.items[0] as SceneGroup
}

// TODO pending https://github.com/vega/vega/issues/3562
export type SceneGroup = SceneItem & {
    context: SceneContext;
    items: Scene[];
    height: number;
    width: number;
    stroke?: string;
};

export function findScenegraphNodes(scenegraphNode: Scene | SceneGroup | SceneItem, passRole: string): any[] {
    let nodes: any[] = [];
    const cancelRoles: string[] = ["cell", "axis-grid"]
    if ((scenegraphNode as any).items === undefined) {
        return nodes;
    }
    (scenegraphNode as any).items.forEach((nestedItem: any) => {
        if (nestedItem.role !== undefined) {
            if (nestedItem.role === passRole && verifyNode(nestedItem, cancelRoles)) {
                nodes.push(nestedItem);
            } else {
                nodes = nodes.concat(findScenegraphNodes(nestedItem, passRole))
            }
        } else {
            nodes = nodes.concat(findScenegraphNodes(nestedItem, passRole))
        }
    })
    return nodes
}

function verifyNode(scenegraphNode: any, cancelRoles: string[]): boolean {
    if (scenegraphNode.role !== undefined && !cancelRoles.some((role: string) => scenegraphNode.role.includes(role))) {
        if (scenegraphNode.items.every((item: any) => verifyNode(item, cancelRoles)) || scenegraphNode.items === undefined) {
            return true
        } else {
            return false
        }
    } else if (scenegraphNode.role === undefined && scenegraphNode.items !== undefined) {
        return scenegraphNode.items.every((item: any) => verifyNode(item, cancelRoles));
    } else if (scenegraphNode.role === undefined && scenegraphNode.items === undefined) {
        return true
    } else {
        return false
    }
}

export function getData(scene: SceneGroup): any[] {
    try {
        // let data: Map<string, any[]> = new Map()
        // const datasets = spec.data?.map((set: any) => set.name)!
        // datasets.map((key: string) => data.set(key, scene.context.data[key].values.value));
        // return data
        return (scene as any).context.data['source_0'].values.value
        // TODO hardcoded dataset name
    } catch (error) {
        throw new Error(`No data defined in the Vega Spec \n ${error}`)
    }
}

export const scaleHasDiscreteRange = (scaleSpec: Scale): boolean => {
	switch (scaleSpec.type) {
		case "ordinal":
		case "bin-ordinal":
		case "quantile":
		case "quantize":
		case "threshold":
			return true; // if the scale has a discrete output range, don't lerp with it
	}
	return false;
}
