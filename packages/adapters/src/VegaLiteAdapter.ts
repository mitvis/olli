import { TopLevelSpec, compile } from 'vega-lite';
import { VisAdapter, OlliSpec, OlliNode, typeInference } from 'olli';
import { getData, getVegaScene, getVegaView } from './utils';

/**
 * Adapter to deconstruct Vega-Lite visualizations into an {@link OlliVisSpec}
 * @param spec The Vega-Lite Spec that rendered the visualization
 * @returns An {@link OlliVisSpec} of the deconstructed Vega-Lite visualization
 */
export const VegaLiteAdapter: VisAdapter<TopLevelSpec> = async (spec: TopLevelSpec): Promise<OlliSpec> => {
  const view = await getVegaView(compile(spec).spec);
  const scene = getVegaScene(view);
  const data = getData(scene);
  const description = spec.description; // possible text description included with spec
  const olliSpec: OlliSpec = {
    description,
    data: data[0],
    fields: [],
    axes: [],
    legends: [],
  };

  if ('mark' in spec) {
    // unit spec

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

    const getFieldFromEncoding = (encoding) => {
      if ('aggregate' in encoding) {
        if (encoding.field === undefined) {
          return `__${encoding.aggregate}`;
        }
        return `${encoding.aggregate}_${encoding.field}`;
      }

      return 'condition' in encoding ? encoding.condition.field : encoding.field;
    };

    if (spec.encoding) {
      Object.entries(spec.encoding).forEach(([channel, encoding]) => {
        const fieldDef = { ...encoding };
        fieldDef.field = getFieldFromEncoding(encoding);
        fieldDef.type =
          encoding.type || (encoding.timeUnit ? 'temporal' : false) || typeInference(data[0], fieldDef.field);

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
  } else {
    // TODO: handle layer and concat specs
    if ('layer' in spec) {
      await Promise.all(
        spec.layer.map(async (layer) => {
          if ('mark' in layer) {
            // unit layer
            const layerSpec = {
              data: layer.data || spec.data,
              mark: layer.mark,
              encoding: layer.encoding,
            };
            const layerOlliSpec = await VegaLiteAdapter(layerSpec);
            olliSpec.fields.push(...layerOlliSpec.fields);
            olliSpec.axes.push(...layerOlliSpec.axes);
            olliSpec.legends.push(...layerOlliSpec.legends);
          } else {
            // nested layer
          }
        })
      );
      olliSpec.fields = olliSpec.fields.filter((f, i, self) => self.findIndex((f2) => f2.field === f.field) === i);
      olliSpec.axes = olliSpec.axes.filter((f, i, self) => self.findIndex((f2) => f2.field === f.field) === i);
      olliSpec.legends = olliSpec.legends.filter((f, i, self) => self.findIndex((f2) => f2.field === f.field) === i);
    }
  }

  olliSpec.fields.forEach((fieldDef) => {
    if (fieldDef.type === 'temporal') {
      // convert temporal data into Date objects
      data.forEach((datum) => {
        datum[fieldDef.field] = new Date(datum[fieldDef.field]);
      });
    }
  });

  console.log(olliSpec);

  return olliSpec;
};
