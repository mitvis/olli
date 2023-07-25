import { TopLevelSpec, compile } from 'vega-lite';
import { VisAdapter, UnitOlliSpec, typeInference, OlliSpec, OlliDataset } from 'olli';
import { getData, getVegaScene, getVegaView } from './utils';
import { TopLevelUnitSpec } from 'vega-lite/build/src/spec/unit';
import { TopLevel, LayerSpec } from 'vega-lite/build/src/spec';

/**
 * Adapter to deconstruct Vega-Lite visualizations into an {@link OlliVisSpec}
 * @param spec The Vega-Lite Spec that rendered the visualization
 * @returns An {@link OlliVisSpec} of the deconstructed Vega-Lite visualization
 */
export const VegaLiteAdapter: VisAdapter<TopLevelSpec> = async (spec: TopLevelSpec): Promise<OlliSpec> => {
  const view = await getVegaView(compile(spec).spec);
  const scene = getVegaScene(view);
  const data = getData(scene);

  if ('mark' in spec) {
    return adaptUnitSpec(spec, data[0]);
  } else {
    // TODO: handle layer and concat specs
    if ('layer' in spec) {
      return await adaptLayerSpec(spec, data);
    } else if ('concat' in spec || 'hconcat' in spec || 'vconcat' in spec) {
      // TODO: concat specs
    } else {
      // TODO: other specs?
    }
  }
};

const getFieldFromEncoding = (encoding) => {
  if ('aggregate' in encoding) {
    if (encoding.field === undefined) {
      return `__${encoding.aggregate}`;
    }
    return `${encoding.aggregate}_${encoding.field}`;
  }
  if ('timeUnit' in encoding) {
    return `${encoding.timeUnit}_${encoding.field}`;
  }

  return 'condition' in encoding ? encoding.condition.field : encoding.field;
};

const typeCoerceData = (olliSpec: UnitOlliSpec) => {
  olliSpec.fields.forEach((fieldDef) => {
    if (fieldDef.type === 'temporal') {
      // convert temporal data into Date objects
      olliSpec.data.forEach((datum) => {
        datum[fieldDef.field] = new Date(datum[fieldDef.field]);
      });
    }
  });
};

function adaptUnitSpec(spec: TopLevelUnitSpec<any>, data: OlliDataset): UnitOlliSpec {
  // unit spec
  const olliSpec: UnitOlliSpec = {
    description: spec.description,
    data: data,
    fields: [],
    axes: [],
    legends: [],
  };

  const getMark = (spec: any) => {
    // TODO vega-lite mark type exceeds olli mark type, should do some validation
    const mark: any = spec.mark;
    if (mark && mark.type) {
      // e.g. "mark": {"type": "line", "point": true}
      return mark.type;
    }
    return mark;
  };
  olliSpec.mark = getMark(spec);

  if (spec.encoding) {
    Object.entries(spec.encoding).forEach(([channel, encoding]) => {
      const fieldDef = { ...encoding };
      fieldDef.field = getFieldFromEncoding(encoding);
      fieldDef.type = encoding.type || (encoding.timeUnit ? 'temporal' : false) || typeInference(data, fieldDef.field);

      if (!fieldDef.field) {
        return;
      }
      if (['row', 'column', 'facet'].includes(channel)) {
        // add facet field
        olliSpec.facet = fieldDef.field;
      } else if (olliSpec.mark === 'line' && ['color', 'detail'].includes(channel)) {
        // treat multi-series line charts as facets
        olliSpec.facet = fieldDef.field;
      } else if (['x', 'y'].includes(channel)) {
        // add axes
        olliSpec.axes.push({
          axisType: channel as 'x' | 'y',
          field: fieldDef.field,
          title: encoding.title,
        });
      } else if (['color', 'opacity'].includes(channel)) {
        // add legends
        olliSpec.legends.push({
          channel: channel as any,
          field: fieldDef.field,
          title: encoding.title,
        });
      } else {
        // TODO: handle other channels
        return;
      }

      // add field to list of field defs
      if (!olliSpec.fields.find((f) => f.field === fieldDef.field)) {
        olliSpec.fields.push(fieldDef);
      }
    });
  }

  typeCoerceData(olliSpec);

  return olliSpec;
}

async function adaptLayerSpec(spec: TopLevel<LayerSpec<any>>, data: OlliDataset[]): Promise<UnitOlliSpec[]> {
  const olliSpec: UnitOlliSpec[] = data.map((d) => {
    return {
      description: spec.description,
      data: d,
      fields: [],
      axes: [],
      legends: [],
    };
  });

  await Promise.all(
    spec.layer.map(async (layer) => {
      if ('mark' in layer) {
        // unit layer
        const layerSpec = {
          data: layer.data || spec.data,
          mark: layer.mark,
          encoding: layer.encoding,
        };
        const dataset = data.find((d) => {
          const fields = Object.keys(d[0]);
          const layerFields = Object.values(layerSpec.encoding)
            .map((f) => getFieldFromEncoding(f))
            .filter((f) => f);
          return layerFields.every((f) => fields.includes(f));
        });
        const layerOlliSpec = adaptUnitSpec(layerSpec, dataset);
        const unitSpec = olliSpec.find((s) => Object.keys(s.data[0]).every((k) => dataset[0][k]));
        unitSpec?.fields.push(...layerOlliSpec.fields);
        unitSpec?.axes.push(...layerOlliSpec.axes);
        unitSpec?.legends.push(...layerOlliSpec.legends);
        unitSpec.mark = layerOlliSpec.mark;
      } else {
        // TODO: nested layer
      }
    })
  );

  olliSpec.forEach((s) => {
    s.fields = s.fields.filter((f, i, self) => self.findIndex((f2) => f2.field === f.field) === i);
    s.axes = s.axes.filter((f, i, self) => self.findIndex((f2) => f2.field === f.field) === i);
    s.legends = s.legends.filter((f, i, self) => self.findIndex((f2) => f2.field === f.field) === i);

    typeCoerceData(s);
  });

  if (olliSpec.length === 1) {
    return olliSpec[0];
  }

  return olliSpec;
}
