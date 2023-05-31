import { TopLevelSpec, compile } from 'vega-lite';
import { VisAdapter, OlliSpec, OlliAxis, OlliLegend, OlliNode } from 'olli';
import { getData, getVegaScene, getVegaView, typeInference } from './utils';

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
    data,
    axes: [],
    legends: [],
    structure: [],
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
        return `${encoding.aggregate}_${encoding.field}`;
      }

      return 'condition' in encoding ? encoding.condition.field : encoding.field;
    };

    if (spec.encoding) {
      Object.entries(spec.encoding).forEach(([channel, encoding]) => {
        const fieldDef = { ...encoding };
        fieldDef.field = getFieldFromEncoding(encoding);
        fieldDef.type = encoding.type || typeInference(data, fieldDef.field);

        if (['row', 'column', 'facet'].includes(channel)) {
          // add facet field
          olliSpec.facetField = fieldDef;
        } else if (olliSpec.mark === 'line' && ['color', 'detail'].includes(channel)) {
          // treat multi-series line charts as facets
          olliSpec.facetField = fieldDef;
        } else if (['x', 'y'].includes(channel)) {
          // add axes
          if (olliSpec.mark === 'bar' && fieldDef.type === 'quantitative') {
            return; // skip quantitative channel for bar charts
          }
          olliSpec.axes.push({
            axisType: channel as 'x' | 'y',
            field: fieldDef,
            title: encoding.title,
          });
        } else if (['color', 'opacity'].includes(channel)) {
          // add legends
          olliSpec.legends.push({
            channel,
            field: fieldDef,
            title: encoding.title,
          });
        }

        if (fieldDef.type === 'temporal') {
          // convert temporal data into Date objects
          data.forEach((datum) => {
            datum[fieldDef.field] = new Date(datum[fieldDef.field]);
          });
        }
      });

      function guideNodes(): OlliNode[] {
        return olliSpec.axes.concat(olliSpec.legends).map((guide) => {
          return {
            groupby: guide.field,
            children: [],
          };
        });
      }

      // create structure
      if (olliSpec.facetField) {
        olliSpec.structure = {
          groupby: olliSpec.facetField,
          children: guideNodes(),
        };
      } else {
        olliSpec.structure = guideNodes();
      }
    }
  } else {
    // TODO: handle layer and concat specs
  }

  // TODO: aggregate field names

  return olliSpec;
};
