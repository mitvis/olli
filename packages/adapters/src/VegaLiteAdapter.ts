import { TopLevelSpec, compile } from 'vega-lite';
import { VisAdapter, OlliSpec, OlliAxis, OlliLegend, OlliNode } from 'olli';
import { getData, getVegaScene, getVegaView, typeInference } from './utils';
// @ts-ignore
import { tickValues } from 'vega-scale';

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
    // TODO vega-lite mark type exceeds olli mark type, should do some validation
    // get mark type
    let mark: any = spec.mark;
    if (mark && mark.type) {
      // e.g. "mark": {"type": "line", "point": true}
      mark = mark.type;
    }
    olliSpec.mark = mark;

    // unit spec
    if (spec.encoding) {
      Object.entries(spec.encoding).forEach(([channel, encoding]) => {
        if (['row', 'column', 'facet'].includes(channel)) {
          olliSpec.facetField = encoding.field;
        } else if (olliSpec.mark === 'line' && ['color', 'detail'].includes(channel)) {
          // treat multi-series line charts as facets
          olliSpec.facetField = encoding.field;
        } else if (['x', 'y'].includes(channel)) {
          if (olliSpec.mark === 'bar' && encoding.type === 'quantitative') {
            return; // skip quantitative channel for bar charts
          }
          const axis: OlliAxis = {
            axisType: channel as 'x' | 'y',
            field: encoding.field,
            type: encoding.type,
            title: encoding.title,
          };
          try {
            const scaleName = spec.name ? `${spec.name}_${channel}` : channel;
            const scale = view.scale(scaleName);
            const ticks = tickValues(scale, 6);
            if (ticks) {
              axis.ticks = ticks;
            }
          } catch (e) {}
          olliSpec.axes.push(axis);
        } else if (['color', 'opacity'].includes(channel)) {
          const legend: OlliLegend = {
            channel,
            field: encoding.field,
            type: encoding.type,
            title: encoding.title,
          };
          try {
            const scaleName = spec.name ? `${spec.name}_${channel}` : channel;
            const scale = view.scale(scaleName);
            const ticks = tickValues(scale, 6);
            if (ticks) {
              legend.ticks = ticks;
            }
          } catch (e) {}
          olliSpec.legends.push(legend);
        }

        if (encoding.type === 'temporal') {
          // convert temporal data into Date objects
          data.forEach((datum) => {
            datum[encoding.field] = new Date(datum[encoding.field]);
          });
        }
      });

      function guideNodes(): OlliNode[] {
        return olliSpec.axes.concat(olliSpec.legends).map((guide) => {
          return {
            groupby: {
              field: guide.field,
              type: guide.type,
            },
            children: [],
          };
        });
      }

      // create structure
      if (olliSpec.facetField) {
        olliSpec.structure = {
          groupby: {
            field: olliSpec.facetField,
            type: Object.values(spec.encoding).find((encoding) => encoding.field === olliSpec.facetField).type,
          },
          children: guideNodes(),
        };
      } else {
        olliSpec.structure = guideNodes();
      }
    }
  } else {
    // TODO: handle layer and concat specs
  }

  // TODO: aggregate field names ... this feels hacky
  // Object.values(olliSpec.encoding).forEach((fieldDef) => {
  //   if ('aggregate' in fieldDef) {
  //     fieldDef.field = `${fieldDef.aggregate}_${fieldDef.field}`;
  //   }
  // });

  // infer missing measure types
  // Object.values(olliSpec.encoding).forEach((fieldDef) => {
  //   fieldDef.type = typeInference(data, fieldDef.field);
  // });

  return olliSpec;
};
