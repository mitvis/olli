import { TopLevelSpec, compile } from 'vega-lite';
import { VisAdapter, UnitOlliSpec, typeInference, OlliSpec, OlliDataset, MultiSpecOperator } from 'olli';
import { getData, getVegaScene, getVegaView } from './utils';
import { TopLevelUnitSpec } from 'vega-lite/build/src/spec/unit';
import { TopLevel, LayerSpec, GenericHConcatSpec, GenericVConcatSpec } from 'vega-lite/build/src/spec';
import { GenericConcatSpec } from 'vega-lite/build/src/spec/concat';

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
    if ('layer' in spec || 'concat' in spec || 'hconcat' in spec || 'vconcat' in spec) {
      const vlOp = Object.keys(spec).find((k) => ['layer', 'concat', 'hconcat', 'vconcat'].includes(k));
      return await adaptMultiSpec(spec, vlOp, data);
    }
  }
};

const getFieldFromEncoding = (encoding, data: OlliDataset) => {
  if ('aggregate' in encoding) {
    if (encoding.aggregate === 'count') {
      return `__${encoding.aggregate}`;
    }
    return `${encoding.aggregate}_${encoding.field}`;
  }
  if ('timeUnit' in encoding) {
    return `${encoding.timeUnit}_${encoding.field}`;
  }
  if ('bin' in encoding && encoding.bin === true && data.length) {
    const fields = Object.keys(data[0]);
    const binField = fields.find((f) => f.startsWith('bin') && f.includes(encoding.field) && !f.endsWith('_end'));
    return binField;
  }

  return 'condition' in encoding ? encoding.condition.field : encoding.field;
};

const getLabelFromEncoding = (encoding) => {
  if ('aggregate' in encoding) {
    if (encoding.aggregate === 'count') {
      return 'count';
    }
  }
  return `${encoding.bin ? 'binned ' : ''}${'aggregate' in encoding ? `${encoding.aggregate} ` : ''}${
    'condition' in encoding ? encoding.condition.field : encoding.field
  }${'timeUnit' in encoding ? ` (${encoding.timeUnit})` : ''}`;
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
      fieldDef.field = getFieldFromEncoding(encoding, data);
      fieldDef.label = getLabelFromEncoding(encoding);
      fieldDef.type =
        encoding.type ||
        (encoding.timeUnit ? 'temporal' : false) ||
        (encoding.bin ? 'quantitative' : false) ||
        typeInference(data, fieldDef.field);

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
      } else if (['color', 'opacity', 'size'].includes(channel)) {
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

async function adaptMultiSpec(
  spec: TopLevel<LayerSpec<any> | GenericConcatSpec<any> | GenericVConcatSpec<any> | GenericHConcatSpec<any>>,
  vlOp: 'layer' | 'concat' | 'vconcat' | 'hconcat',
  data: OlliDataset[]
): Promise<OlliSpec> {
  const units: UnitOlliSpec[] = data.map((d) => {
    return {
      description: spec.description,
      data: d,
      fields: [],
      axes: [],
      legends: [],
    };
  });

  await Promise.all(
    spec[vlOp].map(async (view) => {
      if ('mark' in view) {
        // unit view
        const viewSpec = {
          data: view.data || spec.data,
          mark: view.mark,
          encoding: view.encoding,
        };
        const dataset = data.find((d) => {
          const fields = Object.keys(d[0]);
          const viewFields = Object.values(viewSpec.encoding)
            .map((f) => getFieldFromEncoding(f, d))
            .filter((f) => f);
          return viewFields.every((f) => fields.includes(f));
        });
        const viewOlliSpec = adaptUnitSpec(viewSpec, dataset);
        const unitSpec = units.find((s) => Object.keys(s.data[0]).every((k) => dataset[0][k]));
        unitSpec?.fields.push(...viewOlliSpec.fields);
        unitSpec?.axes.push(...viewOlliSpec.axes);
        unitSpec?.legends.push(...viewOlliSpec.legends);
        unitSpec.mark = viewOlliSpec.mark;
      } else {
        // TODO: nested layer/concat
      }
    })
  );

  units.forEach((s) => {
    s.fields = s.fields.filter((f, i, self) => self.findIndex((f2) => f2.field === f.field) === i);
    s.axes = s.axes.filter((f, i, self) => self.findIndex((f2) => f2.field === f.field) === i);
    s.legends = s.legends.filter((f, i, self) => self.findIndex((f2) => f2.field === f.field) === i);

    typeCoerceData(s);
  });

  if (units.length === 1) {
    return units[0];
  }

  return {
    operator: vlOp === 'layer' ? 'layer' : 'concat',
    units,
  };
}
