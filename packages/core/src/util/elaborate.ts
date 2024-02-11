import { inferStructure } from '../Structure/infer';
import { OlliSpec, UnitOlliSpec, isMultiOlliSpec } from '../Types';
import { typeInference } from './types';
import { llmBin } from '../Annotation/llm';
import { extractAndParseJSON, createAnnotationNodesFromBins} from '../Annotation';
import { OlliAnnotationNode, OlliPredicateNode } from '../Structure/Types';

// fills in default values for missing spec fields
export function elaborateSpec(olliSpec: OlliSpec): OlliSpec {
  if (isMultiOlliSpec(olliSpec)) {
    return {
      ...olliSpec,
      units: olliSpec.units.map((spec) => {
        return elaborateUnitSpec(spec);
      }),
    };
  } else {
    return elaborateUnitSpec(olliSpec);
  }
}

function elaborateUnitSpec(olliSpec: UnitOlliSpec): UnitOlliSpec {

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
    console.log(olliSpec);
    olliSpec.structure = inferStructure(olliSpec);
  }

  return olliSpec;
}
