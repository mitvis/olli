import { inferStructure } from '../Structure/infer';
import { OlliSpec, UnitOlliSpec, isMultiOlliSpec } from '../Types';
import { getDataHighlights } from './llm';
import { typeInference } from './types';

// fills in default values for missing spec fields
export async function elaborateSpec(olliSpec: OlliSpec): Promise<OlliSpec> {
  if (isMultiOlliSpec(olliSpec)) {
    return {
      ...olliSpec,
      units: await Promise.all(
        olliSpec.units.map(async (spec) => {
          return await elaborateUnitSpec(spec);
        })
      ),
    };
  } else {
    return await elaborateUnitSpec(olliSpec);
  }
}

async function elaborateUnitSpec(olliSpec: UnitOlliSpec): Promise<UnitOlliSpec> {
  // if fields not provided, use all fields in data
  olliSpec.fields =
    olliSpec.fields ||
    Object.keys(olliSpec.data[0]).map((field) => {
      return { field };
    });

  // infer types of fields if not provided
  olliSpec.fields = olliSpec.fields.map((fieldDef) => {
    return {
      ...fieldDef,
      type: fieldDef.type || typeInference(olliSpec.data, fieldDef.field),
    };
  });

  // infer structure if not provided
  if (!olliSpec.structure || [olliSpec.structure].flat().length === 0) {
    olliSpec.structure = inferStructure(olliSpec);
  }

  olliSpec.structure = Array.isArray(olliSpec.structure) ? olliSpec.structure : [olliSpec.structure];
  // add data highlights
  const annotations = await getDataHighlights(olliSpec.data);
  console.log('annotations', annotations);
  if (annotations.length > 0) {
    olliSpec.structure.unshift({
      annotations,
    });
  }

  return olliSpec;
}
