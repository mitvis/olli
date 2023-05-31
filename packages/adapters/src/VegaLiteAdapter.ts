import { TopLevelSpec, compile } from 'vega-lite';
import { VisAdapter, OlliSpec, OlliDataset, OlliEncodingChannel, OlliNode, isGuideChannel, olli } from 'olli';
import { getData, getVegaScene, getVegaView, typeInference } from './utils';
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
    encoding: {},
    structure: [],
  };

  if ('mark' in spec) {
    let mark: any = spec.mark; // TODO vega-lite mark type exceeds olli mark type, should do some validation
    if (mark && mark.type) {
      // e.g. "mark": {"type": "line", "point": true}
      mark = mark.type;
    }
    olliSpec.mark = mark;
    // unit spec
    if (spec.encoding) {
      Object.entries(spec.encoding).forEach(([channel, encoding]) => {
        if (['row', 'column'].includes(channel)) {
          olliSpec.encoding['facet'] = encoding;
        } else if (spec.mark === 'line' && channel === 'color') {
          // treat multi-series line charts as facets
          olliSpec.encoding['facet'] = encoding;
        } else if (channel in OlliEncodingChannel) {
          olliSpec.encoding[channel as OlliEncodingChannel] = encoding;

          if (isGuideChannel(channel as OlliEncodingChannel)) {
            try {
              const scaleName = spec.name ? `${spec.name}_${channel}` : channel;
              const scale = view.scale(scaleName);
              const ticks = tickValues(scale, 6);
              if (ticks) {
                olliSpec.encoding[channel as OlliEncodingChannel].bin = ticks;
              }
            } catch (e) {}
          }
        }

        if (encoding.type === 'temporal') {
          // convert temporal data into Date objects
          data.forEach((datum) => {
            datum[encoding.field] = new Date(datum[encoding.field]);
          });
        }
      });
    }
  } else {
    // TODO: handle layer and concat specs
  }

  function getGuideNodes() {
    return Object.entries(olliSpec.encoding).flatMap(([channel, fieldDef]) => {
      if (isGuideChannel(channel as OlliEncodingChannel)) {
        return [
          {
            groupby: fieldDef,
            children: [],
          },
        ];
      }
      return [];
    });
  }

  if (olliSpec.encoding.facet) {
    olliSpec.structure = {
      groupby: olliSpec.encoding.facet,
      children: getGuideNodes(),
    };
  } else {
    olliSpec.structure = getGuideNodes();
  }

  // TODO: aggregate field names ... this feels hacky
  Object.values(olliSpec.encoding).forEach((fieldDef) => {
    if ('aggregate' in fieldDef) {
      fieldDef.field = `${fieldDef.aggregate}_${fieldDef.field}`;
    }
  });

  // infer missing measure types
  Object.values(olliSpec.encoding).forEach((fieldDef) => {
    fieldDef.type = typeInference(data, fieldDef.field);
  });

  return olliSpec;
};
