import dayjs from 'dayjs';
import { Scene, Spec, parse, View, SceneItem, SceneGroup } from 'vega';
import { isNumeric as vlIsNumeric } from 'vega-lite';
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

export function getData(scene: SceneGroup): OlliDataset {
  try {
    const datasets = (scene as any).context.data;
    const names = Object.keys(datasets).filter((name) => {
      return name.match(/(source)|(data)_\d/);
    });
    const name = names.reverse()[0]; // TODO do we know this is the right one?
    const dataset = datasets[name].values.value;

    return dataset;
  } catch (error) {
    throw new Error(`No data found in the Vega scenegraph \n ${error}`);
  }
}

export const guideTypeFromScale = (scaleType: string): 'discrete' | 'continuous' => {
  switch (scaleType) {
    case 'linear':
    case 'log':
    case 'pow':
    case 'sqrt':
    case 'symlog':
    case 'time':
    case 'utc':
    case 'sequential':
      return 'continuous';
    case 'ordinal':
    case 'band':
    case 'point':
    case 'quantile':
    case 'quantize':
    case 'threshold':
    case 'bin-ordinal':
    default:
      return 'discrete';
  }
};

export const guideTypeFromVLEncoding = (encodingType: string): 'discrete' | 'continuous' => {
  switch (encodingType) {
    case 'quantitative':
    case 'temporal':
      return 'continuous';
    case 'ordinal':
    case 'nominal':
    default:
      return 'discrete';
  }
};

export function isNumeric(value: string): boolean {
  return vlIsNumeric(value.replaceAll(',', ''));
}

export function typeInference(data: OlliDataset, field: string) {
  const values = data.map((datum) => datum[field]);

  // this function is mostly stolen from vega/datalib except i fixed the date bug
  function isBoolean(obj) {
    return obj === true || obj === false || toString.call(obj) == '[object Boolean]';
  }

  function isDate(obj) {
    return toString.call(obj) === '[object Date]';
  }

  function isValid(obj) {
    return obj != null && obj === obj;
  }

  var TESTS = {
    boolean: function (x) {
      return x === 'true' || x === 'false' || isBoolean(x);
    },
    integer: function (x) {
      return TESTS.number(x) && (x = +x) === ~~x;
    },
    number: function (x) {
      return !isNaN(+x) && !isDate(x);
    },
    date: function (x) {
      return dayjs(x).isValid();
    },
  };

  // types to test for, in precedence order
  var types = ['boolean', 'integer', 'number', 'date'];

  for (let i = 0; i < values.length; ++i) {
    // get next value to test
    const v = values[i];
    // test value against remaining types
    for (let j = 0; j < types.length; ++j) {
      if (isValid(v) && !TESTS[types[j]](v)) {
        types.splice(j, 1);
        j -= 1;
      }
    }
    // if no types left, return 'string'
    if (types.length === 0) break;
  }

  const inference = types.length ? types[0] : 'string';

  switch (inference) {
    case 'boolean':
    case 'string':
      return 'nominal';
    case 'integer':
      // this logic is from compass
      const numberNominalProportion = 0.05;
      const numberNominalLimit = 40;
      const distinct = new Set(values).size;
      if (distinct < numberNominalLimit && distinct / values.length < numberNominalProportion) {
        return 'nominal';
      } else {
        return 'quantitative';
      }
    case 'number':
      return 'quantitative';
    case 'date':
      return 'temporal';
  }
}
