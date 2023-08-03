import { Scene, Spec, parse, View, SceneItem, SceneGroup } from 'vega';
import { OlliDataset } from 'olli';

export async function getVegaView(spec: Spec): Promise<View> {
  const runtime = parse(spec);
  let view = await new View(runtime).renderer('svg').hover().runAsync();
  return view;
}

export function getVegaScene(view: View): SceneGroup {
  return (view.scenegraph() as any).root.items[0] as SceneGroup;
}

export function filterUniqueObjects<T>(arr: T[]): T[] {
  return arr.filter((value, index) => {
    const _value = JSON.stringify(value);
    return (
      index ===
      arr.findIndex((obj) => {
        return JSON.stringify(obj) === _value;
      })
    );
  });
}

export function findScenegraphNodes(scenegraphNode: Scene | SceneGroup | SceneItem, passRole: string): any[] {
  let nodes: any[] = [];
  const cancelRoles: string[] = ['cell', 'axis-grid'];
  if ((scenegraphNode as any).items === undefined) {
    return nodes;
  }
  (scenegraphNode as any).items.forEach((nestedItem: any) => {
    if (nestedItem.role !== undefined) {
      if (nestedItem.role === passRole && verifyNode(nestedItem, cancelRoles)) {
        nodes.push(nestedItem);
      } else {
        nodes = nodes.concat(findScenegraphNodes(nestedItem, passRole));
      }
    } else {
      nodes = nodes.concat(findScenegraphNodes(nestedItem, passRole));
    }
  });
  return nodes;
}

function verifyNode(scenegraphNode: any, cancelRoles: string[]): boolean {
  if (scenegraphNode.role !== undefined && !cancelRoles.some((role: string) => scenegraphNode.role.includes(role))) {
    if (
      scenegraphNode.items.every((item: any) => verifyNode(item, cancelRoles)) ||
      scenegraphNode.items === undefined
    ) {
      return true;
    } else {
      return false;
    }
  } else if (scenegraphNode.role === undefined && scenegraphNode.items !== undefined) {
    return scenegraphNode.items.every((item: any) => verifyNode(item, cancelRoles));
  } else if (scenegraphNode.role === undefined && scenegraphNode.items === undefined) {
    return true;
  } else {
    return false;
  }
}

export function getData(scene: SceneGroup): OlliDataset[] {
  try {
    const datasets = (scene as any).context.data;
    const data_n = Object.keys(datasets).filter((name) => {
      return name.match(/data_\d/);
    });
    if (data_n.length) {
      return data_n
        .map((name) => {
          return datasets[name].values.value as OlliDataset;
        })
        .filter((d, idx, self) => {
          if (!d.length) {
            return false;
          }
          if (Object.keys(d[0]).length === 0) {
            return false;
          }
          return (
            (self as any).findLastIndex((d2) => Object.keys(d2[0]).every((k) => Object.keys(d[0]).includes(k))) === idx
          );
        });
    } else {
      const data_n = Object.keys(datasets).filter((name) => {
        return name.match(/(source)|(data)_\d/);
      });
      const name = data_n[data_n.length - 1];
      const dataset = datasets[name].values.value as OlliDataset;
      return [dataset];
    }
  } catch (error) {
    throw new Error(`No data found in the Vega scenegraph \n ${error}`);
  }
}
