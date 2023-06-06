import { inferStructure } from '../Structure/infer';
import { OlliSpec } from '../Types';
import { typeInference } from './types';

// fills in default values for missing spec fields
export function elaborateSpec(olliSpec: OlliSpec): OlliSpec {
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

  return olliSpec;
}
