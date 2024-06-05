import { OlliSpec, UnitOlliSpec } from './Types';
import { ElaboratedOlliNode, OlliNode } from './Structure/Types';
import { OlliRuntime, RuntimeCallbacks } from './Runtime/OlliRuntime';
import { updateGlobalStateOnInitialRender } from './util/globalState';
import { elaborateSpec } from './util/elaborate';
import { LogicalComposition } from 'vega-lite/src/logical';
import { FieldPredicate } from 'vega-lite/src/predicate';

export * from './Types';
export * from './Structure/Types';
export * from './util/types';
export type { OlliGlobalState } from './util/globalState';

export type OlliConfigOptions = {
  onFocus?: (elem: HTMLElement, olliNode: ElaboratedOlliNode) => void;
  onSelection?: (predicate: LogicalComposition<FieldPredicate>) => void;
};

export function olli(olliSpec: OlliSpec, config?: OlliConfigOptions): HTMLElement {
  olliSpec = elaborateSpec(olliSpec);
  addDataHighlights(olliSpec);

  const renderContainer: HTMLElement = document.createElement('div');
  renderContainer.classList.add('olli-vis');

  const treeCallbacks: RuntimeCallbacks = {
    onFocus: config?.onFocus,
    onSelection: config?.onSelection,
  };

  const t = new OlliRuntime(olliSpec, renderContainer, treeCallbacks);
  t.init();
  updateGlobalStateOnInitialRender(t);

  return renderContainer;
}

function addDataHighlights(olliSpec: OlliSpec): OlliSpec {
  ((olliSpec as UnitOlliSpec).structure as OlliNode[]).unshift({
    annotations: highlights.bins.map((bin) => {
      return {
        predicate: bin.pred as LogicalComposition<FieldPredicate>,
        name: bin.bin_name,
        reasoning: bin.reasoning,
      };
    }),
  });
  return olliSpec;
}

// function addSemanticBins(olliSpec: OlliSpec): OlliSpec {}

const highlights = {
  bins: [
    {
      bin_name: 'Efficient Foragers',
      reasoning:
        'This group combines mid-sized flipper lengths with a healthy body mass, indicating penguins that have adapted well to a range of environments, being able to swiftly navigate open waters while also capable of agility, a combination suited for efficient foraging',
      pred: {
        and: [
          {
            field: 'Flipper Length (mm)',
            range: [191, 210],
          },
          {
            field: 'Body Mass (g)',
            range: [3301, 4300],
          },
        ],
      },
    },
    {
      bin_name: 'Agile Hunters',
      reasoning:
        'Penguins with shorter flipper lengths and robust body mass likely excel in agility and strength, ideal for dense environments and prey-rich waters, both attributes suggesting a successful adaptation for hunting in such locations',
      pred: {
        and: [
          {
            field: 'Flipper Length (mm)',
            range: [170, 190],
          },
          {
            field: 'Body Mass (g)',
            range: [4301, 6400],
          },
        ],
      },
    },
    {
      bin_name: 'Antarctic Marathoners',
      reasoning:
        'Long flipper lengths paired with a robust or athletic body mass may indicate penguins that are specialized for endurance swimming in Antarctic conditions, capable of long-distance hunting in open waters',
      pred: {
        and: [
          {
            field: 'Flipper Length (mm)',
            range: [211, 235],
          },
          {
            field: 'Body Mass (g)',
            range: [4301, 6400],
          },
        ],
      },
    },
    {
      bin_name: 'Generalist Survivors',
      reasoning:
        'Encompassing all ranges of flipper and body mass but exclusive of athletic body mass, this group may include a wide variety of species showing high adaptability without specializing towards any extreme of body morphology, representing a broad survival strategy',
      pred: {
        field: 'Body Mass (g)',
        range: [2600, 5000],
      },
    },
  ],
};
