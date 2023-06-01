import { inferStructure } from '../Structure/infer';
import { OlliSpec } from '../Types';
import { typeInference } from './types';

// fills in default values for missing spec fields
export function elaborateSpec(olliSpec: OlliSpec): OlliSpec {
  // infer types of fields if not provided
  olliSpec.fields = olliSpec.fields.map((fieldDef) => {
    return {
      ...fieldDef,
      type: fieldDef.type || typeInference(olliSpec.data, fieldDef.field),
    };
  });

  // infer structure if not provided
  if (!olliSpec.structure) {
    olliSpec.structure = inferStructure(olliSpec);
  }

  return olliSpec;
}
